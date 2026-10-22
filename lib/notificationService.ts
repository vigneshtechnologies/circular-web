import {
  createUserNotification,
  createNotificationsForUsers,
  dispatchWebPeerPushNotification,
  notifyChatMessage,
  notifyFollow,
  notifyPostLike,
  notifyPostComment,
  notifyPostCommentReply,
  notifyBusinessReview,
  notifyJobApplication,
} from './notifications'

export async function sendRemotePushNotification(payload: {
  recipientId: string
  title: string
  body: string
  type?: string
  data?: Record<string, any>
  screen?: string
  params?: Record<string, any>
  conversationId?: string
  postId?: string
  businessId?: string
}): Promise<boolean> {
  try {
    await dispatchWebPeerPushNotification({
      recipientId: payload.recipientId,
      type: payload.type || 'chat_message',
      title: payload.title,
      body: payload.body,
      screen: payload.screen,
      params: payload.params,
      conversationId: payload.conversationId || payload.data?.conversationId,
      postId: payload.postId || payload.data?.postId,
      businessId: payload.businessId || payload.data?.businessId,
    })
    return true
  } catch (err) {
    console.warn('[NotificationService] Error sending remote push notification:', err)
    return false
  }
}

export {
  createUserNotification,
  createNotificationsForUsers,
  dispatchWebPeerPushNotification,
  notifyChatMessage,
  notifyFollow,
  notifyPostLike,
  notifyPostComment,
  notifyPostCommentReply,
  notifyBusinessReview,
  notifyJobApplication,
}
