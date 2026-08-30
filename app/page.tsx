'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { PostCard } from '@/components/feed/PostCard'
import { CategoryFilterBar } from '@/components/feed/CategoryFilterBar'
import { PostCommentsDrawer } from '@/components/feed/PostCommentsDrawer'
import { PostComposerModal } from '@/components/feed/PostComposerModal'
import { StoriesBar } from '@/components/feed/StoriesBar'
import { getUserAvatar } from '@/lib/imageUtils'
import { ref, onValue, off, query, orderByChild, limitToLast } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Post } from '@/lib/types'
import { Sparkles, MapPin, PlusCircle, Search } from 'lucide-react'

export default function CircularRootPage() {
  const { user, userProfile, loading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [feedLoading, setFeedLoading] = useState(true)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null)

  // Listen to realtime posts
  useEffect(() => {
    if (!user) return

    setFeedLoading(true)
    const postsQuery = query(ref(db, 'posts'), orderByChild('createdAt'), limitToLast(60))

    const callback = (snap: any) => {
      if (snap.exists()) {
        const list: Post[] = []
        snap.forEach((child: any) => {
          list.push({ id: child.key, ...child.val() })
        })
        setPosts(list.reverse())
      } else {
        setPosts([])
      }
      setFeedLoading(false)
    }

    onValue(postsQuery, callback)
    return () => off(postsQuery)
  }, [user])

  // If initial auth is checking, show splash
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

  // If guest, show Authentication Portal
  if (!user) {
    return <AuthPortal />
  }

  const currentArea = userProfile?.area || userProfile?.city || ''
  const displayLocation = currentArea ? currentArea : 'Your Community'

  // Filter posts by category and text search
  const filteredPosts = posts.filter((p) => {
    const postCat = (p.category || '').toLowerCase().trim()
    const selected = selectedCategory.toLowerCase().trim()

    let matchesCat = selected === 'all'
    if (!matchesCat) {
      if (selected === 'general') {
        matchesCat = !postCat || postCat === 'general'
      } else if (selected === 'news & updates') {
        matchesCat = postCat === 'news' || postCat === 'news & updates' || postCat === 'local news'
      } else {
        matchesCat = postCat === selected || postCat.includes(selected)
      }
    }

    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      p.text?.toLowerCase().includes(q) ||
      p.userName?.toLowerCase().includes(q) ||
      p.area?.toLowerCase().includes(q)

    return matchesCat && matchesSearch
  })

  const authorAvatar = getUserAvatar(userProfile) || '/circular-logo.png'

  return (
    <AppShell currentArea={currentArea}>
      {/* Top Header in Center Feed */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-navy truncate">Home Feed</h1>
              <div className="text-[11px] font-semibold text-muted-foreground truncate">
                Showing posts in <span className="text-primary">{displayLocation}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary/90 active:scale-95 shrink-0"
          >
            <PlusCircle className="size-4" />
            <span>Post</span>
          </button>
        </div>

        {/* Category Filter Bar */}
        <div className="mt-3">
          <CategoryFilterBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      </header>

      {/* Main Feed Container */}
      <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 space-y-4">
        {/* Local Stories / Statuses Bar */}
        <div className="rounded-2xl border border-border bg-card p-2.5 shadow-sm">
          <StoriesBar />
        </div>

        {/* Quick Post Prompt Card */}
        <div
          onClick={() => setIsComposerOpen(true)}
          className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-all hover:border-primary/40 hover:bg-muted/40"
        >
          <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border">
            <Image
              src={authorAvatar}
              alt="Avatar"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 rounded-xl bg-muted/60 px-3.5 py-2 text-xs text-muted-foreground truncate">
            Share what's happening around you...
          </div>
          <button
            type="button"
            className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary shrink-0"
          >
            Post
          </button>
        </div>

        {/* Posts List */}
        {feedLoading ? (
          <div className="space-y-4 py-8 text-center text-xs text-muted-foreground">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p>Loading community feed...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-6" />
            </div>
            <h3 className="mt-3 text-sm sm:text-base font-bold text-navy">
              No posts in {selectedCategory === 'All' ? 'this area' : selectedCategory}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Be the first to share an update with your neighborhood!
            </p>
            <button
              type="button"
              onClick={() => setIsComposerOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow"
            >
              <PlusCircle className="size-4" />
              <span>Create Post</span>
            </button>
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
      </div>

      {/* Modals */}
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
