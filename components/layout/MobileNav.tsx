'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ref, onValue, off } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Home, Search, MessageSquare, Bell, User, PlusCircle } from 'lucide-react'

interface MobileNavProps {
  onOpenPostComposer?: () => void
}

export function MobileNav({ onOpenPostComposer }: MobileNavProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (!user) return

    // Notifications Unread
    const notifRef = ref(db, `notifications/${user.uid}`)
    const notifCb = (snap: any) => {
      if (snap.exists()) {
        const val = snap.val()
        const unread = Object.values(val).filter((n: any) => !(n as any).read).length
        setUnreadNotifications(unread)
      } else {
        setUnreadNotifications(0)
      }
    }
    onValue(notifRef, notifCb)

    // Messages Unread
    const convRef = ref(db, `userConversations/${user.uid}`)
    const convCb = (snap: any) => {
      if (snap.exists()) {
        const val = snap.val()
        const unread = Object.values(val).reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0)
        setUnreadMessages(unread)
      } else {
        setUnreadMessages(0)
      }
    }
    onValue(convRef, convCb)

    return () => {
      off(notifRef)
      off(convRef)
    }
  }, [user])

  const leftTabs = [
    { href: '/', icon: Home, label: 'Home' },
    {
      href: '/messages',
      icon: MessageSquare,
      label: 'Chat',
      badge: unreadMessages > 0 ? unreadMessages : undefined,
    },
  ]

  const rightTabs = [
    {
      href: '/notifications',
      icon: Bell,
      label: 'Alerts',
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    { href: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card/95 pb-safe pt-2 backdrop-blur-md md:hidden">
      {/* Left Tabs (Home, Chat) */}
      {leftTabs.map((tab) => {
        const isActive = pathname === tab.href
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold transition-colors ${
              isActive ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <div className="relative">
              <Icon
                className={`size-5 ${
                  isActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500 stroke-[2]'
                }`}
              />
              {tab.badge != null && tab.badge > 0 && (
                <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </Link>
        )
      })}

      {/* Center Post Button */}
      <button
        type="button"
        onClick={onOpenPostComposer}
        className="flex flex-col items-center gap-0.5 px-3 py-1"
        aria-label="Create Post"
      >
        <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 shadow-lg shadow-blue-500/30 active:scale-95 transition-transform">
          <PlusCircle className="size-5 text-white" />
        </div>
        <span className="text-[10px] font-semibold text-blue-600">Post</span>
      </button>

      {/* Right Tabs (Alerts, Profile) */}
      {rightTabs.map((tab) => {
        const isActive = pathname === tab.href
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold transition-colors ${
              isActive ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <div className="relative">
              <Icon
                className={`size-5 ${
                  isActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500 stroke-[2]'
                }`}
              />
              {tab.badge != null && tab.badge > 0 && (
                <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
