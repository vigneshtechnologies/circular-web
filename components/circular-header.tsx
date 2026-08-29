'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Smartphone, Store, Users, Shield, Sparkles } from 'lucide-react'

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.vigneshtechnologies.circular'

export function CircularHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <div className="relative size-10 overflow-hidden rounded-xl shadow-md ring-1 ring-primary/20">
            <Image
              src="/circular-logo.png"
              alt="Circular Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-navy">
              Circular
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Local Social &amp; Business
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Features
          </a>
          <a
            href="#businesses"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            For Businesses
          </a>
          <a
            href="#community"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Community
          </a>
          <a
            href="#safety"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Safety
          </a>
          <Link
            href="/terms"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Terms
          </Link>
        </nav>

        {/* CTA Button */}
        <div className="flex items-center gap-3">
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg md:inline-flex"
          >
            <Smartphone className="size-4" />
            <span>Download App</span>
          </a>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-foreground md:hidden"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Sparkles className="size-4 text-primary" />
              <span>Features</span>
            </a>
            <a
              href="#businesses"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Store className="size-4 text-primary" />
              <span>For Businesses</span>
            </a>
            <a
              href="#community"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Users className="size-4 text-primary" />
              <span>Community</span>
            </a>
            <a
              href="#safety"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Shield className="size-4 text-primary" />
              <span>Safety &amp; Trust</span>
            </a>
            <Link
              href="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Terms of Service
            </Link>

            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-bold text-primary-foreground shadow"
            >
              <Smartphone className="size-4" />
              <span>Download on Google Play</span>
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
