'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { PostCard } from '@/components/feed/PostCard'
import { CategoryFilterBar } from '@/components/feed/CategoryFilterBar'
import { RadiusSelector } from '@/components/feed/RadiusSelector'
import { PostCommentsDrawer } from '@/components/feed/PostCommentsDrawer'
import { PostComposerModal } from '@/components/feed/PostComposerModal'
import { StoriesBar } from '@/components/feed/StoriesBar'
import { getUserAvatar } from '@/lib/imageUtils'
import {
  CIRCULAR_RADIUS_OPTIONS,
  CircularRadiusOption,
  DEFAULT_RADIUS_KM,
  getDistanceKm,
  isValidCoordinate,
  getUserCommunityLocation,
} from '@/lib/locationUtils'
import { ref, get, query, orderByChild, limitToLast, endAt } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Post } from '@/lib/types'
import { Sparkles, MapPin, Loader2, ArrowDown, Navigation } from 'lucide-react'

const INITIAL_PAGE_SIZE = 30
const NEXT_PAGE_SIZE = 30

export default function CircularRootPage() {
  const { user, userProfile, publicProfiles, loading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedRadius, setSelectedRadius] = useState<CircularRadiusOption>(DEFAULT_RADIUS_KM)
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationAvailable, setLocationAvailable] = useState(false)

  const [feedLoading, setFeedLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [lastCreatedAt, setLastCreatedAt] = useState<number | null>(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null)

  const observerTarget = useRef<HTMLDivElement>(null)

  // Load radius preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('circular_feed_radius')
      if (saved) {
        const num = Number(saved) as CircularRadiusOption
        if (CIRCULAR_RADIUS_OPTIONS.includes(num)) {
          setSelectedRadius(num)
        }
      }
    } catch {}
  }, [])

  // Acquire user browser geolocation
  const requestUserLocation = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          })
          setLocationAvailable(true)
        },
        () => {
          setLocationAvailable(false)
        },
        { timeout: 8000, maximumAge: 120000 }
      )
    }
  }, [])

  useEffect(() => {
    requestUserLocation()
  }, [requestUserLocation])

  const handleSelectRadius = (radius: CircularRadiusOption) => {
    setSelectedRadius(radius)
    try {
      localStorage.setItem('circular_feed_radius', String(radius))
    } catch {}
  }

  // 1. Initial Page Load (30 posts ordered by createdAt descending)
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

  // 2. Cursor Pagination / Load More Posts (30 older posts)
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

  // 3. Infinite scroll observer when reaching bottom
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-navy text-white">
        <div className="relative size-20 overflow-hidden rounded-3xl bg-white/10 p-2 ring-2 ring-primary shadow-2xl animate-pulse">
          <Image
            src="/circular-logo.png"
            alt="Circular Logo"
            fill
            className="object-cover"
            priority
          />
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight">Circular</h1>
        <p className="mt-1 text-xs text-slate-400">Connecting your local community...</p>
      </div>
    )
  }

  if (!user) {
    return <AuthPortal />
  }

  const displayLocation = getUserCommunityLocation(userProfile)

  // Filter posts by Category + Geographic Radius
  const filteredPosts = posts.filter((p) => {
    // 1. Category Filter
    const postCat = (p.category || '').toLowerCase().trim()
    const selected = selectedCategory.toLowerCase().trim()

    let matchesCategory = selected === 'all'
    if (!matchesCategory) {
      if (selected === 'general') {
        matchesCategory = !postCat || postCat === 'general'
      } else if (selected === 'news & updates') {
        matchesCategory = postCat === 'news' || postCat === 'news & updates' || postCat === 'local news'
      } else {
        matchesCategory = postCat === selected || postCat.includes(selected)
      }
    }

    if (!matchesCategory) return false

    // 2. Geographic Radius Filter
    if (userCoords && isValidCoordinate(p.latitude, p.longitude)) {
      const distance = getDistanceKm(
        userCoords.latitude,
        userCoords.longitude,
        p.latitude!,
        p.longitude!
      )
      return distance <= selectedRadius
    }

    if (selectedRadius === DEFAULT_RADIUS_KM || !userCoords) {
      return true
    }

    return false
  })

  const authorAvatar = getUserAvatar(userProfile, publicProfiles) || '/circular-logo.png'

  return (
    <AppShell currentArea={displayLocation}>
      {/* Top Header in Center Feed (Clean Layout: Location on Left, Radius on Right) */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <MapPin className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">Local Feed</h1>
              <div className="text-[11px] font-semibold text-muted-foreground truncate flex items-center gap-1">
                <span>Showing updates in</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{displayLocation}</span>
              </div>
            </div>
          </div>

          {/* Right Action: ONLY Radius Selector (No duplicate blank buttons) */}
          <div className="flex items-center shrink-0">
            <RadiusSelector
              selectedRadius={selectedRadius}
              onSelectRadius={handleSelectRadius}
              hasUserLocation={locationAvailable}
              onRequestLocation={requestUserLocation}
            />
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="mt-2.5">
          <CategoryFilterBar
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
          />
        </div>
      </header>

      {/* Main Feed Container */}
      <div className="mx-auto max-w-2xl px-4 py-4 md:px-6 space-y-3.5">
        {/* Compact Stories / Status Launcher Bar */}
        <StoriesBar />

        {/* Quick Discovery Buttons (Local Jobs, Need Nearby, Bulletin) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 py-0.5">
          <Link
            href="/jobs"
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-2.5 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-sm transition-all hover:bg-emerald-500/15 hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate">Local Jobs</span>
          </Link>

          <Link
            href="/needs"
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-2.5 py-2.5 text-center text-xs font-bold text-amber-600 dark:text-amber-400 shadow-sm transition-all hover:bg-amber-500/15 hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="truncate">Need Nearby</span>
          </Link>

          <Link
            href="/businesses"
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-purple-500/20 bg-purple-500/10 px-2.5 py-2.5 text-center text-xs font-bold text-purple-600 dark:text-purple-400 shadow-sm transition-all hover:bg-purple-500/15 hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="size-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="truncate">Bulletin</span>
          </Link>
        </div>

        {/* Quick Post Prompt Card */}
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
            Share what's happening around you...
          </div>
          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm shrink-0 hover:opacity-95"
          >
            Post
          </button>
        </div>

        {/* Posts List */}
        {feedLoading ? (
          <div className="space-y-4 py-8 text-center text-xs text-muted-foreground">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-2 font-medium">Loading community feed...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-6" />
            </div>
            <h3 className="mt-3 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              No posts found within {selectedRadius} km
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedCategory !== 'All'
                ? `No ${selectedCategory} posts currently in this radius.`
                : 'Try expanding your distance radius or sharing a new update!'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {selectedRadius < 25 && (
                <button
                  type="button"
                  onClick={() => handleSelectRadius(25)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm hover:bg-muted"
                >
                  <Navigation className="size-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Expand to 25 km</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsComposerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:opacity-95"
              >
                <span>Create Post</span>
              </button>
            </div>
          </div>
        ) : (
          filteredPosts.map((post) => (
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
