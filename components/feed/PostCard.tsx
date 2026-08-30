'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ref, onValue, off, set, remove, runTransaction } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Post } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'
import { getUserAvatar, getPostLocation } from '@/lib/imageUtils'
import { ImageViewerModal } from '@/components/ui/ImageViewerModal'
import {
  Heart,
  MessageSquare,
  Share2,
  MapPin,
  Calendar,
  Vote,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'

interface PostCardProps {
  post: Post
  onOpenComments?: (postId: string) => void
}

export function PostCard({ post, onOpenComments }: PostCardProps) {
  const { user, publicProfiles } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likesCount || 0)
  const [copied, setCopied] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Listen to like status for current user
  useEffect(() => {
    if (!user || !post.id) return

    const likeRef = ref(db, `postLikes/${post.id}/${user.uid}`)
    const callback = (snap: any) => {
      setIsLiked(snap.exists() && snap.val() === true)
    }
    onValue(likeRef, callback)

    return () => off(likeRef)
  }, [user, post.id])

  const handleToggleLike = async () => {
    if (!user) return

    const likeRef = ref(db, `postLikes/${post.id}/${user.uid}`)
    const postRef = ref(db, `posts/${post.id}/likesCount`)

    if (isLiked) {
      setIsLiked(false)
      setLikesCount((prev) => Math.max(0, prev - 1))
      await remove(likeRef)
      await runTransaction(postRef, (curr) => Math.max(0, (curr || 1) - 1))
    } else {
      setIsLiked(true)
      setLikesCount((prev) => prev + 1)
      await set(likeRef, true)
      await runTransaction(postRef, (curr) => (curr || 0) + 1)
    }
  }

  const handleShare = async () => {
    const url = `https://circularapp.in/post/${post.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.userName || 'Circular Post',
          text: post.text || 'Check out this post on Circular!',
          url,
        })
        return
      } catch {}
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatTimestamp = (ts: number) => {
    if (!ts) return 'Recent'
    const diffMs = Date.now() - ts
    const diffMins = Math.floor(diffMs / (1000 * 60))
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return new Date(ts).toLocaleDateString()
  }

  const authorAvatar =
    (!imgError && getUserAvatar(post, publicProfiles)) || '/circular-logo.png'
  const authorName =
    publicProfiles?.[post.userId]?.name || post.userName || 'Circular Member'
  const displayLocation = getPostLocation(post)

  const allImages: string[] = []
  if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) {
    post.imageUrls.forEach((u) => { if (typeof u === 'string' && u.trim()) allImages.push(u.trim()) })
  } else if (post.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.trim()) {
    allImages.push(post.imageUrl.trim())
  }

  return (
    <>
      <article className="rounded-3xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md md:p-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/user/${post.userId}`}
              className="relative size-10 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border"
            >
              <Image
                src={authorAvatar}
                alt={authorName}
                fill
                className="object-cover"
                onError={() => setImgError(true)}
              />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/user/${post.userId}`}
                  className="font-bold text-navy hover:text-primary text-xs sm:text-sm"
                >
                  {authorName}
                </Link>
                {post.businessTrustLabel && (
                  <span className="rounded-full bg-purple-500/10 px-2 py-0.2 text-[9px] font-bold text-purple-600">
                    {post.businessTrustLabel}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {displayLocation ? (
                  <>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3 text-primary" />
                      <span>{displayLocation}</span>
                    </span>
                    <span>•</span>
                  </>
                ) : null}
                <span>{formatTimestamp(post.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Category Badge */}
          {post.category && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              {post.category}
            </span>
          )}
        </div>

        {/* Post Text */}
        {post.text && (
          <p className="mt-3 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-foreground">
            {post.text}
          </p>
        )}

        {/* Special Post Type: Event */}
        {post.postType === 'event' && post.event && (
          <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Calendar className="size-4" />
              <span>{post.event.title || 'Community Event'}</span>
            </div>
            {post.event.description && (
              <p className="text-xs text-muted-foreground">{post.event.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-foreground pt-1">
              {post.event.venue && <span>📍 {post.event.venue}</span>}
              {post.event.eventDate && <span>📅 {post.event.eventDate}</span>}
              {post.event.time && <span>⏰ {post.event.time}</span>}
            </div>
          </div>
        )}

        {/* Special Post Type: Poll */}
        {post.postType === 'poll' && post.poll && (
          <div className="mt-3 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
              <Vote className="size-4" />
              <span>{post.poll.question}</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {(post.poll.options || []).map((opt: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-2 text-xs font-medium"
                >
                  <span>{opt}</span>
                  <span className="text-[10px] text-muted-foreground">Vote</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clickable Image Grid with Lightbox */}
        {allImages.length === 1 && (
          <div
            onClick={() => setLightboxIndex(0)}
            className="relative mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-border cursor-pointer group"
          >
            <Image
              src={allImages[0]}
              alt="Post photo"
              fill
              className="object-cover transition-transform group-hover:scale-102"
            />
          </div>
        )}

        {allImages.length > 1 && (
          <div className={`mt-3 grid gap-2 ${allImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {allImages.map((url, idx) => (
              <div
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border cursor-pointer group"
              >
                <Image
                  src={url}
                  alt={`Post photo ${idx + 1}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-102"
                />
              </div>
            ))}
          </div>
        )}

        {/* Engagement Footer */}
        <div className="mt-3.5 flex items-center justify-between border-t border-border pt-2.5 text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Like Button */}
            <button
              type="button"
              onClick={handleToggleLike}
              className={`flex items-center gap-1.5 transition-colors ${
                isLiked ? 'text-rose-500 font-bold' : 'hover:text-rose-500'
              }`}
            >
              <Heart className={`size-4 ${isLiked ? 'fill-rose-500' : ''}`} />
              <span>{likesCount}</span>
            </button>

            {/* Comment Button */}
            <button
              type="button"
              onClick={() => onOpenComments && onOpenComments(post.id)}
              className="flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <MessageSquare className="size-4" />
              <span>{post.commentsCount || 0}</span>
            </button>
          </div>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 transition-colors hover:text-primary"
          >
            <Share2 className="size-4" />
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </article>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <ImageViewerModal
          isOpen={true}
          images={allImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
