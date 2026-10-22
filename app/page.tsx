'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { PostCard } from '@/components/feed/PostCard'
import { PostCommentsDrawer } from '@/components/feed/PostCommentsDrawer'
import { PostComposerModal } from '@/components/feed/PostComposerModal'
import { StoriesBar } from '@/components/feed/StoriesBar'
import { PeopleYouMayKnowCard } from '@/components/feed/PeopleYouMayKnowCard'
import { getUserAvatar } from '@/lib/imageUtils'
import { getUserCommunityLocation } from '@/lib/locationUtils'
import { ref, get, query, orderByChild, limitToLast, endAt } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Post } from '@/lib/types'
import { onActiveProfileChanged } from '@/lib/profileService'
import { useTranslation } from '@/lib/i18n'
import {
  Sparkles,
  Loader2,
  ArrowDown,
  Briefcase,
  HandHeart,
  Store,
  Users,
  Compass,
  Search,
} from 'lucide-react'

const INITIAL_PAGE_SIZE = 35
const NEXT_PAGE_SIZE = 30

export default function CircularRootPage() {
  const { user, userProfile, publicProfiles, loading } = useAuth()
  const { t } = useTranslation()

  const [posts, setPosts] = useState<Post[]>([])
  const [followingUids, setFollowingUids] = useState<string[]>([])

  const [feedLoading, setFeedLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [lastCreatedAt, setLastCreatedAt] = useState<number | null>(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null)

  const observerTarget = useRef<HTMLDivElement>(null)

  // 1. Load following user IDs for following filter and privacy checks
  useEffect(() => {
    if (!user) return
    const fetchFollowing = async () => {
      try {
        const uidsSet = new Set<string>()
        const fSnap = await get(ref(db, `following/${user.uid}`)).catch(() => null)
        if (fSnap && fSnap.exists()) {
          const val = fSnap.val()
          Object.keys(val).forEach((k) => {
            if (val[k]) uidsSet.add(k)
          })
        }
        const userFollowSnap = await get(ref(db, `users/${user.uid}/following`)).catch(() => null)
        if (userFollowSnap && userFollowSnap.exists()) {
          const val = userFollowSnap.val()
          Object.keys(val).forEach((k) => {
            if (val[k]) uidsSet.add(k)
          })
        }
        setFollowingUids(Array.from(uidsSet))
      } catch (err) {
        console.warn('Error loading following list:', err)
      }
    }
    fetchFollowing()
  }, [user])

  // 2. Initial Page Load
  const loadInitialPosts = useCallback(async () => {
    if (!user) return
    setFeedLoading(true)
    try {
      const postsQuery = query(
        ref(db, 'posts'),
        orderByChild('createdAt'),
        limitToLast(INITIAL_PAGE_SIZE)
      )

      const snapshot = await get(postsQuery)
      if (snapshot.exists()) {
        const data = snapshot.val()
        const batch: Post[] = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

        setPosts(batch)
        const oldest = batch[batch.length - 1]?.createdAt ?? null
        setLastCreatedAt(oldest)
        setHasMorePosts(batch.length >= INITIAL_PAGE_SIZE)
      } else {
        setPosts([])
        setHasMorePosts(false)
      }
    } catch (err) {
      console.error('Error loading initial posts:', err)
    } finally {
      setFeedLoading(false)
    }
  }, [user])

  // 3. Cursor Pagination / Load More Posts
  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMorePosts || lastCreatedAt == null || !user) return

    setLoadingMore(true)
    try {
      const moreQuery = query(
        ref(db, 'posts'),
        orderByChild('createdAt'),
        endAt(lastCreatedAt - 1),
        limitToLast(NEXT_PAGE_SIZE)
      )

      const snapshot = await get(moreQuery)
      if (snapshot.exists()) {
        const data = snapshot.val()
        const batch: Post[] = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

        if (batch.length === 0) {
          setHasMorePosts(false)
          return
        }

        setPosts((prev) => {
          const map = new Map<string, Post>(prev.map((p) => [p.id, p]))
          batch.forEach((p) => map.set(p.id, p))
          return Array.from(map.values()).sort(
            (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
          )
        })

        const nextOldest = batch[batch.length - 1]?.createdAt ?? null
        setLastCreatedAt(nextOldest)
        setHasMorePosts(batch.length >= NEXT_PAGE_SIZE)
      } else {
        setHasMorePosts(false)
      }
    } catch (err) {
      console.error('Error loading more posts:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMorePosts, lastCreatedAt, user])

  useEffect(() => {
    loadInitialPosts()
  }, [loadInitialPosts])

  useEffect(() => {
    const unsub = onActiveProfileChanged(() => {
      loadInitialPosts()
    })
    return () => unsub()
  }, [loadInitialPosts])

  // 4. Infinite scroll observer when reaching bottom
  useEffect(() => {
    const el = observerTarget.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePosts && !loadingMore && !feedLoading) {
          loadMorePosts()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMorePosts, loadingMore, feedLoading, loadMorePosts])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="relative size-20 overflow-hidden rounded-3xl bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 p-1 shadow-2xl animate-pulse ring-2 ring-purple-500/30">
          <div className="relative size-full rounded-2xl overflow-hidden bg-card">
            <Image
              src="/circular-logo.png"
              alt="Circular Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Circular</h1>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">Local Social &amp; Business</p>
      </div>
    )
  }

  if (!user) {
    return <AuthPortal />
  }

  const displayLocation = getUserCommunityLocation(userProfile)

  // Filter posts based on For You vs Following & Privacy Enforcement
  const visiblePosts = posts.filter((post) => {
    // Edge-case exclusion: moderated or deleted records or restricted authors must NEVER appear
    if (
      (post as any).isDeleted === true ||
      (post as any).isModerated === true ||
      (post as any).status === 'deleted' ||
      (post as any).status === 'moderated' ||
      (post as any).isRestricted === true
    ) {
      return false
    }

    const isOwnPost = Boolean(user && post.userId === user.uid)
    const authorProfile = post.userId ? publicProfiles[post.userId] : null
    if (authorProfile?.isRestricted === true) {
      return false
    }
    const isAuthorPrivate =
      authorProfile?.isPrivate === true ||
      (authorProfile as any)?.accountPrivacy === 'private'
    const isFollowersOnly = post.audience === 'followers' || isAuthorPrivate
    const isFollowingAuthor = post.userId ? followingUids.includes(post.userId) : false

    // Privacy rule: private or followers-only content is protected
    if (isFollowersOnly && !isOwnPost && !isFollowingAuthor) {
      return false
    }

    // Main Feed: eligible public posts from all locations globally (no distance restriction)
    return true
  })

  const authorAvatar = getUserAvatar(userProfile, publicProfiles) || '/circular-logo.png'

  return (
    <AppShell currentArea={displayLocation}>
      {/* Main Feed Container */}
      <div className="mx-auto max-w-2xl px-4 py-4 md:px-6 space-y-3.5">
        {/* Compact Stories / Status Launcher Bar */}
        <StoriesBar />

        {/* Quick Discovery Buttons (Jobs, Need Nearby, Bulletin) with Individual Colour Identity */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 py-0.5">
          <Link
            href="/jobs"
            className="group flex items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/25 px-2 sm:px-3 py-2.5 text-center text-xs font-bold text-emerald-700 dark:text-emerald-400 shadow-xs transition-all hover:bg-emerald-500/20 hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex size-5 items-center justify-center rounded-md bg-emerald-500 text-white shrink-0 shadow-xs">
              <Briefcase className="size-3 stroke-[2.5]" />
            </div>
            <span className="truncate">{t.jobs}</span>
          </Link>

          <Link
            href="/needs"
            className="group flex items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/25 px-2 sm:px-3 py-2.5 text-center text-xs font-bold text-amber-700 dark:text-amber-400 shadow-xs transition-all hover:bg-amber-500/20 hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex size-5 items-center justify-center rounded-md bg-amber-500 text-white shrink-0 shadow-xs">
              <HandHeart className="size-3 stroke-[2.5]" />
            </div>
            <span className="truncate">Need Nearby</span>
          </Link>

          <Link
            href="/businesses"
            className="group flex items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 dark:bg-purple-950/25 px-2 sm:px-3 py-2.5 text-center text-xs font-bold text-purple-700 dark:text-purple-400 shadow-xs transition-all hover:bg-purple-500/20 hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex size-5 items-center justify-center rounded-md bg-purple-500 text-white shrink-0 shadow-xs">
              <Store className="size-3 stroke-[2.5]" />
            </div>
            <span className="truncate">Bulletin</span>
          </Link>
        </div>

        {/* Simplified Quick Post Prompt Card */}
        <div
          onClick={() => setIsComposerOpen(true)}
          className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-all hover:border-purple-500/40 hover:bg-muted/40"
        >
          <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border">
            <Image
              src={authorAvatar}
              alt="Avatar"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 rounded-xl bg-muted/60 px-3.5 py-1.5 text-xs text-muted-foreground truncate">
            {t.whatsOnYourMind}
          </div>
          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm shrink-0 hover:opacity-95"
          >
            {t.postButton}
          </button>
        </div>

        {/* People You May Know Recommendation Carousel */}
        <PeopleYouMayKnowCard />

        {/* Posts List */}
        {feedLoading ? (
          <div className="space-y-4 py-8 text-center text-xs text-muted-foreground">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-2 font-medium">Loading feed...</p>
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-6" />
            </div>
            <h3 className="mt-3 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {t.noPostsYet}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Share an update or event with the community!
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsComposerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:opacity-95"
              >
                <span>{t.navCreate}</span>
              </button>
            </div>
          </div>
        ) : (
          visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenComments={(pId) => setActiveCommentsPostId(pId)}
            />
          ))
        )}

        {/* Infinite Scroll / Load More Trigger */}
        {!feedLoading && posts.length > 0 && (
          <div ref={observerTarget} className="py-4 text-center">
            {loadingMore ? (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Loading older posts...</span>
              </div>
            ) : hasMorePosts ? (
              <button
                type="button"
                onClick={loadMorePosts}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground shadow-sm"
              >
                <ArrowDown className="size-3.5" />
                <span>Load More Posts</span>
              </button>
            ) : (
              <p className="text-xs text-muted-foreground">You've reached the end of the feed.</p>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <PostComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSuccess={loadInitialPosts}
      />

      <PostCommentsDrawer
        postId={activeCommentsPostId}
        onClose={() => setActiveCommentsPostId(null)}
      />
    </AppShell>
  )
}
