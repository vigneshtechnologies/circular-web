'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Menu,
  X,
  Smartphone,
  Store,
  Briefcase,
  Calendar,
  HelpCircle,
  FileText,
  MessageSquare,
  Bell,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react'

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.vigneshtechnologies.circular'

export function CircularHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSetTheme = (theme: 'light' | 'dark' | 'system') => {
    try {
      localStorage.setItem('theme', theme)
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (theme === 'dark' || (theme === 'system' && systemDark)) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch {}
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        {/* Brand Logo with 100% Crisp High-Contrast Wordmark */}
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-95 group">
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
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Circular
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Local Social &amp; Business
            </span>
          </div>
        </Link>

        {/* Desktop Nav with Semantic Colour Highlights */}
        <nav className="hidden items-center gap-4 lg:gap-6 md:flex">
          <Link
            href="/businesses"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <div className="flex size-6 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Store className="size-3.5" />
            </div>
            <span>Businesses</span>
          </Link>
          <Link
            href="/jobs"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            <div className="flex size-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Briefcase className="size-3.5" />
            </div>
            <span>Jobs</span>
          </Link>
          <Link
            href="/events"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors hover:text-orange-600 dark:hover:text-orange-400"
          >
            <div className="flex size-6 items-center justify-center rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Calendar className="size-3.5" />
            </div>
            <span>Events</span>
          </Link>
          <Link
            href="/needs"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors hover:text-teal-600 dark:hover:text-teal-400"
          >
            <div className="flex size-6 items-center justify-center rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <HelpCircle className="size-3.5" />
            </div>
            <span>Need Board</span>
          </Link>
        </nav>

        {/* Action Controls & Colourful Quick Icons */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Calendar: Orange/Amber */}
          <Link
            href="/events"
            className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 transition-all hover:bg-orange-500/20 hover:scale-105 active:scale-95"
            title="Community Events"
          >
            <Calendar className="size-4 stroke-[2.2]" />
          </Link>

          {/* Messages: Purple/Pink */}
          <Link
            href="/messages"
            className="flex size-9 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 transition-all hover:bg-pink-500/20 hover:scale-105 active:scale-95"
            title="Messages"
          >
            <MessageSquare className="size-4 stroke-[2.2]" />
          </Link>

          {/* Notifications: Amber/Orange */}
          <Link
            href="/notifications"
            className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-all hover:bg-amber-500/20 hover:scale-105 active:scale-95"
            title="Notifications"
          >
            <Bell className="size-4 stroke-[2.2]" />
          </Link>

          {/* App CTA */}
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:opacity-95 hover:shadow active:scale-[0.98] md:inline-flex"
          >
            <Smartphone className="size-3.5" />
            <span>App</span>
          </a>

          {/* Menu Toggle: Purple/Neutral */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-all hover:bg-purple-500/20 md:hidden"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="size-4 stroke-[2.5]" /> : <Menu className="size-4 stroke-[2.5]" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-card px-4 py-4 md:hidden animate-in fade-in slide-in-from-top-2">
          {/* Quick Discover Links */}
          <div className="space-y-1">
            <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Discover
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/businesses"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-purple-500/40"
              >
                <Store className="size-4 text-indigo-600 dark:text-indigo-400" />
                <span>Businesses</span>
              </Link>
              <Link
                href="/jobs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-emerald-500/40"
              >
                <Briefcase className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Local Jobs</span>
              </Link>
              <Link
                href="/events"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-orange-500/40"
              >
                <Calendar className="size-4 text-orange-600 dark:text-orange-400" />
                <span>Events</span>
              </Link>
              <Link
                href="/needs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-teal-500/40"
              >
                <HelpCircle className="size-4 text-teal-600 dark:text-teal-400" />
                <span>Need Board</span>
              </Link>
            </div>
          </div>

          {/* Mobile Appearance Control */}
          <div className="mt-4 pt-3 border-t border-border space-y-1.5">
            <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Appearance
            </span>
            <div className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-border">
              <button
                type="button"
                onClick={() => handleSetTheme('light')}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
              >
                <Sun className="size-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetTheme('dark')}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
              >
                <Moon className="size-3.5 text-blue-400" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetTheme('system')}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
              >
                <Laptop className="size-3.5 text-purple-400" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* App download */}
          <div className="mt-4 pt-3 border-t border-border">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 py-2.5 text-center text-xs font-bold text-white shadow-sm"
            >
              <Smartphone className="size-4" />
              <span>Get Circular on Android</span>
            </a>
          </div>
        </div>
      )}
    </header>
  )
}