import { get, push, ref, remove, set, update } from 'firebase/database'
import { auth, db } from './firebase'
import type { ProfileType, SubProfile } from './types'

const ACTIVE_PROFILE_STORAGE_KEY = '@circular_active_profile_id'

export function getActiveProfileId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setActiveProfileId(profileId: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (profileId) {
      localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, profileId)
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY)
    }
  } catch {}
}

export async function getUserProfiles(uid: string): Promise<SubProfile[]> {
  try {
    const snap = await get(ref(db, `users/${uid}/subProfiles`))
    if (!snap.exists()) return []
    const data = snap.val()
    return Object.keys(data).map((id) => ({
      id,
      ...data[id],
    }))
  } catch (err) {
    console.log('Error fetching user sub-profiles:', err)
    return []
  }
}

export async function createSubProfile(
  uid: string,
  params: {
    name: string
    handle: string
    profileType: ProfileType
    bio?: string
    avatarUrl?: string
    area?: string
  }
): Promise<SubProfile> {
  const profileRef = push(ref(db, `users/${uid}/subProfiles`))
  const profileId = profileRef.key || `sub_${Date.now()}`
  const now = Date.now()

  const newProfile: SubProfile = {
    id: profileId,
    userId: uid,
    name: params.name.trim(),
    handle: params.handle.trim().replace(/^@/, ''),
    profileType: params.profileType,
    bio: params.bio?.trim() || '',
    avatarUrl: params.avatarUrl || '',
    area: params.area || '',
    createdAt: now,
    updatedAt: now,
  }

  const updates: Record<string, any> = {
    [`users/${uid}/subProfiles/${profileId}`]: newProfile,
    [`publicProfiles/${uid}/subProfiles/${profileId}`]: newProfile,
  }

  await update(ref(db), updates)
  return newProfile
}

export async function deleteSubProfile(uid: string, profileId: string): Promise<void> {
  const updates: Record<string, any> = {
    [`users/${uid}/subProfiles/${profileId}`]: null,
    [`publicProfiles/${uid}/subProfiles/${profileId}`]: null,
  }
  await update(ref(db), updates)
  if (getActiveProfileId() === profileId) {
    setActiveProfileId(null)
  }
}
