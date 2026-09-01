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
  Sun,
  Moon,
} from 'lucide-react'

interface SidebarNavProps {
  onOpenPostComposer?: () => void
}

export function SidebarNav({ onOpenPostComposer }: SidebarNavProps) {
  const pathname = usePathname()
  const { user, userProfile, publicProfiles, isAdmin, logout } = useAuth()
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    try {
      const isDark = document.documentElement.classList.contains('dark')
      setTheme(isDark ? 'dark' : 'light')
    } catch {}
  }, [])

  const handleSetTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    try {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
    } catch {}
  }

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

  // Core navigation items in preferred upper priority with distinct colourful accents
  const mainNavItems = [
    { href: '/', label: 'Home', icon: Home, color: 'text-blue-600 dark:text-blue-400' },
    { href: '/search', label: 'Search', icon: Compass, color: 'text-sky-600 dark:text-sky-400' },
    { href: '/following', label: 'Following', icon: Users, color: 'text-purple-600 dark:text-purple-400' },
    {
      href: '/messages',
      label: 'Messages',
      icon: MessageSquare,
      color: 'text-pink-600 dark:text-pink-400',
      badge: unreadMessages > 0 ? unreadMessages : undefined,
    },
    { href: '/businesses', label: 'Businesses', icon: Store, color: 'text-indigo-600 dark:text-indigo-400' },
    { href: '/jobs', label: 'Local Jobs', icon: Briefcase, color: 'text-emerald-600 dark:text-emerald-400' },
    { href: '/needs', label: 'Need Board', icon: HandHeart, color: 'text-amber-600 dark:text-amber-400' },
    { href: '/events', label: 'Events', icon: Calendar, color: 'text-orange-600 dark:text-orange-400' },
    {
      href: '/notifications',
      label: 'Notifications',
      icon: Bell,
      color: 'text-amber-500 dark:text-amber-400',
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    { href: '/profile', label: 'Profile', icon: User, color: 'text-violet-600 dark:text-violet-400' },
    { href: '/settings', label: 'Settings', icon: Settings, color: 'text-slate-600 dark:text-slate-400' },
  ]

  const adminNavItems = [
    {
      href: '/admin/messages',
      label: 'Admin Messages',
      icon: MessageSquare,
      color: 'text-pink-600',
    },
    { href: '/admin', label: 'Admin Panel & Broadcast', icon: Shield, color: 'text-indigo-600' },
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
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Circular</span>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                    ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`size-5 shrink-0 ${
                      isActive ? 'text-white stroke-[2.5]' : `${item.color} stroke-[2]`
                    }`}
                  />
                  <span className={isActive ? 'font-bold text-white' : 'text-slate-800 dark:text-slate-200'}>
                    {item.label}
                  </span>
                </div>

                {item.badge && item.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-black ${
                      isActive ? 'bg-white text-purple-600' : 'bg-rose-500 text-white'
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
                        ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon
                        className={`size-4 shrink-0 ${
                          isActive ? 'text-white stroke-[2.5]' : `${item.color} stroke-[2]`
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

      {/* Theme Toggle & User Footer Profile */}
      <div className="border-t border-border pt-2 space-y-2">
        {/* Compact Segmented Theme Toggle */}
        <div className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-border">
          <button
            type="button"
            onClick={() => handleSetTheme('light')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
              theme === 'light'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Switch to Light Mode"
          >
            <Sun className={`size-3.5 ${theme === 'light' ? 'text-amber-500 fill-amber-500/20' : 'text-slate-400'}`} />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetTheme('dark')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Switch to Dark Mode"
          >
            <Moon className={`size-3.5 ${theme === 'dark' ? 'text-blue-400 fill-blue-400/20' : 'text-slate-400'}`} />
            <span>Dark</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center justify-between rounded-2xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
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
              <div className="truncate text-xs font-bold text-slate-900 dark:text-white" title={userProfile?.name || 'Circular User'}>
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
