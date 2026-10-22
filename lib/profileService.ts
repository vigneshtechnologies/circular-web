'use client'

import { useState, useEffect, useCallback } from 'react'
import { equalTo, get, orderByChild, push, query, ref, remove, set, update } from 'firebase/database'
import { auth, db } from './firebase'
import { getProfileFromMemory } from './profileCacheService'
import { optimizeCloudinaryUrl } from './imageUtils'
import type { Post, ProfileType, SubProfile } from './types'

export const ACTIVE_PROFILE_STORAGE_KEY = '@circular_active_profile_id'
export const PROFILE_CHANGED_EVENT = 'circular:profileChanged'

export interface ActiveActorProfile {
  actorId: string
  authUid: string
  isSubProfile: boolean
  name: string
  username: string
  avatar: string
  bio: string
  isPrivate: boolean
  type: string
}

let cachedActiveProfileId: string = 'default'
let cachedActiveActor: ActiveActorProfile | null = null

if (typeof window !== 'undefined') {
  try {
    cachedActiveProfileId = localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY) || 'default'
  } catch {}
}

export function getActiveProfileId(): string | null {
  if (typeof window === 'undefined') return cachedActiveProfileId || 'default'
  try {
    cachedActiveProfileId = localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY) || 'default'
    return cachedActiveProfileId
  } catch {
    return 'default'
  }
}

export function getActiveProfileIdSync(): string {
  return cachedActiveProfileId || 'default'
}

/**
 * Returns the effective UID (actorId) for social graph operations:
 * - When primary account is active: returns authUid.
 * - When a sub-profile is active: returns activeProfileId.
 */
export function getEffectiveUid(authUid?: string): string {
  const currentUid = authUid || auth.currentUser?.uid || ''
  const activeId = getActiveProfileId() || 'default'
  if (activeId && activeId !== 'default') {
    return activeId
  }
  return currentUid
}

export function setActiveProfileId(profileId: string | null): void {
  if (typeof window === 'undefined') return
  try {
    const target = profileId && profileId !== 'default' ? profileId : null
    cachedActiveProfileId = target || 'default'
    if (target) {
      localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, target)
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY)
    }
    window.dispatchEvent(
      new CustomEvent(PROFILE_CHANGED_EVENT, { detail: { profileId: target || 'default' } })
    )
    const currentUser = auth.currentUser
    if (currentUser) {
      getActiveActorProfile(currentUser.uid).catch(() => {})
    }
  } catch {}
}

export function onActiveProfileChanged(callback: (profileId: string) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (event: any) => {
    callback(event.detail?.profileId || 'default')
  }
  window.addEventListener(PROFILE_CHANGED_EVENT, handler)
  return () => {
    window.removeEventListener(PROFILE_CHANGED_EVENT, handler)
  }
}

/**
 * First-Class Public Profile Sync:
 * Syncs sub-profile public records into BOTH publicProfiles/${subProfile.id} AND publicSubProfiles/${subProfile.id}
 * with ownerUid: authUid, isSubProfile: true.
 * This makes every sub-profile (like @muhavur) searchable, followable, and viewable as a standalone Instagram-style account!
 */
export async function syncSubProfilePublicRecord(uid: string, subProfile: any): Promise<void> {
  if (!uid || !subProfile || !subProfile.id || subProfile.id === 'default') {
    return
  }
  try {
    const profileId = subProfile.id
    const name = (subProfile.name || 'Sub Profile').trim()
    const rawUsername = subProfile.username || subProfile.handle || ''
    const cleanUsername = rawUsername.replace(/^@/, '').toLowerCase()
    const avatar = (subProfile.profileImage || subProfile.avatar || subProfile.avatarUrl || '').trim()
    const bio = (subProfile.bio || '').trim()
    const type = subProfile.type || subProfile.profileType || 'other'
    const updatedAt = Date.now()

    const payload = {
      uid: profileId,
      id: profileId,
      ownerUid: uid,
      isSubProfile: true,
      name,
      publicName: name,
      username: cleanUsername,
      profileImage: avatar,
      publicProfileImage: avatar,
      bio,
      accountType: type,
      category: type,
      isPrivate: subProfile.isPrivate === true,
      createdAt: subProfile.createdAt || updatedAt,
      updatedAt,
    }

    await update(ref(db), {
      [`publicProfiles/${profileId}`]: payload,
      [`publicSubProfiles/${profileId}`]: payload,
    })
  } catch (err) {
    console.log('Error syncing sub-profile public record:', err)
  }
}

/**
 * Resolves the full active actor profile for the currently logged-in user.
 */
export async function getActiveActorProfile(authUid?: string): Promise<ActiveActorProfile> {
  const uid = authUid || auth.currentUser?.uid || ''
  const activeProfileId = getActiveProfileId()

  if (activeProfileId && activeProfileId !== 'default' && uid) {
    let subProfile: any = null
    const subSnap = await get(ref(db, `users/${uid}/subProfiles/${activeProfileId}`))
    if (subSnap.exists()) {
      subProfile = subSnap.val()
    } else {
      const pubSnap = await get(ref(db, `publicProfiles/${activeProfileId}`))
      if (pubSnap.exists()) {
        subProfile = pubSnap.val()
      } else {
        const pubSubSnap = await get(ref(db, `publicSubProfiles/${activeProfileId}`))
        if (pubSubSnap.exists()) {
          subProfile = pubSubSnap.val()
        }
      }
    }

    if (subProfile) {
      const actor: ActiveActorProfile = {
        actorId: activeProfileId,
        authUid: uid,
        isSubProfile: true,
        name: (subProfile.name || 'Sub Profile').trim(),
        username: (subProfile.username || subProfile.handle || '').replace(/^@/, ''),
        avatar: (subProfile.profileImage || subProfile.avatar || subProfile.avatarUrl || '').trim(),
        bio: (subProfile.bio || '').trim(),
        isPrivate: subProfile.isPrivate === true,
        type: subProfile.type || subProfile.profileType || 'other',
      }
      cachedActiveActor = actor
      syncSubProfilePublicRecord(uid, subProfile).catch(() => {})
      return actor
    }
  }

  // Fallback to primary account
  let primaryName = 'Circular Member'
  let primaryUsername = ''
  let primaryAvatar = ''
  let primaryBio = ''
  let isPrivate = false

  if (uid) {
    try {
      const [userSnap, publicSnap] = await Promise.all([
        get(ref(db, `users/${uid}`)),
        get(ref(db, `publicProfiles/${uid}`)),
      ])
      const uData = userSnap.val() || {}
      const pData = publicSnap.val() || {}
      primaryName = (pData.name || uData.name || auth.currentUser?.displayName || 'Circular Member').trim()
      primaryUsername = (pData.username || uData.username || '').replace(/^@/, '')
      primaryAvatar = (pData.profileImage || uData.profileImage || auth.currentUser?.photoURL || '').trim()
      primaryBio = (pData.bio || uData.bio || '').trim()
      isPrivate = uData.isPrivate === true || pData.isPrivate === true
    } catch {}
  }

  const primaryActor: ActiveActorProfile = {
    actorId: uid,
    authUid: uid,
    isSubProfile: false,
    name: primaryName,
    username: primaryUsername,
    avatar: primaryAvatar,
    bio: primaryBio,
    isPrivate,
    type: 'personal',
  }
  cachedActiveActor = primaryActor
  return primaryActor
}

/**
 * Synchronous cached version of getActiveActorProfile.
 */
export function getActiveActorProfileSync(authUid?: string): ActiveActorProfile {
  const uid = authUid || auth.currentUser?.uid || ''
  const activeId = getActiveProfileId() || 'default'

  if (cachedActiveActor && cachedActiveActor.authUid === uid && cachedActiveActor.actorId === (activeId === 'default' ? uid : activeId)) {
    return cachedActiveActor
  }

  const baseline: ActiveActorProfile = {
    actorId: activeId === 'default' ? uid : activeId,
    authUid: uid,
    isSubProfile: activeId !== 'default',
    name: auth.currentUser?.displayName || 'Circular Member',
    username: '',
    avatar: auth.currentUser?.photoURL || '',
    bio: '',
    isPrivate: false,
    type: activeId === 'default' ? 'personal' : 'other',
  }
  return baseline
}

/**
 * React hook that returns the active actor identity and automatically re-renders
 * whenever the user switches accounts.
 */
export function useActiveActor(): {
  actor: ActiveActorProfile
  actorId: string
  authUid: string
  isSubProfile: boolean
  loading: boolean
  refreshActor: () => Promise<void>
} {
  const currentUser = auth.currentUser
  const [actor, setActor] = useState<ActiveActorProfile>(() =>
    getActiveActorProfileSync(currentUser?.uid)
  );
  const [loading, setLoading] = useState<boolean>(true)

  const refreshActor = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if (!uid) {
      setLoading(false)
      return
    }
    try {
      const active = await getActiveActorProfile(uid)
      setActor(active)
    } catch (err) {
      console.log('Error refreshing active actor:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshActor()
    const unsub = onActiveProfileChanged(() => {
      refreshActor()
    })
    return () => unsub()
  }, [refreshActor])

  return {
    actor,
    actorId: actor.actorId,
    authUid: actor.authUid,
    isSubProfile: actor.isSubProfile,
    loading,
    refreshActor,
  }
}

/**
 * Checks whether a post belongs to the specified profile ID.
 * Properly isolates primary/default profile posts from sub-profile posts.
 */
export function isPostBelongingToProfile(
  post: any,
  profileId: string | null | undefined,
  userUid?: string
): boolean {
  if (userUid && post.userId !== userUid) {
    return false
  }
  const targetId =
    !profileId || profileId === 'default' || (userUid && profileId === userUid)
      ? 'default'
      : profileId
  const pProfileId = !post.profileId || post.profileId === 'default' ? 'default' : post.profileId
  const pAuthorProfileId =
    !post.authorProfileId || post.authorProfileId === 'default' ? 'default' : post.authorProfileId

  if (targetId === 'default') {
    return pProfileId === 'default' && pAuthorProfileId === 'default'
  }
  return pProfileId === targetId || pAuthorProfileId === targetId
}

export interface ProfilePhotoItem {
  id: string
  imageUrl: string
  thumbnailUrl: string
  postId?: string
  caption?: string
  likesCount?: number
  commentsCount?: number
  createdAt: number
  type: 'post' | 'profile' | 'cover'
  authorName?: string
  authorAvatar?: string
}

/**
 * Extracts all photos from a user's posts and profile records,
 * strictly isolating primary vs. sub-profile photos according to activeProfileId.
 */
export function extractProfilePhotos(
  posts: any[] = [],
  profileData?: any,
  activeProfileId?: string | null
): ProfilePhotoItem[] {
  const photos: ProfilePhotoItem[] = []
  const targetId = !activeProfileId || activeProfileId === 'default' ? 'default' : activeProfileId

  // 1. Post photos (filtered strictly by active profile ID)
  const profilePosts = (posts || []).filter((post) => {
    return isPostBelongingToProfile(post, targetId)
  })

  profilePosts.forEach((post) => {
    if (!post) return
    const rawImages: string[] = []

    // Check mediaUrls
    if (Array.isArray(post.mediaUrls)) {
      post.mediaUrls.forEach((url: any) => {
        if (typeof url === 'string' && url.trim().length > 0) rawImages.push(url.trim())
      })
    }
    // Check images
    if (Array.isArray(post.images)) {
      post.images.forEach((url: any) => {
        if (typeof url === 'string' && url.trim().length > 0) rawImages.push(url.trim())
      })
    }
    // Check imageUrls
    if (Array.isArray(post.imageUrls)) {
      post.imageUrls.forEach((url: any) => {
        if (typeof url === 'string' && url.trim().length > 0) rawImages.push(url.trim())
      })
    }
    // Check imageUrl
    if (typeof post.imageUrl === 'string' && post.imageUrl.trim().length > 0) {
      rawImages.push(post.imageUrl.trim())
    }
    // Check image
    if (typeof post.image === 'string' && post.image.trim().length > 0) {
      rawImages.push(post.image.trim())
    }
    // Check event?.imageUrl
    if (post.event && typeof post.event.imageUrl === 'string' && post.event.imageUrl.trim().length > 0) {
      rawImages.push(post.event.imageUrl.trim())
    }

    const uniqueImages = Array.from(new Set(rawImages))

    const likesCount =
      typeof post.likesCount === 'number'
        ? post.likesCount
        : post.likes && typeof post.likes === 'object'
        ? Object.keys(post.likes).length
        : 0
    const commentsCount =
      typeof post.commentsCount === 'number'
        ? post.commentsCount
        : post.comments && typeof post.comments === 'object'
        ? Object.keys(post.comments).length
        : 0

    const caption = post.content || post.text || post.caption || post.title || ''
    const authorName = post.userName || post.authorName || post.publicName || ''
    const authorAvatar = post.userAvatar || post.authorAvatar || post.profileImage || ''

    uniqueImages.forEach((imgUrl, idx) => {
      photos.push({
        id: `${post.id || 'post'}_img_${idx}`,
        imageUrl: optimizeCloudinaryUrl(imgUrl, 'full'),
        thumbnailUrl: optimizeCloudinaryUrl(imgUrl, 'thumbnail'),
        postId: post.id,
        caption,
        likesCount,
        commentsCount,
        createdAt: post.createdAt || 0,
        type: 'post',
        authorName,
        authorAvatar,
      })
    });
  })

  // 2. Profile picture (if available on profileData)
  const avatar =
    profileData?.profileImage ||
    profileData?.avatar ||
    profileData?.avatarUrl ||
    profileData?.photoUrl ||
    ''
  if (typeof avatar === 'string' && avatar.trim().length > 0) {
    photos.push({
      id: `avatar_${targetId}`,
      imageUrl: optimizeCloudinaryUrl(avatar.trim(), 'full'),
      thumbnailUrl: optimizeCloudinaryUrl(avatar.trim(), 'thumbnail'),
      caption: 'Profile Picture',
      createdAt: profileData?.updatedAt || profileData?.createdAt || 0,
      type: 'profile',
      authorName: profileData?.name || profileData?.publicName || '',
      authorAvatar: avatar.trim(),
    })
  }

  // 3. Cover image (if available on profileData)
  const cover = profileData?.coverImage || profileData?.coverUrl || ''
  if (typeof cover === 'string' && cover.trim().length > 0) {
    photos.push({
      id: `cover_${targetId}`,
      imageUrl: optimizeCloudinaryUrl(cover.trim(), 'full'),
      thumbnailUrl: optimizeCloudinaryUrl(cover.trim(), 'thumbnail'),
      caption: 'Cover Photo',
      createdAt: profileData?.updatedAt || profileData?.createdAt || 0,
      type: 'cover',
      authorName: profileData?.name || profileData?.publicName || '',
      authorAvatar: avatar || '',
    })
  }

  // Sort newest first
  return photos.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

/**
 * Fetches user posts filtered strictly by active profile ID.
 */
export async function fetchUserPosts(uid: string, profileId?: string | null): Promise<Post[]> {
  try {
    const postsQuery = query(ref(db, 'posts'), orderByChild('userId'), equalTo(uid))
    const snapshot = await get(postsQuery)
    if (!snapshot.exists()) return []
    const data = snapshot.val() || {}
    const targetId = profileId || 'default'
    return Object.keys(data)
      .map((key) => ({ id: key, ...data[key] } as Post))
      .filter((post) => isPostBelongingToProfile(post, targetId, uid))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  } catch (err) {
    console.log('Error fetching user profile posts:', err)
    return []
  }
}

export async function getUserProfiles(uid: string): Promise<SubProfile[]> {
  try {
    const snap = await get(ref(db, `users/${uid}/subProfiles`))
    if (!snap.exists()) return []
    const data = snap.val()
    return Object.keys(data).map((id) => {
      const p = {
        id,
        ...data[id],
      }
      // Mirror to publicProfiles & publicSubProfiles as first-class public identity
      syncSubProfilePublicRecord(uid, p).catch(() => {})
      return p
    })
  } catch (err) {
    console.log('Error fetching user sub-profiles:', err)
    return []
  }
}

export interface AuthorIdentity {
  authorName: string
  publicName: string
  userName: string
  authorUsername: string
  authorAvatar: string
  profileImage: string
  profileId: string
  authorProfileId: string
  isSubProfile: boolean
  subProfileType?: string
  businessName?: string
}

export interface ResolvedPostAuthor {
  name: string
  avatar: string
  initial: string
  isSubProfile: boolean
  subProfileId?: string
  actorId?: string
}

/**
 * Resolves the author identity based on the currently active profile.
 * When a sub-profile is active, uses the sub-profile's name and avatar.
 * Crucially, if the sub-profile has no avatar, leaves it empty so it NEVER falls back to the primary account.
 */
export async function resolveActiveAuthorIdentity(uid: string): Promise<AuthorIdentity> {
  try {
    const activeProfileId = getActiveProfileId()
    if (activeProfileId && activeProfileId !== 'default') {
      let subProfile: any = null
      const subSnap = await get(ref(db, `users/${uid}/subProfiles/${activeProfileId}`))
      if (subSnap.exists()) {
        subProfile = subSnap.val()
      } else {
        const pubSubSnap = await get(ref(db, `publicProfiles/${uid}/subProfiles/${activeProfileId}`))
        if (pubSubSnap.exists()) {
          subProfile = pubSubSnap.val()
        } else {
          const directPubSnap = await get(ref(db, `publicSubProfiles/${activeProfileId}`))
          if (directPubSnap.exists()) {
            subProfile = directPubSnap.val()
          }
        }
      }

      if (subProfile) {
        const name = (subProfile.name || 'Sub Profile').trim()
        const username = subProfile.handle ? `@${subProfile.handle}` : (subProfile.username ? `@${subProfile.username}` : '')
        // Crucial: If sub-profile has no avatar, keep it EMPTY string! Do NOT fallback to primary user!
        const avatar = (subProfile.avatarUrl || subProfile.profileImage || '').trim()
        const isBiz = subProfile.profileType === 'business' || subProfile.type === 'business'

        // Mirror/Sync to publicProfiles & publicSubProfiles
        syncSubProfilePublicRecord(uid, subProfile).catch(() => {})

        return {
          authorName: name,
          publicName: name,
          userName: name,
          authorUsername: username,
          authorAvatar: avatar,
          profileImage: avatar,
          profileId: activeProfileId,
          authorProfileId: activeProfileId,
          isSubProfile: true,
          subProfileType: subProfile.profileType || subProfile.type || 'other',
          businessName: isBiz ? name : undefined,
        }
      }
    }

    // Default primary account
    const [userSnap, publicSnap] = await Promise.all([
      get(ref(db, `users/${uid}`)),
      get(ref(db, `publicProfiles/${uid}`)),
    ])
    const userData = userSnap.val() || {}
    const publicData = publicSnap.val() || {}
    const name = (publicData.name || userData.name || 'Circular Member').trim()
    const username = publicData.username ? `@${publicData.username}` : (userData.username ? `@${userData.username}` : '')
    const avatar = (publicData.profileImage || userData.profileImage || '').trim()

    return {
      authorName: name,
      publicName: name,
      userName: name,
      authorUsername: username,
      authorAvatar: avatar,
      profileImage: avatar,
      profileId: 'default',
      authorProfileId: 'default',
      isSubProfile: false,
      subProfileType: 'personal',
      businessName: publicData.businessName || userData.businessName || undefined,
    }
  } catch (err) {
    console.log('Error resolving active author identity:', err)
    return {
      authorName: 'Circular Member',
      publicName: 'Circular Member',
      userName: 'Circular Member',
      authorUsername: '',
      authorAvatar: '',
      profileImage: '',
      profileId: 'default',
      authorProfileId: 'default',
      isSubProfile: false,
      subProfileType: 'personal',
    }
  }
}

/**
 * Resolves post author information for feeds.
 * If the post was authored by a sub-profile, strictly uses the sub-profile identity.
 * Never overrides sub-profile posts with the primary account's public profile.
 */
export function resolvePostAuthor(
  post: any,
  publicProfilesMap?: Record<string, any> | null,
  publicSubProfilesMap?: Record<string, any> | null
): ResolvedPostAuthor {
  if (!post) {
    return { name: 'Circular Member', avatar: '', initial: 'C', isSubProfile: false }
  }

  const pProfileId = post.profileId && post.profileId !== 'default' ? post.profileId : null
  const pAuthorProfileId = post.authorProfileId && post.authorProfileId !== 'default' ? post.authorProfileId : null
  const subProfileId = pProfileId || pAuthorProfileId
  const isSubProfile = Boolean(subProfileId)

  if (isSubProfile && subProfileId) {
    const cachedSub = (publicSubProfilesMap && publicSubProfilesMap[subProfileId]) || getProfileFromMemory(subProfileId)
    const name = (cachedSub?.name || post.authorName || post.publicName || post.userName || 'Circular Member').trim()
    // Do NOT check publicProfilesMap[post.userId] for subprofile posts!
    const rawAvatar = (cachedSub?.profileImage || cachedSub?.avatarUrl || cachedSub?.avatar || post.authorAvatar || (post.profileId === subProfileId ? post.profileImage : '') || '').trim()
    const avatar = optimizeCloudinaryUrl(rawAvatar, 'avatar')
    const initial = (name.charAt(0) || 'C').toUpperCase()
    return {
      name,
      avatar,
      initial,
      isSubProfile: true,
      subProfileId,
      actorId: subProfileId,
    }
  }

  // Primary user account
  const primaryProfile = ((publicProfilesMap && post.userId) ? publicProfilesMap[post.userId] : null) || (post.userId ? getProfileFromMemory(post.userId) : null)
  const name = (primaryProfile?.name || post.authorName || post.publicName || post.userName || 'Circular Member').trim()
  const rawAvatar = (primaryProfile?.profileImage || primaryProfile?.avatar || primaryProfile?.photoUrl || post.authorAvatar || post.profileImage || '').trim()
  const avatar = optimizeCloudinaryUrl(rawAvatar, 'avatar')
  const initial = (name.charAt(0) || 'C').toUpperCase()

  return {
    name,
    avatar,
    initial,
    isSubProfile: false,
    actorId: post.userId,
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
    [`publicProfiles/${profileId}`]: {
      uid: profileId,
      id: profileId,
      ownerUid: uid,
      isSubProfile: true,
      name: newProfile.name,
      publicName: newProfile.name,
      username: newProfile.handle,
      profileImage: newProfile.avatarUrl || '',
      publicProfileImage: newProfile.avatarUrl || '',
      bio: newProfile.bio || '',
      accountType: newProfile.profileType,
      category: newProfile.profileType,
      area: newProfile.area || '',
      createdAt: now,
      updatedAt: now,
    },
    [`publicSubProfiles/${profileId}`]: {
      uid: profileId,
      id: profileId,
      ownerUid: uid,
      userId: uid,
      isSubProfile: true,
      name: newProfile.name,
      publicName: newProfile.name,
      username: newProfile.handle,
      bio: newProfile.bio || '',
      profileImage: newProfile.avatarUrl || '',
      publicProfileImage: newProfile.avatarUrl || '',
      type: newProfile.profileType,
      createdAt: now,
      updatedAt: now,
    },
  }

  await update(ref(db), updates)
  return newProfile
}

export async function deleteSubProfile(uid: string, profileId: string): Promise<void> {
  const updates: Record<string, any> = {
    [`users/${uid}/subProfiles/${profileId}`]: null,
    [`publicProfiles/${uid}/subProfiles/${profileId}`]: null,
    [`publicSubProfiles/${profileId}`]: null,
  }
  await update(ref(db), updates)
  if (getActiveProfileId() === profileId) {
    setActiveProfileId(null)
  }
}

