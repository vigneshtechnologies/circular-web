/**
 * Centralized Image, Data, and Location Resolution Utilities for Circular 2.0 Web
 * Mirrors the mobile app logic from imageResolution.ts and locationUtils.ts.
 */

export function getUserAvatar(user: any, publicProfiles?: Record<string, any>): string {
  if (!user) return ''
  if (typeof user === 'string') return user.trim()

  // 1. Direct user object fields (custom upload > Google photoURL)
  const directCandidates = [
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
      return c.trim()
    }
  }

  // 2. Check publicProfiles map if userId is available
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
      return pImg.trim()
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
        if (typeof photo === 'string' && photo.trim().length > 0) return photo.trim()
      }
    }
  }

  return ''
}

export function getPostMainImage(post: any): string {
  if (!post) return ''
  if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) {
    const firstValid = post.imageUrls.find((url: any) => typeof url === 'string' && url.trim().length > 0)
    if (firstValid) return firstValid.trim()
  }
  if (post.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.trim().length > 0) {
    return post.imageUrl.trim()
  }
  if (post.event?.imageUrl && typeof post.event.imageUrl === 'string' && post.event.imageUrl.trim().length > 0) {
    return post.event.imageUrl.trim()
  }
  return ''
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
