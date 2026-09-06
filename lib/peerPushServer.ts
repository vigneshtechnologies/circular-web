import 'server-only'
import { getAdminDb, getAdminAuth } from './firebaseAdmin'

export type PeerNotificationType =
  | 'chat_message'
  | 'follow'
  | 'post_like'
  | 'post_comment'
  | 'post_comment_reply'
  | 'business_review'

export interface PeerPushDispatchInput {
  callerUid: string
  recipientId: string
  type: PeerNotificationType
  title: string
  body: string
  screen?: string
  params?: Record<string, any>
  conversationId?: string
  postId?: string
  businessId?: string
}

export interface PeerPushDispatchResult {
  success: boolean
  dispatched: boolean
  reason?: string
  successCount?: number
  failureCount?: number
  tickets?: string[]
}

const ALLOWED_PEER_TYPES: Set<string> = new Set([
  'chat_message',
  'follow',
  'post_like',
  'post_comment',
  'post_comment_reply',
  'business_review',
])

const isValidExpoPushToken = (token: string): boolean => {
  return /^ExponentPushToken\[[^\]]+\]$|^ExpoPushToken\[[^\]]+\]$/.test(token)
}

function isWithinQuietHours(
  settings?: {
    quietHoursEnabled?: boolean
    quietHoursStart?: string
    quietHoursEnd?: string
  } | null,
  now = new Date()
): boolean {
  if (!settings || settings.quietHoursEnabled !== true) {
    return false
  }

  const startStr = settings.quietHoursStart || '22:00'
  const endStr = settings.quietHoursEnd || '07:00'

  const [startH, startM] = startStr.split(':').map((v) => parseInt(v, 10) || 0)
  const [endH, endM] = endStr.split(':').map((v) => parseInt(v, 10) || 0)

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  } else {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }
}

export async function dispatchPeerPushServer(
  input: PeerPushDispatchInput
): Promise<PeerPushDispatchResult> {
  const { callerUid, recipientId, type, title, body } = input

  // 1. Basic validation
  if (!recipientId || typeof recipientId !== 'string') {
    return { success: false, dispatched: false, reason: 'Invalid or missing recipient ID' }
  }

  if (recipientId === callerUid) {
    return { success: false, dispatched: false, reason: 'Self-notifications are not eligible for push' }
  }

  if (!ALLOWED_PEER_TYPES.has(type)) {
    return { success: false, dispatched: false, reason: `Notification type '${type}' is not an authorized peer push type` }
  }

  const adminDb = getAdminDb()
  if (!adminDb) {
    console.error('[PeerPushServer] Firebase Admin Database instance unavailable')
    return { success: false, dispatched: false, reason: 'Database service unavailable' }
  }

  try {
    // 2. Block validation (bidirectional)
    const [recipientBlockedSnap, callerBlockedSnap] = await Promise.all([
      adminDb.ref(`users/${recipientId}/blockedUsers/${callerUid}`).once('value'),
      adminDb.ref(`users/${callerUid}/blockedUsers/${recipientId}`).once('value'),
    ])

    if (recipientBlockedSnap.exists() || callerBlockedSnap.exists()) {
      return { success: true, dispatched: false, reason: 'Blocked relationship suppresses push notification' }
    }

    // 3. Recipient Settings verification
    const settingsSnap = await adminDb.ref(`notificationSettings/${recipientId}`).once('value')
    const rawSettings = settingsSnap.val() || {}

    const settings = {
      allNotifications: rawSettings.allNotifications !== false,
      phonePushNotifications: rawSettings.phonePushNotifications !== false,
      messagePush: rawSettings.messagePush !== false,
      messages: rawSettings.messages !== false,
      followPush: rawSettings.followPush !== false,
      follows: rawSettings.follows !== false,
      likePush: rawSettings.likePush !== false,
      likes: rawSettings.likes !== false,
      commentPush: rawSettings.commentPush !== false,
      comments: rawSettings.comments !== false,
      businessReviewPush: rawSettings.businessReviewPush !== false,
      businessReviews: rawSettings.businessReviews !== false,
      sound: rawSettings.sound !== false,
      quietHoursEnabled: rawSettings.quietHoursEnabled === true,
      quietHoursStart: rawSettings.quietHoursStart || '22:00',
      quietHoursEnd: rawSettings.quietHoursEnd || '07:00',
    }

    if (!settings.allNotifications || !settings.phonePushNotifications) {
      return { success: true, dispatched: false, reason: 'Recipient has disabled push notifications' }
    }

    // Type-specific checks
    let typeAllowed = true
    switch (type) {
      case 'chat_message':
        typeAllowed = settings.messagePush && settings.messages
        break
      case 'follow':
        typeAllowed = settings.followPush && settings.follows
        break
      case 'post_like':
        typeAllowed = settings.likePush && settings.likes
        break
      case 'post_comment':
      case 'post_comment_reply':
        typeAllowed = settings.commentPush && settings.comments
        break
      case 'business_review':
        typeAllowed = settings.businessReviewPush && settings.businessReviews
        break
      default:
        typeAllowed = true
    }

    if (!typeAllowed) {
      return { success: true, dispatched: false, reason: `Recipient has muted '${type}' push notifications` }
    }

    const inQuietHours = isWithinQuietHours(settings)
    if (inQuietHours && settings.quietHoursEnabled) {
      return { success: true, dispatched: false, reason: 'Recipient is currently in quiet hours' }
    }

    // 4. Retrieve active push tokens from Admin SDK
    const tokensSnap = await adminDb.ref(`pushTokens/${recipientId}`).once('value')
    const tokensData = tokensSnap.val() || {}

    const validTokenEntries: { token: string; key: string }[] = []
    const seenTokens = new Set<string>()

    Object.entries(tokensData).forEach(([key, record]: [string, any]) => {
      let tokenStr = ''
      if (typeof record === 'string') {
        tokenStr = record
      } else if (record && record.enabled !== false && typeof record.token === 'string') {
        tokenStr = record.token
      }

      if (tokenStr && isValidExpoPushToken(tokenStr) && !seenTokens.has(tokenStr)) {
        seenTokens.add(tokenStr)
        validTokenEntries.push({ token: tokenStr, key })
      }
    })

    if (validTokenEntries.length === 0) {
      return { success: true, dispatched: false, reason: 'No registered push tokens found for recipient' }
    }

    // 5. Build Expo push messages
    const channelId = type === 'chat_message' ? 'circular_chat_messages' : 'default'
    const messages = validTokenEntries.map(({ token }) => ({
      to: token,
      sound: settings.sound ? 'default' : null,
      title: input.title,
      body: input.body,
      channelId,
      priority: 'high',
      data: {
        type: input.type,
        screen: input.screen || (type === 'chat_message' ? 'Chat' : 'Notifications'),
        params: input.params || {},
        conversationId: input.conversationId || '',
        otherUserId: callerUid,
        postId: input.postId || '',
        businessId: input.businessId || '',
        actorId: callerUid,
      },
    }))

    // 6. Send to Expo Push API
    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    })

    let successCount = 0
    let failureCount = 0
    const ticketIds: string[] = []
    const staleTokenKeys: string[] = []

    if (expoRes.ok) {
      const resultJson: any = await expoRes.json().catch(() => null)
      const ticketData = Array.isArray(resultJson?.data) ? resultJson.data : []

      ticketData.forEach((ticket: any, idx: number) => {
        const correspondingEntry = validTokenEntries[idx]
        if (ticket?.status === 'ok') {
          successCount++
          if (ticket.id) ticketIds.push(ticket.id)
        } else {
          failureCount++
          const errorMsg = ticket?.details?.error || ticket?.message
          if (errorMsg === 'DeviceNotRegistered' && correspondingEntry) {
            staleTokenKeys.push(correspondingEntry.key)
          }
        }
      })
    } else {
      failureCount += messages.length
      console.warn(`[PeerPushServer] Expo HTTP Error ${expoRes.status}`)
    }

    // 7. Cleanup stale tokens if any
    if (staleTokenKeys.length > 0) {
      const updates: Record<string, any> = {}
      staleTokenKeys.forEach((key: string) => {
        updates[`pushTokens/${recipientId}/${key}/enabled`] = false
        updates[`pushTokens/${recipientId}/${key}/disabledReason`] = 'DeviceNotRegistered'
        updates[`pushTokens/${recipientId}/${key}/updatedAt`] = Date.now()
      })
      adminDb.ref().update(updates).catch((err: any) => {
        console.warn('[PeerPushServer] Stale token cleanup notice:', err)
      })
    }

    return {
      success: true,
      dispatched: successCount > 0,
      successCount,
      failureCount,
      tickets: ticketIds,
    }
  } catch (error: any) {
    console.error('[PeerPushServer] Push dispatch error:', error)
    return {
      success: false,
      dispatched: false,
      reason: error?.message || 'Internal server error while processing push',
    }
  }
}
