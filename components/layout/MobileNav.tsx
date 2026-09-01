'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ref, onValue, off } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Home, Search, MessageSquare, Bell, User, PlusCircle, Users } from 'lucide-react'

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

  const navTabs = [
    {
      href: '/',
      icon: Home,
      label: 'Home',
      activeColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      href: '/following',
      icon: Users,
      label: 'Following',
      activeColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      isAction: true,
      label: 'Post',
    },
    {
      href: '/search',
      icon: Search,
      label: 'Search',
      activeColor: 'text-sky-600 dark:text-sky-400',
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile',
      activeColor: 'text-violet-600 dark:text-violet-400',
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card/95 pb-safe pt-2 backdrop-blur-md md:hidden shadow-lg">
      {navTabs.map((tab, idx) => {
        if (tab.isAction) {
          return (
            <button
              key="post-action-btn"
              type="button"
              onClick={onOpenPostComposer}
              className="flex flex-col items-center gap-0.5 px-2 py-1 -mt-3"
              aria-label="Create Post"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 shadow-md shadow-purple-500/30 active:scale-95 transition-transform ring-2 ring-card">
                <PlusCircle className="size-5 text-white stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">Post</span>
            </button>
          )
        }

        const isActive = pathname === tab.href
        const Icon = tab.icon!

        return (
          <Link
            key={tab.href}
            href={tab.href!}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold transition-colors ${
              isActive
                ? `${tab.activeColor} font-bold`
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon
                className={`size-5 ${
                  isActive ? `${tab.activeColor} stroke-[2.5]` : 'text-slate-500 dark:text-slate-400 stroke-[1.8]'
                }`}
              />
            </div>
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
