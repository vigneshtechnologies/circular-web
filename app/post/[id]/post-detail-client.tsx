'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ref, onValue, off, update, push, set, runTransaction } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Post, PostComment } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { ImageViewerModal } from '@/components/ui/ImageViewerModal'
import { SmartPostRenderer } from '@/components/smartPosts/SmartPostRenderer'
import { LinkPreviewCard } from '@/components/links/LinkPreviewCard'
import { OpenInCircularBanner } from '@/components/public/open-in-circular-banner'
import { getUserAvatar, getPostLocation } from '@/lib/imageUtils'
import {
  Heart,
  MessageCircle,
  MessageSquare,
  Share2,
  MapPin,
  Calendar,
  Clock,
  BarChart2,
  CheckCircle2,
  Check,
  Eye,
  ArrowLeft,
  Sparkles,
  Send,
  Loader2,
  Tag,
  X,
} from 'lucide-react'

interface PostDetailClientProps {
  id: string
  initialPost?: any | null
}

export function PostDetailClient({ id, initialPost }: PostDetailClientProps) {
  const router = useRouter()
  const { user, userProfile, publicProfiles } = useAuth()

  const [post, setPost] = useState<Post | null>(() => {
    if (!initialPost) return null
    return {
      id,
      userId: initialPost.authorId || '',
      userName: initialPost.authorName || 'Circular Member',
      userAvatar: initialPost.authorAvatar,
      businessName: initialPost.hasBusinessProfile ? initialPost.authorName : undefined,
      hasBusinessProfile: initialPost.hasBusinessProfile,
      businessId: initialPost.businessId,
      text: initialPost.text,
      category: initialPost.category,
      area: initialPost.area,
      imageUrls: initialPost.images,
      postType: initialPost.postType,
      smart: initialPost.smart,
      linkPreview: initialPost.linkPreview,
      event: initialPost.event,
      poll: initialPost.poll,
      createdAt: initialPost.createdAt,
      likesCount: initialPost.likesCount || 0,
      commentsCount: initialPost.commentsCount || 0,
    } as Post
  })

  const [loading, setLoading] = useState<boolean>(!initialPost)
  const [notFound, setNotFound] = useState<boolean>(false)

  // Engagement states
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState<number>(initialPost?.likesCount || 0)
  const [sharedToast, setSharedToast] = useState(false)

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Poll
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)

  // Comments
  const [comments, setComments] = useState<PostComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // 1. Subscribe to Realtime Post Data from Firebase
  useEffect(() => {
    if (!id) return

    const postRef = ref(db, `posts/${id}`)
    const callback = (snap: any) => {
      if (snap.exists()) {
        const val = snap.val()
        if (val.isRestricted || val.isDeleted) {
          setPost(null)
          setNotFound(true)
        } else {
          const loadedPost: Post = { id, ...val }
          setPost(loadedPost)
          setLikesCount(val.likesCount || 0)
          setNotFound(false)
        }
      } else {
        if (!initialPost) {
          setPost(null)
          setNotFound(true)
        }
      }
      setLoading(false)
    }

    onValue(postRef, callback)
    return () => off(postRef)
  }, [id, initialPost])

  // 2. Subscribe to Realtime Comments
  useEffect(() => {
    if (!id) return

    const commentsRef = ref(db, `postComments/${id}`)
    const callback = (snap: any) => {
      if (snap.exists()) {
        const list: PostComment[] = []
        snap.forEach((child: any) => {
          list.push({ id: child.key, ...child.val() })
        })
        setComments(list.sort((a, b) => b.createdAt - a.createdAt))
      } else {
        setComments([])
      }
    }

    onValue(commentsRef, callback)
    return () => off(commentsRef)
  }, [id])

  const handleLike = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    const newLiked = !liked
    setLiked(newLiked)
    const newCount = newLiked ? likesCount + 1 : Math.max(0, likesCount - 1)
    setLikesCount(newCount)

    try {
      await update(ref(db, `posts/${id}`), {
        likesCount: newCount,
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleShare = async () => {
    const shareUrl = `https://circularapp.in/post/${id}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: post?.userName ? `Post by ${post.userName} on Circular` : 'Circular Post',
          text: post?.text?.substring(0, 100) || 'Check out this post on Circular',
          url: shareUrl,
        })
        return
      } catch (err) {}
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl)
      setSharedToast(true)
      setTimeout(() => setSharedToast(false), 2500)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setShowAuthModal(true)
      return
    }
    if (!newComment.trim() || submittingComment) return

    setSubmittingComment(true)
    try {
      const commentRef = push(ref(db, `postComments/${id}`))
      const commentData: PostComment = {
        id: commentRef.key as string,
        postId: id,
        userId: user.uid,
        userName: userProfile?.name || user.displayName || 'Circular Member',
        userAvatar: userProfile?.photoURL || user.photoURL || undefined,
        text: newComment.trim(),
        createdAt: Date.now(),
      }

      await set(commentRef, commentData)
      await runTransaction(ref(db, `posts/${id}/commentsCount`), (curr) => (curr || 0) + 1)
      setNewComment('')
    } catch (err) {
      console.error('Comment error:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  // Author details
  const authorAvatar = post ? (getUserAvatar(post, publicProfiles) || '/circular-logo.png') : '/circular-logo.png'
  const authorName = post?.businessName || post?.userName || 'Circular Member'
  const locationName = post ? getPostLocation(post) : ''
  const authorHref = post?.hasBusinessProfile && post?.businessId
    ? `/business/${post.businessId}`
    : `/user/${post?.userId || ''}`

  const postDate = post?.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent'

  const allImages = (post?.imageUrls && post.imageUrls.length > 0
    ? post.imageUrls
    : post?.imageUrl
    ? [post.imageUrl]
    : []
  ).filter((img): img is string => typeof img === 'string' && img.trim().length > 0)

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const getCategoryBadgeClass = (category?: string) => {
    const cat = (category || '').toLowerCase()
    if (cat.includes('food') || cat.includes('restaurant')) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
    if (cat.includes('shop') || cat.includes('store')) return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20'
    if (cat.includes('edu') || cat.includes('school')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
    if (cat.includes('job')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    if (cat.includes('event')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    if (cat.includes('need')) return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
    if (cat.includes('offer')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    if (cat.includes('med') || cat.includes('health')) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-xs font-semibold text-muted-foreground">Loading community post...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (notFound || !post) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg py-16 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
            <Sparkles className="size-8" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Community Post Not Found</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            This post does not exist, is private, or has been removed from Circular.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-700 transition-colors"
            >
              Back to Home Feed
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl pb-16">
        {/* Navigation & Breadcrumbs */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-sm hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </button>

          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/" className="hover:text-primary">Posts</Link>
            <span>/</span>
            <span className="truncate max-w-[140px] text-foreground">{authorName}</span>
          </nav>
        </div>

        {/* Main Post Card */}
        <article className="rounded-3xl border border-border bg-card p-5 md:p-7 shadow-sm">
          {/* Top Author Row */}
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <Link href={authorHref} className="flex items-center gap-3 group min-w-0">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-2 ring-primary/20 group-hover:ring-purple-500 transition-all">
                <Image
                  src={authorAvatar}
                  alt={authorName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    {authorName}
                  </span>
                  {post.businessTrustLabel && (
                    <CheckCircle2 className="size-4 text-emerald-500 fill-emerald-500/20 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{postDate}</span>
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
              <span className={`rounded-full border px-3 py-1 text-xs font-bold shrink-0 ${getCategoryBadgeClass(post.category)}`}>
                {post.category}
              </span>
            )}
          </div>

          {/* Main Text Body */}
          {post.text && (
            <div className="py-4">
              <p className="text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-line break-words">
                {post.text}
              </p>
            </div>
          )}

          {/* Full Image Gallery */}
          {allImages.length > 0 && (
            <div className="mt-2 overflow-hidden rounded-2xl border border-border/80">
              {allImages.length === 1 ? (
                <div
                  onClick={() => openLightbox(0)}
                  className="relative h-72 sm:h-96 w-full cursor-pointer bg-muted/40 group overflow-hidden"
                >
                  <Image
                    src={allImages[0]}
                    alt="Post photo"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 bg-muted/40">
                  {allImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => openLightbox(idx)}
                      className="relative h-48 sm:h-60 cursor-pointer overflow-hidden group"
                    >
                      <Image
                        src={img}
                        alt={`Post photo ${idx + 1}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Special Post: Smart Posts (9 templates) */}
          {post.postType === 'smart' && post.smart && (
            <div className="mt-4">
              <SmartPostRenderer postId={post.id} smart={post.smart} />
            </div>
          )}

          {/* Special Post: Rich Link Preview */}
          {post.postType === 'link' && post.linkPreview && (
            <div className="mt-4">
              <LinkPreviewCard preview={post.linkPreview} />
            </div>
          )}

          {/* Special Post: Event Card */}
          {post.postType === 'event' && post.event && (
            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Calendar className="size-4" />
                <span>COMMUNITY EVENT</span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">{post.event.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-muted-foreground">
                {(post.event.eventDate || post.event.startAt) && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-4 text-primary" />
                    <span>
                      {post.event.eventDate || new Date(post.event.startAt!).toLocaleDateString()}
                      {post.event.time ? ` at ${post.event.time}` : ''}
                    </span>
                  </div>
                )}
                {post.event.venue && (
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="size-4 text-primary" />
                    <span className="truncate">{post.event.venue}</span>
                  </div>
                )}
              </div>
              {post.event.description && (
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed border-t border-primary/10 pt-3">
                  {post.event.description}
                </p>
              )}
            </div>
          )}

          {/* Special Post: Poll Card */}
          {post.postType === 'poll' && post.poll && (
            <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <BarChart2 className="size-4" />
                <span>COMMUNITY POLL</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{post.poll.question}</h3>
              <div className="space-y-2.5">
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
                          className={`w-full text-left rounded-xl border p-3 text-xs sm:text-sm font-semibold transition-all flex items-center justify-between ${
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
          <div className="mt-6 flex items-center justify-between border-t border-border/80 pt-4">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={handleLike}
                aria-label="Like post"
                className={`flex items-center gap-2 text-sm font-bold transition-colors ${
                  liked ? 'text-rose-600' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Heart className={`size-5 transition-transform active:scale-125 ${liked ? 'fill-rose-600 text-rose-600' : ''}`} />
                <span>{likesCount}</span>
              </button>

              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <MessageCircle className="size-5" />
                <span>{comments.length || post.commentsCount || 0}</span>
              </div>

              <button
                type="button"
                onClick={handleShare}
                aria-label="Share post"
                className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                <Share2 className="size-5" />
                {sharedToast ? <span className="text-xs text-primary font-bold">Link Copied!</span> : <span>Share</span>}
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/80" title="Total Views">
              <Eye className="size-4" />
              <span>{(post as any).viewsCount || (post as any).views || 1} Views</span>
            </div>
          </div>
        </article>

        {/* Embedded Real-time Comments Section */}
        <section className="mt-6 rounded-3xl border border-border bg-card p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Community Discussion</h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                {comments.length}
              </span>
            </div>
          </div>

          {/* New Comment Input Box */}
          <form onSubmit={handleCommentSubmit} className="mt-4 flex items-center gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Write a comment..." : "Sign in to leave a comment..."}
              className="flex-1 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {submittingComment ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </form>

          {/* Comments List */}
          <div className="mt-6 space-y-4">
            {comments.length === 0 ? (
              <div className="py-8 text-center text-xs sm:text-sm text-muted-foreground">
                No comments yet. Be the first to share your thoughts!
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex items-start gap-3 rounded-2xl bg-muted/20 p-3.5 border border-border/50">
                  <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border">
                    <Image
                      src={c.userAvatar || '/circular-logo.png'}
                      alt={c.userName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {c.userName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {c.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Deep link CTA Banner */}
        <div className="mt-8">
          <OpenInCircularBanner path={`/post/${id}`} title="Community Post" />
        </div>
      </div>

      {/* Lightbox Modal */}
      <ImageViewerModal
        isOpen={lightboxOpen}
        images={allImages}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-muted/80 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
            <AuthPortal />
          </div>
        </div>
      )}
    </AppShell>
  )
}
