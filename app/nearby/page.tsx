'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { PostCard } from '@/components/feed/PostCard'
import { CategoryFilterBar } from '@/components/feed/CategoryFilterBar'
import { RadiusSelector } from '@/components/feed/RadiusSelector'
import { PostCommentsDrawer } from '@/components/feed/PostCommentsDrawer'
import { PostComposerModal } from '@/components/feed/PostComposerModal'
import { StoriesBar } from '@/components/feed/StoriesBar'
import {
  CIRCULAR_RADIUS_OPTIONS,
  CircularRadiusOption,
  DEFAULT_RADIUS_KM,
  getDistanceKm,
  formatDistanceKm,
  isValidCoordinate,
  getUserCommunityLocation,
} from '@/lib/locationUtils'
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Post } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'
import {
  MapPin,
  Sparkles,
  Loader2,
  Navigation,
  Compass,
  Store,
  HandHeart,
  Briefcase,
  AlertCircle,
  Calendar,
  Newspaper,
  ChevronRight,
} from 'lucide-react'

export default function NearbyPage() {
  const { user, userProfile, publicProfiles, loading } = useAuth()
  const { t } = useTranslation()

  const [posts, setPosts] = useState<Post[]>([])
  const [nearbyBusinesses, setNearbyBusinesses] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedRadius, setSelectedRadius] = useState<CircularRadiusOption>(DEFAULT_RADIUS_KM)
  const [manualAreaName, setManualAreaName] = useState('')
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationAvailable, setLocationAvailable] = useState(false)

  const [feedLoading, setFeedLoading] = useState(true)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null)

  // Load radius preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('circular_nearby_radius')
      if (saved) {
        const num = Number(saved) as CircularRadiusOption
        if (CIRCULAR_RADIUS_OPTIONS.includes(num)) {
          setSelectedRadius(num)
        }
      }
    } catch {}
  }, [])

  // Geolocation
  const requestUserLocation = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          })
          setLocationAvailable(true)
        },
        () => {
          setLocationAvailable(false)
        },
        { timeout: 8000, maximumAge: 120000 }
      )
    }
  }, [])

  useEffect(() => {
    requestUserLocation()
  }, [requestUserLocation])

  const handleSelectRadius = (radius: CircularRadiusOption) => {
    setSelectedRadius(radius)
    try {
      localStorage.setItem('circular_nearby_radius', String(radius))
    } catch {}
  }

  // Load posts
  const loadNearbyPosts = useCallback(async () => {
    if (!user) return
    setFeedLoading(true)
    try {
      const postsQuery = query(
        ref(db, 'posts'),
        orderByChild('createdAt'),
        limitToLast(50)
      )

      const snapshot = await get(postsQuery)
      if (snapshot.exists()) {
        const data = snapshot.val()
        const batch: Post[] = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

        setPosts(batch)
      } else {
        setPosts([])
      }
    } catch (err) {
      console.error('Error loading nearby posts:', err)
    } finally {
      setFeedLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadNearbyPosts()
  }, [loadNearbyPosts])

  useEffect(() => {
    const bizRef = ref(db, 'businessProfiles')
    get(bizRef)
      .then((snap) => {
        if (!snap.exists()) {
          setNearbyBusinesses([])
          return
        }
        const data = snap.val()
        const list = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((biz) => {
            if (biz.isRestricted === true || biz.isDeleted === true) return false
            if (manualAreaName.trim()) {
              const bArea = (biz.area || biz.city || biz.areaName || '').toLowerCase()
              return bArea.includes(manualAreaName.toLowerCase().trim())
            }
            if (userCoords && isValidCoordinate(biz.latitude, biz.longitude)) {
              const dist = getDistanceKm(
                userCoords.latitude,
                userCoords.longitude,
                biz.latitude,
                biz.longitude
              )
              biz.distanceKm = dist
              return dist <= selectedRadius
            }
            return true
          })
        setNearbyBusinesses(list.slice(0, 10))
      })
      .catch(() => setNearbyBusinesses([]))
  }, [userCoords, selectedRadius, manualAreaName])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <AuthPortal />
  }

  const displayLocation = getUserCommunityLocation(userProfile)

  // Filter posts by Privacy + Category + Geographic Radius
  const filteredPosts = posts.filter((p) => {
    // 0. Privacy Filter: followers-only or private accounts must never leak into Nearby discovery
    const authorProfile = p.userId ? publicProfiles[p.userId] : null
    const isAuthorPrivate =
      authorProfile?.isPrivate === true ||
      (authorProfile as any)?.accountPrivacy === 'private'
    if ((p.audience === 'followers' || isAuthorPrivate) && p.userId !== user?.uid) {
      return false
    }

    // 1. Category Filter
    const postCat = (p.category || '').toLowerCase().trim()
    const selected = selectedCategory.toLowerCase().trim()

    let matchesCategory = selected === 'all'
    if (!matchesCategory) {
      if (selected === 'general') {
        matchesCategory = !postCat || postCat === 'general'
      } else if (selected === 'news & updates') {
        matchesCategory = postCat === 'news' || postCat === 'news & updates' || postCat === 'local news'
      } else {
        matchesCategory = postCat === selected || postCat.includes(selected)
      }
    }

    if (!matchesCategory) return false

    // If manual locality is entered, filter by area/locality substring (no GPS needed)
    if (manualAreaName.trim().length > 0) {
      const pArea = (p.area || (p as any).areaName || (p as any).city || '').toLowerCase()
      return pArea.includes(manualAreaName.toLowerCase().trim())
    }

    // 2. Geographic Radius Filter
    if (userCoords && isValidCoordinate(p.latitude, p.longitude)) {
      const distance = getDistanceKm(
        userCoords.latitude,
        userCoords.longitude,
        p.latitude!,
        p.longitude!
      )
      return distance <= selectedRadius
    }

    // Fallback: match locality or default radius
    if (selectedRadius === DEFAULT_RADIUS_KM || !userCoords) {
      return true
    }

    return false
  })

  return (
    <AppShell currentArea={displayLocation}>
      {/* Top Header with Locality & Radius Selector */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 via-purple-500/15 to-pink-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Compass className="size-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                {t.nearbyFeed}
              </h1>
              <div className="text-[11px] font-semibold text-muted-foreground truncate flex items-center gap-1">
                <span>{manualAreaName.trim() ? manualAreaName.trim() : displayLocation}</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">• {selectedRadius} km</span>
              </div>
            </div>
          </div>

          {/* Locality Search Input + Radius Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={manualAreaName}
                onChange={(e) => setManualAreaName(e.target.value)}
                placeholder="Search area / locality..."
                className="w-full rounded-xl border border-border bg-card pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              />
              {manualAreaName && (
                <button
                  type="button"
                  onClick={() => setManualAreaName('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <RadiusSelector
              selectedRadius={selectedRadius}
              onSelectRadius={handleSelectRadius}
              hasUserLocation={locationAvailable}
              onRequestLocation={requestUserLocation}
            />
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="mt-2.5">
          <CategoryFilterBar
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
          />
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-2xl px-4 py-4 md:px-6 space-y-3.5">
        {/* Compact Stories / Status Launcher Bar */}
        <StoriesBar />

        {/* Locality Quick Links (Jobs, Events, Needs, Bulletin) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Link
            href="/jobs"
            className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 sm:p-3 hover:bg-emerald-500/20 transition-colors"
          >
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-emerald-500 text-white shrink-0">
              <Briefcase className="size-3.5 sm:size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.navJobs || 'Jobs'}</div>
              <div className="text-[10px] text-muted-foreground truncate">Hiring nearby</div>
            </div>
          </Link>

          <Link
            href="/events"
            className="flex items-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-2.5 sm:p-3 hover:bg-blue-500/20 transition-colors"
          >
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-blue-500 text-white shrink-0">
              <Calendar className="size-3.5 sm:size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.navEvents || 'Events'}</div>
              <div className="text-[10px] text-muted-foreground truncate">Local gatherings</div>
            </div>
          </Link>

          <Link
            href="/needs"
            className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-2.5 sm:p-3 hover:bg-amber-500/20 transition-colors"
          >
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-amber-500 text-white shrink-0">
              <HandHeart className="size-3.5 sm:size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">Needs</div>
              <div className="text-[10px] text-muted-foreground truncate">Help neighbors</div>
            </div>
          </Link>

          <Link
            href="/search?tab=posts"
            className="flex items-center gap-2 rounded-2xl border border-pink-500/30 bg-pink-500/10 p-2.5 sm:p-3 hover:bg-pink-500/20 transition-colors"
          >
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-pink-500 text-white shrink-0">
              <Newspaper className="size-3.5 sm:size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">Bulletin</div>
              <div className="text-[10px] text-muted-foreground truncate">Community notices</div>
            </div>
          </Link>
        </div>

        {/* Nearby Businesses Carousel */}
        {nearbyBusinesses.length > 0 && (
          <div className="space-y-2 rounded-3xl border border-border bg-card p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Store className="size-4 text-purple-600 dark:text-purple-400" />
                <span>Nearby Businesses</span>
                <span className="text-[10px] text-muted-foreground font-semibold">({nearbyBusinesses.length})</span>
              </div>
              <Link
                href="/businesses"
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
              >
                <span>See All</span>
                <ChevronRight className="size-3" />
              </Link>
            </div>

            <div className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {nearbyBusinesses.map((biz) => {
                const logo = biz.logoUrl || biz.imageUrl || biz.photoUrl || '/circular-logo.png'
                return (
                  <Link
                    key={biz.id}
                    href={`/business/${biz.id}`}
                    className="flex w-38 sm:w-44 shrink-0 flex-col rounded-2xl border border-border bg-card/60 p-2.5 shadow-xs hover:border-purple-500/40 hover:shadow-sm transition-all"
                  >
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted/60 mb-2">
                      <Image
                        src={logo}
                        alt={biz.name || biz.businessName || 'Business'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {biz.name || biz.businessName || 'Local Business'}
                    </h4>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {biz.category || 'General Business'}
                    </p>
                    <div className="mt-auto pt-1.5 flex items-center justify-between text-[9px] font-semibold text-purple-600 dark:text-purple-400">
                      <span className="truncate max-w-[70px]">{biz.area || biz.city || 'Local'}</span>
                      {biz.distanceKm != null && (
                        <span>{formatDistanceKm(biz.distanceKm)}</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Location Notice if GPS disabled */}
        {!locationAvailable && (
          <div className="flex items-center justify-between rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-blue-500" />
              <span>Enable GPS location to get precise distance calculation.</span>
            </div>
            <button
              type="button"
              onClick={requestUserLocation}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
            >
              Enable
            </button>
          </div>
        )}

        {/* Posts List */}
        {feedLoading ? (
          <div className="space-y-4 py-8 text-center text-xs text-muted-foreground">
            <Loader2 className="mx-auto size-8 animate-spin text-primary" />
            <p className="mt-2 font-medium">Scanning updates within {selectedRadius} km...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-6" />
            </div>
            <h3 className="mt-3 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              No posts found within {selectedRadius} km
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.noNearbyPosts}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {selectedRadius < 25 && (
                <button
                  type="button"
                  onClick={() => handleSelectRadius(25)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm hover:bg-muted"
                >
                  <Navigation className="size-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Expand to 25 km</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsComposerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:opacity-95"
              >
                <span>{t.navCreate}</span>
              </button>
            </div>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenComments={(pId) => setActiveCommentsPostId(pId)}
            />
          ))
        )}
      </div>

      <PostComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSuccess={loadNearbyPosts}
      />

      <PostCommentsDrawer
        postId={activeCommentsPostId}
        onClose={() => setActiveCommentsPostId(null)}
      />
    </AppShell>
  )
}
