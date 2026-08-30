'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ref, onValue, off, set, remove, runTransaction } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Post } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'
import { getUserAvatar } from '@/lib/imageUtils'
import {
  Heart,
  MessageSquare,
  Share2,
  MapPin,
  CheckCircle2,
} from 'lucide-react'

interface PostCardProps {
  post: Post
  onOpenComments?: (postId: string) => void
}

export function PostCard({ post, onOpenComments }: PostCardProps) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likesCount || 0)
  const [copied, setCopied] = useState(false)

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

  const authorAvatar = getUserAvatar(post) || '/circular-logo.png'
  const displayArea = post.area || post.areaName || post.city || ''

  const allImages: string[] = []
  if (Array.isArray(post.imageUrls) && post.imageUrls.length > 0) {
    post.imageUrls.forEach((u) => { if (typeof u === 'string' && u.trim()) allImages.push(u.trim()) })
  } else if (post.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.trim()) {
    allImages.push(post.imageUrl.trim())
  }

  return (
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
              alt={post.userName || 'Author'}
              fill
              className="object-cover"
            />
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/user/${post.userId}`}
                className="font-bold text-navy hover:text-primary text-xs sm:text-sm"
              >
                {post.userName || 'Circular Member'}
              </Link>
              {post.businessTrustLabel && (
                <span className="rounded-full bg-purple-500/10 px-2 py-0.2 text-[9px] font-bold text-purple-600">
                  {post.businessTrustLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {displayArea && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3 text-primary" />
                  <span>{displayArea}</span>
                </span>
              )}
              {displayArea && <span>•</span>}
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

      {/* Post Text (Unicode & Tamil supported) */}
      {post.text && (
        <p className="mt-3 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-foreground">
          {post.text}
        </p>
      )}

      {/* Post Media Images */}
      {allImages.length === 1 && (
        <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
          <Image
            src={allImages[0]}
            alt="Post photo"
            fill
            className="object-cover"
          />
        </div>
      )}

      {allImages.length > 1 && (
        <div className={`mt-3 grid gap-2 ${allImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {allImages.map((url, idx) => (
            <div key={idx} className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border">
              <Image src={url} alt={`Post photo ${idx + 1}`} fill className="object-cover" />
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
  )
}
