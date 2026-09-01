'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import {
  MapPin,
  Sparkles,
  Users,
  Store,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  MessageSquare,
  Compass,
} from 'lucide-react'

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.vigneshtechnologies.circular'

export default function CircularLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      <CircularHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24 border-b border-border">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
                  <Sparkles className="size-3.5" />
                  <span>Circular 2.0 Web &amp; Android</span>
                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl sm:leading-tight">
                  Your Neighborhood.{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Connected &amp; Thriving.
                  </span>
                </h1>

                <p className="text-base text-muted-foreground sm:text-lg leading-relaxed">
                  Discover nearby updates, local businesses, needs, jobs, and community stories within your local area. Available on Android and Web.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link
                    href="/"
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
                  >
                    <span>Launch Circular Web</span>
                    <ArrowRight className="size-4" />
                  </Link>

                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-muted"
                  >
                    <Smartphone className="size-4 text-primary" />
                    <span>Download on Google Play</span>
                  </a>
                </div>
              </div>

              {/* Hero Visual Mockup */}
              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div className="relative rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
                  <div className="flex items-center gap-3 border-b border-border pb-4">
                    <div className="relative size-12 overflow-hidden rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                      <Image
                        src="/circular-logo.png"
                        alt="Circular App"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Circular Local Feed</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-3 text-primary" /> Within 25 km of your location
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="rounded-2xl bg-muted/50 p-3.5 border border-border/60">
                      <span className="font-bold text-primary">📍 Hyperlocal Updates</span>
                      <p className="mt-1 text-muted-foreground">
                        Real-time feeds filtered strictly by radius: 1 km, 3 km, 5 km, 10 km, and 25 km.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-muted/50 p-3.5 border border-border/60">
                      <span className="font-bold text-purple-600">🏪 Local Business Hub</span>
                      <p className="mt-1 text-muted-foreground">
                        Verified profiles, customer reviews, promotional posters, and direct chat.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-muted/50 p-3.5 border border-border/60">
                      <span className="font-bold text-emerald-600">💬 Real-time Messaging</span>
                      <p className="mt-1 text-muted-foreground">
                        Direct 1-on-1 private messaging between residents and local business owners.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Key Capabilities</h2>
              <p className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">Built for Hyperlocal Communities</p>
              <p className="text-sm text-muted-foreground">
                Everything you need to discover, interact, and grow locally.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
                <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Compass className="size-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Radius-Based Filtering</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Filter posts and stories precisely within 1 km, 3 km, 5 km, 10 km, or 25 km from your current GPS position.
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
                <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Store className="size-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Business Directory</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Discover verified neighborhood shops, service providers, galleries, and read genuine reviews from local patrons.
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <MessageSquare className="size-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Direct Chat &amp; Oversight</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Connect instantly with business owners and community members with secure real-time messaging.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-navy py-14 text-white">
          <div className="mx-auto max-w-4xl px-4 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black">Ready to explore Circular?</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Join thousands of neighbors and local businesses on Circular today. Free, verified, and community-first.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="w-full sm:w-auto rounded-2xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow hover:bg-primary/90"
              >
                Open Circular Web App
              </Link>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto rounded-2xl border border-white/20 bg-white/10 px-8 py-3.5 text-sm font-bold text-white hover:bg-white/20"
              >
                Get Android App
              </a>
            </div>
          </div>
        </section>
      </main>

      <CircularFooter />
    </div>
  )
}
