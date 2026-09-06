'use client'

import { get, ref, update, query, orderByChild, startAt, limitToLast } from 'firebase/database'
import { db } from './firebase'
import { getDistanceKm, DEFAULT_RADIUS_KM } from './locationUtils'
import { UserProfile } from './types'

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

export interface ClientDailyCandidate {
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
  targetRoute: string
  params: Record<string, any>
}

/**
 * Web Client fallback/hybrid daily engagement evaluator.
 * Runs non-blockingly in the browser when the user session is active.
 */
export async function evaluateWebDailyEngagement(
  currentUser: { uid: string } | null | undefined,
  userProfile?: UserProfile | null,
  now = new Date()
): Promise<{ dispatched: boolean; reason?: string }> {
  if (!currentUser?.uid || typeof window === 'undefined') {
    return { dispatched: false, reason: 'No user or window undefined' }
  }

  const uid = currentUser.uid
  const dateKey = getDailyEngagementDateKey(now)
  const cacheKey = `daily_engagement_${dateKey}`

  // 1. Fast local cache check: already evaluated today?
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      return { dispatched: false, reason: 'Already evaluated today (cached)' }
    }
  } catch (e) {
    // Ignore localStorage errors
  }

  // 2. Notification settings and quiet hours check
  try {
    const settingsSnap = await get(ref(db, `notificationSettings/${uid}`))
    const settings = settingsSnap.val() || {}

    if (settings.inAppNotifications === false || settings.dailyEngagement === false) {
      localStorage.setItem(cacheKey, 'skipped_preference')
      return { dispatched: false, reason: 'User disabled engagement notifications' }
    }

    if (isWithinQuietHours(settings, now)) {
      return { dispatched: false, reason: 'Currently within quiet hours' }
    }
  } catch (err) {
    console.warn('[DailyEngagement] Settings check error:', err)
  }

  // 3. Database check: Has a notification for today already been written to RTDB?
  const dedupKey = `daily_${dateKey}`
  try {
    const notifSnap = await get(ref(db, `notifications/${uid}/${dedupKey}`))
    if (notifSnap.exists()) {
      localStorage.setItem(cacheKey, 'already_sent')
      return { dispatched: false, reason: 'Already sent today in database' }
    }
  } catch (err) {
    console.warn('[DailyEngagement] RTDB check error:', err)
  }

  // 4. Blocked users
  let blockedUserIds = new Set<string>()
  try {
    const blockedSnap = await get(ref(db, `users/${uid}/blockedUsers`))
    const blockedMap = blockedSnap.val() || {}
    blockedUserIds = new Set(Object.keys(blockedMap))
  } catch (e) {}

  // 5. Following list
  let followingUids = new Set<string>()
  try {
    const followingSnap = await get(ref(db, `following/${uid}`))
    const followingMap = followingSnap.val() || {}
    followingUids = new Set(Object.keys(followingMap).filter((k) => followingMap[k] === true))
  } catch (e) {}

  const userArea = (userProfile?.area || userProfile?.areaName || userProfile?.city || '').trim()
  const userLat = Number((userProfile as any)?.latitude || 0)
  const userLng = Number((userProfile as any)?.longitude || 0)
  const userHasCoords = userLat !== 0 && userLng !== 0

  let candidate: ClientDailyCandidate | null = null

  // ==========================================
  // TIER 1: Unread direct messages (HIGHEST)
  // ==========================================
  try {
    const userConvsSnap = await get(ref(db, `userConversations/${uid}`))
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
      candidate = {
        priority: 1,
        candidateType: 'unread_message',
        title: 'Unread message waiting',
        body: unread === 1
          ? `You have an unread message from ${senderName}.`
          : `You have ${unread} unread messages waiting from ${senderName}.`,
        screen: 'Chat',
        targetRoute: 'Chat',
        params: {
          conversationId: topUnreadConv.conversationId,
          otherUserId: topUnreadConv.otherUserId,
          otherUserName: topUnreadConv.otherUserName || 'User',
          otherUserAvatar: topUnreadConv.otherUserAvatar || '',
        },
      }
    }
  } catch (err) {
    console.warn('[DailyEngagement] Tier 1 error:', err)
  }

  // ==========================================
  // TIER 2: Recent new follower
  // ==========================================
  if (!candidate) {
    try {
      const twoDaysAgo = now.getTime() - 48 * 3600 * 1000
      const notifsSnap = await get(
        query(
          ref(db, `notifications/${uid}`),
          orderByChild('createdAt'),
          startAt(twoDaysAgo),
          limitToLast(10)
        )
      )

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
        candidate = {
          priority: 2,
          candidateType: 'new_follower',
          title: 'New follower on Circular',
          body: `${name} started following you. Discover their profile and mutual connections.`,
          screen: 'UserProfile',
          targetRoute: 'UserProfile',
          params: { userId: actorId },
        }
      }
    } catch (err) {
      console.warn('[DailyEngagement] Tier 2 error:', err)
    }
  }

  // ==========================================
  // TIER 3: Strong mutual connections nearby
  // ==========================================
  if (!candidate && followingUids.size > 0) {
    try {
      const allPublicSnap = await get(ref(db, 'publicProfiles'))
      const allPublic = allPublicSnap.val() || {}

      let bestCandidate: any = null
      let bestMutualCount = 0

      for (const cUid of Object.keys(allPublic)) {
        if (cUid === uid || followingUids.has(cUid) || blockedUserIds.has(cUid)) continue
        const candProf = allPublic[cUid]
        if (!candProf) continue

        let isNearby = false
        const candArea = String(candProf.area || candProf.areaName || '').trim()
        if (userArea && candArea && userArea.toLowerCase() === candArea.toLowerCase()) {
          isNearby = true
        } else if (userHasCoords && candProf.latitude && candProf.longitude) {
          const dist = getDistanceKm(userLat, userLng, candProf.latitude, candProf.longitude)
          if (dist <= DEFAULT_RADIUS_KM) isNearby = true
        }

        if (!isNearby) continue

        const candFollowersSnap = await get(ref(db, `followers/${cUid}`))
        const candFollowers = candFollowersSnap.val() || {}
        let mutuals = 0
        for (const fId of Object.keys(candFollowers)) {
          if (followingUids.has(fId)) mutuals++
        }

        if (mutuals > bestMutualCount) {
          bestMutualCount = mutuals
          bestCandidate = { uid: cUid, ...candProf }
        }
      }

      if (bestCandidate && bestMutualCount >= 1) {
        const name = bestCandidate.name || bestCandidate.username || 'A neighbor'
        const areaStr = bestCandidate.area || userArea || 'your area'
        candidate = {
          priority: 3,
          candidateType: 'mutual_nearby',
          title: 'Connect with people nearby',
          body: `${name} and ${bestMutualCount} mutual connection${bestMutualCount > 1 ? 's are' : ' is'} in ${areaStr}.`,
          screen: 'UserProfile',
          targetRoute: 'UserProfile',
          params: { userId: bestCandidate.uid },
        }
      }
    } catch (err) {
      console.warn('[DailyEngagement] Tier 3 error:', err)
    }
  }

  // ==========================================
  // TIER 4: Upcoming local events
  // ==========================================
  if (!candidate) {
    try {
      const oneDayAgo = now.getTime() - 24 * 3600 * 1000
      const postsSnap = await get(
        query(
          ref(db, 'posts'),
          orderByChild('createdAt'),
          startAt(oneDayAgo),
          limitToLast(50)
        )
      )

      const posts = postsSnap.val() || {}
      let topEvent: any = null

      for (const pId of Object.keys(posts).reverse()) {
        const p = posts[pId]
        if (!p || p.postType !== 'event' || p.userId === uid || blockedUserIds.has(p.userId)) continue

        const pArea = String(p.area || '').trim()
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
        candidate = {
          priority: 4,
          candidateType: 'local_event',
          title: 'Upcoming local event',
          body: `Local event coming up: "${eventTitle}" in ${areaStr}. Check it out!`,
          screen: 'EventDetails',
          targetRoute: 'EventDetails',
          params: { postId: topEvent.id },
        }
      }
    } catch (err) {
      console.warn('[DailyEngagement] Tier 4 error:', err)
    }
  }

  // ==========================================
  // TIER 5: New local needs or jobs
  // ==========================================
  if (!candidate) {
    try {
      const twoDaysAgo = now.getTime() - 48 * 3600 * 1000
      const [jobsSnap, needsSnap] = await Promise.all([
        get(query(ref(db, 'localJobs'), orderByChild('createdAt'), startAt(twoDaysAgo), limitToLast(20))),
        get(query(ref(db, 'needPosts'), orderByChild('createdAt'), startAt(twoDaysAgo), limitToLast(20))),
      ])

      const jobs = jobsSnap.val() || {}
      const needs = needsSnap.val() || {}

      let topJob: any = null
      for (const jId of Object.keys(jobs).reverse()) {
        const j = jobs[jId]
        if (!j || j.createdBy === uid || blockedUserIds.has(j.createdBy) || j.status === 'closed') continue
        const jArea = String(j.area || '').trim()
        if (userArea && jArea && (userArea.toLowerCase() === jArea.toLowerCase() || jArea.toLowerCase().includes(userArea.toLowerCase()))) {
          topJob = { id: jId, ...j }
          break
        }
      }

      let topNeed: any = null
      for (const nId of Object.keys(needs).reverse()) {
        const n = needs[nId]
        if (!n || n.createdBy === uid || blockedUserIds.has(n.createdBy) || n.status === 'resolved') continue
        const nArea = String(n.area || '').trim()
        if (userArea && nArea && (userArea.toLowerCase() === nArea.toLowerCase() || nArea.toLowerCase().includes(userArea.toLowerCase()))) {
          topNeed = { id: nId, ...n }
          break
        }
      }

      if (topNeed && (!topJob || topNeed.createdAt >= topJob.createdAt)) {
        candidate = {
          priority: 5,
          candidateType: 'local_need',
          title: 'New need in your community',
          body: `New community need: "${topNeed.title}" was posted in ${topNeed.area || userArea}.`,
          screen: 'NeedDetails',
          targetRoute: 'NeedDetails',
          params: { needId: topNeed.id },
        }
      } else if (topJob) {
        candidate = {
          priority: 5,
          candidateType: 'local_job',
          title: 'New local job opportunity',
          body: `"${topJob.title}" at ${topJob.businessName || 'a local business'} was posted in ${topJob.area || userArea}.`,
          screen: 'JobDetails',
          targetRoute: 'JobDetails',
          params: { jobId: topJob.id },
        }
      }
    } catch (err) {
      console.warn('[DailyEngagement] Tier 5 error:', err)
    }
  }

  // ==========================================
  // TIER 6: Recent post from followed users
  // ==========================================
  if (!candidate && followingUids.size > 0) {
    try {
      const oneDayAgo = now.getTime() - 24 * 3600 * 1000
      const recentPostsSnap = await get(
        query(
          ref(db, 'posts'),
          orderByChild('createdAt'),
          startAt(oneDayAgo),
          limitToLast(30)
        )
      )

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
        candidate = {
          priority: 6,
          candidateType: 'followed_activity',
          title: 'Update from someone you follow',
          body: `${author} shared: "${snippet}"`,
          screen: 'PostDetail',
          targetRoute: 'PostDetail',
          params: { postId: topFollowedPost.id },
        }
      }
    } catch (err) {
      console.warn('[DailyEngagement] Tier 6 error:', err)
    }
  }

  // ==========================================
  // TIER 7: New nearby people / community members
  // ==========================================
  if (!candidate) {
    try {
      const twoDaysAgo = now.getTime() - 48 * 3600 * 1000
      const publicProfilesSnap = await get(ref(db, 'publicProfiles'))
      const allProfiles = publicProfilesSnap.val() || {}

      const newNearby: any[] = []
      for (const cUid of Object.keys(allProfiles)) {
        if (cUid === uid || followingUids.has(cUid) || blockedUserIds.has(cUid)) continue
        const prof = allProfiles[cUid]
        if (!prof || !prof.createdAt || prof.createdAt < twoDaysAgo) continue

        const candArea = String(prof.area || prof.areaName || '').trim()
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
        candidate = {
          priority: 7,
          candidateType: 'people_nearby',
          title: 'New neighbors joined Circular',
          body: count === 1
            ? `${firstName} joined your community in ${areaStr}. Welcome them!`
            : `${count} new neighbors joined your community in ${areaStr}. Connect with them!`,
          screen: count === 1 ? 'UserProfile' : 'Search',
          targetRoute: count === 1 ? 'UserProfile' : 'Search',
          params: count === 1 ? { userId: newNearby[0].uid } : { initialTab: 'people' },
        }
      }
    } catch (err) {
      console.warn('[DailyEngagement] Tier 7 error:', err)
    }
  }

  // ==========================================
  // TIER 8: Local business updates
  // ==========================================
  if (!candidate) {
    try {
      const twoDaysAgo = now.getTime() - 48 * 3600 * 1000
      const postsSnap = await get(
        query(
          ref(db, 'posts'),
          orderByChild('createdAt'),
          startAt(twoDaysAgo),
          limitToLast(30)
        )
      )

      const posts = postsSnap.val() || {}
      let topBizPost: any = null

      for (const pId of Object.keys(posts).reverse()) {
        const p = posts[pId]
        if (!p || (!p.businessId && !p.hasBusinessProfile) || p.userId === uid || blockedUserIds.has(p.userId)) continue

        const pArea = String(p.area || '').trim()
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
        candidate = {
          priority: 8,
          candidateType: 'business_update',
          title: 'Local business update',
          body: `${bizName} shared a new update in ${areaStr}.`,
          screen: topBizPost.businessId ? 'BusinessProfile' : 'PostDetail',
          targetRoute: topBizPost.businessId ? 'BusinessProfile' : 'PostDetail',
          params: topBizPost.businessId ? { businessId: topBizPost.businessId } : { postId: topBizPost.id },
        }
      }
    } catch (err) {
      console.warn('[DailyEngagement] Tier 8 error:', err)
    }
  }

  // Quality floor: No candidate found -> strictly avoid sending spam
  if (!candidate) {
    localStorage.setItem(cacheKey, 'no_candidate')
    return { dispatched: false, reason: 'No high-value candidate found today. Spam prevented.' }
  }

  // 6. Idempotent write to RTDB
  const createdAt = Date.now()
  const payload = {
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
    targetRoute: candidate.targetRoute,
    params: candidate.params,
    targetParams: candidate.params,
    candidateType: candidate.candidateType,
    priority: candidate.priority,
  }

  try {
    await update(ref(db), {
      [`notifications/${uid}/${dedupKey}`]: payload,
    })
    localStorage.setItem(cacheKey, 'dispatched')
    return { dispatched: true }
  } catch (writeErr: any) {
    console.warn('[DailyEngagement] Dispatch write error:', writeErr)
    localStorage.setItem(cacheKey, 'write_error')
    return { dispatched: false, reason: String(writeErr) }
  }
}
