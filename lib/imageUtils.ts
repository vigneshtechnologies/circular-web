/**
 * Centralized Image, Data, and Location Resolution Utilities for Circular 2.0 Web
 * Mirrors the mobile app logic from imageResolution.ts and locationUtils.ts.
 */

/**
 * Transforms Cloudinary image URLs to compressed dimensions:
 * - 'feed': w_600,q_auto,f_auto
 * - 'avatar': w_120,c_fill,q_auto,f_auto
 * - 'thumbnail': w_300,c_fill,q_auto,f_auto
 * - 'full': w_1080,q_auto,f_auto
 */
export function optimizeCloudinaryUrl(
  url: string | undefined | null,
  type: 'feed' | 'avatar' | 'thumbnail' | 'full' | string = 'feed'
): string {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed.includes('res.cloudinary.com') || !trimmed.includes('/image/upload/')) {
    return trimmed
  }

  const transform =
    type === 'avatar'
      ? 'w_120,c_fill,q_auto,f_auto'
      : type === 'thumbnail'
      ? 'w_300,c_fill,q_auto,f_auto'
      : type === 'full'
      ? 'w_1080,q_auto,f_auto'
      : 'w_600,q_auto,f_auto'

  if (trimmed.includes(`/image/upload/${transform}/`)) {
    return trimmed
  }

  return trimmed.replace(
    /\/image\/upload\/(?:[a-z]_[a-zA-Z0-9_,-]+\/)?(.*)/,
    (_, rest) => `/image/upload/${transform}/${rest}`
  )
}

export function getUserAvatar(user: any, publicProfiles?: Record<string, any>, publicSubProfiles?: Record<string, any>): string {
  if (!user) return ''
  if (typeof user === 'string') return optimizeCloudinaryUrl(user.trim(), 'avatar')

  // If this user/post object belongs to a sub-profile, NEVER fall back to primary user publicProfiles[uid]!
  const isSubProfile = Boolean(
    (user.profileId && user.profileId !== 'default') ||
    (user.authorProfileId && user.authorProfileId !== 'default') ||
    user.isSubProfile === true
  )

  // 1. Direct user object fields (custom upload > Google photoURL)
  const directCandidates = [
    user.authorAvatar,
    user.publicProfileImage,
    user.profileImage,
    user.avatar,
    user.photoURL,
    user.photoUrl,
    user.imageUrl,
    user.profilePhoto,
    user.profilePic,
    user.photo,
    user.image,
  ]

  for (const c of directCandidates) {
    if (typeof c === 'string' && c.trim().length > 0) {
      return optimizeCloudinaryUrl(c.trim(), 'avatar')
    }
  }

  // If this is a sub-profile, check publicSubProfiles if available, but DO NOT fallback to publicProfiles[uid]
  const subProfId = (user.profileId && user.profileId !== 'default' ? user.profileId : user.authorProfileId) || ''
  if (isSubProfile) {
    if (subProfId && publicSubProfiles && publicSubProfiles[subProfId]) {
      const sProf = publicSubProfiles[subProfId]
      const sImg = sProf.avatar || sProf.profileImage || ''
      if (typeof sImg === 'string' && sImg.trim().length > 0) {
        return optimizeCloudinaryUrl(sImg.trim(), 'avatar')
      }
    }
    // Sub-profile with no custom photo -> return empty string so initial letter renders!
    return ''
  }

  // 2. Check publicProfiles map if userId is available (only for primary profiles)
  const uid = user.userId || user.uid || user.id || ''
  if (uid && publicProfiles && publicProfiles[uid]) {
    const prof = publicProfiles[uid]
    const pImg =
      prof.profileImage ||
      prof.avatar ||
      prof.photoURL ||
      prof.photoUrl ||
      prof.imageUrl ||
      prof.profilePhoto ||
      prof.profilePic ||
      ''
    if (typeof pImg === 'string' && pImg.trim().length > 0) {
      return optimizeCloudinaryUrl(pImg.trim(), 'avatar')
    }
  }

  return ''
}

export function getBusinessPhoto(
  business: any,
  photosRecord?: Record<string, any>
): string {
  if (!business) return ''
  if (typeof business === 'string') return business.trim()

  // 1. Direct explicit image fields on business (Logo / Profile image)
  const directCandidates = [
    business.logoUrl,
    business.businessLogo,
    business.logo,
    business.imageUrl,
    business.photoUrl,
    business.photoURL,
    business.profileImage,
    business.businessImage,
    business.image,
    business.picture,
    business.coverImage,
    business.bannerUrl,
    business.thumbnail,
  ]

  for (const c of directCandidates) {
    if (typeof c === 'string' && c.trim().length > 0) {
      return c.trim()
    }
  }

  // 2. Photos array if present
  if (Array.isArray(business.photos) && business.photos.length > 0) {
    const first = business.photos.find((p: any) => typeof p === 'string' && p.trim().length > 0)
    if (first) return first.trim()
  }

  if (Array.isArray(business.imageUrls) && business.imageUrls.length > 0) {
    const first = business.imageUrls.find((p: any) => typeof p === 'string' && p.trim().length > 0)
    if (first) return first.trim()
  }

  // 3. Business Photos / Gallery records if available
  if (photosRecord) {
    const bizId = business.id || business.businessId || ''
    const bizPhotos = photosRecord[bizId]
    if (bizPhotos && typeof bizPhotos === 'object') {
      const values = Object.values(bizPhotos)
      if (values.length > 0) {
        const first = values[0] as any
        const photo = first?.imageUrl || first?.url || first?.photoUrl || first?.photoURL || ''
        if (typeof photo === 'string' && photo.trim().length > 0) return optimizeCloudinaryUrl(photo.trim(), 'thumbnail')
      }
    }
  }

  return ''
}

export function getPostMainImage(post: any): string {
  if (!post) return ''
  let raw = ''
  if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) {
    const firstValid = post.imageUrls.find((url: any) => typeof url === 'string' && url.trim().length > 0)
    if (firstValid) raw = firstValid.trim()
  }
  if (!raw && post.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.trim().length > 0) {
    raw = post.imageUrl.trim()
  }
  if (!raw && post.event?.imageUrl && typeof post.event.imageUrl === 'string' && post.event.imageUrl.trim().length > 0) {
    raw = post.event.imageUrl.trim()
  }
  return raw ? optimizeCloudinaryUrl(raw, 'feed') : ''
}

/**
 * Safely resolves post location name, never returning "Unknown", "null", or placeholder strings.
 */
export function getPostLocation(post: any): string {
  if (!post) return ''

  const candidates = [post.area, post.areaName, post.city, post.address]
  for (const loc of candidates) {
    if (typeof loc === 'string') {
      const trimmed = loc.trim()
      if (
        trimmed &&
        trimmed.toLowerCase() !== 'unknown' &&
        trimmed.toLowerCase() !== 'undefined' &&
        trimmed.toLowerCase() !== 'null'
      ) {
        return trimmed
      }
    }
  }

  return ''
}
