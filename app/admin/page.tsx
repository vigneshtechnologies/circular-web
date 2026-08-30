'use client'

import { getUserCommunityLocation } from '@/lib/locationUtils'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { ref, get, query, limitToLast, push, set, remove, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Post, BusinessProfile } from '@/lib/types'
import { Shield, Megaphone, Trash2, CheckCircle2, AlertCircle, BarChart3, Users, Store, FileText } from 'lucide-react'

export default function AdminPage() {
  const { user, userProfile, isAdmin, loading } = useAuth()
  const [stats, setStats] = useState({ posts: 0, businesses: 0, users: 0, reports: 0 })
  const [broadcastText, setBroadcastText] = useState('')
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)
  const [broadcastSuccess, setBroadcastSuccess] = useState(false)

  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [recentBusinesses, setRecentBusinesses] = useState<BusinessProfile[]>([])

  useEffect(() => {
    if (!user || !isAdmin) return

    const loadAdminData = async () => {
      try {
        const [pSnap, bSnap, uSnap, rSnap] = await Promise.all([
          get(query(ref(db, 'posts'), limitToLast(30))),
          get(query(ref(db, 'businessProfiles'), limitToLast(30))),
          get(query(ref(db, 'users'), limitToLast(30))),
          get(query(ref(db, 'reports'), limitToLast(30))),
        ])

        const pList: Post[] = []
        if (pSnap.exists()) {
          pSnap.forEach((c) => { pList.push({ id: c.key as string, ...c.val() }) })
          setRecentPosts(pList.reverse())
        }

        const bList: BusinessProfile[] = []
        if (bSnap.exists()) {
          bSnap.forEach((c) => { bList.push({ id: c.key as string, ...c.val() }) })
          setRecentBusinesses(bList.reverse())
        }

        setStats({
          posts: pSnap.exists() ? Object.keys(pSnap.val()).length : 0,
          businesses: bSnap.exists() ? Object.keys(bSnap.val()).length : 0,
          users: uSnap.exists() ? Object.keys(uSnap.val()).length : 0,
          reports: rSnap.exists() ? Object.keys(rSnap.val()).length : 0,
        })
      } catch (e) {
        console.error('Error fetching admin data:', e)
      }
    }

    loadAdminData()
  }, [user, isAdmin])

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isAdmin) return
    if (!broadcastTitle.trim() || !broadcastText.trim()) return

    setBroadcasting(true)
    try {
      const bRef = push(ref(db, 'broadcasts'))
      await set(bRef, {
        id: bRef.key as string,
        senderId: user.uid,
        senderName: 'Circular Team',
        title: broadcastTitle.trim(),
        message: broadcastText.trim(),
        createdAt: Date.now(),
      })

      // Also create announcement post
      const pRef = push(ref(db, 'posts'))
      await set(pRef, {
        id: pRef.key as string,
        userId: user.uid,
        userName: 'Circular Team',
        text: `📢 ANNOUNCEMENT: ${broadcastTitle.trim()}\n\n${broadcastText.trim()}`,
        category: 'Announcement',
        postType: 'announcement',
        area: 'All Areas',
        createdAt: Date.now(),
      })

      setBroadcastSuccess(true)
      setBroadcastTitle('')
      setBroadcastText('')
      setTimeout(() => setBroadcastSuccess(false), 4000)
    } catch (e) {
      console.error(e)
    } finally {
      setBroadcasting(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      await remove(ref(db, `posts/${postId}`))
      setRecentPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleVerify = async (businessId: string, currentStatus: boolean | undefined) => {
    try {
      await update(ref(db, `businessProfiles/${businessId}`), { isVerified: !currentStatus })
      setRecentBusinesses((prev) =>
        prev.map((b) => (b.id === businessId ? { ...b, isVerified: !currentStatus } : b))
      )
    } catch (e) {
      console.error(e)
    }
  }

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

  if (!isAdmin) {
    return (
      <AppShell currentArea={getUserCommunityLocation(userProfile)}>
        <div className="mx-auto max-w-md py-20 px-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-7" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-navy">Access Denied</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            You do not have administrative privileges to access this area.
          </p>
          <Link href="/" className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white">
            Return Home
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell currentArea={getUserCommunityLocation(userProfile)}>
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3.5 md:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-navy">Admin Command Center</h1>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Moderation, broadcast &amp; platform management
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <FileText className="size-4 text-primary" />
              <span>Posts</span>
            </div>
            <p className="mt-2 text-2xl font-black text-navy">{stats.posts}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Store className="size-4 text-emerald-500" />
              <span>Businesses</span>
            </div>
            <p className="mt-2 text-2xl font-black text-navy">{stats.businesses}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Users className="size-4 text-purple-500" />
              <span>Users</span>
            </div>
            <p className="mt-2 text-2xl font-black text-navy">{stats.users}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <AlertCircle className="size-4 text-rose-500" />
              <span>Reports</span>
            </div>
            <p className="mt-2 text-2xl font-black text-navy">{stats.reports}</p>
          </div>
        </div>

        {/* Broadcast / Announcement Form */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="size-5 text-primary" />
            <h2 className="text-sm font-bold text-navy">Send Admin Announcement Broadcast</h2>
          </div>

          {broadcastSuccess && (
            <div className="mb-4 rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-600">
              Broadcast sent successfully to all users!
            </div>
          )}

          <form onSubmit={handleBroadcast} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Announcement Title</label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Platform update, Festival greetings"
                className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Message Content</label>
              <textarea
                required
                rows={3}
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="Type your official broadcast message..."
                className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="text-right">
              <button
                type="submit"
                disabled={broadcasting}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {broadcasting ? 'Broadcasting...' : 'Publish Announcement'}
              </button>
            </div>
          </form>
        </section>

        {/* Post Moderation */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-navy">Recent Posts Moderation</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between rounded-2xl border border-border p-3">
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-xs font-bold text-navy">{post.userName || 'Member'}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{post.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeletePost(post.id)}
                  className="rounded-xl bg-destructive/10 p-2 text-destructive hover:bg-destructive/20"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Business Moderation */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-navy">Business Verification Management</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentBusinesses.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-2xl border border-border p-3">
                <div>
                  <h4 className="text-xs font-bold text-navy">{b.name}</h4>
                  <p className="text-[11px] text-muted-foreground">{b.category} • {b.area || getUserCommunityLocation(userProfile)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleVerify(b.id, b.isVerified)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    b.isVerified
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {b.isVerified ? '✓ Verified' : 'Mark Verified'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
