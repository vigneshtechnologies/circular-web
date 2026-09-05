'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Post } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'
import { ref, update, push, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { getUserAvatar, getPostLocation } from '@/lib/imageUtils'
import { ImageViewerModal } from '@/components/ui/ImageViewerModal'
import { SmartPostRenderer } from '@/components/smartPosts/SmartPostRenderer'
import { LinkPreviewCard } from '@/components/links/LinkPreviewCard'
import { getCategoryBadgeClass } from '@/lib/categoryColors'
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Calendar,
  Clock,
  Phone,
  BarChart2,
  CheckCircle2,
  Check,
  Eye,
} from 'lucide-react'

interface PostCardProps {
  post: Post
  onOpenComments?: (postId: string) => void
}

export function PostCard({ post, onOpenComments }: PostCardProps) {
  const { user, userProfile, publicProfiles } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likesCount || 0)
  const [sharedToast, setSharedToast] = useState(false)

  // Lightbox modal state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Poll interactive voting state
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)

  const handleLike = async () => {
    if (!user) return
    const newLiked = !liked
    setLiked(newLiked)
    const newCount = newLiked ? likesCount + 1 : Math.max(0, likesCount - 1)
    setLikesCount(newCount)

    try {
      await update(ref(db, `posts/${post.id}`), {
        likesCount: newCount,
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleShare = async () => {
    const shareUrl = `https://circularapp.in/post/${post.id}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: post.userName ? `Post by ${post.userName} on Circular` : 'Circular Post',
          text: post.text?.substring(0, 100) || 'Check out this post on Circular',
          url: shareUrl,
        })
        return
      } catch (err) {}
    }

    // Fallback: Copy canonical link
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl)
      setSharedToast(true)
      setTimeout(() => setSharedToast(false), 2500)
    }
  }

  // Format date / timestamp
  const postDate = new Date(post.createdAt || Date.now()).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  })

  // Author details
  const authorAvatar = getUserAvatar(post, publicProfiles) || '/circular-logo.png'
  const authorName = post.businessName || post.userName || 'Circular Member'
  const locationName = getPostLocation(post)

  // Image list
  const allImages = (post.imageUrls && post.imageUrls.length > 0
    ? post.imageUrls
    : post.imageUrl
    ? [post.imageUrl]
    : []
  ).filter((img): img is string => typeof img === 'string' && img.trim().length > 0)

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  // Category badge class imported from centralized @/lib/categoryColors

  const authorHref = post.hasBusinessProfile && post.businessId
    ? `/business/${post.businessId}`
    : `/user/${post.userId}`

  return (
    <article className="rounded-3xl border border-border bg-card p-4 md:p-5 shadow-sm transition-all hover:border-purple-500/30">
      {/* Top Author Row */}
      <div className="flex items-center justify-between">
        <Link href={authorHref} className="flex items-center gap-3 group min-w-0">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-purple-500/10 ring-1 ring-border group-hover:ring-purple-500">
            <Image
              src={authorAvatar}
              alt={authorName}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                {authorName}
              </span>
              {post.businessTrustLabel && (
                <CheckCircle2 className="size-3.5 text-emerald-500 fill-emerald-500/20 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Link href={`/post/${post.id}`} className="hover:underline hover:text-foreground">
                <span>{postDate}</span>
              </Link>
              {locationName && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-semibold truncate">
                    <MapPin className="size-3" />
                    {locationName}
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>

        {post.category && (
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${getCategoryBadgeClass(post.category)}`}>
            {post.category}
          </span>
        )}
      </div>

      {/* Main Text Body (Clickable to /post/{id}) */}
      {post.text && (
        <Link href={`/post/${post.id}`} className="block mt-3 group/post">
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line break-words group-hover/post:text-primary transition-colors cursor-pointer">
            {post.text}
          </p>
        </Link>
      )}

      {/* Image Grid with Clickable Lightbox */}
      {allImages.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-border/80">
          {allImages.length === 1 ? (
            <div
              onClick={() => openLightbox(0)}
              className="relative h-64 sm:h-80 w-full cursor-pointer bg-muted/40 group overflow-hidden"
            >
              <Image
                src={allImages[0]}
                alt="Post photo"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 bg-muted/40">
              {allImages.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => openLightbox(idx)}
                  className="relative h-36 sm:h-44 cursor-pointer overflow-hidden group"
                >
                  <Image
                    src={img}
                    alt={`Post photo ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {idx === 3 && allImages.length > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 font-black text-white text-base">
                      +{allImages.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Special Post: Smart Posts (9 templates) */}
      {post.postType === 'smart' && post.smart && (
        <SmartPostRenderer postId={post.id} smart={post.smart} />
      )}

      {/* Special Post: Rich Link Preview */}
      {post.postType === 'link' && post.linkPreview && (
        <LinkPreviewCard preview={post.linkPreview} />
      )}

      {/* Special Post: Event Card */}
      {post.postType === 'event' && post.event && (
        <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Calendar className="size-4" />
            <span>COMMUNITY EVENT</span>
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">{post.event.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            {(post.event.eventDate || post.event.startAt) && (
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" />
                <span>
                  {post.event.eventDate || new Date(post.event.startAt!).toLocaleDateString()}
                  {post.event.time ? ` at ${post.event.time}` : ''}
                </span>
              </div>
            )}
            {post.event.venue && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="size-3.5 text-primary" />
                <span className="truncate">{post.event.venue}</span>
              </div>
            )}
          </div>
          {post.event.description && (
            <p className="text-xs text-foreground/90 leading-relaxed border-t border-primary/10 pt-2">
              {post.event.description}
            </p>
          )}
        </div>
      )}

      {/* Special Post: Poll Card */}
      {post.postType === 'poll' && post.poll && (
        <div className="mt-3 rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <BarChart2 className="size-4" />
            <span>COMMUNITY POLL</span>
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{post.poll.question}</h3>
          <div className="space-y-2">
            {Array.isArray(post.poll.options)
              ? post.poll.options.map((opt: any, idx: number) => {
                  const optText = typeof opt === 'string' ? opt : opt.text || ''
                  const isSelected = selectedPollOption === String(idx)
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedPollOption(String(idx))
                        setHasVoted(true)
                      }}
                      className={`w-full text-left rounded-xl border p-2.5 text-xs font-semibold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-foreground hover:bg-muted'
                      }`}
                    >
                      <span>{optText}</span>
                      {isSelected && <Check className="size-4 text-primary" />}
                    </button>
                  )
                })
              : null}
          </div>
        </div>
      )}

      {/* Bottom Engagement Row */}
      <div className="mt-4 flex items-center justify-between border-t border-border/80 pt-3">
        <div className="flex items-center gap-5 sm:gap-6">
          <button
            type="button"
            onClick={handleLike}
            aria-label="Like post"
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              liked ? 'text-rose-600' : 'text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400'
            }`}
          >
            <Heart className={`size-4 transition-transform active:scale-125 ${liked ? 'fill-rose-600 text-rose-600' : ''}`} />
            <span>{likesCount}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenComments && onOpenComments(post.id)}
            aria-label="View comments"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            <MessageCircle className="size-4" />
            <span>{post.commentsCount || 0}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label="Share post"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
          >
            <Share2 className="size-4" />
            {sharedToast && <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold">Copied</span>}
          </button>
        </div>

        {/* Views */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-teal-600/80 dark:text-teal-400/80" title="Total Views">
          <Eye className="size-3.5" />
          <span>{(post as any).viewsCount || (post as any).views || 1}</span>
        </div>
      </div>

      {/* Lightbox Modal */}
      <ImageViewerModal
        isOpen={lightboxOpen}
        images={allImages}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </article>
  )
}
