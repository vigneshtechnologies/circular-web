'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { ref, get, query, limitToLast } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Post, BusinessProfile, UserProfile, LocalJob, NeedPost, CommunityEvent } from '@/lib/types'
import { PostCard } from '@/components/feed/PostCard'
import { getUserAvatar, getBusinessPhoto } from '@/lib/imageUtils'
import { getUserCommunityLocation } from '@/lib/locationUtils'
import { Search as SearchIcon, Store, Users, FileText, Briefcase, HandHeart, Calendar, Star, X, Loader2 } from 'lucide-react'

export default function SearchPage() {
  const { user, userProfile, publicProfiles, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<'all' | 'businesses' | 'posts' | 'people' | 'jobs' | 'needs' | 'events'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [people, setPeople] = useState<UserProfile[]>([])
  const [jobs, setJobs] = useState<LocalJob[]>([])
  const [needs, setNeeds] = useState<NeedPost[]>([])
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [photosRecord, setPhotosRecord] = useState<Record<string, any>>({})
  const [isSearching, setIsSearching] = useState(true)

  useEffect(() => {
    if (!user) return

    let isMounted = true

    const loadSearchData = async () => {
      setIsSearching(true)

      // Fetch each collection independently so one failure does not break the others
      try {
        const bSnap = await get(ref(db, 'businessProfiles')).catch(() => null)
        if (isMounted && bSnap && bSnap.exists()) {
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
          setBusinesses(list)
        }
      } catch (err) {}

      try {
        const pSnap = await get(ref(db, 'posts')).catch(() => null)
        if (isMounted && pSnap && pSnap.exists()) {
          const list: Post[] = []
          pSnap.forEach((c) => { list.push({ id: c.key as string, ...c.val() }) })
          setPosts(list.reverse())
        }
      } catch (err) {}

      try {
        const uSnap = await get(ref(db, 'publicProfiles')).catch(() => null)
        if (isMounted && uSnap && uSnap.exists()) {
          const list: UserProfile[] = []
          uSnap.forEach((c) => {
            const val = c.val()
            list.push({
              uid: c.key as string,
              name: val.name || 'Member',
              username: val.username || 'user',
              area: val.area || val.city || val.areaName || '',
              ...val,
            })
          })
          setPeople(list)
        }
      } catch (err) {}

      try {
        const jSnap = await get(ref(db, 'jobs')).catch(() => null)
        if (isMounted && jSnap && jSnap.exists()) {
          const list: LocalJob[] = []
          jSnap.forEach((c) => { list.push({ id: c.key as string, ...c.val() }) })
          setJobs(list.reverse())
        }
      } catch (err) {}

      try {
        const nSnap = await get(ref(db, 'needPosts')).catch(() => null)
        if (isMounted && nSnap && nSnap.exists()) {
          const list: NeedPost[] = []
          nSnap.forEach((c) => { list.push({ id: c.key as string, ...c.val() }) })
          setNeeds(list.reverse())
        }
      } catch (err) {}

      try {
        const eSnap = await get(ref(db, 'events')).catch(() => null)
        if (isMounted && eSnap && eSnap.exists()) {
          const list: CommunityEvent[] = []
          eSnap.forEach((c) => { list.push({ id: c.key as string, ...c.val() }) })
          setEvents(list.reverse())
        }
      } catch (err) {}

      try {
        const bpSnap = await get(ref(db, 'businessPhotos')).catch(() => null)
        if (isMounted && bpSnap && bpSnap.exists()) {
          setPhotosRecord(bpSnap.val() || {})
        }
      } catch (err) {}

      if (isMounted) setIsSearching(false)
    }

    loadSearchData()

    return () => {
      isMounted = false
    }
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

  const q = searchTerm.toLowerCase().trim()

  const filteredBusinesses = businesses.filter((b) => {
    if (!q) return true
    const name = (b.name || (b as any).businessName || '').toLowerCase()
    const cat = (b.category || (b as any).businessCategory || '').toLowerCase()
    const desc = (b.description || '').toLowerCase()
    const area = (b.area || '').toLowerCase()
    const addr = (b.address || '').toLowerCase()
    return name.includes(q) || cat.includes(q) || desc.includes(q) || area.includes(q) || addr.includes(q)
  })

  const filteredPosts = posts.filter((p) => {
    if (!q) return true
    const text = (p.text || '').toLowerCase()
    const author = (p.userName || '').toLowerCase()
    const biz = (p.businessName || '').toLowerCase()
    const cat = (p.category || '').toLowerCase()
    const area = (p.area || '').toLowerCase()
    return text.includes(q) || author.includes(q) || biz.includes(q) || cat.includes(q) || area.includes(q)
  })

  const filteredPeople = people.filter((u) => {
    if (!q) return true
    const name = (u.name || '').toLowerCase()
    const username = (u.username || '').toLowerCase()
    const email = (u.email || '').toLowerCase()
    const bio = (u.bio || '').toLowerCase()
    const biz = (u.businessName || '').toLowerCase()
    const area = (u.area || '').toLowerCase()
    return name.includes(q) || username.includes(q) || email.includes(q) || bio.includes(q) || biz.includes(q) || area.includes(q)
  })

  const filteredJobs = jobs.filter((j) => {
    if (!q) return true
    const title = (j.title || '').toLowerCase()
    const biz = (j.businessName || '').toLowerCase()
    const cat = (j.category || '').toLowerCase()
    const desc = (j.description || '').toLowerCase()
    const area = (j.area || '').toLowerCase()
    return title.includes(q) || biz.includes(q) || cat.includes(q) || desc.includes(q) || area.includes(q)
  })

  const filteredNeeds = needs.filter((n) => {
    if (!q) return true
    const title = (n.title || '').toLowerCase()
    const desc = (n.description || '').toLowerCase()
    const user = (n.userName || '').toLowerCase()
    const area = (n.area || '').toLowerCase()
    return title.includes(q) || desc.includes(q) || user.includes(q) || area.includes(q)
  })

  const filteredEvents = events.filter((e) => {
    if (!q) return true
    const title = (e.title || '').toLowerCase()
    const desc = (e.description || '').toLowerCase()
    const venue = (e.venue || '').toLowerCase()
    const area = (e.area || '').toLowerCase()
    return title.includes(q) || desc.includes(q) || venue.includes(q) || area.includes(q)
  })

  const totalResultsCount =
    filteredBusinesses.length +
    filteredPosts.length +
    filteredPeople.length +
    filteredJobs.length +
    filteredNeeds.length +
    filteredEvents.length

  const tabs = [
    { key: 'all', label: `All (${totalResultsCount})` },
    { key: 'businesses', label: `Businesses (${filteredBusinesses.length})` },
    { key: 'posts', label: `Posts (${filteredPosts.length})` },
    { key: 'people', label: `People (${filteredPeople.length})` },
    { key: 'jobs', label: `Jobs (${filteredJobs.length})` },
    { key: 'needs', label: `Needs (${filteredNeeds.length})` },
    { key: 'events', label: `Events (${filteredEvents.length})` },
  ] as const

  const displayArea = getUserCommunityLocation(userProfile)

  return (
    <AppShell currentArea={displayArea}>
      {/* Search Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-3.5 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search businesses, people, jobs, needs, posts..."
              className="w-full rounded-2xl border border-border bg-muted/60 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20 font-bold'
                    : 'bg-card border border-border text-slate-700 dark:text-slate-300 hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Results Container */}
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-6">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-muted-foreground gap-2">
            <Loader2 className="size-6 animate-spin text-purple-600" />
            <span>Searching community database...</span>
          </div>
        ) : totalResultsCount === 0 && q ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <SearchIcon className="size-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">No results found for "{searchTerm}"</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Try searching with another keyword or explore categories.
            </p>
          </div>
        ) : (
          <>
            {/* 1. Businesses Section */}
            {(activeTab === 'all' || activeTab === 'businesses') && filteredBusinesses.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <Store className="size-4 text-purple-600 dark:text-purple-400" />
                  <span>Local Businesses ({filteredBusinesses.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredBusinesses.map((b) => {
                    const photo = getBusinessPhoto(b, photosRecord) || '/circular-logo.png'
                    const bizName = b.name || (b as any).businessName || 'Local Business'
                    const bizCat = b.category || (b as any).businessCategory || 'Local Shop'
                    return (
                      <Link
                        key={b.id}
                        href={`/business/${b.id}`}
                        className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-all hover:border-purple-500/40 hover:shadow-md"
                      >
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-purple-500/10 ring-1 ring-border">
                          <Image src={photo} alt={bizName} fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                            {bizName}
                          </h4>
                          <p className="truncate text-xs text-muted-foreground mt-0.5">{bizCat}</p>
                          {b.area && (
                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-1 inline-block">
                              📍 {b.area}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* 2. People Section */}
            {(activeTab === 'all' || activeTab === 'people') && filteredPeople.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <Users className="size-4 text-blue-600 dark:text-blue-400" />
                  <span>People ({filteredPeople.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredPeople.map((p) => {
                    const avatar = getUserAvatar(p, publicProfiles) || '/circular-logo.png'
                    return (
                      <Link
                        key={p.uid}
                        href={`/user/${p.uid}`}
                        className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-all hover:border-purple-500/40 hover:shadow-md"
                      >
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border">
                          <Image src={avatar} alt={p.name} fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                            {p.name}
                          </h4>
                          <p className="truncate text-[11px] text-muted-foreground">@{p.username || 'member'}</p>
                          {p.area && (
                            <span className="text-[10px] text-muted-foreground mt-0.5 inline-block">
                              📍 {p.area}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* 3. Jobs Section */}
            {(activeTab === 'all' || activeTab === 'jobs') && filteredJobs.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <Briefcase className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Job Openings ({filteredJobs.length})</span>
                </div>
                <div className="space-y-2.5">
                  {filteredJobs.map((j) => (
                    <Link
                      key={j.id}
                      href={`/job/${j.id}`}
                      className="group block rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          {j.title}
                        </h4>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {j.jobType}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {j.businessName} • {j.area}
                      </p>
                      {j.salary && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 inline-block">
                          {j.salary}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Needs Section */}
            {(activeTab === 'all' || activeTab === 'needs') && filteredNeeds.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <HandHeart className="size-4 text-amber-600 dark:text-amber-400" />
                  <span>Community Needs ({filteredNeeds.length})</span>
                </div>
                <div className="space-y-2.5">
                  {filteredNeeds.map((n) => (
                    <Link
                      key={n.id}
                      href={`/need/${n.id}`}
                      className="group block rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-amber-500/40 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                          {n.title}
                        </h4>
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          {n.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {n.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2">
                        <span>Posted by {n.userName}</span>
                        <span>•</span>
                        <span>📍 {n.area}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 5. Events Section */}
            {(activeTab === 'all' || activeTab === 'events') && filteredEvents.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <Calendar className="size-4 text-orange-600 dark:text-orange-400" />
                  <span>Community Events ({filteredEvents.length})</span>
                </div>
                <div className="space-y-2.5">
                  {filteredEvents.map((e) => (
                    <Link
                      key={e.id}
                      href={`/event/${e.id}`}
                      className="group block rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-orange-500/40 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
                          {e.title}
                        </h4>
                        <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                          {e.eventDate || 'Upcoming'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {e.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2">
                        <span>📍 {e.venue || e.area}</span>
                        {e.eventTime && (
                          <>
                            <span>•</span>
                            <span>🕒 {e.eventTime}</span>
                          </>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 6. Posts Section */}
            {(activeTab === 'all' || activeTab === 'posts') && filteredPosts.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                  <span>Posts &amp; Updates ({filteredPosts.length})</span>
                </div>
                <div className="space-y-3.5">
                  {filteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
