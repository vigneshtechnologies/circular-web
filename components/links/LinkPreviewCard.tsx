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
  const isMaps = targetUrl.includes('maps.google') || targetUrl.includes('goo.gl/maps')
  const isPlayStore = targetUrl.includes('play.google.com')

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-3 block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-md"
    >
      {/* Thumbnail if present */}
      {preview.imageUrl && !imgFailed && (
        <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
          <Image
            src={preview.imageUrl}
            alt={preview.title || 'Preview'}
            fill
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

        <h4 className="text-xs sm:text-sm font-bold text-navy group-hover:text-primary line-clamp-1">
          {preview.title || targetUrl}
        </h4>

        {preview.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  )
}
