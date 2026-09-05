'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { ref, get, query, orderByChild, limitToLast, endAt } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Post } from '@/lib/types'
import { PostCard } from '@/components/feed/PostCard'
import { PostComposerModal } from '@/components/feed/PostComposerModal'
import { PostCommentsDrawer } from '@/components/feed/PostCommentsDrawer'
import { StoriesBar } from '@/components/feed/StoriesBar'
import { getUserCommunityLocation } from '@/lib/locationUtils'
import { Users, Sparkles, PlusCircle, Loader2, ArrowDown, Store, Compass } from 'lucide-react'

const BATCH_QUERY_SIZE = 50
const DESIRED_POSTS_PER_PAGE = 20

export default function FollowingFeedPage() {
  const { user, userProfile, loading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [followingUids, setFollowingUids] = useState<string[]>([])
  const [hasFollowingRelationships, setHasFollowingRelationships] = useState(false)
  const [feedLoading, setFeedLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [lastCreatedAt, setLastCreatedAt] = useState<number | null>(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null)

  const observerTarget = useRef<HTMLDivElement>(null)
  const displayArea = getUserCommunityLocation(userProfile)

  // 1. Initial Load: Fetch Following UIDs and scan backwards for followed posts
  const loadInitialFollowingPosts = useCallback(async () => {
    if (!user) return
    setFeedLoading(true)

    try {
      // Step A: Load all followed account IDs (people + businesses)
      const uidsSet = new Set<string>()

      // 1. user following
      const fSnap = await get(ref(db, `following/${user.uid}`)).catch(() => null)
      if (fSnap && fSnap.exists()) {
        const val = fSnap.val()
        Object.keys(val).forEach((k) => {
          if (val[k]) uidsSet.add(k)
        })
      }

      // 2. business following if separate node
      const bfSnap = await get(ref(db, `businessFollowing/${user.uid}`)).catch(() => null)
      if (bfSnap && bfSnap.exists()) {
        const val = bfSnap.val()
        Object.keys(val).forEach((k) => {
          if (val[k]) uidsSet.add(k)
        })
      }

      const uids = Array.from(uidsSet)
      setFollowingUids(uids)
      setHasFollowingRelationships(uids.length > 0)

      if (uids.length === 0) {
        setPosts([])
        setHasMorePosts(false)
        setFeedLoading(false)
        return
      }

      // Step B: Scan posts collections in reverse chronological batches until accumulating target posts
      let visiblePosts: Post[] = []
      let nextLastCreatedAt: number | null = null
      let hasMore = true
      let scanIterations = 0
      const MAX_SCAN_ITERATIONS = 10 // scan up to 500 posts across platform if needed

      while (visiblePosts.length < DESIRED_POSTS_PER_PAGE && hasMore && scanIterations < MAX_SCAN_ITERATIONS) {
        scanIterations++

        const postsQuery =
          nextLastCreatedAt == null
            ? query(ref(db, 'posts'), orderByChild('createdAt'), limitToLast(BATCH_QUERY_SIZE))
            : query(
                ref(db, 'posts'),
                orderByChild('createdAt'),
                endAt(nextLastCreatedAt - 1),
                limitToLast(BATCH_QUERY_SIZE)
              )

        const snapshot = await get(postsQuery)
        if (!snapshot.exists()) {
          hasMore = false
          break
        }

        const data = snapshot.val()
        const batchPosts: Post[] = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

        if (batchPosts.length === 0) {
          hasMore = false
          break
        }

        // Filter for posts created by followed users or businesses
        const matchingPosts = batchPosts.filter((p) => {
          const authorId = p.userId || ''
          return uids.includes(authorId)
        })

        // Deduplicate
        const existingIds = new Set(visiblePosts.map((p) => p.id))
        matchingPosts.forEach((p) => {
          if (!existingIds.has(p.id)) {
            visiblePosts.push(p)
            existingIds.add(p.id)
          }
        })

        nextLastCreatedAt = batchPosts[batchPosts.length - 1]?.createdAt ?? null

        if (batchPosts.length < BATCH_QUERY_SIZE || nextLastCreatedAt == null) {
          hasMore = false
        }
      }

      setPosts(visiblePosts)
      setLastCreatedAt(nextLastCreatedAt)
      setHasMorePosts(hasMore)
    } catch (err) {
      console.error('Error loading following posts:', err)
    } finally {
      setFeedLoading(false)
    }
  }, [user])

  // 2. Pagination / Load More Older Followed Posts
  const loadMoreFollowingPosts = useCallback(async () => {
    if (loadingMore || !hasMorePosts || lastCreatedAt == null || !user || followingUids.length === 0) return

    setLoadingMore(true)
    try {
      let additionalPosts: Post[] = []
      let nextLastCreatedAt: number | null = lastCreatedAt
      let hasMore = true
      let scanIterations = 0
      const MAX_SCAN_ITERATIONS = 8

      while (additionalPosts.length < DESIRED_POSTS_PER_PAGE && hasMore && scanIterations < MAX_SCAN_ITERATIONS) {
        scanIterations++

        const moreQuery = query(
          ref(db, 'posts'),
          orderByChild('createdAt'),
          endAt(nextLastCreatedAt - 1),
          limitToLast(BATCH_QUERY_SIZE)
        )

        const snapshot = await get(moreQuery)
        if (!snapshot.exists()) {
          hasMore = false
          break
        }

        const data = snapshot.val()
        const batchPosts: Post[] = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

        if (batchPosts.length === 0) {
          hasMore = false
          break
        }

        const matchingPosts = batchPosts.filter((p) => {
          const authorId = p.userId || ''
          return followingUids.includes(authorId)
        })

        const existingIds = new Set([...posts.map((p) => p.id), ...additionalPosts.map((p) => p.id)])
        matchingPosts.forEach((p) => {
          if (!existingIds.has(p.id)) {
            additionalPosts.push(p)
            existingIds.add(p.id)
          }
        })

        nextLastCreatedAt = batchPosts[batchPosts.length - 1]?.createdAt ?? null

        if (batchPosts.length < BATCH_QUERY_SIZE || nextLastCreatedAt == null) {
          hasMore = false
        }
      }

      if (additionalPosts.length > 0) {
        setPosts((prev) => {
          const map = new Map<string, Post>(prev.map((p) => [p.id, p]))
          additionalPosts.forEach((p) => map.set(p.id, p))
          return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        })
      }

      setLastCreatedAt(nextLastCreatedAt)
      setHasMorePosts(hasMore)
    } catch (err) {
      console.error('Error loading more following posts:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMorePosts, lastCreatedAt, user, followingUids, posts])

  useEffect(() => {
    loadInitialFollowingPosts()
  }, [loadInitialFollowingPosts])

  // 3. Infinite scroll observer
  useEffect(() => {
    const el = observerTarget.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePosts && !loadingMore && !feedLoading) {
          loadMoreFollowingPosts()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMorePosts, loadingMore, feedLoading, loadMoreFollowingPosts])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <AuthPortal />
  }

  return (
    <AppShell currentArea={displayArea}>
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white">Following Feed</h1>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Updates from {followingUids.length} creators &amp; businesses you follow
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95 active:scale-95"
          >
            <PlusCircle className="size-4" />
            <span>Post</span>
          </button>
        </div>
      </header>

      {/* Main Feed Container */}
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-4">
        <StoriesBar />
        {feedLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-muted-foreground gap-2">
            <Loader2 className="size-6 animate-spin text-purple-600" />
            <p className="font-semibold">Loading followed updates...</p>
          </div>
        ) : !hasFollowingRelationships ? (
          /* Empty State A: User is not following anyone yet */
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center space-y-3">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600">
              <Users className="size-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">You're not following anyone yet</h3>
            <p className="mx-auto max-w-sm text-xs text-muted-foreground leading-relaxed">
              Follow your favorite local businesses, creators, and neighbors to see all their updates, offers, and announcements in one place!
            </p>
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/businesses"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow transition-all hover:opacity-95"
              >
                <Store className="size-4" />
                <span>Discover Businesses</span>
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-sm hover:bg-muted"
              >
                <Compass className="size-4 text-teal-600" />
                <span>Search Community</span>
              </Link>
            </div>
          </div>
        ) : posts.length === 0 ? (
          /* Empty State B: Followed accounts exist but have no recent posts */
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center space-y-3">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <Sparkles className="size-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No recent posts from accounts you follow</h3>
            <p className="mx-auto max-w-sm text-xs text-muted-foreground leading-relaxed">
              The {followingUids.length} accounts you follow haven't posted new updates yet. Check the main community feed or discover more local creators!
            </p>
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow transition-all hover:opacity-95"
              >
                <span>Home Community Feed</span>
              </Link>
              <Link
                href="/businesses"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-sm hover:bg-muted"
              >
                <Store className="size-4 text-purple-600" />
                <span>Browse Directory</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Rendered Posts List */
          posts.map((post) => (
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
                <span>Loading older followed posts...</span>
              </div>
            ) : hasMorePosts ? (
              <button
                type="button"
                onClick={loadMoreFollowingPosts}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground shadow-sm"
              >
                <ArrowDown className="size-3.5" />
                <span>Load More Followed Posts</span>
              </button>
            ) : (
              <p className="text-xs text-muted-foreground">You've caught up with all followed posts.</p>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <PostComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSuccess={loadInitialFollowingPosts}
      />

      <PostCommentsDrawer
        postId={activeCommentsPostId}
        onClose={() => setActiveCommentsPostId(null)}
      />
    </AppShell>
  )
}
