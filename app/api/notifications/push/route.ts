import { NextRequest, NextResponse } from 'next/server'
import type { PeerNotificationType } from '@/lib/peerPushServer'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'peer-push',
    hasServiceKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  })
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Missing or invalid Authorization header.' },
        { status: 401 }
      )
    }

    const idToken = authHeader.substring(7).trim()
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Empty Bearer token.' },
        { status: 401 }
      )
    }

    let getAdminAuth: any
    let dispatchPeerPushServer: any
    try {
      const adminMod = await import('@/lib/firebaseAdmin')
      getAdminAuth = adminMod.getAdminAuth
      const peerMod = await import('@/lib/peerPushServer')
      dispatchPeerPushServer = peerMod.dispatchPeerPushServer
    } catch (loadErr: any) {
      console.error('[PushRoute] Module load failed:', loadErr)
      return NextResponse.json(
        { success: false, error: `Module load failed: ${loadErr?.message || String(loadErr)}` },
        { status: 500 }
      )
    }

    const adminAuth = getAdminAuth()
    if (!adminAuth) {
      console.error('[PushRoute] Firebase Admin Auth unavailable')
      return NextResponse.json(
        { success: false, error: 'Authentication service unavailable.' },
        { status: 500 }
      )
    }

    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken)
    } catch (tokenErr: any) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Invalid Firebase ID token.' },
        { status: 401 }
      )
    }

    const callerUid = decodedToken.uid
    if (!callerUid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Invalid token UID.' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Bad Request. Invalid JSON payload.' },
        { status: 400 }
      )
    }

    const { recipientId, type, title, body: notificationBody, screen, params, conversationId, postId, businessId } = body

    if (!recipientId || typeof recipientId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid recipientId.' },
        { status: 400 }
      )
    }

    if (recipientId === callerUid) {
      return NextResponse.json(
        { success: false, error: 'Recipient cannot be the caller.' },
        { status: 400 }
      )
    }

    const allowedTypes: PeerNotificationType[] = [
      'chat_message',
      'follow',
      'post_like',
      'post_comment',
      'post_comment_reply',
      'business_review',
    ]

    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Unauthorized notification type: '${type}'. Only peer notifications are allowed.` },
        { status: 403 }
      )
    }

    const cleanTitle = String(title || 'Circular').slice(0, 120)
    const cleanBody = String(notificationBody || '').slice(0, 300)

    const result = await dispatchPeerPushServer({
      callerUid,
      recipientId,
      type,
      title: cleanTitle,
      body: cleanBody,
      screen,
      params,
      conversationId,
      postId,
      businessId,
    })

    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error: any) {
    console.error('[PushRoute] Unhandled execution error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
