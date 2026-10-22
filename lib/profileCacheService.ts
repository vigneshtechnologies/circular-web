import { get, ref } from 'firebase/database'
import { db } from './firebase'

interface CachedEntry {
  data: any
  timestamp: number
}

const MEMORY_CACHE = new Map<string, CachedEntry>()
const IN_FLIGHT_REQUESTS = new Map<string, Promise<any>>()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes TTL

function normalizeProfile(uid: string, raw: any) {
  if (!raw) return null
  return {
    uid: raw.uid || raw.id || uid,
    id: raw.id || raw.uid || uid,
    name: raw.name || raw.publicName || raw.username || 'Circular Member',
    username: (raw.username || raw.handle || '').replace(/^@/, ''),
    avatar: raw.avatar || raw.profileImage || raw.publicProfileImage || raw.photoURL || '',
    profileImage: raw.profileImage || raw.avatar || raw.publicProfileImage || raw.photoURL || '',
    bio: raw.bio || '',
    city: raw.city || raw.area || '',
    area: raw.area || raw.city || '',
    category: raw.category || raw.accountType || '',
    isSubProfile: Boolean(raw.isSubProfile || raw.ownerUid),
    ownerUid: raw.ownerUid || null,
    businessName: raw.businessName || '',
    showBusinessDetails: Boolean(raw.showBusinessDetails),
    businessTrustLabel: raw.businessTrustLabel || '',
    adminBusinessBadge: raw.adminBusinessBadge || null,
  }
}

export function getProfileFromMemory(uid: string): any | null {
  if (!uid) return null
  const entry = MEMORY_CACHE.get(uid)
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data
  }
  return null
}

export async function getProfileCached(uid: string): Promise<any | null> {
  if (!uid || typeof uid !== 'string') return null

  const mem = getProfileFromMemory(uid)
  if (mem) return mem

  if (IN_FLIGHT_REQUESTS.has(uid)) {
    return IN_FLIGHT_REQUESTS.get(uid)
  }

  const fetchPromise = (async () => {
    try {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(`@circular_prof_${uid}`)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (parsed && typeof parsed === 'object') {
              MEMORY_CACHE.set(uid, { data: parsed, timestamp: Date.now() })
              return parsed
            }
          }
        } catch {}
      }

      const pubSnap = await get(ref(db, `publicProfiles/${uid}`)).catch(() => null)
      let profileData = pubSnap && pubSnap.exists() ? pubSnap.val() : null

      if (!profileData) {
        const subSnap = await get(ref(db, `publicSubProfiles/${uid}`)).catch(() => null)
        if (subSnap && subSnap.exists()) {
          profileData = subSnap.val()
        }
      }

      if (profileData) {
        const normalized = normalizeProfile(uid, profileData)
        MEMORY_CACHE.set(uid, { data: normalized, timestamp: Date.now() })
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              `@circular_prof_${uid}`,
              JSON.stringify({ ...normalized, _cachedAt: Date.now() })
            )
          } catch {}
        }
        return normalized
      }

      return null
    } catch (err) {
      console.warn(`[ProfileCache] Error resolving profile ${uid}:`, err)
      return null
    } finally {
      IN_FLIGHT_REQUESTS.delete(uid)
    }
  })()

  IN_FLIGHT_REQUESTS.set(uid, fetchPromise)
  return fetchPromise
}

export async function getProfilesBatchCached(uids: string[]): Promise<Record<string, any>> {
  const uniqueUids = Array.from(new Set(uids.filter(Boolean)))
  const result: Record<string, any> = {}

  await Promise.all(
    uniqueUids.map(async (uid) => {
      const prof = await getProfileCached(uid)
      if (prof) result[uid] = prof
    })
  )

  return result
}

export function preloadProfilesForFeed(items: any[]): void {
  if (!Array.isArray(items) || items.length === 0) return
  const authorIds = items
    .map((item) => item.userId || item.actorId || item.profileId || item.id)
    .filter(Boolean)

  getProfilesBatchCached(authorIds).catch(() => {})
}

export function invalidateProfileCache(uid: string): void {
  if (!uid) return
  MEMORY_CACHE.delete(uid)
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`@circular_prof_${uid}`)
    } catch {}
  }
}
