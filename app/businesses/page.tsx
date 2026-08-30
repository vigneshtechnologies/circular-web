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
import { Store, MapPin, Star, CheckCircle2, Search } from 'lucide-react'

export default function BusinessesPage() {
  const { user, userProfile, publicProfiles, loading } = useAuth()
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([])
  const [photosRecord, setPhotosRecord] = useState<Record<string, any>>({})
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [dataLoading, setDataLoading] = useState(true)

  const categories = [
    'All',
    'Food & Dining',
    'Retail & Shopping',
    'Health & Wellness',
    'Services & Repairs',
    'Education & Classes',
    'Automotive',
    'Real Estate',
    'IT & Tech',
  ]

  useEffect(() => {
    if (!user) return

    const loadBusinesses = async () => {
      setDataLoading(true)
      try {
        const [bSnap, pSnap] = await Promise.all([
          get(query(ref(db, 'businessProfiles'), limitToLast(60))),
          get(query(ref(db, 'businessPhotos'), limitToLast(30))),
        ])

        if (pSnap.exists()) {
          setPhotosRecord(pSnap.val())
        }

        if (bSnap.exists()) {
          const list: BusinessProfile[] = []
          bSnap.forEach((c) => {
            const val = c.val()
            list.push({
              id: c.key as string,
              name: val.businessName || val.name || 'Local Business',
              category: val.category || val.businessCategory || 'Local Shop',
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

  const filtered = businesses.filter((b) => {
    const matchesCat = selectedCategory === 'All' || b.category?.toLowerCase() === selectedCategory.toLowerCase()
    const matchesQ =
      !searchQuery.trim() ||
      b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesQ
  })

  return (
    <AppShell currentArea={userProfile?.area || userProfile?.city || ''}>
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
                Discover verified shops, services &amp; local businesses
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search businesses, shops, services..."
            className="w-full rounded-xl border border-border bg-muted/60 py-2 pl-10 pr-4 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
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
              Try selecting a different category or clearing your search.
            </p>
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
                        {b.ratingCount && b.ratingCount > 0 && (
                          <span className="text-[10px] font-normal text-muted-foreground">
                            ({b.ratingCount})
                          </span>
                        )}
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
