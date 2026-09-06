import { get, push, ref, update } from 'firebase/database'
import { auth, db } from './firebase'
import { CircularNotificationType } from './types'

export type CreateNotificationInput = {
  userId: string
  type: CircularNotificationType
  title: string
  body: string
  dedupKey?: string
  actorId?: string
  actorName?: string
  senderAvatar?: string
  postId?: string
  businessId?: string
  businessName?: string
  jobId?: string
  needId?: string
  eventId?: string
  reportId?: string
  targetUserId?: string
  screen?: string
  params?: Record<string, any>
}

const cleanText = (value: string | undefined, fallback: string) => {
  const clean = String(value || '').trim()
  return clean.length > 0 ? clean : fallback
}

const truncateText = (value: string | undefined, maxLength: number) => {
  const clean = String(value || '').trim()
  if (clean.length <= maxLength) {
    return clean
  }
  return `${clean.slice(0, maxLength - 3)}...`
}

export const getProfileName = async (uid?: string, fallback = 'Circular Member') => {
  if (!uid) return fallback
  try {
    const snapshot = await get(ref(db, `publicProfiles/${uid}`))
    const data = snapshot.val() || {}
    return cleanText(data?.name || data?.username, fallback)
  } catch (error) {
    return fallback
  }
}

const getDefaultRouteForType = (type: CircularNotificationType) => {
  switch (type) {
    case 'follow':
      return 'UserProfile'
    case 'post_like':
      return 'PostDetail'
    case 'post_comment':
    case 'post_comment_reply':
      return 'Comments'
    case 'event_new':
      return 'EventDetails'
    case 'job_new':
      return 'JobDetails'
    case 'need_new':
      return 'NeedDetails'
    case 'business_update':
    case 'business_review':
    case 'business_badge':
    case 'business_restricted':
    case 'business_reports_resolved':
      return 'BusinessProfile'
    case 'chat_message':
      return 'Chat'
    default:
      return 'Notifications'
  }
}

export const createUserNotification = async (input: CreateNotificationInput) => {
  try {
    if (!input.userId) {
      return null
    }

    let notificationId: string | null = null
    const now = Date.now()
    const targetRoute = input.screen || getDefaultRouteForType(input.type)
    const targetParams = input.params || {}

    if (input.dedupKey) {
      notificationId = input.dedupKey.replace(/[.#$/[\]]/g, '_')
    } else {
      const notificationRef = push(ref(db, `notifications/${input.userId}`))
      notificationId = notificationRef.key
    }

    if (notificationId) {
      try {
        await update(ref(db), {
          [`notifications/${input.userId}/${notificationId}`]: {
            id: notificationId,
            type: input.type,
            title: input.title,
            body: input.body,
            message: input.body,
            read: false,
            createdAt: now,
            actorId: input.actorId || '',
            actorName: input.actorName || '',
            senderId: input.actorId || '',
            senderName: input.actorName || '',
            senderAvatar: input.senderAvatar || '',
            postId: input.postId || '',
            businessId: input.businessId || '',
            businessName: input.businessName || '',
            jobId: input.jobId || '',
            needId: input.needId || '',
            eventId: input.eventId || '',
            reportId: input.reportId || '',
            targetUserId: input.targetUserId || '',
            userId: input.targetUserId || '',
            screen: targetRoute,
            targetRoute,
            params: targetParams,
            targetParams,
          },
        })
      } catch (writeErr) {
        if (input.dedupKey) {
          return notificationId
        }
        throw writeErr
      }
    }

    // Trigger secure server-side push dispatch for peer notification types
    const peerPushTypes = new Set([
      'chat_message',
      'follow',
      'post_like',
      'post_comment',
      'post_comment_reply',
      'business_review',
    ])

    if (peerPushTypes.has(input.type)) {
      dispatchWebPeerPushNotification({
        recipientId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        screen: targetRoute,
        params: targetParams,
        conversationId: input.params?.conversationId,
        postId: input.postId,
        businessId: input.businessId,
      }).catch((err) => {
        console.warn('[WebPush] Notice during peer push dispatch:', err)
      })
    }

    return notificationId
  } catch (error) {
    console.error('Create notification error on web:', error)
    return null
  }
}

export const dispatchWebPeerPushNotification = async (payload: {
  recipientId: string
  type: string
  title: string
  body: string
  screen?: string
  params?: Record<string, any>
  conversationId?: string
  postId?: string
  businessId?: string
}) => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) return
    const idToken = await currentUser.getIdToken()
    if (!idToken) return

    await fetch('/api/notifications/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.warn('[WebPush] Error dispatching peer push:', err)
  }
}

export const createNotificationsForUsers = async (
  userIds: string[],
  input: Omit<CreateNotificationInput, 'userId'>
) => {
  const uniqueUserIds = Array.from(new Set(userIds)).filter(Boolean)
  return Promise.allSettled(
    uniqueUserIds.map((uid) =>
      createUserNotification({
        ...input,
        userId: uid,
      })
    )
  )
}

export const notifyFollow = async ({
  targetUserId,
  actorId,
  actorName,
}: {
  targetUserId: string
  actorId: string
  actorName?: string
}) => {
  if (!targetUserId || !actorId || targetUserId === actorId) return

  const finalActorName = actorName || (await getProfileName(actorId))

  await createUserNotification({
    userId: targetUserId,
    type: 'follow',
    dedupKey: `follow_${actorId}`,
    title: 'New follower',
    body: `${finalActorName} started following you`,
    actorId,
    actorName: finalActorName,
    targetUserId,
    screen: 'UserProfile',
    params: { userId: actorId },
  })
}

export const notifyPostLike = async ({
  postId,
  postOwnerId,
  actorId,
  actorName,
  postText,
}: {
  postId: string
  postOwnerId?: string
  actorId: string
  actorName?: string
  postText?: string
}) => {
  if (!postId || !postOwnerId || !actorId || postOwnerId === actorId) return

  const finalActorName = actorName || (await getProfileName(actorId))
  const shortText = truncateText(postText, 60)

  await createUserNotification({
    userId: postOwnerId,
    type: 'post_like',
    dedupKey: `like_${actorId}_${postId}`,
    title: 'Post liked',
    body: shortText
      ? `${finalActorName} liked your post: ${shortText}`
      : `${finalActorName} liked your post`,
    actorId,
    actorName: finalActorName,
    postId,
    screen: 'PostDetail',
    params: { postId },
  })
}

export const notifyPostComment = async ({
  postId,
  postOwnerId,
  actorId,
  actorName,
  commentText,
  commentId,
  postText,
}: {
  postId: string
  postOwnerId?: string
  actorId: string
  actorName?: string
  commentText: string
  commentId?: string
  postText?: string
}) => {
  if (!postId || !postOwnerId || !actorId || postOwnerId === actorId) return

  const finalActorName = actorName || (await getProfileName(actorId))
  const shortComment = truncateText(commentText, 60)
  const dedupKey = commentId ? `comment_${actorId}_${commentId}` : undefined

  await createUserNotification({
    userId: postOwnerId,
    type: 'post_comment',
    dedupKey,
    title: 'New comment',
    body: `${finalActorName} commented: "${shortComment}"`,
    actorId,
    actorName: finalActorName,
    postId,
    screen: 'Comments',
    params: { postId, focusInput: false },
  })
}

export const notifyBusinessReview = async ({
  businessId,
  businessOwnerId,
  businessName,
  actorId,
  actorName,
  rating,
  hasReview,
}: {
  businessId: string
  businessOwnerId?: string
  businessName?: string
  actorId: string
  actorName?: string
  rating: number
  hasReview?: boolean
}) => {
  if (!businessId || !businessOwnerId || !actorId || businessOwnerId === actorId) return

  const finalActorName = actorName || (await getProfileName(actorId))
  const finalBusinessName = cleanText(businessName, 'your business')

  await createUserNotification({
    userId: businessOwnerId,
    type: 'business_review',
    dedupKey: `review_${actorId}_${businessId}`,
    title: 'New business review',
    body: hasReview
      ? `${finalActorName} reviewed ${finalBusinessName}`
      : `${finalActorName} rated ${finalBusinessName} ${rating}/5`,
    actorId,
    actorName: finalActorName,
    businessId,
    businessName: finalBusinessName,
    screen: 'BusinessProfile',
    params: { businessId },
  })
}
