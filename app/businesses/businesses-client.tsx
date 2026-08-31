'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import { OpenInCircularBanner } from '@/components/public/open-in-circular-banner'
import { ref, get } from 'firebase/database'
import { db } from '@/lib/firebase'
import { getBusinessPhoto } from '@/lib/imageUtils'
import { getUserCommunityLocation } from '@/lib/locationUtils'
import { PublicBusinessData } from '@/lib/serverPublicData'
import { Store, MapPin, Star, CheckCircle2, Search, X, Loader2 } from 'lucide-react'

const OFFICIAL_BUSINESS_CATEGORIES = [
  'All',
  'Education',
  'Food',
  'Shopping',
  'Services',
  'Medical',
  'Jobs',
  'Events',
  'Technology',
  'General',
] as const

interface BusinessesClientProps {
  initialBusinesses: PublicBusinessData[]
}

export default function BusinessesClientContainer({ initialBusinesses }: BusinessesClientProps) {
  const { user, userProfile, publicProfiles, loading } = useAuth()
  const [businesses, setBusinesses] = useState<any[]>(initialBusinesses || [])
  const [photosRecord, setPhotosRecord] = useState<Record<string, any>>({})
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const refreshPhotos = async () => {
      try {
        const pSnap = await get(ref(db, 'businessPhotos')).catch(() => null)
        if (isMounted && pSnap && pSnap.exists()) {
          setPhotosRecord(pSnap.val() || {})
        }
      } catch (err) {}
    }

    refreshPhotos()

    return () => {
      isMounted = false
    }
  }, [user])

  // Allow immediate SSR rendering of public catalog without blocking on auth loading

  const q = searchQuery.toLowerCase().trim()
  const selCat = selectedCategory.toLowerCase().trim()

  const filtered = businesses.filter((b) => {
    const bCat = (b.category || b.businessCategory || '').toLowerCase().trim()
    const matchesCat =
      selCat === 'all' ||
      bCat === selCat ||
      bCat.includes(selCat) ||
      (selCat === 'food' && (bCat.includes('dine') || bCat.includes('food') || bCat.includes('hotel') || bCat.includes('restaurant'))) ||
      (selCat === 'technology' && (bCat.includes('tech') || bCat.includes('it') || bCat.includes('software'))) ||
      (selCat === 'shopping' && (bCat.includes('shop') || bCat.includes('wear') || bCat.includes('textile') || bCat.includes('store')))

    const bName = (b.name || b.businessName || '').toLowerCase()
    const bArea = (b.area || '').toLowerCase()
    const bDesc = (b.description || '').toLowerCase()

    const matchesQ =
      !q ||
      bName.includes(q) ||
      bCat.includes(q) ||
      bArea.includes(q) ||
      bDesc.includes(q)

    return matchesCat && matchesQ
  })

  const displayArea = getUserCommunityLocation(userProfile)

  const content = (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-navy">Business Directory</h1>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Discover verified shops, services &amp; local businesses in {displayArea}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by business name, product, or area..."
            className="w-full rounded-2xl border border-border bg-muted/60 py-2 pl-10 pr-10 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {OFFICIAL_BUSINESS_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
        {dataLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-muted-foreground gap-2">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span>Loading verified businesses...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600">
              <Store className="size-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-navy">No businesses found</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No businesses match "${searchQuery}".`
                : 'There are currently no active listings in this section. Download the Circular mobile app to post a business profile, announce updates, or connect with customers in your neighborhood.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((b) => {
              const photo = getBusinessPhoto(b, photosRecord, publicProfiles) || '/circular-logo.png'
              const hasRating = typeof b.rating === 'number' && b.rating > 0
              const isRecent = b.createdAt && Date.now() - b.createdAt < 14 * 24 * 60 * 60 * 1000
              const bizName = b.name || b.businessName || 'Local Business'
              const bizCategory = b.category || b.businessCategory || 'Local Shop'

              return (
                <Link
                  key={b.id}
                  href={`/business/${b.id}`}
                  className="group flex flex-col rounded-3xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-purple-500/10 ring-1 ring-border">
                      <Image
                        src={photo}
                        alt={bizName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h3 className="truncate text-sm font-bold text-navy group-hover:text-primary">
                          {bizName}
                        </h3>
                        {b.isVerified && (
                          <CheckCircle2 className="size-3.5 text-emerald-500 fill-emerald-500/20 shrink-0" />
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{bizCategory}</p>

                      <div className="mt-1 flex items-center gap-2 text-[11px]">
                        {hasRating ? (
                          <span className="flex items-center gap-1 font-bold text-amber-500">
                            <Star className="size-3 fill-amber-500" />
                            <span>{b.rating!.toFixed(1)}</span>
                          </span>
                        ) : isRecent ? (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                            New
                          </span>
                        ) : null}

                        {b.area && (
                          <span className="flex items-center gap-0.5 text-muted-foreground truncate">
                            <MapPin className="size-3 text-primary" />
                            <span className="truncate">{b.area}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {b.description && (
                    <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed border-t border-border/50 pt-2.5">
                      {b.description}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )

  if (user) {
    return <AppShell currentArea={displayArea}>{content}</AppShell>
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <CircularHeader />
      <main className="flex-1">
        {content}
        <div className="mx-auto max-w-2xl px-4 pb-12 md:px-6">
          <OpenInCircularBanner path="/businesses" title="Business Directory" />
        </div>
      </main>
      <CircularFooter />
    </div>
  )
}
