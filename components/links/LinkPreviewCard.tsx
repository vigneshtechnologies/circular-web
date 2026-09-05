'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { LinkPreviewData } from '@/lib/types'
import { getInstagramMediaInfo, isInstagramLink } from '@/lib/linkPreview'
import { ExternalLink, Globe, Play, MapPin, Smartphone, Film, Video } from 'lucide-react'

function InstagramIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

export function LinkPreviewCard({
  preview,
  compact = false,
}: {
  preview: LinkPreviewData
  compact?: boolean
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const targetUrl = preview.canonicalUrl || preview.originalUrl || ''

  const primaryImageUrl = (preview.imageUrl || '').trim()
  const fallbackImageUrl = (preview.imageFallbackUrl || '').trim()
  const [currentImageUrl, setCurrentImageUrl] = useState(primaryImageUrl)

  useEffect(() => {
    setImgFailed(false)
    setCurrentImageUrl(primaryImageUrl)
  }, [primaryImageUrl, fallbackImageUrl])

  if (!targetUrl) return null

  const igInfo = getInstagramMediaInfo(targetUrl)
  const isInstagram =
    Boolean(preview.instagramType) ||
    preview.mediaType === 'reel' ||
    preview.mediaType === 'video' ||
    igInfo.isInstagram ||
    isInstagramLink(targetUrl)

  const instagramKind: 'reel' | 'video' | 'post' | 'unknown' = useMemo(() => {
    if (!isInstagram) return 'unknown'
    if (preview.instagramType === 'reel' || preview.mediaType === 'reel') return 'reel'
    if (preview.instagramType === 'video' || preview.mediaType === 'video') return 'video'
    if (preview.instagramType === 'photo') return 'post'
    if (igInfo.kind !== 'unknown') return igInfo.kind
    return 'post'
  }, [preview, isInstagram, igInfo.kind])

  const isInstagramReel = instagramKind === 'reel'
  const isInstagramVideo = instagramKind === 'video'
  const isInstagramReelOrVideo = isInstagramReel || isInstagramVideo

  const isYouTube = targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')
  const isFacebook = targetUrl.includes('facebook.com') || targetUrl.includes('fb.watch')
  const isMaps = targetUrl.includes('maps.google') || targetUrl.includes('goo.gl/maps')
  const isPlayStore = targetUrl.includes('play.google.com')

  const domain = isInstagram
    ? isInstagramReel
      ? 'Instagram Reel'
      : isInstagramVideo
      ? 'Instagram Video'
      : 'Instagram'
    : preview.domain || preview.siteName || 'Web Link'

  // Clean error strings if preview fetcher stored technical HTTP error messages
  const rawTitle = preview.title || ''
  const isTitleError =
    rawTitle.includes('HTTP 400') ||
    rawTitle.includes('HTTP 403') ||
    rawTitle.includes('HTTP 404') ||
    rawTitle.includes('HTTP 500') ||
    rawTitle.includes('returned HTTP') ||
    rawTitle.includes('failed to fetch')

  const title = isTitleError
    ? isInstagramReel
      ? 'Instagram Reel'
      : isInstagramVideo
      ? 'Instagram Video'
      : isInstagram
      ? 'Instagram Post'
      : isFacebook
      ? 'Facebook Post / Video'
      : isYouTube
      ? 'YouTube Video'
      : domain
    : rawTitle || (isInstagramReel ? 'Instagram Reel' : isInstagramVideo ? 'Instagram Video' : targetUrl)

  const rawDesc = preview.description || ''
  const isDescError =
    rawDesc.includes('HTTP 400') ||
    rawDesc.includes('HTTP 403') ||
    rawDesc.includes('HTTP 404') ||
    rawDesc.includes('HTTP 500') ||
    rawDesc.includes('returned HTTP') ||
    rawDesc.includes('failed to fetch')

  const description = isDescError
    ? isInstagramReelOrVideo
      ? 'Preview unavailable'
      : isInstagram
      ? 'View post on Instagram'
      : isFacebook
      ? 'View post on Facebook'
      : `Visit ${domain}`
    : rawDesc

  // Guard: If it is an Instagram Reel or Video, but the imageUrl is an invalid photo endpoint (/p/.../media),
  // ignore it so we never render a 404 image or empty box.
  const isInvalidReelPhotoUrl =
    isInstagramReelOrVideo &&
    currentImageUrl.includes('/p/') &&
    currentImageUrl.includes('/media')

  const usableImageUrl = isInvalidReelPhotoUrl ? '' : currentImageUrl
  const hasValidImage = Boolean(usableImageUrl && usableImageUrl.length > 0 && !imgFailed)

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-3 block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
    >
      {hasValidImage ? (
        <>
          {/* Thumbnail container */}
          <div className="relative h-44 w-full bg-muted/40 overflow-hidden">
            <Image
              src={usableImageUrl}
              alt={title}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => {
                if (fallbackImageUrl && currentImageUrl !== fallbackImageUrl) {
                  setCurrentImageUrl(fallbackImageUrl)
                  return
                }
                setImgFailed(true)
              }}
            />
            {isYouTube && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="flex size-12 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg">
                  <Play className="size-6 fill-white ml-0.5" />
                </div>
              </div>
            )}
            {isInstagramReel && (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-xs">
                <Film className="size-3" />
                <span>Reel</span>
              </div>
            )}
            {isInstagramVideo && (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-xs">
                <Video className="size-3" />
                <span>Video</span>
              </div>
            )}
          </div>

          {/* Info Container with Image */}
          <div className="p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              {isInstagram ? (
                <>
                  <InstagramIcon className="size-3.5 text-[#E1306C]" />
                  <span className="truncate text-[#E1306C]">{domain}</span>
                </>
              ) : isMaps ? (
                <>
                  <MapPin className="size-3.5 text-emerald-600" />
                  <span className="truncate text-muted-foreground">{domain}</span>
                </>
              ) : isPlayStore ? (
                <>
                  <Smartphone className="size-3.5 text-blue-600" />
                  <span className="truncate text-muted-foreground">{domain}</span>
                </>
              ) : (
                <>
                  <Globe className="size-3.5 text-primary" />
                  <span className="truncate text-muted-foreground">{domain}</span>
                </>
              )}
              <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary ml-auto" />
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary line-clamp-1">
              {title}
            </h4>

            {description &&
            description !== 'Open this link to view the shared content.' &&
            description !== 'Preview unavailable' && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </>
      ) : isInstagram ? (
        /* Compact Instagram Card when thumbnail is unavailable - COLLAPSED, ZERO EMPTY SPACE */
        <div className="flex items-center gap-3.5 p-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-pink-500/10 border border-pink-500/20 text-[#E1306C] shadow-xs">
            {isInstagramReel ? (
              <Film className="size-5" />
            ) : isInstagramVideo ? (
              <Video className="size-5" />
            ) : (
              <InstagramIcon className="size-5" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary truncate">
              {isInstagramReel
                ? 'Instagram Reel'
                : isInstagramVideo
                ? 'Instagram Video'
                : title && title.toLowerCase() !== 'instagram'
                ? title
                : 'Instagram Post'}
            </h4>

            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
              {description &&
              description !== 'Open this link to view the shared content.' &&
              description !== 'Instagram Reel' &&
              description !== 'Instagram Video'
                ? description
                : 'Preview unavailable'}
            </p>

            <div className="flex items-center gap-1 text-[11px] font-bold text-[#E1306C] pt-0.5">
              <span>Open on Instagram</span>
              <ExternalLink className="size-3 ml-0.5" />
            </div>
          </div>
        </div>
      ) : (
        /* Compact Generic / Non-Instagram Card when no thumbnail - ZERO EMPTY SPACE */
        <div className="p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            {isMaps ? (
              <MapPin className="size-3.5 text-emerald-600" />
            ) : isPlayStore ? (
              <Smartphone className="size-3.5 text-blue-600" />
            ) : (
              <Globe className="size-3.5 text-primary" />
            )}
            <span className="truncate">{domain}</span>
            <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary ml-auto" />
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary line-clamp-1">
            {title}
          </h4>

          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
    </a>
  )
}
