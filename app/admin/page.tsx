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
import {
  Shield,
  Megaphone,
  Trash2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Users,
  Store,
  FileText,
  PlayCircle,
  MapPin,
  Briefcase,
  FileCheck,
} from 'lucide-react'
import {
  AdminActivityLogEntry,
  getRecentAdminActivity,
  logAdminActivity,
} from '@/lib/adminLogService'

export default function AdminPage() {
  const { user, userProfile, isAdmin, loading } = useAuth()
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    stories: 0,
    locations: 0,
    jobs: 0,
    applications: 0,
    businesses: 0,
    reports: 0,
  })
  const [activityLogs, setActivityLogs] = useState<AdminActivityLogEntry[]>([])
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
        const results = await Promise.allSettled([
          get(query(ref(db, 'posts'), limitToLast(30))),
          get(query(ref(db, 'businessProfiles'), limitToLast(30))),
          get(query(ref(db, 'users'), limitToLast(30))),
          get(query(ref(db, 'reports'), limitToLast(30))),
          get(ref(db, 'statuses')),
          get(ref(db, 'localJobs')),
          get(ref(db, 'jobApplications')),
          getRecentAdminActivity(20),
        ])

        const pSnap = results[0].status === 'fulfilled' ? results[0].value : null
        const bSnap = results[1].status === 'fulfilled' ? results[1].value : null
        const uSnap = results[2].status === 'fulfilled' ? results[2].value : null
        const rSnap = results[3].status === 'fulfilled' ? results[3].value : null
        const sSnap = results[4].status === 'fulfilled' ? results[4].value : null
        const jSnap = results[5].status === 'fulfilled' ? results[5].value : null
        const aSnap = results[6].status === 'fulfilled' ? results[6].value : null
        const logs = results[7].status === 'fulfilled' ? results[7].value : []

        const pList: Post[] = []
        const distinctAreas = new Set<string>()
        if (pSnap && pSnap.exists()) {
          pSnap.forEach((c) => {
            const p = c.val()
            pList.push({ id: c.key as string, ...p })
            const area = p?.area || p?.areaName || p?.city
            if (area && typeof area === 'string' && area.trim().length > 0) {
              distinctAreas.add(area.trim().toLowerCase())
            }
          })
          setRecentPosts(pList.reverse())
        }

        const bList: BusinessProfile[] = []
        if (bSnap && bSnap.exists()) {
          bSnap.forEach((c) => { bList.push({ id: c.key as string, ...c.val() }) })
          setRecentBusinesses(bList.reverse())
        }

        let totalApps = 0
        if (aSnap && aSnap.exists()) {
          const aVal = aSnap.val() || {}
          Object.values(aVal).forEach((sub: any) => {
            if (sub && typeof sub === 'object') {
              totalApps += Object.keys(sub).length
            }
          })
        }

        setStats({
          posts: pSnap && pSnap.exists() ? Object.keys(pSnap.val()).length : 0,
          businesses: bSnap && bSnap.exists() ? Object.keys(bSnap.val()).length : 0,
          users: uSnap && uSnap.exists() ? Object.keys(uSnap.val()).length : 0,
          reports: rSnap && rSnap.exists() ? Object.keys(rSnap.val()).length : 0,
          stories: sSnap && sSnap.exists() ? Object.keys(sSnap.val()).length : 0,
          locations: Math.max(1, distinctAreas.size),
          jobs: jSnap && jSnap.exists() ? Object.keys(jSnap.val()).length : 0,
          applications: totalApps,
        })

        setActivityLogs(logs)
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

      logAdminActivity({
        actorUid: user.uid,
        actorName: userProfile?.name || user.displayName || 'Admin',
        role: 'admin',
        actionType: 'broadcast',
        targetId: bRef.key as string,
        targetType: 'broadcast',
        reason: broadcastTitle.trim(),
      }).then(() => getRecentAdminActivity(20).then(setActivityLogs))
    } catch (e) {
      console.error(e)
    } finally {
      setBroadcasting(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!user || !isAdmin) return
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      await remove(ref(db, `posts/${postId}`))
      setRecentPosts((prev) => prev.filter((p) => p.id !== postId))
      await logAdminActivity({
        actorUid: user.uid,
        actorName: userProfile?.name || user.displayName || 'Admin',
        role: 'admin',
        actionType: 'delete_post',
        targetId: postId,
        targetType: 'post',
        reason: 'Post deleted by administrator',
      })
      const freshLogs = await getRecentAdminActivity(20)
      setActivityLogs(freshLogs)
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleVerify = async (businessId: string, currentStatus: boolean | undefined) => {
    if (!user || !isAdmin) return
    try {
      await update(ref(db, `businessProfiles/${businessId}`), { isVerified: !currentStatus })
      setRecentBusinesses((prev) =>
        prev.map((b) => (b.id === businessId ? { ...b, isVerified: !currentStatus } : b))
      )
      await logAdminActivity({
        actorUid: user.uid,
        actorName: userProfile?.name || user.displayName || 'Admin',
        role: 'admin',
        actionType: 'verify_business',
        targetId: businessId,
        targetType: 'user',
        reason: currentStatus ? 'Verification badge revoked' : 'Verification badge granted',
      })
      const freshLogs = await getRecentAdminActivity(20)
      setActivityLogs(freshLogs)
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
          <h1 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Access Denied</h1>
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
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white">Admin Command Center</h1>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Unified platform management, moderation &amp; analytics
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 space-y-6">
        {/* Metric Cards — 6 Unified Core Entities */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
              <Users className="size-4 text-emerald-500" />
              <span>Users</span>
            </div>
            <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{stats.users}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
              <FileText className="size-4 text-blue-500" />
              <span>Posts</span>
            </div>
            <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{stats.posts}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
              <PlayCircle className="size-4 text-purple-500" />
              <span>Stories</span>
            </div>
            <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{stats.stories}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
              <MapPin className="size-4 text-cyan-500" />
              <span>Locations</span>
            </div>
            <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{stats.locations}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
              <Briefcase className="size-4 text-pink-500" />
              <span>Jobs</span>
            </div>
            <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{stats.jobs}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
              <FileCheck className="size-4 text-amber-500" />
              <span>Applications</span>
            </div>
            <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{stats.applications}</p>
          </div>
        </div>

        {/* Broadcast / Announcement Form */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="size-5 text-primary" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Send Admin Announcement Broadcast</h2>
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
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Posts Moderation</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between rounded-2xl border border-border p-3">
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{post.userName || 'Member'}</p>
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
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Business Verification Management</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentBusinesses.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-2xl border border-border p-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{b.name}</h4>
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

        {/* Admin Activity Log Section */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Admin Activity Log</h2>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground">
              Recent {activityLogs.length} actions
            </span>
          </div>

          {activityLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No administrative activity logged yet.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {activityLogs.map((log, idx) => (
                <div
                  key={log.id || String(idx)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-border/70 bg-muted/20 p-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                      {log.actionType.replace('_', ' ')}
                    </span>
                    <span className="font-semibold text-foreground">
                      {log.targetType.toUpperCase()}: {log.targetId.substring(0, 16)}
                    </span>
                    {log.reason && (
                      <span className="text-muted-foreground text-[11px]">({log.reason})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0">
                    <span>
                      Actor: <strong className="text-foreground">{log.actorName || log.actorUid.substring(0, 6)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
