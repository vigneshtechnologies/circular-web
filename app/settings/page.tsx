'use client'

import { getUserCommunityLocation } from '@/lib/locationUtils'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { Settings, Shield, FileText, Smartphone, LogOut, ChevronRight, Info } from 'lucide-react'

export default function SettingsPage() {
  const { user, userProfile, isAdmin, logout, loading } = useAuth()

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

  return (
    <AppShell currentArea={getUserCommunityLocation(userProfile)}>
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3.5 md:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white">Settings</h1>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Account preferences, privacy &amp; application info
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-6">
        {/* Account Info */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account</h2>
          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{userProfile?.name || 'Member'}</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Link
              href="/profile"
              className="rounded-xl bg-primary/10 px-3 py-1.5 font-bold text-primary hover:bg-primary/20"
            >
              View Profile
            </Link>
          </div>
        </section>

        {/* Admin Link if authorized */}
        {isAdmin && (
          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Administration</h2>
            <Link
              href="/admin"
              className="flex items-center justify-between rounded-2xl bg-primary/5 p-3.5 text-xs font-bold text-primary hover:bg-primary/10"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="size-4" />
                <span>Admin Dashboard</span>
              </div>
              <ChevronRight className="size-4" />
            </Link>
          </section>
        )}

        {/* Legal & Policies */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Legal &amp; Policy</h2>
          <Link
            href="/terms"
            className="flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="size-4 text-muted-foreground" />
              <span>Terms of Service</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>

          <a
            href="https://sites.google.com/view/circular-privacy-policy/home"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="size-4 text-muted-foreground" />
              <span>Privacy Policy</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </a>

          <a
            href="https://sites.google.com/view/circular-privacy-policy/community-guidelines"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <div className="flex items-center gap-2.5">
              <Info className="size-4 text-muted-foreground" />
              <span>Community Guidelines</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </a>
        </section>

        {/* App Version Info */}
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-2 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">About Circular</h2>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Web Platform Version</span>
            <span className="font-bold text-foreground">2.0.0</span>
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

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 py-3 text-xs font-bold text-destructive hover:bg-destructive/20"
        >
          <LogOut className="size-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </AppShell>
  )
}
