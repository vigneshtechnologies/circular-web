'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ref, onValue, off } from 'firebase/database'
import { db } from '@/lib/firebase'
import { getUserAvatar } from '@/lib/imageUtils'
import {
  Home,
  Compass,
  Users,
  MessageSquare,
  Store,
  Briefcase,
  HandHeart,
  Calendar,
  Bell,
  User,
  Shield,
  LogOut,
  PlusCircle,
  Settings,
} from 'lucide-react'

interface SidebarNavProps {
  onOpenPostComposer?: () => void
}

export function SidebarNav({ onOpenPostComposer }: SidebarNavProps) {
  const pathname = usePathname()
  const { user, userProfile, publicProfiles, isAdmin, logout } = useAuth()
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (!user) return

    // 1. Notifications Unread
    const notifRef = ref(db, `notifications/${user.uid}`)
    const notifCallback = (snap: any) => {
      if (snap.exists()) {
        const val = snap.val()
        const unread = Object.values(val).filter((n: any) => !n.read).length
        setUnreadNotifications(unread)
      } else {
        setUnreadNotifications(0)
      }
    }
    onValue(notifRef, notifCallback)

    // 2. User Conversations Unread
    const convRef = ref(db, `userConversations/${user.uid}`)
    const convCallback = (snap: any) => {
      if (snap.exists()) {
        const val = snap.val()
        const unread = Object.values(val).reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0)
        setUnreadMessages(unread)
      } else {
        setUnreadMessages(0)
      }
    }
    onValue(convRef, convCallback)

    return () => {
      off(notifRef)
      off(convRef)
    }
  }, [user])

  // Core navigation items in preferred upper priority
  const mainNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Compass },
    { href: '/following', label: 'Following', icon: Users },
    {
      href: '/messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessages > 0 ? unreadMessages : undefined,
    },
    { href: '/businesses', label: 'Businesses', icon: Store },
    { href: '/jobs', label: 'Local Jobs', icon: Briefcase },
    { href: '/needs', label: 'Need Board', icon: HandHeart },
    { href: '/events', label: 'Events', icon: Calendar },
    {
      href: '/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  const adminNavItems = [
    {
      href: '/admin/messages',
      label: 'Admin Messages',
      icon: MessageSquare,
    },
    { href: '/admin', label: 'Admin Panel & Broadcast', icon: Shield },
  ]

  const avatar = getUserAvatar(userProfile, publicProfiles) || '/circular-logo.png'

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-border bg-card p-4">
      <div className="flex flex-col gap-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-2">
          <div className="relative size-10 overflow-hidden rounded-xl bg-primary/10 shadow-sm ring-1 ring-primary/20">
            <Image
              src="/circular-logo.png"
              alt="Circular Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-navy">Circular</span>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Local Social &amp; Business
            </span>
          </div>
        </Link>

        {/* Primary Post CTA */}
        {onOpenPostComposer && (
          <button
            type="button"
            onClick={onOpenPostComposer}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition-all hover:opacity-95 active:scale-[0.98]"
          >
            <PlusCircle className="size-5" />
            <span>Create Post</span>
          </button>
        )}

        {/* Navigation List with Guaranteed Visible Icons */}
        <nav className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 no-scrollbar">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`size-5 shrink-0 ${
                      isActive ? 'text-white stroke-[2.5]' : 'text-blue-600 stroke-[2]'
                    }`}
                  />
                  <span className={isActive ? 'font-bold text-white' : 'text-slate-800'}>
                    {item.label}
                  </span>
                </div>

                {item.badge && item.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-black ${
                      isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Admin Section (Visible Only to Admins) */}
          {isAdmin && (
            <div className="mt-4 pt-3 border-t border-border/80 space-y-1">
              <span className="block px-3.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Administration
              </span>
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon
                        className={`size-4 shrink-0 ${
                          isActive ? 'text-white stroke-[2.5]' : 'text-primary stroke-[2]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between rounded-2xl p-2 hover:bg-slate-100 transition-colors">
          <Link href="/profile" className="flex items-center gap-2.5 flex-1 min-w-0 mr-1">
            <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-primary/20">
              <Image
                src={avatar}
                alt="Profile Avatar"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="truncate text-xs font-bold text-navy" title={userProfile?.name || 'Circular User'}>
                {userProfile?.name || 'Circular User'}
              </div>
              <div className="truncate text-[10px] text-muted-foreground">
                @{userProfile?.username || 'member'}
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={logout}
            title="Logout"
            className="rounded-xl p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
