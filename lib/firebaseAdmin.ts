import { getApps, initializeApp, cert, App } from 'firebase-admin/app'
import { getDatabase, Database } from 'firebase-admin/database'

const FIREBASE_DATABASE_URL = 'https://buzzly-v-default-rtdb.firebaseio.com'
const DEFAULT_PROJECT_ID = 'buzzly-v'

let adminApp: App | null = null

export function getAdminApp(): App | null {
  if (adminApp) return adminApp
  const currentApps = getApps()
  if (currentApps.length > 0 && currentApps[0]) {
    adminApp = currentApps[0]
    return adminApp
  }

  try {
    // 1. Full service account JSON via environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || FIREBASE_DATABASE_URL,
        projectId: serviceAccount.project_id || DEFAULT_PROJECT_ID,
      })
      return adminApp
    }

    // 2. Individual credentials via environment variables
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const projectId = process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID

    if (privateKey && clientEmail) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL || FIREBASE_DATABASE_URL,
        projectId,
      })
      return adminApp
    }

    // 3. Application Default Credentials explicitly configured
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      adminApp = initializeApp({
        projectId,
        databaseURL: process.env.FIREBASE_DATABASE_URL || FIREBASE_DATABASE_URL,
      })
      return adminApp
    }

    // When running locally or during build without admin credentials, return null gracefully
    return null
  } catch (err) {
    console.warn('[FirebaseAdmin] Failed to initialize admin app:', err)
    return null
  }
}

export function getAdminDb(): Database | null {
  const app = getAdminApp()
  if (!app) return null
  try {
    return getDatabase(app)
  } catch (err) {
    console.warn('[FirebaseAdmin] Failed to get database instance:', err)
    return null
  }
}

export async function getAdminAuth(): Promise<any | null> {
  const app = getAdminApp()
  if (!app) return null
  try {
    const { getAuth } = await import('firebase-admin/auth')
    return getAuth(app)
  } catch (err) {
    console.warn('[FirebaseAdmin] Failed to dynamically get auth instance:', err)
    return null
  }
}

export async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ uid: string; email?: string } | null> {
  if (!idToken || typeof idToken !== 'string') return null

  // 1. Primary & Robust: Google Identity Toolkit accounts:lookup REST API
  // Works reliably in all Vercel Serverless and Edge environments without ESM dependency issues
  try {
    const apiKey =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.FIREBASE_API_KEY ||
      'AIzaSyAAj9NI9tHlfgZd3Xi4ie4l6z3c8xfJH_c'
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    )
    if (res.ok) {
      const data = await res.json()
      const user = data.users?.[0]
      if (user && user.localId) {
        return { uid: user.localId, email: user.email }
      }
    } else {
      const errText = await res.text().catch(() => '')
      console.warn('[VerifyToken] Identity Toolkit non-OK response:', res.status, errText)
    }
  } catch (restErr) {
    console.error('[VerifyToken] REST verification error:', restErr)
  }

  // 2. Secondary fallback: Firebase Admin SDK verifyIdToken via dynamic import
  try {
    const authInstance = await getAdminAuth()
    if (authInstance) {
      const decoded = await authInstance.verifyIdToken(idToken)
      if (decoded && decoded.uid) {
        return { uid: decoded.uid, email: decoded.email }
      }
    }
  } catch (adminErr: any) {
    // Silently continue if dynamic import or admin check fails
  }

  return null
}