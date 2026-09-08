// Firebase Messaging Service Worker for Circular Web
// Runs in the background to handle web push notifications when tab is inactive or closed.

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

const firebaseConfig = {
  apiKey: 'AIzaSyAAj9NI9tHlfgZd3Xi4ie4l6z3c8xfJH_c',
  authDomain: 'circularapp.in',
  databaseURL: 'https://buzzly-v-default-rtdb.firebaseio.com',
  projectId: 'buzzly-v',
  storageBucket: 'buzzly-v.appspot.com',
  messagingSenderId: '836493689240',
  appId: '1:836493689240:web:8026edda556fe3e599ebed',
}

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

const messaging = firebase.messaging()

// Background notification listener
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload)

  const data = payload.data || {}
  const title = payload.notification?.title || data.title || 'Circular'
  const body = payload.notification?.body || data.body || 'You have a new community update on Circular.'
  const icon = '/circular-logo.png'
  const badge = '/circular-logo.png'

  const notificationOptions = {
    body,
    icon,
    badge,
    data,
    tag: data.conversationId || data.postId || data.type || 'circular-notification',
    renotify: true,
  }

  return self.registration.showNotification(title, notificationOptions)
})

// Handle notification click to navigate to target entity
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  let targetUrl = '/notifications'

  if (data.conversationId) {
    targetUrl = `/chat/${data.conversationId}`
  } else if (data.postId) {
    targetUrl = `/post/${data.postId}`
  } else if (data.businessId) {
    targetUrl = `/business/${data.businessId}`
  } else if (data.jobId) {
    targetUrl = `/job/${data.jobId}`
  } else if (data.needId) {
    targetUrl = `/need/${data.needId}`
  } else if (data.eventId) {
    targetUrl = `/event/${data.eventId}`
  } else if (data.targetUserId || data.actorId) {
    targetUrl = `/user/${data.targetUserId || data.actorId}`
  } else if (data.screen === 'Chat' && data.params?.conversationId) {
    targetUrl = `/chat/${data.params.conversationId}`
  } else if (data.screen === 'PostDetail' && data.params?.postId) {
    targetUrl = `/post/${data.params.postId}`
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If a window is already open on circularapp.in, focus it and navigate
        for (const client of windowClients) {
          if ('focus' in client) {
            client.focus()
            if ('navigate' in client) {
              return client.navigate(targetUrl)
            }
            return
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
  )
})
