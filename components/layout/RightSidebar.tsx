'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ref, get, query, limitToLast } from 'firebase/database'
import { db } from '@/lib/firebase'
import { BusinessProfile, NeedPost } from '@/lib/types'
import { getBusinessPhoto } from '@/lib/imageUtils'
import { Store, HandHeart, MapPin, Star, Smartphone, CheckCircle2, ChevronRight } from 'lucide-react'

export function RightSidebar({
  currentArea,
  onSelectArea,
}: {
  currentArea?: string
  onSelectArea?: (area: string) => void
}) {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([])
  const [needs, setNeeds] = useState<NeedPost[]>([])
  const [photosRecord, setPhotosRecord] = useState<Record<string, any>>({})

  const displayArea = currentArea?.trim() || 'Your Community'

  useEffect(() => {
    const loadSidebarData = async () => {
      try {
        const [bSnap, nSnap, pSnap] = await Promise.all([
          get(query(ref(db, 'businessProfiles'), limitToLast(6))),
          get(query(ref(db, 'needPosts'), limitToLast(3))),
          get(query(ref(db, 'businessPhotos'), limitToLast(10))),
        ])

        if (pSnap.exists()) {
          setPhotosRecord(pSnap.val())
        }

        if (bSnap.exists()) {
          const list: BusinessProfile[] = []
          bSnap.forEach((child) => {
            list.push({ id: child.key as string, ...child.val() })
          })
          setBusinesses(list.reverse().slice(0, 4))
        }

        if (nSnap.exists()) {
          const list: NeedPost[] = []
          nSnap.forEach((child) => {
            list.push({ id: child.key as string, ...child.val() })
          })
          setNeeds(list.reverse())
        }
      } catch (e) {
        console.error('Sidebar fetch error:', e)
      }
    }

    loadSidebarData()
  }, [])

  return (
    <aside className="sticky top-0 hidden h-screen w-80 flex-col gap-4 overflow-y-auto border-l border-border bg-card p-4 xl:flex">
      {/* Current Community Area Card */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
              <MapPin className="size-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Your Community
              </span>
              <div className="text-sm font-black text-navy">{displayArea}</div>
            </div>
          </div>

          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
            Active
          </span>
        </div>
      </div>

      {/* Nearby Businesses Widget */}
      <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-purple-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
              Local Businesses
            </h3>
          </div>
          <Link
            href="/businesses"
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {businesses.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Loading local businesses...</p>
          ) : (
            businesses.map((b) => {
              const photo = getBusinessPhoto(b, photosRecord) || '/circular-logo.png'
              const hasRating = typeof b.rating === 'number' && b.rating > 0
              const isRecent = b.createdAt && Date.now() - b.createdAt < 14 * 24 * 60 * 60 * 1000

              return (
                <Link
                  key={b.id}
                  href={`/business/${b.id}`}
                  className="group flex items-center justify-between rounded-xl p-1.5 transition-colors hover:bg-muted/70"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-purple-500/10 ring-1 ring-border">
                      <Image
                        src={photo}
                        alt={b.name || 'Business'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="truncate text-xs font-bold text-navy group-hover:text-primary">
                          {b.name}
                        </span>
                        {b.isVerified && (
                          <CheckCircle2 className="size-3 shrink-0 text-emerald-500 fill-emerald-500/20" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="truncate">{b.category || 'Local Shop'}</span>
                        {hasRating ? (
                          <>
                            <span>•</span>
                            <span className="flex items-center text-amber-500 font-semibold shrink-0">
                              ★ {b.rating!.toFixed(1)}
                            </span>
                          </>
                        ) : isRecent ? (
                          <>
                            <span>•</span>
                            <span className="text-[10px] font-bold text-emerald-600 shrink-0">New</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary shrink-0 ml-1" />
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* Community Needs Widget */}
      <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <HandHeart className="size-4 text-pink-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
              Active Needs
            </h3>
          </div>
          <Link
            href="/needs"
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="mt-3 flex flex-col gap-2.5">
          {needs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No open requests right now.</p>
          ) : (
            needs.map((n) => (
              <Link
                key={n.id}
                href={`/need/${n.id}`}
                className="group rounded-xl border border-border/60 bg-card p-2.5 transition-colors hover:border-primary/40 hover:bg-muted"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-muted-foreground">{n.userName || 'Neighbor'}</span>
                  <span className="rounded-full bg-pink-500/10 px-2 py-0.5 font-bold text-pink-600">
                    {n.urgency || 'Open'}
                  </span>
                </div>
                <h4 className="mt-1 text-xs font-bold text-navy group-hover:text-primary line-clamp-1">
                  {n.title}
                </h4>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {n.description}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Download Android App Promo */}
      <div className="rounded-2xl border border-navy/20 bg-navy p-4 text-white shadow-md">
        <div className="flex items-center gap-2">
          <Smartphone className="size-5 text-primary" />
          <span className="text-xs font-black uppercase tracking-wider">Circular Android</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          Get real-time push alerts, camera uploads, and turn-by-turn navigation.
        </p>
        <a
          href="https://play.google.com/store/apps/details?id=com.vigneshtechnologies.circular"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary py-2 text-xs font-bold text-white shadow transition-all hover:bg-primary/90"
        >
          <Smartphone className="size-3.5" />
          <span>Get on Google Play</span>
        </a>
      </div>

      {/* Footer Legal Mini Links */}
      <div className="mt-auto border-t border-border pt-3 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link href="/terms" className="hover:text-primary">
            Terms
          </Link>
          <a
            href="https://sites.google.com/view/circular-privacy-policy/home"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary"
          >
            Privacy
          </a>
          <a
            href="https://sites.google.com/view/circular-privacy-policy/community-guidelines"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary"
          >
            Guidelines
          </a>
          <a
            href="https://sites.google.com/view/circular-privacy-policy/account-deletion"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary"
          >
            Deletion
          </a>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground/70">
          &copy; {new Date().getFullYear()} Circular • Vignesh Technologies
        </p>
      </div>
    </aside>
  )
}
