import type { LinkPreviewData } from './types'

export interface InstagramMediaInfo {
  isInstagram: boolean
  kind: 'post' | 'reel' | 'video' | 'unknown'
  code: string
  canonicalUrl: string
}

export const isInstagramLink = (url: string): boolean => {
  if (!url) return false
  try {
    const full = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
    const host = new URL(full).hostname.replace(/^www\./i, '').toLowerCase()
    return host === 'instagram.com' || host === 'instagr.am' || host.endsWith('.instagram.com')
  } catch {
    return false
  }
}

export const getInstagramMediaInfo = (url: string): InstagramMediaInfo => {
  if (!isInstagramLink(url)) {
    return {
      isInstagram: false,
      kind: 'unknown',
      code: '',
      canonicalUrl: url,
    }
  }

  try {
    const full = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
    const parsed = new URL(full)
    const parts = parsed.pathname.split('/').filter(Boolean)
    const first = (parts[0] || '').toLowerCase()
    const second = parts[1] || ''
    const third = parts[2] || ''

    if (first === 'reel' || first === 'reels') {
      return {
        isInstagram: true,
        kind: 'reel',
        code: second,
        canonicalUrl: second ? `https://www.instagram.com/reel/${second}/` : full,
      }
    }

    if (first === 'tv' || first === 'video') {
      return {
        isInstagram: true,
        kind: 'video',
        code: second,
        canonicalUrl: second ? `https://www.instagram.com/tv/${second}/` : full,
      }
    }

    if (first === 'p') {
      return {
        isInstagram: true,
        kind: 'post',
        code: second,
        canonicalUrl: second ? `https://www.instagram.com/p/${second}/` : full,
      }
    }

    if (first === 'share') {
      const sub = second.toLowerCase()
      if ((sub === 'reel' || sub === 'reels') && third) {
        return {
          isInstagram: true,
          kind: 'reel',
          code: third,
          canonicalUrl: `https://www.instagram.com/reel/${third}/`,
        }
      }
      if (sub === 'p' && third) {
        return {
          isInstagram: true,
          kind: 'post',
          code: third,
          canonicalUrl: `https://www.instagram.com/p/${third}/`,
        }
      }
    }

    return {
      isInstagram: true,
      kind: 'unknown',
      code: '',
      canonicalUrl: full,
    }
  } catch {
    return {
      isInstagram: false,
      kind: 'unknown',
      code: '',
      canonicalUrl: url,
    }
  }
}

/**
 * Builds or enhances LinkPreviewData for web links, with special handling for Instagram
 * image posts, Reels, and Videos.
 */
export const buildWebLinkPreview = (
  rawUrl: string,
  overrides?: Partial<LinkPreviewData>
): LinkPreviewData => {
  const cleanUrl = rawUrl.trim()
  const fullUrl = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')
    ? cleanUrl
    : `https://${cleanUrl}`

  let hostname = 'Web Link'
  try {
    hostname = new URL(fullUrl).hostname
  } catch {}

  const igInfo = getInstagramMediaInfo(fullUrl)

  if (!igInfo.isInstagram) {
    return {
      originalUrl: cleanUrl,
      canonicalUrl: overrides?.canonicalUrl || fullUrl,
      title: overrides?.title || cleanUrl,
      description: overrides?.description || '',
      imageUrl: overrides?.imageUrl || undefined,
      domain: overrides?.domain || hostname,
      siteName: overrides?.siteName || hostname,
      previewStatus: overrides?.imageUrl ? 'ready' : 'fallback',
      ...overrides,
    }
  }

  // Instagram Post (IMAGE) - Preserved exactly as existing working photo logic
  if (igInfo.kind === 'post') {
    const photoUrl = igInfo.code
      ? `https://www.instagram.com/p/${igInfo.code}/media/?size=l`
      : overrides?.imageUrl

    const title =
      overrides?.title &&
      overrides.title.toLowerCase() !== 'instagram' &&
      overrides.title.toLowerCase() !== 'shared link'
        ? overrides.title
        : 'Instagram Post'

    const description =
      overrides?.description &&
      overrides.description !== 'Open this link to view the shared content.'
        ? overrides.description
        : 'View post on Instagram'

    return {
      ...overrides,
      originalUrl: cleanUrl,
      canonicalUrl: igInfo.canonicalUrl,
      title,
      description,
      imageUrl: overrides?.imageUrl && !overrides.imageUrl.includes('login') ? overrides.imageUrl : photoUrl,
      imageFallbackUrl: overrides?.imageFallbackUrl,
      siteName: 'Instagram',
      domain: 'instagram.com',
      mediaType: 'photo',
      instagramType: 'photo',
      previewStatus: 'ready',
    }
  }

  // Instagram Reel or Video
  const isReel = igInfo.kind === 'reel'
  const defaultTitle = isReel ? 'Instagram Reel' : 'Instagram Video'
  const hasRealTitle =
    Boolean(overrides?.title) &&
    overrides!.title!.toLowerCase() !== 'instagram' &&
    overrides!.title!.toLowerCase() !== 'shared link' &&
    overrides!.title!.toLowerCase() !== 'instagram.com'

  const title = hasRealTitle ? overrides!.title! : defaultTitle

  const hasRealDesc =
    Boolean(overrides?.description) &&
    overrides!.description !== 'Open this link to view the shared content.' &&
    overrides!.description !== 'Preview unavailable'

  const description = hasRealDesc ? overrides!.description! : 'Preview unavailable'

  // Only use imageUrl if it is a genuinely provided image (not a fake photo endpoint for Reels)
  const rawCandidateImage = overrides?.imageUrl?.trim() || ''
  const isInvalidReelPhoto =
    rawCandidateImage.includes('/p/') && rawCandidateImage.includes('/media')

  const candidateImageUrl = isInvalidReelPhoto ? '' : rawCandidateImage

  return {
    ...overrides,
    originalUrl: cleanUrl,
    canonicalUrl: igInfo.canonicalUrl,
    title,
    description,
    imageUrl: candidateImageUrl || undefined,
    imageFallbackUrl: overrides?.imageFallbackUrl,
    siteName: 'Instagram',
    domain: 'instagram.com',
    mediaType: isReel ? 'reel' : 'video',
    instagramType: isReel ? 'reel' : 'video',
    previewStatus: candidateImageUrl ? 'ready' : 'fallback',
  }
}

/**
 * Client-side preview fetcher with fallback chain:
 * 1. Next.js server route /api/preview?url=...
 * 2. Direct Cloudflare Worker query
 * 3. Local buildWebLinkPreview fallback
 */
export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreviewData> {
  const cleanUrl = rawUrl.trim()
  if (!cleanUrl) {
    throw new Error('Please enter a valid link URL.')
  }

  // 1. Try local server-side API proxy
  try {
    const res = await fetch(`/api/preview?url=${encodeURIComponent(cleanUrl)}`, {
      headers: { Accept: 'application/json' },
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.ok && data?.preview) {
        return data.preview as LinkPreviewData
      }
    }
  } catch {}

  // 2. Try direct Cloudflare Worker fallback
  try {
    const workerUrl = `https://circular-link-preview.vigneshtechnologyservice.workers.dev/preview?url=${encodeURIComponent(cleanUrl)}`
    const res = await fetch(workerUrl, {
      headers: { Accept: 'application/json' },
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.preview) {
        return buildWebLinkPreview(cleanUrl, data.preview)
      }
    }
  } catch {}

  // 3. Local fallback builder
  return buildWebLinkPreview(cleanUrl)
}
