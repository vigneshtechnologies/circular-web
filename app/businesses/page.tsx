'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { ref, get, query, limitToLast } from 'firebase/database'
import { db } from '@/lib/firebase'
import { BusinessProfile } from '@/lib/types'
import { getBusinessPhoto } from '@/lib/imageUtils'
import { getUserCommunityLocation } from '@/lib/locationUtils'
import { Store, MapPin, Star, CheckCircle2, Search, X } from 'lucide-react'

// Exact categories matching Android CreateBusinessProfileScreen.tsx
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

export default function BusinessesPage() {
  const { user, userProfile, publicProfiles, loading } = useAuth()
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([])
  const [photosRecord, setPhotosRecord] = useState<Record<string, any>>({})
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadBusinesses = async () => {
      setDataLoading(true)
      try {
        const [bSnap, pSnap] = await Promise.all([
          get(query(ref(db, 'businessProfiles'), limitToLast(100))),
          get(query(ref(db, 'businessPhotos'), limitToLast(50))),
        ])

        if (pSnap.exists()) {
          setPhotosRecord(pSnap.val() || {})
        }

        if (bSnap.exists()) {
          const list: BusinessProfile[] = []
          bSnap.forEach((c) => {
            const val = c.val()
            list.push({
              id: c.key as string,
              name: val.businessName || val.name || 'Local Business',
              businessName: val.businessName || val.name || 'Local Business',
              category: val.category || val.businessCategory || 'General',
              area: val.area || val.city || val.areaName || '',
              ...val,
            })
          })
          setBusinesses(list.reverse())
        }
      } catch (e) {
        console.error('Error fetching businesses:', e)
      } finally {
        setDataLoading(false)
      }
    }

    loadBusinesses()
  }, [user])

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

  const q = searchQuery.toLowerCase().trim()
  const selCat = selectedCategory.toLowerCase().trim()

  const filtered = businesses.filter((b) => {
    const bCat = (b.category || (b as any).businessCategory || '').toLowerCase().trim()
    const matchesCat =
      selCat === 'all' ||
      bCat === selCat ||
      bCat.includes(selCat) ||
      (selCat === 'food' && bCat.includes('dine')) ||
      (selCat === 'technology' && (bCat.includes('tech') || bCat.includes('it')))

    const bName = (b.name || (b as any).businessName || '').toLowerCase()
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

  return (
    <AppShell currentArea={displayArea}>
      {/* Header */}
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

        {/* Search Input */}
        <div className="mt-3 relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search businesses by name, category, or locality..."
            className="w-full rounded-xl border border-border bg-muted/60 py-2 pl-10 pr-10 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills (Intentional Horizontal Scrolling) */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
          {OFFICIAL_BUSINESS_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase()
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/40'
                    : 'border border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
        {dataLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-2">Loading businesses...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Store className="size-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-navy">No businesses found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedCategory !== 'All'
                ? `No ${selectedCategory} businesses currently registered.`
                : 'Try clearing your search or exploring other categories.'}
            </p>
            {selectedCategory !== 'All' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow"
              >
                <span>View All Businesses</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => {
              const photo =
                getBusinessPhoto(b, photosRecord, publicProfiles) || '/circular-logo.png'
              const hasRating = typeof b.rating === 'number' && b.rating > 0
              const isRecent = b.createdAt && Date.now() - b.createdAt < 14 * 24 * 60 * 60 * 1000
              const bizName = b.name || (b as any).businessName || 'Local Business'
              const bizCategory = b.category || (b as any).businessCategory || 'Local Shop'

              return (
                <Link
                  key={b.id}
                  href={`/business/${b.id}`}
                  className="group flex flex-col justify-between rounded-3xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div>
                    {/* Top: Logo + Verified Badge */}
                    <div className="flex items-start justify-between">
                      <div className="relative size-14 overflow-hidden rounded-2xl bg-primary/10 ring-1 ring-border">
                        <Image
                          src={photo}
                          alt={bizName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {b.isVerified && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                          <CheckCircle2 className="size-3" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <h3 className="mt-3 truncate text-sm font-bold text-navy group-hover:text-primary">
                      {bizName}
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground">{bizCategory}</p>

                    {b.description && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground/80">
                        {b.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Bar */}
                  <div className="mt-4 border-t border-border pt-3 flex items-center justify-between text-xs text-muted-foreground">
                    {hasRating ? (
                      <span className="flex items-center gap-1 font-bold text-amber-500">
                        <Star className="size-3.5 fill-amber-500" />
                        <span>{b.rating!.toFixed(1)}</span>
                      </span>
                    ) : isRecent ? (
                      <span className="text-[11px] font-bold text-emerald-600">New Business</span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Local Business</span>
                    )}

                    {b.area && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <MapPin className="size-3 text-primary" />
                        <span className="truncate max-w-[120px]">{b.area}</span>
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
