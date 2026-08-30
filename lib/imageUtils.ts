/**
 * Centralized Image and Data Resolution Utilities for Circular 2.0 Web
 * Mirrors the mobile app image-resolution hierarchy (imageResolution.ts).
 */

export function getUserAvatar(user: any): string {
  if (!user) return ''
  if (typeof user === 'string') return user.trim()
  return (
    user.profileImage ||
    user.avatar ||
    user.photoUrl ||
    user.photoURL ||
    user.imageUrl ||
    user.logoUrl ||
    user.image ||
    ''
  ).trim()
}

export function getBusinessPhoto(
  business: any,
  photosRecord?: Record<string, any>
): string {
  if (!business) return ''
  if (typeof business === 'string') return business.trim()

  // 1. Direct explicit image fields
  const direct =
    business.imageUrl ||
    business.photoUrl ||
    business.photoURL ||
    business.profileImage ||
    business.logo ||
    business.logoUrl ||
    business.coverImage ||
    ''

  if (typeof direct === 'string' && direct.trim().length > 0) {
    return direct.trim()
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
