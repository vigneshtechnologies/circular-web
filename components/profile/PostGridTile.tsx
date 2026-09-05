'use client'

import React from 'react'
import Image from 'next/image'
import { Post } from '@/lib/types'
import { Images, FileText } from 'lucide-react'
import { getCategoryBadgeClass } from '@/lib/categoryColors'

interface PostGridTileProps {
  post: Post
  onClick: () => void
}

export function PostGridTile({ post, onClick }: PostGridTileProps) {
  const allImages = (
    post.imageUrls && post.imageUrls.length > 0
      ? post.imageUrls
      : post.imageUrl
      ? [post.imageUrl]
      : []
  ).filter((img): img is string => typeof img === 'string' && img.trim().length > 0)

  const firstImage = allImages[0]
  const hasMultiple = allImages.length > 1

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 transition-all hover:border-primary/40"
    >
      {firstImage ? (
        <>
          <Image
            src={firstImage}
            alt={post.text?.substring(0, 40) || 'Post image'}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 33vw, 25vw"
          />
          {hasMultiple && (
            <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white">
              <Images className="size-3" />
            </span>
          )}
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="p-2 text-[10px] font-bold text-white drop-shadow line-clamp-2">
              {post.text || ''}
            </span>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col justify-between p-2.5">
          <span className={`self-start rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${getCategoryBadgeClass(post.category)}`}>
            {post.category || 'Post'}
          </span>
          <p className="line-clamp-4 text-[11px] font-semibold leading-tight text-foreground">
            {post.text || 'Circular post'}
          </p>
          <FileText className="size-3.5 text-muted-foreground" />
        </div>
      )}
    </button>
  )
}
