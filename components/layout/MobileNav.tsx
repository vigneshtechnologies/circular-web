'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MapPin, Users, PlusCircle, Search, MessageSquare, User } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/context/AuthContext'
import { useActiveActor } from '@/lib/profileService'
import { ref, onValue, off } from 'firebase/database'
import { db } from '@/lib/firebase'

interface MobileNavProps {
  onOpenPostComposer?: () => void
}

export function MobileNav({ onOpenPostComposer }: MobileNavProps) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { actorId } = useActiveActor()
  const effectiveId = actorId || user?.uid
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (!effectiveId) {
      setUnreadMessages(0)
      return
    }

    const convRef = ref(db, `userConversations/${effectiveId}`)
    const callback = (snap: any) => {
      if (snap.exists()) {
        const val = snap.val()
        const unread = Object.values(val).reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0)
        setUnreadMessages(unread)
      } else {
        setUnreadMessages(0)
      }
    }

    onValue(convRef, callback)
    return () => off(convRef)
  }, [effectiveId])

  const navTabs = [
    {
      href: '/',
      icon: Home,
      label: t.navHome,
      activeColor: 'text-blue-600 dark:text-blue-400',
      activeBg: 'bg-blue-500/15 dark:bg-blue-500/20',
      dotColor: 'bg-blue-600 dark:bg-blue-400',
    },
    {
      href: '/nearby',
      icon: MapPin,
      label: t.navNearby,
      activeColor: 'text-orange-600 dark:text-orange-400',
      activeBg: 'bg-orange-500/15 dark:bg-orange-500/20',
      dotColor: 'bg-orange-600 dark:bg-orange-400',
    },
    {
      href: '/following',
      icon: Users,
      label: t.navFollowing || 'Following',
      activeColor: 'text-purple-600 dark:text-purple-400',
      activeBg: 'bg-purple-500/15 dark:bg-purple-500/20',
      dotColor: 'bg-purple-600 dark:bg-purple-400',
    },
    {
      isAction: true,
      label: t.navCreate,
    },
    {
      href: '/search',
      icon: Search,
      label: t.navSearch || 'Search',
      activeColor: 'text-pink-600 dark:text-pink-400',
      activeBg: 'bg-pink-500/15 dark:bg-pink-500/20',
      dotColor: 'bg-pink-600 dark:bg-pink-400',
    },
    {
      href: '/messages',
      icon: MessageSquare,
      label: t.navMessages || 'Messages',
      activeColor: 'text-indigo-600 dark:text-indigo-400',
      activeBg: 'bg-indigo-500/15 dark:bg-indigo-500/20',
      dotColor: 'bg-indigo-600 dark:bg-indigo-400',
      badge: unreadMessages > 0 ? unreadMessages : undefined,
    },
    {
      href: '/profile',
      icon: User,
      label: t.navProfile,
      activeColor: 'text-rose-600 dark:text-rose-400',
      activeBg: 'bg-rose-500/15 dark:bg-rose-500/20',
      dotColor: 'bg-rose-600 dark:bg-rose-400',
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card/95 pb-safe pt-1 backdrop-blur-md md:hidden shadow-md px-1">
      {navTabs.map((tab) => {
        if (tab.isAction) {
          return (
            <button
              key="post-action-btn"
              type="button"
              onClick={onOpenPostComposer}
              className="flex flex-col items-center gap-0.5 px-1 py-0 -mt-2 group min-w-0"
              aria-label="Create Post"
            >
              <div className="flex size-8.5 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-500 shadow-sm shadow-pink-500/30 active:scale-95 group-hover:shadow transition-transform ring-2 ring-card">
                <PlusCircle className="size-4 text-white stroke-[2.5]" />
              </div>
              <span className="text-[8px] font-bold text-pink-600 dark:text-pink-400">Post</span>
            </button>
          )
        }

        const isActive = pathname === tab.href
        const Icon = tab.icon!

        return (
          <Link
            key={tab.href}
            href={tab.href!}
            className="relative flex flex-1 flex-col items-center gap-0 py-0.5 text-[8.5px] font-semibold transition-colors min-w-0"
          >
            <div
              className={`relative flex size-7 items-center justify-center rounded-lg transition-all ${
                isActive
                  ? `${tab.activeBg} ${tab.activeColor} shadow-xs`
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon
                className={`size-3.5 transition-transform ${
                  isActive ? `${tab.activeColor} stroke-[2.4] scale-105` : 'text-slate-400 dark:text-slate-500 stroke-[1.8]'
                }`}
              />
              {Boolean(tab.badge) && (
                <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-600 px-0.5 text-[8px] font-bold text-white shadow-xs ring-1 ring-card animate-in zoom-in-75">
                  {tab.badge! > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <span
              className={`truncate text-[8.5px] max-w-full px-0.5 ${
                isActive ? `${tab.activeColor} font-bold` : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {tab.label}
            </span>
            {isActive && (
              <span className={`size-1 rounded-full ${tab.dotColor} -mt-0.5`} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
