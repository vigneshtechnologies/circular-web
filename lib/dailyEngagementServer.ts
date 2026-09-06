import 'server-only'
import { getAdminDb } from './firebaseAdmin'
import { getDistanceKm, DEFAULT_RADIUS_KM } from './locationUtils'

export interface DailyEngagementCandidate {
  priority: number
  candidateType:
    | 'unread_message'
    | 'new_follower'
    | 'mutual_nearby'
    | 'local_event'
    | 'local_need'
    | 'local_job'
    | 'followed_activity'
    | 'people_nearby'
    | 'business_update'
  title: string
  body: string
  screen: string
  params: Record<string, any>
  metadata?: Record<string, any>
}

export interface EvaluationResult {
  uid: string
  dateKey: string
  status:
    | 'dispatched'
    | 'already_sent'
    | 'skipped_preference'
    | 'skipped_quiet_hours'
    | 'no_candidate'
    | 'error'
  candidate?: DailyEngagementCandidate | null
  pushSent?: boolean
  pushCount?: number
  reason?: string
}

export function getDailyEngagementDateKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isWithinQuietHours(
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

const isValidExpoPushToken = (token: string): boolean => {
  return /^ExponentPushToken\[[^\]]+\]$|^ExpoPushToken\[[^\]]+\]$/.test(token)
}

export async function sendServerExpoPush({
  tokens,
  title,
  body,
  data,
}: {
  tokens: string[]
  title: string
  body: string
  data?: Record<string, any>
}): Promise<{ successCount: number; failureCount: number }> {
  const validTokens = Array.from(new Set(tokens.filter((t) => typeof t === 'string' && isValidExpoPushToken(t))))
  if (validTokens.length === 0) {
    return { successCount: 0, failureCount: 0 }
  }

  let successCount = 0
  let failureCount = 0

  const messages = validTokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    channelId: 'default',
    priority: 'high',
    data: {
      screen: 'Notifications',
      ...data,
    },
  }))

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    })

    if (res.ok) {
      const json = await res.json()
      const dataArr = json.data || []
      dataArr.forEach((ticket: any) => {
        if (ticket.status === 'ok') successCount++
        else failureCount++
      })
    } else {
      failureCount += messages.length
    }
  } catch (err) {
    console.warn('[ServerPush] Error sending push to Expo:', err)
    failureCount += messages.length
  }

  return { successCount, failureCount }
}

export async function evaluateDailyEngagementForUser(
  uid: string,
  now = new Date()
): Promise<DailyEngagementCandidate | null> {
  const adminDb = getAdminDb()
  if (!adminDb || !uid) return null

  // 1. Fetch user's blocked users
  const blockedSnap = await adminDb.ref(`users/${uid}/blockedUsers`).once('value')
  const blockedMap = blockedSnap.val() || {}
  const blockedUserIds = new Set<string>(Object.keys(blockedMap))

  // 2. Fetch user's profile and location
  const [userSnap, publicSnap] = await Promise.all([
    adminDb.ref(`users/${uid}`).once('value'),
    adminDb.ref(`publicProfiles/${uid}`).once('value'),
  ])
  const userData = userSnap.val() || {}
  const publicData = publicSnap.val() || {}

  const userArea = (publicData.area || userData.area || publicData.areaName || userData.areaName || '').trim()
  const userLat = Number(publicData.latitude || userData.latitude || 0)
  const userLng = Number(publicData.longitude || userData.longitude || 0)
  const userHasCoords = userLat !== 0 && userLng !== 0

  // 3. Fetch user's following
  const followingSnap = await adminDb.ref(`following/${uid}`).once('value')
  const followingMap = followingSnap.val() || {}
  const followingUids = new Set<string>(Object.keys(followingMap).filter((k) => followingMap[k] === true))

  // ==========================================
  // TIER 1: Unread direct messages (HIGHEST)
  // ==========================================
  try {
    const userConvsSnap = await adminDb.ref(`userConversations/${uid}`).once('value')
    const userConvs = userConvsSnap.val() || {}
    let topUnreadConv: any = null

    for (const convId of Object.keys(userConvs)) {
      const conv = userConvs[convId]
      if (!conv || !conv.unreadCount || conv.unreadCount <= 0) continue
      if (conv.otherUserId && blockedUserIds.has(conv.otherUserId)) continue
      if (!topUnreadConv || conv.lastMessageTime > topUnreadConv.lastMessageTime) {
        topUnreadConv = conv
      }
    }

    if (topUnreadConv) {
      const senderName = topUnreadConv.otherUserName || 'Someone'
      const unread = topUnreadConv.unreadCount
      return {
        priority: 1,
        candidateType: 'unread_message',
        title: 'Unread message waiting',
        body: unread === 1
          ? `You have an unread message from ${senderName}.`
          : `You have ${unread} unread messages waiting from ${senderName}.`,
        screen: 'Chat',
        params: {
          conversationId: topUnreadConv.conversationId,
          otherUserId: topUnreadConv.otherUserId,
          otherUserName: topUnreadConv.otherUserName || 'User',
          otherUserAvatar: topUnreadConv.otherUserAvatar || '',
        },
      }
    }
  } catch (err) {
    console.warn('[DailyEngagement] Error checking unread messages:', err)
  }

  // ==========================================
  // TIER 2: Recent new follower
  // ==========================================
  try {
    const twoDaysAgo = now.getTime() - 48 * 3600 * 1000
    const notifsSnap = await adminDb
      .ref(`notifications/${uid}`)
      .orderByChild('createdAt')
      .startAt(twoDaysAgo)
      .once('value')

    const notifs = notifsSnap.val() || {}
    let recentFollower: any = null

    for (const nId of Object.keys(notifs).reverse()) {
      const n = notifs[nId]
      if (n && n.type === 'follow' && n.createdAt >= twoDaysAgo) {
        const actorId = n.actorId || n.senderId
        if (actorId && actorId !== uid && !blockedUserIds.has(actorId)) {
          recentFollower = n
          break
        }
      }
    }

    if (recentFollower) {
      const name = recentFollower.actorName || recentFollower.senderName || 'A member'
      const actorId = recentFollower.actorId || recentFollower.senderId
      return {
        priority: 2,
        candidateType: 'new_follower',
        title: 'New follower on Circular',
        body: `${name} started following you. Discover their profile and mutual connections.`,
        screen: 'UserProfile',
        params: { userId: actorId },
      }
    }
  } catch (err) {
    console.warn('[DailyEngagement] Error checking followers:', err)
  }

  // ==========================================
  // TIER 3: Strong mutual connections nearby
  // ==========================================
  try {
    if (followingUids.size > 0) {
      const allPublicSnap = await adminDb.ref('publicProfiles').once('value')
      const allPublic = allPublicSnap.val() || {}

      let bestCandidate: any = null
      let bestMutualCount = 0

      for (const candidateUid of Object.keys(allPublic)) {
        if (candidateUid === uid || followingUids.has(candidateUid) || blockedUserIds.has(candidateUid)) {
          continue
        }

        const candidateProfile = allPublic[candidateUid]
        if (!candidateProfile) continue

        // Proximity check: same area or within 25km
        let isNearby = false
        const candArea = (candidateProfile.area || candidateProfile.areaName || '').trim()
        if (userArea && candArea && userArea.toLowerCase() === candArea.toLowerCase()) {
          isNearby = true
        } else if (userHasCoords && candidateProfile.latitude && candidateProfile.longitude) {
          const dist = getDistanceKm(userLat, userLng, candidateProfile.latitude, candidateProfile.longitude)
          if (dist <= DEFAULT_RADIUS_KM) isNearby = true
        }

        if (!isNearby) continue

        // Count mutual connections
        const candFollowersSnap = await adminDb.ref(`followers/${candidateUid}`).once('value')
        const candFollowers = candFollowersSnap.val() || {}
        let mutuals = 0
        for (const followerId of Object.keys(candFollowers)) {
          if (followingUids.has(followerId)) mutuals++
        }

        if (mutuals > bestMutualCount) {
          bestMutualCount = mutuals
          bestCandidate = { uid: candidateUid, ...candidateProfile }
        }
      }

      if (bestCandidate && bestMutualCount >= 1) {
        const name = bestCandidate.name || bestCandidate.username || 'A neighbor'
        const areaStr = bestCandidate.area || userArea || 'your area'
        return {
          priority: 3,
          candidateType: 'mutual_nearby',
          title: 'Connect with people nearby',
          body: `${name} and ${bestMutualCount} mutual connection${bestMutualCount > 1 ? 's are' : ' is'} in ${areaStr}.`,
          screen: 'UserProfile',
          params: { userId: bestCandidate.uid },
        }
      }
    }
  } catch (err) {
    console.warn('[DailyEngagement] Error checking mutuals:', err)
  }

  // ==========================================
  // TIER 4: Upcoming local events
  // ==========================================
  try {
    const twoDaysFuture = now.getTime() + 48 * 3600 * 1000
    const oneDayAgo = now.getTime() - 24 * 3600 * 1000

    const postsSnap = await adminDb
      .ref('posts')
      .orderByChild('createdAt')
      .startAt(oneDayAgo)
      .limitToLast(50)
      .once('value')

    const posts = postsSnap.val() || {}
    let topEvent: any = null

    for (const pId of Object.keys(posts).reverse()) {
      const p = posts[pId]
      if (!p || p.postType !== 'event' || p.userId === uid || blockedUserIds.has(p.userId)) continue

      const pArea = (p.area || '').trim()
      let isNearby = false
      if (userArea && pArea && userArea.toLowerCase() === pArea.toLowerCase()) {
        isNearby = true
      } else if (userHasCoords && p.latitude && p.longitude) {
        const dist = getDistanceKm(userLat, userLng, p.latitude, p.longitude)
        if (dist <= DEFAULT_RADIUS_KM) isNearby = true
      }

      if (isNearby) {
        topEvent = { id: pId, ...p }
        break
      }
    }

    if (topEvent) {
      const eventTitle = topEvent.title || topEvent.event?.title || 'Local Event'
      const areaStr = topEvent.area || userArea || 'your area'
      return {
        priority: 4,
        candidateType: 'local_event',
        title: 'Upcoming local event',
        body: `Local event coming up: "${eventTitle}" in ${areaStr}. Check it out!`,
        screen: 'EventDetails',
        params: { postId: topEvent.id },
      }
    }
  } catch (err) {
    console.warn('[DailyEngagement] Error checking events:', err)
  }

  // ==========================================
  // TIER 5: New local needs or jobs
  // ==========================================
  try {
    const twoDaysAgo = now.getTime() - 48 * 3600 * 1000
    const [jobsSnap, needsSnap] = await Promise.all([
      adminDb.ref('localJobs').orderByChild('createdAt').startAt(twoDaysAgo).limitToLast(20).once('value'),
      adminDb.ref('needPosts').orderByChild('createdAt').startAt(twoDaysAgo).limitToLast(20).once('value'),
    ])

    const jobs = jobsSnap.val() || {}
    const needs = needsSnap.val() || {}

    let topJob: any = null
    for (const jId of Object.keys(jobs).reverse()) {
      const j = jobs[jId]
      if (!j || j.createdBy === uid || blockedUserIds.has(j.createdBy) || j.status === 'closed') continue
      const jArea = (j.area || '').trim()
      if (userArea && jArea && (userArea.toLowerCase() === jArea.toLowerCase() || jArea.toLowerCase().includes(userArea.toLowerCase()))) {
        topJob = { id: jId, ...j }
        break
      }
    }

    let topNeed: any = null
    for (const nId of Object.keys(needs).reverse()) {
      const n = needs[nId]
      if (!n || n.createdBy === uid || blockedUserIds.has(n.createdBy) || n.status === 'resolved') continue
      const nArea = (n.area || '').trim()
      if (userArea && nArea && (userArea.toLowerCase() === nArea.toLowerCase() || nArea.toLowerCase().includes(userArea.toLowerCase()))) {
        topNeed = { id: nId, ...n }
        break
      }
    }

    if (topNeed && (!topJob || topNeed.createdAt >= topJob.createdAt)) {
      return {
        priority: 5,
        candidateType: 'local_need',
        title: 'New need in your community',
        body: `New community need: "${topNeed.title}" was posted in ${topNeed.area || userArea}.`,
        screen: 'NeedDetails',
        params: { needId: topNeed.id },
      }
    } else if (topJob) {
      return {
        priority: 5,
        candidateType: 'local_job',
        title: 'New local job opportunity',
        body: `"${topJob.title}" at ${topJob.businessName || 'a local business'} was posted in ${topJob.area || userArea}.`,
        screen: 'JobDetails',
        params: { jobId: topJob.id },
      }
    }
  } catch (err) {
    console.warn('[DailyEngagement] Error checking jobs and needs:', err)
  }

  // ==========================================
  // TIER 6: Recent post from followed users
  // ==========================================
  try {
    if (followingUids.size > 0) {
      const oneDayAgo = now.getTime() - 24 * 3600 * 1000
      const recentPostsSnap = await adminDb
        .ref('posts')
        .orderByChild('createdAt')
        .startAt(oneDayAgo)
        .limitToLast(30)
        .once('value')

      const posts = recentPostsSnap.val() || {}
      let topFollowedPost: any = null

      for (const pId of Object.keys(posts).reverse()) {
        const p = posts[pId]
        if (p && followingUids.has(p.userId) && !blockedUserIds.has(p.userId)) {
          topFollowedPost = { id: pId, ...p }
          break
        }
      }

      if (topFollowedPost) {
        const author = topFollowedPost.userName || 'Someone you follow'
        const rawText = topFollowedPost.text || topFollowedPost.title || 'a new post'
        const snippet = rawText.length > 50 ? `${rawText.slice(0, 47)}...` : rawText
        return {
          priority: 6,
          candidateType: 'followed_activity',
          title: 'Update from someone you follow',
          body: `${author} shared: "${snippet}"`,
          screen: 'PostDetail',
          params: { postId: topFollowedPost.id },
        }
      }
    }
  } catch (err) {
    console.warn('[DailyEngagement] Error checking followed posts:', err)
  }

  // ==========================================
  // TIER 7: New nearby people / community members
  // ==========================================
  try {
    const twoDaysAgo = now.getTime() - 48 * 3600 * 1000
    const publicProfilesSnap = await adminDb.ref('publicProfiles').once('value')
    const allProfiles = publicProfilesSnap.val() || {}

    const newNearby: any[] = []
    for (const cUid of Object.keys(allProfiles)) {
      if (cUid === uid || followingUids.has(cUid) || blockedUserIds.has(cUid)) continue
      const prof = allProfiles[cUid]
      if (!prof || !prof.createdAt || prof.createdAt < twoDaysAgo) continue

      const candArea = (prof.area || prof.areaName || '').trim()
      let isNearby = false
      if (userArea && candArea && userArea.toLowerCase() === candArea.toLowerCase()) {
        isNearby = true
      } else if (userHasCoords && prof.latitude && prof.longitude) {
        const dist = getDistanceKm(userLat, userLng, prof.latitude, prof.longitude)
        if (dist <= DEFAULT_RADIUS_KM) isNearby = true
      }

      if (isNearby) {
        newNearby.push({ uid: cUid, ...prof })
      }
    }

    if (newNearby.length > 0) {
      const count = newNearby.length
      const firstName = newNearby[0].name || newNearby[0].username || 'A new neighbor'
      const areaStr = userArea || 'your neighborhood'
      return {
        priority: 7,
        candidateType: 'people_nearby',
        title: 'New neighbors joined Circular',
        body: count === 1
          ? `${firstName} joined your community in ${areaStr}. Welcome them!`
          : `${count} new neighbors joined your community in ${areaStr}. Connect with them!`,
        screen: count === 1 ? 'UserProfile' : 'Search',
        params: count === 1 ? { userId: newNearby[0].uid } : { initialTab: 'people' },
      }
    }
  } catch (err) {
    console.warn('[DailyEngagement] Error checking nearby members:', err)
  }

  // ==========================================
  // TIER 8: Local business updates
  // ==========================================
  try {
    const twoDaysAgo = now.getTime() - 48 * 3600 * 1000
    const postsSnap = await adminDb
      .ref('posts')
      .orderByChild('createdAt')
      .startAt(twoDaysAgo)
      .limitToLast(30)
      .once('value')

    const posts = postsSnap.val() || {}
    let topBizPost: any = null

    for (const pId of Object.keys(posts).reverse()) {
      const p = posts[pId]
      if (!p || (!p.businessId && !p.hasBusinessProfile) || p.userId === uid || blockedUserIds.has(p.userId)) continue

      const pArea = (p.area || '').trim()
      let isNearby = false
      if (userArea && pArea && userArea.toLowerCase() === pArea.toLowerCase()) {
        isNearby = true
      } else if (userHasCoords && p.latitude && p.longitude) {
        const dist = getDistanceKm(userLat, userLng, p.latitude, p.longitude)
        if (dist <= DEFAULT_RADIUS_KM) isNearby = true
      }

      if (isNearby) {
        topBizPost = { id: pId, ...p }
        break
      }
    }

    if (topBizPost) {
      const bizName = topBizPost.businessName || 'A local business'
      const areaStr = topBizPost.area || userArea || 'your area'
      return {
        priority: 8,
        candidateType: 'business_update',
        title: 'Local business update',
        body: `${bizName} shared a new update in ${areaStr}.`,
        screen: topBizPost.businessId ? 'BusinessProfile' : 'PostDetail',
        params: topBizPost.businessId ? { businessId: topBizPost.businessId } : { postId: topBizPost.id },
      }
    }
  } catch (err) {
    console.warn('[DailyEngagement] Error checking business updates:', err)
  }

  // Quality floor: No candidate met quality criteria
  return null
}

export async function evaluateAndDispatchDailyEngagementForUser(
  uid: string,
  now = new Date()
): Promise<EvaluationResult> {
  const adminDb = getAdminDb()
  const dateKey = getDailyEngagementDateKey(now)

  if (!adminDb || !uid) {
    return { uid, dateKey, status: 'error', reason: 'Admin database or uid missing' }
  }

  // 1. Check user notification settings
  const settingsSnap = await adminDb.ref(`notificationSettings/${uid}`).once('value')
  const settings = settingsSnap.val() || {}

  if (settings.inAppNotifications === false || settings.dailyEngagement === false) {
    return { uid, dateKey, status: 'skipped_preference', reason: 'User disabled daily engagement or in-app notifications' }
  }

  if (isWithinQuietHours(settings, now)) {
    return { uid, dateKey, status: 'skipped_quiet_hours', reason: 'Currently within user quiet hours' }
  }

  // 2. Deterministic Deduplication: Check if today's notification already exists
  const dedupKey = `daily_${dateKey}`
  const notifRef = adminDb.ref(`notifications/${uid}/${dedupKey}`)
  const existingSnap = await notifRef.once('value')

  if (existingSnap.exists()) {
    return { uid, dateKey, status: 'already_sent', reason: 'Notification already dispatched for today' }
  }

  // 3. Evaluate 8-tier candidate
  const candidate = await evaluateDailyEngagementForUser(uid, now)

  if (!candidate) {
    return { uid, dateKey, status: 'no_candidate', reason: 'No high-value candidate found today. Spam prevented.' }
  }

  // 4. Dispatch In-App Notification using deterministic key
  const createdAt = Date.now()
  const notifPayload = {
    id: dedupKey,
    type: 'daily_engagement',
    title: candidate.title,
    body: candidate.body,
    message: candidate.body,
    read: false,
    createdAt,
    actorId: uid,
    senderId: uid,
    senderName: 'Circular',
    senderAvatar: '/circular-logo.png',
    screen: candidate.screen,
    targetRoute: candidate.screen,
    params: candidate.params,
    targetParams: candidate.params,
    candidateType: candidate.candidateType,
    priority: candidate.priority,
  }

  await notifRef.set(notifPayload)

  // Record audit history
  await adminDb.ref(`dailyEngagementHistory/${uid}/${dedupKey}`).set({
    dateKey,
    candidateType: candidate.candidateType,
    priority: candidate.priority,
    dispatchedAt: createdAt,
  })

  // 5. Dispatch Expo Push Notification if enabled
  let pushSent = false
  let pushCount = 0

  if (settings.phonePushNotifications !== false) {
    const tokensSnap = await adminDb.ref(`pushTokens/${uid}`).once('value')
    const tokensData = tokensSnap.val() || {}
    const tokens: string[] = []

    Object.values(tokensData).forEach((record: any) => {
      if (typeof record === 'string') tokens.push(record)
      else if (record?.enabled !== false && typeof record?.token === 'string') tokens.push(record.token)
    })

    if (tokens.length > 0) {
      const pushRes = await sendServerExpoPush({
        tokens,
        title: candidate.title,
        body: candidate.body,
        data: {
          type: 'daily_engagement',
          notificationId: dedupKey,
          screen: candidate.screen,
          targetRoute: candidate.screen,
          params: candidate.params,
          targetParams: candidate.params,
        },
      })
      pushSent = pushRes.successCount > 0
      pushCount = pushRes.successCount
    }
  }

  return {
    uid,
    dateKey,
    status: 'dispatched',
    candidate,
    pushSent,
    pushCount,
  }
}

export async function evaluateDailyEngagementForAllUsers(
  now = new Date()
): Promise<{
  dateKey: string
  totalUsers: number
  dispatched: number
  alreadySent: number
  skippedPreference: number
  skippedQuietHours: number
  noCandidate: number
  errors: number
  results: EvaluationResult[]
}> {
  const adminDb = getAdminDb()
  const dateKey = getDailyEngagementDateKey(now)

  if (!adminDb) {
    throw new Error('Firebase Admin database unavailable')
  }

  const usersSnap = await adminDb.ref('users').once('value')
  const users = usersSnap.val() || {}
  const uids = Object.keys(users)

  const results: EvaluationResult[] = []
  let dispatched = 0
  let alreadySent = 0
  let skippedPreference = 0
  let skippedQuietHours = 0
  let noCandidate = 0
  let errors = 0

  for (const uid of uids) {
    try {
      const res = await evaluateAndDispatchDailyEngagementForUser(uid, now)
      results.push(res)
      if (res.status === 'dispatched') dispatched++
      else if (res.status === 'already_sent') alreadySent++
      else if (res.status === 'skipped_preference') skippedPreference++
      else if (res.status === 'skipped_quiet_hours') skippedQuietHours++
      else if (res.status === 'no_candidate') noCandidate++
      else errors++
    } catch (err) {
      console.warn(`[DailyEngagement] Error evaluating user ${uid}:`, err)
      errors++
      results.push({ uid, dateKey, status: 'error', reason: String(err) })
    }
  }

  return {
    dateKey,
    totalUsers: uids.length,
    dispatched,
    alreadySent,
    skippedPreference,
    skippedQuietHours,
    noCandidate,
    errors,
    results,
  }
}
