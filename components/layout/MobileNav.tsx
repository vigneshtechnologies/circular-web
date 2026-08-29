'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ref, onValue, off } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Home, Search, PlusCircle, Bell, User } from 'lucide-react'

interface MobileNavProps {
  onOpenPostComposer?: () => void
}

export function MobileNav({ onOpenPostComposer }: MobileNavProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    if (!user) return
    const notifRef = ref(db, `notifications/${user.uid}`)
    const cb = (snap: any) => {
      if (snap.exists()) {
        const val = snap.val()
        const unread = Object.values(val).filter((n: any) => !(n as any).read).length
        setUnreadNotifications(unread)
      } else {
        setUnreadNotifications(0)
      }
    }
    onValue(notifRef, cb)
    return () => off(notifRef)
  }, [user])

  const tabs = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/notifications', icon: Bell, label: 'Alerts', badge: unreadNotifications },
    { href: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card/95 pb-safe pt-2 backdrop-blur-md md:hidden">
      {tabs.slice(0, 2).map((tab) => {
        const isActive = pathname === tab.href
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon className={`size-5 ${isActive ? 'text-primary' : ''}`} />
            <span>{tab.label}</span>
          </Link>
        )
      })}

      {/* Center Post Button */}
      <button
        type="button"
        onClick={onOpenPostComposer}
        className="flex flex-col items-center gap-0.5 px-4 py-1"
      >
        <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 shadow-lg shadow-primary/30">
          <PlusCircle className="size-5 text-white" />
        </div>
        <span className="text-[10px] font-semibold text-primary">Post</span>
      </button>

      {/* Notifications + Profile */}
      {tabs.slice(2).map((tab) => {
        const isActive = pathname === tab.href
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div className="relative">
              <Icon className={`size-5 ${isActive ? 'text-primary' : ''}`} />
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
