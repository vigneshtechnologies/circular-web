'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Post } from '@/lib/types'
import { PostCard } from '@/components/feed/PostCard'
import { PostComposerModal } from '@/components/feed/PostComposerModal'
import { PostCommentsDrawer } from '@/components/feed/PostCommentsDrawer'
import { getUserCommunityLocation } from '@/lib/locationUtils'
import { Users, Sparkles, PlusCircle } from 'lucide-react'

export default function FollowingFeedPage() {
  const { user, userProfile, loading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null)

  const displayArea = getUserCommunityLocation(userProfile)

  useEffect(() => {
    if (!user) return

    const loadFollowingPosts = async () => {
      setFeedLoading(true)
      try {
        // 1. Get list of UIDs user follows
        const fSnap = await get(ref(db, `following/${user.uid}`))
        const uids: string[] = [user.uid]
        if (fSnap.exists()) {
          const val = fSnap.val()
          Object.keys(val).forEach((k) => {
            if (val[k]) uids.push(k)
          })
        }

        // 2. Fetch recent posts
        const pSnap = await get(query(ref(db, 'posts'), orderByChild('createdAt'), limitToLast(60)))
        if (pSnap.exists()) {
          const list: Post[] = []
          pSnap.forEach((child) => {
            const val = child.val()
            if (uids.includes(val.userId)) {
              list.push({ id: child.key as string, ...val })
            }
          })
          setPosts(list.reverse())
        }
      } catch (e) {
        console.error('Error fetching following posts:', e)
      } finally {
        setFeedLoading(false)
      }
    }

    loadFollowingPosts()
  }, [user])

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
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3.5 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-navy">Following Feed</h1>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Updates from creators &amp; businesses you follow in {displayArea}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90"
          >
            <PlusCircle className="size-4" />
            <span>Post</span>
          </button>
        </div>
      </header>

      {/* Main Feed */}
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-5">
        {feedLoading ? (
          <div className="space-y-4 py-8 text-center text-xs text-muted-foreground">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p>Loading following feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-navy">No posts from following yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Follow more local businesses and neighbors to see their updates here!
            </p>
            <Link
              href="/search"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow"
            >
              <span>Discover People &amp; Businesses</span>
            </Link>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenComments={(pId) => setActiveCommentsPostId(pId)}
            />
          ))
        )}
      </div>

      <PostComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
      />

      <PostCommentsDrawer
        postId={activeCommentsPostId}
        onClose={() => setActiveCommentsPostId(null)}
      />
    </AppShell>
  )
}
