import 'server-only'
import { getAdminDb } from './firebaseAdmin'

// 1. Types for Sanitized Public Data
export interface PublicBusinessData {
  id: string
  name: string
  category: string
  area: string
  city?: string
  description?: string
  photoUrl?: string
  rating?: number
  isVerified?: boolean
  createdAt?: number
}

export interface PublicPostData {
  id: string
  text: string
  category: string
  area: string
  images: string[]
  postType: string
  smart?: any
  authorName: string
  authorAvatar?: string
  createdAt?: number
}

export interface PublicJobData {
  id: string
  title: string
  businessName: string
  jobType: string
  category?: string
  salary?: string
  area: string
  description: string
  createdAt?: number
}

export interface PublicEventData {
  id: string
  title: string
  venue: string
  area: string
  date?: string
  time?: string
  description: string
  imageUrl?: string
  organizerName?: string
  createdAt?: number
}

export interface PublicNeedData {
  id: string
  title: string
  category: string
  urgency: string
  area: string
  description: string
  requesterName?: string
  createdAt?: number
}

export interface PublicUserData {
  uid: string
  name: string
  username?: string
  area?: string
  bio?: string
  avatarUrl?: string
  businessTrustLabel?: string
}

// 2. Public Entity Single Getters
export async function getPublicBusiness(id: string): Promise<PublicBusinessData | null> {
  const db = getAdminDb()
  if (!db || !id) return null

  try {
    const snap = await db.ref(`businessProfiles/${id}`).once('value')
    if (!snap.exists()) return null

    const data = snap.val()
    if (data.isRestricted || data.isDeleted) return null

    let photoUrl = data.logoUrl || data.imageUrl || data.photoUrl || ''
    if (!photoUrl) {
      const photosSnap = await db.ref(`businessPhotos/${id}`).limitToLast(1).once('value').catch(() => null)
      if (photosSnap && photosSnap.exists()) {
        const pVal = photosSnap.val()
        const firstKey = Object.keys(pVal)[0]
        if (firstKey && pVal[firstKey]) {
          photoUrl = pVal[firstKey].photoUrl || pVal[firstKey].url || ''
        }
      }
    }

    return {
      id,
      name: String(data.businessName || data.name || 'Local Business').trim(),
      category: String(data.category || data.businessCategory || 'Local Shop').trim(),
      area: String(data.area || data.city || data.areaName || 'Local Community').trim(),
      city: data.city ? String(data.city).trim() : undefined,
      description: data.description ? String(data.description).trim() : undefined,
      photoUrl: photoUrl || undefined,
      rating: typeof data.rating === 'number' && data.rating > 0 ? data.rating : undefined,
      isVerified: Boolean(data.isVerified || data.verified),
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : undefined,
    }
  } catch (err) {
    console.warn(`[getPublicBusiness] Error fetching business #${id}:`, err)
    return null
  }
}

export async function getPublicPost(id: string): Promise<PublicPostData | null> {
  const db = getAdminDb()
  if (!db || !id) return null

  try {
    const snap = await db.ref(`posts/${id}`).once('value')
    if (!snap.exists()) return null

    const data = snap.val()
    if (data.isRestricted || data.isDeleted || data.isPrivate) return null

    const images: string[] = []
    if (Array.isArray(data.imageUrls)) {
      data.imageUrls.forEach((u: any) => typeof u === 'string' && images.push(u))
    } else if (typeof data.imageUrl === 'string') {
      images.push(data.imageUrl)
    }

    return {
      id,
      text: String(data.text || data.content || '').trim(),
      category: String(data.category || 'General').trim(),
      area: String(data.area || data.areaName || data.city || 'Local Community').trim(),
      images,
      postType: String(data.postType || 'normal'),
      smart: data.smart || undefined,
      authorName: String(data.authorName || data.userName || 'Community Member').trim(),
      authorAvatar: data.authorAvatar || data.userAvatar || undefined,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : undefined,
    }
  } catch (err) {
    console.warn(`[getPublicPost] Error fetching post #${id}:`, err)
    return null
  }
}

export async function getPublicJob(id: string): Promise<PublicJobData | null> {
  const db = getAdminDb()
  if (!db || !id) return null

  try {
    const snap = await db.ref(`jobs/${id}`).once('value')
    if (!snap.exists()) return null

    const data = snap.val()
    if (data.isRestricted || data.isDeleted || data.status === 'expired') return null

    return {
      id,
      title: String(data.title || 'Job Opening').trim(),
      businessName: String(data.businessName || data.employerName || 'Local Employer').trim(),
      jobType: String(data.jobType || 'Full-time').trim(),
      category: data.category ? String(data.category).trim() : undefined,
      salary: data.salary ? String(data.salary).trim() : undefined,
      area: String(data.area || data.city || 'Local Area').trim(),
      description: String(data.description || '').trim(),
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : undefined,
    }
  } catch (err) {
    console.warn(`[getPublicJob] Error fetching job #${id}:`, err)
    return null
  }
}

export async function getPublicEvent(id: string): Promise<PublicEventData | null> {
  const db = getAdminDb()
  if (!db || !id) return null

  try {
    // Check in posts (event postType) or events node
    let data: any = null
    const eSnap = await db.ref(`events/${id}`).once('value').catch(() => null)
    if (eSnap && eSnap.exists()) {
      data = eSnap.val()
    } else {
      const pSnap = await db.ref(`posts/${id}`).once('value').catch(() => null)
      if (pSnap && pSnap.exists() && pSnap.val().postType === 'event') {
        const postVal = pSnap.val()
        data = {
          id,
          title: postVal.event?.title || postVal.text || 'Community Event',
          venue: postVal.event?.venue || postVal.area || 'Local Venue',
          area: postVal.area || 'Local Community',
          date: postVal.event?.date || '',
          time: postVal.event?.time || '',
          description: postVal.event?.description || postVal.text || '',
          imageUrl: postVal.imageUrl || (postVal.imageUrls && postVal.imageUrls[0]) || '',
          organizerName: postVal.authorName || postVal.userName || 'Community Organizer',
          createdAt: postVal.createdAt,
        }
      }
    }

    if (!data || data.isRestricted || data.isDeleted || data.status === 'cancelled') return null

    return {
      id,
      title: String(data.title || 'Community Event').trim(),
      venue: String(data.venue || 'Local Community Venue').trim(),
      area: String(data.area || 'Local Area').trim(),
      date: data.date ? String(data.date).trim() : undefined,
      time: data.time ? String(data.time).trim() : undefined,
      description: String(data.description || '').trim(),
      imageUrl: data.imageUrl || undefined,
      organizerName: data.organizerName ? String(data.organizerName).trim() : undefined,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : undefined,
    }
  } catch (err) {
    console.warn(`[getPublicEvent] Error fetching event #${id}:`, err)
    return null
  }
}

export async function getPublicNeed(id: string): Promise<PublicNeedData | null> {
  const db = getAdminDb()
  if (!db || !id) return null

  try {
    const snap = await db.ref(`needPosts/${id}`).once('value')
    if (!snap.exists()) return null

    const data = snap.val()
    if (data.isRestricted || data.isDeleted || data.status === 'closed') return null

    return {
      id,
      title: String(data.title || 'Community Need Request').trim(),
      category: String(data.category || 'General').trim(),
      urgency: String(data.urgency || 'Normal').trim(),
      area: String(data.area || 'Local Community').trim(),
      description: String(data.description || '').trim(),
      requesterName: data.userName || data.requesterName || undefined,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : undefined,
    }
  } catch (err) {
    console.warn(`[getPublicNeed] Error fetching need #${id}:`, err)
    return null
  }
}

export async function getPublicUserProfile(uid: string): Promise<PublicUserData | null> {
  const db = getAdminDb()
  if (!db || !uid) return null

  try {
    let data: any = null
    const pubSnap = await db.ref(`publicProfiles/${uid}`).once('value').catch(() => null)
    if (pubSnap && pubSnap.exists()) {
      data = pubSnap.val()
    } else {
      const userSnap = await db.ref(`users/${uid}`).once('value').catch(() => null)
      if (userSnap && userSnap.exists()) {
        data = userSnap.val()
      }
    }

    if (!data || data.isRestricted || data.isDeleted) return null

    return {
      uid,
      name: String(data.name || data.displayName || 'Circular Member').trim(),
      username: data.username ? String(data.username).trim() : undefined,
      area: data.area || data.areaName || data.city || undefined,
      bio: data.bio ? String(data.bio).trim() : undefined,
      avatarUrl: data.photoUrl || data.avatarUrl || undefined,
      businessTrustLabel: data.businessTrustLabel || undefined,
    }
  } catch (err) {
    console.warn(`[getPublicUserProfile] Error fetching profile #${uid}:`, err)
    return null
  }
}

// 3. Batch List Getters for Public Hub Previews and Sitemaps
export async function getPublicBusinessesList(limit = 100): Promise<PublicBusinessData[]> {
  const db = getAdminDb()
  if (!db) return []

  try {
    const snap = await db.ref('businessProfiles').limitToLast(limit).once('value')
    if (!snap.exists()) return []

    const list: PublicBusinessData[] = []
    snap.forEach((child: any) => {
      const data = child.val()
      if (!data.isRestricted && !data.isDeleted) {
        list.push({
          id: child.key as string,
          name: String(data.businessName || data.name || 'Local Business').trim(),
          category: String(data.category || data.businessCategory || 'Local Shop').trim(),
          area: String(data.area || data.city || data.areaName || 'Local Community').trim(),
          city: data.city ? String(data.city).trim() : undefined,
          description: data.description ? String(data.description).trim() : undefined,
          photoUrl: data.logoUrl || data.imageUrl || data.photoUrl || undefined,
          rating: typeof data.rating === 'number' && data.rating > 0 ? data.rating : undefined,
          isVerified: Boolean(data.isVerified || data.verified),
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : undefined,
        })
      }
    })
    return list.reverse()
  } catch (err) {
    console.warn('[getPublicBusinessesList] Error:', err)
    return []
  }
}

export async function getPublicJobsList(limit = 100): Promise<PublicJobData[]> {
  const db = getAdminDb()
  if (!db) return []

  try {
    const snap = await db.ref('jobs').limitToLast(limit).once('value')
    if (!snap.exists()) return []

    const list: PublicJobData[] = []
    snap.forEach((child: any) => {
      const data = child.val()
      if (!data.isRestricted && !data.isDeleted && data.status !== 'expired') {
        list.push({
          id: child.key as string,
          title: String(data.title || 'Job Opening').trim(),
          businessName: String(data.businessName || data.employerName || 'Local Employer').trim(),
          jobType: String(data.jobType || 'Full-time').trim(),
          category: data.category ? String(data.category).trim() : undefined,
          salary: data.salary ? String(data.salary).trim() : undefined,
          area: String(data.area || data.city || 'Local Area').trim(),
          description: String(data.description || '').trim(),
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : undefined,
        })
      }
    })
    return list.reverse()
  } catch (err) {
    console.warn('[getPublicJobsList] Error:', err)
    return []
  }
}

export async function getPublicEventsList(limit = 100): Promise<PublicEventData[]> {
  const db = getAdminDb()
  if (!db) return []

  try {
    const list: PublicEventData[] = []
    const snap = await db.ref('events').limitToLast(limit).once('value').catch(() => null)
    if (snap && snap.exists()) {
      snap.forEach((child: any) => {
        const data = child.val()
        if (!data.isRestricted && !data.isDeleted && data.status !== 'cancelled') {
          list.push({
            id: child.key as string,
            title: String(data.title || 'Community Event').trim(),
            venue: String(data.venue || 'Local Community Venue').trim(),
            area: String(data.area || 'Local Area').trim(),
            date: data.date ? String(data.date).trim() : undefined,
            time: data.time ? String(data.time).trim() : undefined,
            description: String(data.description || '').trim(),
            imageUrl: data.imageUrl || undefined,
            organizerName: data.organizerName ? String(data.organizerName).trim() : undefined,
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : undefined,
          })
        }
      })
    }
    return list.reverse()
  } catch (err) {
    console.warn('[getPublicEventsList] Error:', err)
    return []
  }
}

export async function getPublicNeedsList(limit = 100): Promise<PublicNeedData[]> {
  const db = getAdminDb()
  if (!db) return []

  try {
    const snap = await db.ref('needPosts').limitToLast(limit).once('value')
    if (!snap.exists()) return []

    const list: PublicNeedData[] = []
    snap.forEach((child: any) => {
      const data = child.val()
      if (!data.isRestricted && !data.isDeleted && data.status !== 'closed') {
        list.push({
          id: child.key as string,
          title: String(data.title || 'Community Need Request').trim(),
          category: String(data.category || 'General').trim(),
          urgency: String(data.urgency || 'Normal').trim(),
          area: String(data.area || 'Local Community').trim(),
          description: String(data.description || '').trim(),
          requesterName: data.userName || data.requesterName || undefined,
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : undefined,
        })
      }
    })
    return list.reverse()
  } catch (err) {
    console.warn('[getPublicNeedsList] Error:', err)
    return []
  }
}

export async function getPublicPostsList(limit = 100): Promise<PublicPostData[]> {
  const db = getAdminDb()
  if (!db) return []

  try {
    const snap = await db.ref('posts').limitToLast(limit).once('value')
    if (!snap.exists()) return []

    const list: PublicPostData[] = []
    snap.forEach((child: any) => {
      const data = child.val()
      if (!data.isRestricted && !data.isDeleted && !data.isPrivate) {
        const images: string[] = []
        if (Array.isArray(data.imageUrls)) {
          data.imageUrls.forEach((u: any) => typeof u === 'string' && images.push(u))
        } else if (typeof data.imageUrl === 'string') {
          images.push(data.imageUrl)
        }

        list.push({
          id: child.key as string,
          text: String(data.text || data.content || '').trim(),
          category: String(data.category || 'General').trim(),
          area: String(data.area || data.areaName || data.city || 'Local Community').trim(),
          images,
          postType: String(data.postType || 'normal'),
          smart: data.smart || undefined,
          authorName: String(data.authorName || data.userName || 'Community Member').trim(),
          authorAvatar: data.authorAvatar || data.userAvatar || undefined,
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : undefined,
        })
      }
    })
    return list.reverse()
  } catch (err) {
    console.warn('[getPublicPostsList] Error:', err)
    return []
  }
}