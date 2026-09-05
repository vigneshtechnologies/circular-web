'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { getUserCommunityLocation } from '@/lib/locationUtils'
import {
  Settings,
  Shield,
  FileText,
  LogOut,
  ChevronRight,
  Info,
  Sun,
  Moon,
  Laptop,
  Check,
} from 'lucide-react'

type ThemePreference = 'light' | 'dark' | 'system'

export default function SettingsPage() {
  const { user, userProfile, isAdmin, logout, loading } = useAuth()
  const [themePref, setThemePref] = useState<ThemePreference>('system')

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <AuthPortal />
  }

  return (
    <AppShell currentArea={getUserCommunityLocation(userProfile)}>
      {/* Header with Amber Theme Identity */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3.5 md:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Settings className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white">Settings</h1>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Account preferences, appearance &amp; application info
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-6">
        {/* Appearance Mode Section (Amber, Purple, Blue identity) */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="size-4 text-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Appearance
              </h2>
            </div>
            <span className="capitalize text-xs font-bold text-purple-600 dark:text-purple-400">
              {themePref} Mode
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {/* Light Card */}
            <button
              type="button"
              onClick={() => applyTheme('light')}
              className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition-all ${
                themePref === 'light'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-sm ring-2 ring-amber-500/20 font-bold'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/70'
              }`}
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 mb-1.5">
                <Sun className="size-5" />
              </div>
              <span className="text-xs">Light</span>
              {themePref === 'light' && <Check className="size-3 text-amber-600 mt-1" />}
            </button>

            {/* Dark Card */}
            <button
              type="button"
              onClick={() => applyTheme('dark')}
              className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition-all ${
                themePref === 'dark'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-400 shadow-sm ring-2 ring-purple-500/20 font-bold'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/70'
              }`}
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-500 mb-1.5">
                <Moon className="size-5" />
              </div>
              <span className="text-xs">Dark</span>
              {themePref === 'dark' && <Check className="size-3 text-purple-600 mt-1" />}
            </button>

            {/* System Card */}
            <button
              type="button"
              onClick={() => applyTheme('system')}
              className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition-all ${
                themePref === 'system'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-sm ring-2 ring-blue-500/20 font-bold'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/70'
              }`}
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 mb-1.5">
                <Laptop className="size-5" />
              </div>
              <span className="text-xs">System</span>
              {themePref === 'system' && <Check className="size-3 text-blue-600 mt-1" />}
            </button>
          </div>
        </section>

        {/* Account Info (Teal Accent) */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account</h2>
          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{userProfile?.name || 'Member'}</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Link
              href="/profile"
              className="rounded-xl bg-teal-500/10 px-3.5 py-1.5 font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 transition-colors"
            >
              View Profile
            </Link>
          </div>
        </section>

        {/* Admin Link if authorized (Purple Identity) */}
        {isAdmin && (
          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-3">Administration</h2>
            <Link
              href="/admin"
              className="flex items-center justify-between rounded-2xl bg-purple-500/10 p-3.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-500/15 border border-purple-500/20 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="size-4 text-purple-600 dark:text-purple-400" />
                <span>Admin Dashboard &amp; Broadcasts</span>
              </div>
              <ChevronRight className="size-4 text-purple-600" />
            </Link>
          </section>
        )}

        {/* Legal & Policies (Green/Emerald Identity) */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="size-4 text-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Legal &amp; Policy</h2>
          </div>
          <Link
            href="/terms"
            className="flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Terms of Service</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>

          <a
            href="https://sites.google.com/view/circular-privacy-policy/home"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Privacy Policy</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </a>

          <a
            href="https://sites.google.com/view/circular-privacy-policy/community-guidelines"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Info className="size-4 text-teal-600 dark:text-teal-400" />
              <span>Community Guidelines</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </a>
        </section>

        {/* App Version Info */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <Info className="size-4 text-teal-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About Circular</h2>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Web Platform Version</span>
            <span className="font-bold text-foreground">2.0.0 (Colourful Edition)</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Android App Version</span>
            <span className="font-bold text-foreground">1.0.20 (20)</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Publisher</span>
            <span className="font-bold text-foreground">Vignesh Technologies</span>
          </div>
        </section>

        {/* Logout (Red Destructive Style) */}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-3 text-xs font-bold text-rose-600 hover:bg-rose-500/20 dark:text-rose-400 transition-colors"
        >
          <LogOut className="size-4 stroke-[2.2]" />
          <span>Sign Out</span>
        </button>
      </div>
    </AppShell>
  )
}
