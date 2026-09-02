'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { LinkPreviewData } from '@/lib/types'
import { ExternalLink, Globe, Play, MapPin, Smartphone } from 'lucide-react'

export function LinkPreviewCard({
  preview,
  compact = false,
}: {
  preview: LinkPreviewData
  compact?: boolean
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const targetUrl = preview.canonicalUrl || preview.originalUrl || ''
  
  if (!targetUrl) return null

  const domain = preview.domain || preview.siteName || 'Web Link'
  const isYouTube = targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')
  const isFacebook = targetUrl.includes('facebook.com') || targetUrl.includes('fb.watch')
  const isInstagram = targetUrl.includes('instagram.com')
  const isMaps = targetUrl.includes('maps.google') || targetUrl.includes('goo.gl/maps')
  const isPlayStore = targetUrl.includes('play.google.com')

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
    ? isFacebook
      ? 'Facebook Post / Video'
      : isInstagram
      ? 'Instagram Post'
      : isYouTube
      ? 'YouTube Video'
      : domain
    : rawTitle || targetUrl

  const rawDesc = preview.description || ''
  const isDescError =
    rawDesc.includes('HTTP 400') ||
    rawDesc.includes('HTTP 403') ||
    rawDesc.includes('HTTP 404') ||
    rawDesc.includes('HTTP 500') ||
    rawDesc.includes('returned HTTP') ||
    rawDesc.includes('failed to fetch')

  const description = isDescError
    ? isFacebook
      ? 'View post on Facebook'
      : isInstagram
      ? 'View post on Instagram'
      : `Visit ${domain}`
    : rawDesc

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-3 block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
    >
      {/* Thumbnail if present */}
      {preview.imageUrl && preview.imageUrl.trim().length > 0 && !imgFailed && (
        <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
          <Image
            src={preview.imageUrl.trim()}
            alt={title}
            fill
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgFailed(true)}
          />
          {isYouTube && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="flex size-12 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg">
                <Play className="size-6 fill-white ml-0.5" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Container */}
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
    </a>
  )
}
