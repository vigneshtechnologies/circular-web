// Client-side Web Push Notification Manager using Firebase Cloud Messaging (FCM)

import { ref, update } from 'firebase/database'
import { app, db } from './firebase'

const TOKEN_CACHE_KEY = 'circular_web_fcm_token'

export interface WebPushStatus {
  isSupported: boolean
  permission: NotificationPermission | 'unsupported'
  hasVapidKey: boolean
  token: string | null
}

export function isWebPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return (
    'serviceWorker' in navigator &&
    'Notification' in window &&
    'PushManager' in window
  )
}

export function getWebPushPermission(): NotificationPermission | 'unsupported' {
  if (!isWebPushSupported()) return 'unsupported'
  return Notification.permission
}

export function getCachedWebPushToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(TOKEN_CACHE_KEY)
  } catch {
    return null
  }
}

export function sanitizeFirebaseTokenKey(token: string): string {
  return token.replace(/[.#$/[\]]/g, '_').slice(-64)
}

/**
 * Registers the service worker, requests notification permission from the user,
 * fetches an FCM web token, and stores it under pushTokens/${uid}/${tokenKey}.
 */
export async function registerWebPushToken(uid: string): Promise<{
  success: boolean
  token?: string
  error?: string
  needsVapidKey?: boolean
}> {
  if (!isWebPushSupported()) {
    return { success: false, error: 'Web Push notifications are not supported in this browser.' }
  }

  if (!uid) {
    return { success: false, error: 'User must be authenticated to register push notifications.' }
  }

  try {
    // 1. Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { success: false, error: `Notification permission was ${permission}.` }
    }

    // 2. Register Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    })

    await navigator.serviceWorker.ready

    // 3. Dynamically load Firebase Messaging to keep bundle lean
    const { getMessaging, getToken } = await import('firebase/messaging')
    const messaging = getMessaging(app)

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim() || undefined

    // 4. Retrieve FCM Token
    let fcmToken: string
    try {
      fcmToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      })
    } catch (tokenErr: any) {
      console.warn('[WebPush] Error fetching token with provided VAPID key:', tokenErr)
      if (!vapidKey) {
        return {
          success: false,
          needsVapidKey: true,
          error:
            'Firebase Web Push requires a public VAPID Key Pair. Please configure NEXT_PUBLIC_FIREBASE_VAPID_KEY in environment settings.',
        }
      }
      throw tokenErr
    }

    if (!fcmToken) {
      return { success: false, error: 'No FCM registration token returned from Firebase Messaging.' }
    }

    // 5. Store token under pushTokens/${uid}/${tokenKey}
    const tokenKey = sanitizeFirebaseTokenKey(fcmToken)
    await update(ref(db), {
      [`pushTokens/${uid}/${tokenKey}`]: {
        token: fcmToken,
        platform: 'web',
        enabled: true,
        userAgent: navigator.userAgent.slice(0, 150),
        updatedAt: Date.now(),
      },
    })

    try {
      localStorage.setItem(TOKEN_CACHE_KEY, fcmToken)
    } catch {}

    return { success: true, token: fcmToken }
  } catch (err: any) {
    console.error('[WebPush] Registration failed:', err)
    return {
      success: false,
      error: err?.message || 'Failed to register web push notifications.',
    }
  }
}

/**
 * Disables the current web push token in Firebase RTDB.
 */
export async function disableWebPushToken(uid: string): Promise<boolean> {
  const currentToken = getCachedWebPushToken()
  if (!uid || !currentToken) return false

  try {
    const tokenKey = sanitizeFirebaseTokenKey(currentToken)
    await update(ref(db), {
      [`pushTokens/${uid}/${tokenKey}/enabled`]: false,
      [`pushTokens/${uid}/${tokenKey}/disabledAt`]: Date.now(),
    })

    try {
      localStorage.removeItem(TOKEN_CACHE_KEY)
    } catch {}

    return true
  } catch (err) {
    console.error('[WebPush] Failed to disable push token:', err)
    return false
  }
}

/**
 * Attaches a foreground push listener so incoming messages while active
 * can trigger UI feedback without creating duplicate system notifications.
 */
export function listenToForegroundMessages(
  onMessageReceived: (payload: any) => void
): (() => void) | null {
  if (!isWebPushSupported()) return null

  let unsubscribe: (() => void) | null = null

  import('firebase/messaging')
    .then(({ getMessaging, onMessage }) => {
      const messaging = getMessaging(app)
      unsubscribe = onMessage(messaging, (payload) => {
        console.log('[WebPush] Foreground message received:', payload)
        onMessageReceived(payload)
      })
    })
    .catch((err) => {
      console.warn('[WebPush] Could not attach foreground listener:', err)
    })

  return () => {
    if (unsubscribe) unsubscribe()
  }
}
