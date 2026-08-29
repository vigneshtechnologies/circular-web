'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { ref, onValue, off, update, remove } from 'firebase/database'
import { db } from '@/lib/firebase'
import { NotificationItem } from '@/lib/types'
import { Bell, Check, Trash2, Heart, MessageSquare, UserPlus, Store, Sparkles } from 'lucide-react'

export default function NotificationsPage() {
  const { user, userProfile, loading } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (!user) return

    const notifRef = ref(db, `notifications/${user.uid}`)
    const cb = (snap: any) => {
      if (snap.exists()) {
        const list: NotificationItem[] = []
        snap.forEach((c: any) => {
          list.push({ id: c.key as string, ...c.val() })
        })
        setNotifications(list.reverse())
      } else {
        setNotifications([])
      }
    }

    onValue(notifRef, cb)
    return () => off(notifRef)
  }, [user])

  const markAsRead = async (notifId: string) => {
    if (!user) return
    try {
      await update(ref(db, `notifications/${user.uid}/${notifId}`), { read: true })
    } catch (e) {
      console.error(e)
    }
  }

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return
    try {
      const updates: Record<string, any> = {}
      notifications.forEach((n) => {
        if (!n.read) {
          updates[`notifications/${user.uid}/${n.id}/read`] = true
        }
      })
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const deleteNotification = async (notifId: string) => {
    if (!user) return
    try {
      await remove(ref(db, `notifications/${user.uid}/${notifId}`))
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

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read
    return true
  })

  return (
    <AppShell currentArea={userProfile?.area || 'Rajapalayam'}>
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3.5 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-navy">Notifications</h1>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Stay updated with your local community activities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllAsRead}
              className="rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-xl px-3 py-1 text-xs font-semibold ${
              filter === 'all' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`rounded-xl px-3 py-1 text-xs font-semibold ${
              filter === 'unread' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            Unread ({notifications.filter((n) => !n.read).length})
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Bell className="size-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-navy">No notifications</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              You're all caught up with your updates!
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const targetUrl =
              n.targetType === 'post' && n.targetId
                ? `/post/${n.targetId}`
                : n.targetType === 'business' && n.targetId
                ? `/business/${n.targetId}`
                : n.targetType === 'chat'
                ? '/messages'
                : n.senderId
                ? `/user/${n.senderId}`
                : '#'

            return (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`flex items-start justify-between gap-3 rounded-2xl border p-4 transition-all ${
                  n.read
                    ? 'border-border bg-card'
                    : 'border-primary/30 bg-primary/5 shadow-sm'
                }`}
              >
                <Link href={targetUrl} className="flex flex-1 items-start gap-3 min-w-0">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border">
                    <Image
                      src={n.senderAvatar || '/circular-logo.png'}
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-navy">{n.title}</h4>
                    <p className="text-xs leading-relaxed text-foreground/80">{n.message}</p>
                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(n.id)
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </AppShell>
  )
}
