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
  Laptop,
  FilePlus2,
  Building2,
  Info,
} from 'lucide-react'

interface SidebarNavProps {
  onOpenPostComposer?: () => void
}

type ThemePreference = 'light' | 'dark' | 'system'

export function SidebarNav({ onOpenPostComposer }: SidebarNavProps) {
  const pathname = usePathname()
  const { user, userProfile, publicProfiles, isAdmin, logout } = useAuth()
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [themePref, setThemePref] = useState<ThemePreference>('system')

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme') as ThemePreference | null
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemePref(saved)
      } else {
        setThemePref('system')
      }
    } catch {}
  }, [])

  const applyTheme = (pref: ThemePreference) => {
    setThemePref(pref)
    try {
      localStorage.setItem('theme', pref)
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (pref === 'dark' || (pref === 'system' && systemDark)) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch {}
  }

  // Listen for system theme changes if themePref === 'system'
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const current = localStorage.getItem('theme')
      if (!current || current === 'system') {
        if (e.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Firebase unread notifications & conversations
  useEffect(() => {
    if (!user) return

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

  interface NavItem {
    href: string
    label: string
    icon: React.ElementType
    iconColor: string
    bgColor: string
    activeBg: string
    activeText: string
    badge?: number
    external?: boolean
  }

  interface NavGroup {
    title: string
    items: NavItem[]
  }

  // Strictly organized into the 6 requested sections with semantic colors
  const navGroups: NavGroup[] = [
    {
      title: 'Feed & Social',
      items: [
        {
          href: '/',
          label: 'Home Feed',
          icon: Home,
          iconColor: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-500/10 dark:bg-blue-500/15',
          activeBg: 'bg-blue-500/15 dark:bg-blue-500/20',
          activeText: 'text-blue-600 dark:text-blue-400 font-bold',
        },
        {
          href: '/following',
          label: 'Following',
          icon: Users,
          iconColor: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-500/10 dark:bg-purple-500/15',
          activeBg: 'bg-purple-500/15 dark:bg-purple-500/20',
          activeText: 'text-purple-600 dark:text-purple-400 font-bold',
        },
      ],
    },
    {
      title: 'Profile',
      items: [
        {
          href: '/profile',
          label: 'My Profile',
          icon: User,
          iconColor: 'text-teal-600 dark:text-teal-400',
          bgColor: 'bg-teal-500/10 dark:bg-teal-500/15',
          activeBg: 'bg-teal-500/15 dark:bg-teal-500/20',
          activeText: 'text-teal-600 dark:text-teal-400 font-bold',
        },
        {
          href: '/profile?tab=posts',
          label: 'My Posts',
          icon: FilePlus2,
          iconColor: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-500/10 dark:bg-blue-500/15',
          activeBg: 'bg-blue-500/15 dark:bg-blue-500/20',
          activeText: 'text-blue-600 dark:text-blue-400 font-bold',
        },
        {
          href: '/profile?tab=businesses',
          label: 'My Businesses',
          icon: Building2,
          iconColor: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-500/10 dark:bg-purple-500/15',
          activeBg: 'bg-purple-500/15 dark:bg-purple-500/20',
          activeText: 'text-purple-600 dark:text-purple-400 font-bold',
        },
      ],
    },
    {
      title: 'Discover',
      items: [
        {
          href: '/search',
          label: 'Explore & Search',
          icon: Compass,
          iconColor: 'text-teal-600 dark:text-teal-400',
          bgColor: 'bg-teal-500/10 dark:bg-teal-500/15',
          activeBg: 'bg-teal-500/15 dark:bg-teal-500/20',
          activeText: 'text-teal-600 dark:text-teal-400 font-bold',
        },
        {
          href: '/businesses',
          label: 'Local Businesses',
          icon: Store,
          iconColor: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-500/10 dark:bg-orange-500/15',
          activeBg: 'bg-orange-500/15 dark:bg-orange-500/20',
          activeText: 'text-orange-600 dark:text-orange-400 font-bold',
        },
        {
          href: '/jobs',
          label: 'Local Jobs',
          icon: Briefcase,
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
          activeBg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
          activeText: 'text-emerald-600 dark:text-emerald-400 font-bold',
        },
        {
          href: '/needs',
          label: 'Need Board',
          icon: HandHeart,
          iconColor: 'text-pink-600 dark:text-pink-400',
          bgColor: 'bg-pink-500/10 dark:bg-pink-500/15',
          activeBg: 'bg-pink-500/15 dark:bg-pink-500/20',
          activeText: 'text-pink-600 dark:text-pink-400 font-bold',
        },
        {
          href: '/events',
          label: 'Community Events',
          icon: Calendar,
          iconColor: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-500/10 dark:bg-orange-500/15',
          activeBg: 'bg-orange-500/15 dark:bg-orange-500/20',
          activeText: 'text-orange-600 dark:text-orange-400 font-bold',
        },
      ],
    },
    {
      title: 'Communication',
      items: [
        {
          href: '/messages',
          label: 'Messages',
          icon: MessageSquare,
          iconColor: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-500/10 dark:bg-purple-500/15',
          activeBg: 'bg-purple-500/15 dark:bg-purple-500/20',
          activeText: 'text-purple-600 dark:text-purple-400 font-bold',
          badge: unreadMessages > 0 ? unreadMessages : undefined,
        },
        {
          href: '/notifications',
          label: 'Notifications',
          icon: Bell,
          iconColor: 'text-pink-600 dark:text-pink-400',
          bgColor: 'bg-pink-500/10 dark:bg-pink-500/15',
          activeBg: 'bg-pink-500/15 dark:bg-pink-500/20',
          activeText: 'text-pink-600 dark:text-pink-400 font-bold',
          badge: unreadNotifications > 0 ? unreadNotifications : undefined,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          href: '/settings',
          label: 'Settings',
          icon: Settings,
          iconColor: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-500/10 dark:bg-amber-500/15',
          activeBg: 'bg-amber-500/15 dark:bg-amber-500/20',
          activeText: 'text-amber-600 dark:text-amber-400 font-bold',
        },
        {
          href: 'https://sites.google.com/view/circular-privacy-policy/home',
          label: 'Privacy & Safety',
          icon: Shield,
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
          activeBg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
          activeText: 'text-emerald-600 dark:text-emerald-400 font-bold',
          external: true,
        },
      ],
    },
    {
      title: 'Information',
      items: [
        {
          href: '/terms',
          label: 'About Circular',
          icon: Info,
          iconColor: 'text-teal-600 dark:text-teal-400',
          bgColor: 'bg-teal-500/10 dark:bg-teal-500/15',
          activeBg: 'bg-teal-500/15 dark:bg-teal-500/20',
          activeText: 'text-teal-600 dark:text-teal-400 font-bold',
        },
      ],
    },
  ]

  const adminNavItems = [
    {
      href: '/admin/messages',
      label: 'Admin Messages',
      icon: MessageSquare,
      iconColor: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-500/10 dark:bg-pink-500/15',
    },
    {
      href: '/admin',
      label: 'Admin Panel & Broadcast',
      icon: Shield,
      iconColor: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500/10 dark:bg-rose-500/15',
    },
  ]

  const avatar = getUserAvatar(userProfile, publicProfiles) || '/circular-logo.png'

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-border bg-card p-3.5 shadow-sm">
      <div className="flex flex-col gap-3 min-h-0 flex-1">
        {/* Brand Header with 100% Crisp High-Contrast Wordmark */}
        <Link href="/" className="flex items-center gap-3 px-2 py-1 group">
          <div className="relative size-10 overflow-hidden rounded-xl bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 p-0.5 shadow-sm shrink-0">
            <div className="relative size-full rounded-[10px] overflow-hidden bg-card">
              <Image
                src="/circular-logo.png"
                alt="Circular Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          <div className="min-w-0">
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Circular
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Local Social &amp; Business
            </span>
          </div>
        </Link>

        {/* Primary Branded Create Post CTA with Signature Brand Gradient */}
        {onOpenPostComposer && (
          <button
            type="button"
            onClick={onOpenPostComposer}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.98] shrink-0"
          >
            <PlusCircle className="size-4" />
            <span>Create Post</span>
          </button>
        )}

        {/* Organized Navigation List with Colourful Semantic Icon System */}
        <nav className="flex-1 overflow-y-auto pr-1 space-y-3.5 no-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-0.5">
              <span className="block px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                {group.title}
              </span>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = !('external' in item && item.external) && pathname === item.href.split('?')[0]
                  const content = (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          isActive
                            ? `${item.bgColor} ${item.iconColor} ring-1 ring-current/25`
                            : `${item.bgColor} ${item.iconColor}`
                        }`}
                      >
                        <item.icon className="size-3.5 stroke-[2.2]" />
                      </div>
                      <span
                        className={`truncate text-xs ${
                          isActive
                            ? item.activeText
                            : 'font-semibold text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  )

                  if ('external' in item && item.external) {
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all hover:bg-muted/70"
                      >
                        {content}
                      </a>
                    )
                  }

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all ${
                        isActive
                          ? `${item.activeBg} border border-current/15`
                          : 'hover:bg-muted/70'
                      }`}
                    >
                      {content}
                      {item.badge && item.badge > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                            isActive ? 'bg-pink-600 text-white' : 'bg-pink-500 text-white'
                          }`}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Admin Section (Visible Only to Admins) */}
          {isAdmin && (
            <div className="pt-2 border-t border-border space-y-1">
              <span className="block px-2.5 text-[10px] font-bold uppercase tracking-wider text-rose-500">
                Administration
              </span>
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-all ${
                      isActive
                        ? 'bg-rose-500/15 border border-rose-500/25 text-rose-600 dark:text-rose-400 font-bold'
                        : 'hover:bg-muted/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${item.bgColor} ${item.iconColor}`}
                      >
                        <item.icon className="size-3.5 stroke-[2.2]" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </nav>
      </div>

      {/* Footer: Dedicated 3-Way Appearance Selector, User Identity & Sign Out */}
      <div className="border-t border-border pt-2.5 space-y-2 shrink-0">
        {/* Dedicated 3-Way Appearance Control */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sun className="size-3 text-amber-500" />
              <span>Appearance</span>
            </span>
            <span className="capitalize text-[9px] text-amber-600 dark:text-amber-400 font-bold">{themePref}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-muted/60 p-1 border border-border">
            <button
              type="button"
              onClick={() => applyTheme('light')}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-bold transition-all ${
                themePref === 'light'
                  ? 'bg-card text-amber-600 shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sun className="size-3 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => applyTheme('dark')}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-bold transition-all ${
                themePref === 'dark'
                  ? 'bg-card text-purple-600 dark:text-purple-400 shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Moon className="size-3 text-purple-500" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => applyTheme('system')}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-bold transition-all ${
                themePref === 'system'
                  ? 'bg-card text-blue-600 dark:text-blue-400 shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Laptop className="size-3 text-blue-500" />
              <span>Auto</span>
            </button>
          </div>
        </div>

        {/* Account: User Avatar & Destructive Sign Out */}
        <div className="flex items-center justify-between pt-1">
          <Link href="/profile" className="flex items-center gap-2 min-w-0 group">
            <div className="relative size-8 shrink-0 overflow-hidden rounded-full ring-1.5 ring-purple-500/30">
              <Image src={avatar} alt="User Avatar" fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                {userProfile?.name || 'My Account'}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {userProfile?.username ? `@${userProfile.username}` : user?.email?.split('@')[0]}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            aria-label="Sign Out"
            className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400 transition-colors"
          >
            <LogOut className="size-3.5 stroke-[2.2]" />
          </button>
        </div>
      </div>
    </aside>
  )
}
