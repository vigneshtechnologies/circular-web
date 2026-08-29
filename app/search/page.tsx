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
import { Search as SearchIcon, MapPin, Store, Users, FileText, Briefcase, HandHeart, Calendar, Star, Phone } from 'lucide-react'

export default function SearchPage() {
  const { user, userProfile, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<'all' | 'businesses' | 'posts' | 'people' | 'jobs' | 'needs' | 'events'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [people, setPeople] = useState<UserProfile[]>([])
  const [jobs, setJobs] = useState<LocalJob[]>([])
  const [needs, setNeeds] = useState<NeedPost[]>([])
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [isSearching, setIsSearching] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadSearchData = async () => {
      setIsSearching(true)
      try {
        const [bSnap, pSnap, uSnap, jSnap, nSnap, eSnap] = await Promise.all([
          get(query(ref(db, 'businessProfiles'), limitToLast(50))),
          get(query(ref(db, 'posts'), limitToLast(50))),
          get(query(ref(db, 'publicProfiles'), limitToLast(50))),
          get(query(ref(db, 'jobs'), limitToLast(50))),
          get(query(ref(db, 'needPosts'), limitToLast(50))),
          get(query(ref(db, 'events'), limitToLast(50))),
        ])

        if (bSnap.exists()) {
          const list: BusinessProfile[] = []
          bSnap.forEach((c) => { list.push({ id: c.key as string, ...c.val() }) })
          setBusinesses(list)
        }
        if (pSnap.exists()) {
          const list: Post[] = []
          pSnap.forEach((c) => { list.push({ id: c.key as string, ...c.val() }) })
          setPosts(list.reverse())
        }
        if (uSnap.exists()) {
          const list: UserProfile[] = []
          uSnap.forEach((c) => { list.push({ uid: c.key as string, ...c.val() }) })
          setPeople(list)
        }
        if (jSnap.exists()) {
          const list: LocalJob[] = []
          jSnap.forEach((c) => { list.push({ id: c.key as string, ...c.val() }) })
          setJobs(list)
        }
        if (nSnap.exists()) {
          const list: NeedPost[] = []
          nSnap.forEach((c) => { list.push({ id: c.key as string, ...c.val() }) })
          setNeeds(list)
        }
        if (eSnap.exists()) {
          const list: CommunityEvent[] = []
          eSnap.forEach((c) => { list.push({ id: c.key as string, ...c.val() }) })
          setEvents(list)
        }
      } catch (e) {
        console.error('Search data fetch error:', e)
      } finally {
        setIsSearching(false)
      }
    }

    loadSearchData()
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
  const areaFilter = selectedArea.toLowerCase().trim()

  const filteredBusinesses = businesses.filter((b) => {
    const matchesQ = !q || b.name?.toLowerCase().includes(q) || b.category?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q)
    const matchesArea = !areaFilter || b.area?.toLowerCase().includes(areaFilter) || b.address?.toLowerCase().includes(areaFilter)
    return matchesQ && matchesArea
  })

  const filteredPosts = posts.filter((p) => {
    const matchesQ = !q || p.text?.toLowerCase().includes(q) || p.userName?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    const matchesArea = !areaFilter || p.area?.toLowerCase().includes(areaFilter)
    return matchesQ && matchesArea
  })

  const filteredPeople = people.filter((u) => {
    const matchesQ = !q || u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.bio?.toLowerCase().includes(q)
    const matchesArea = !areaFilter || u.area?.toLowerCase().includes(areaFilter)
    return matchesQ && matchesArea
  })

  const filteredJobs = jobs.filter((j) => {
    const matchesQ = !q || j.title?.toLowerCase().includes(q) || j.category?.toLowerCase().includes(q) || j.businessName?.toLowerCase().includes(q)
    const matchesArea = !areaFilter || j.area?.toLowerCase().includes(areaFilter)
    return matchesQ && matchesArea
  })

  const filteredNeeds = needs.filter((n) => {
    const matchesQ = !q || n.title?.toLowerCase().includes(q) || n.category?.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q)
    const matchesArea = !areaFilter || n.area?.toLowerCase().includes(areaFilter)
    return matchesQ && matchesArea
  })

  const filteredEvents = events.filter((e) => {
    const matchesQ = !q || e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.venue?.toLowerCase().includes(q)
    const matchesArea = !areaFilter || e.area?.toLowerCase().includes(areaFilter)
    return matchesQ && matchesArea
  })

  const tabs = [
    { key: 'all', label: 'All Results' },
    { key: 'businesses', label: `Businesses (${filteredBusinesses.length})` },
    { key: 'posts', label: `Posts (${filteredPosts.length})` },
    { key: 'people', label: `People (${filteredPeople.length})` },
    { key: 'jobs', label: `Jobs (${filteredJobs.length})` },
    { key: 'needs', label: `Needs (${filteredNeeds.length})` },
    { key: 'events', label: `Events (${filteredEvents.length})` },
  ] as const

  return (
    <AppShell currentArea={userProfile?.area || 'Rajapalayam'}>
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
              className="w-full rounded-2xl border border-border bg-muted/60 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Filter Tabs */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Results Container */}
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-6">
        {isSearching ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-2">Searching across Circular...</p>
          </div>
        ) : (
          <>
            {/* Businesses Section */}
            {(activeTab === 'all' || activeTab === 'businesses') && filteredBusinesses.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
                    <Store className="size-4 text-primary" />
                    <span>Businesses</span>
                  </h2>
                  <Link href="/businesses" className="text-xs font-semibold text-primary hover:underline">
                    View all
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filteredBusinesses.slice(0, activeTab === 'all' ? 4 : 50).map((b) => (
                    <Link
                      key={b.id}
                      href={`/business/${b.id}`}
                      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-primary/10 ring-1 ring-border">
                        <Image
                          src={b.logoUrl || '/circular-logo.png'}
                          alt={b.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-xs font-bold text-navy">{b.name}</h3>
                        <p className="truncate text-[11px] text-muted-foreground">{b.category}</p>
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                            <Star className="size-3 fill-amber-500" />
                            {b.rating ? b.rating.toFixed(1) : '5.0'}
                          </span>
                          <span>•</span>
                          <span className="truncate">{b.area || 'Rajapalayam'}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* People Section */}
            {(activeTab === 'all' || activeTab === 'people') && filteredPeople.length > 0 && (
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
                  <Users className="size-4 text-primary" />
                  <span>People</span>
                </h2>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {filteredPeople.slice(0, activeTab === 'all' ? 4 : 50).map((p) => (
                    <Link
                      key={p.uid}
                      href={`/user/${p.uid}`}
                      className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-sm transition-all hover:border-primary/40"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border">
                          <Image
                            src={p.photoURL || '/circular-logo.png'}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-xs font-bold text-navy">{p.name}</h3>
                          <p className="truncate text-[11px] text-muted-foreground">@{p.username || 'member'}</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-xl bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                        View
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Jobs Section */}
            {(activeTab === 'all' || activeTab === 'jobs') && filteredJobs.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
                    <Briefcase className="size-4 text-primary" />
                    <span>Local Jobs</span>
                  </h2>
                  <Link href="/jobs" className="text-xs font-semibold text-primary hover:underline">
                    View all
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {filteredJobs.slice(0, activeTab === 'all' ? 3 : 50).map((j) => (
                    <Link
                      key={j.id}
                      href={`/job/${j.id}`}
                      className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-navy">{j.title}</h3>
                          <p className="text-xs text-muted-foreground">{j.businessName || 'Local Business'}</p>
                        </div>
                        <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                          {j.jobType || 'Full-time'}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 text-primary" />
                          {j.area || 'Rajapalayam'}
                        </span>
                        {j.salary && <span>• {j.salary}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Needs Section */}
            {(activeTab === 'all' || activeTab === 'needs') && filteredNeeds.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
                    <HandHeart className="size-4 text-pink-500" />
                    <span>Need Board</span>
                  </h2>
                  <Link href="/needs" className="text-xs font-semibold text-primary hover:underline">
                    View all
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {filteredNeeds.slice(0, activeTab === 'all' ? 3 : 50).map((n) => (
                    <Link
                      key={n.id}
                      href={`/need/${n.id}`}
                      className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40"
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="text-sm font-bold text-navy">{n.title}</h3>
                        <span className="rounded-lg bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                          {n.urgency || 'Medium'}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.description}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Events Section */}
            {(activeTab === 'all' || activeTab === 'events') && filteredEvents.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
                    <Calendar className="size-4 text-purple-500" />
                    <span>Events</span>
                  </h2>
                  <Link href="/events" className="text-xs font-semibold text-primary hover:underline">
                    View all
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {filteredEvents.slice(0, activeTab === 'all' ? 3 : 50).map((e) => (
                    <Link
                      key={e.id}
                      href={`/event/${e.id}`}
                      className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40"
                    >
                      <h3 className="text-sm font-bold text-navy">{e.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{e.description}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>📍 {e.venue}</span>
                        {e.eventDate && <span>• 📅 {e.eventDate}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Posts Section */}
            {(activeTab === 'all' || activeTab === 'posts') && filteredPosts.length > 0 && (
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
                  <FileText className="size-4 text-primary" />
                  <span>Posts</span>
                </h2>
                <div className="space-y-4">
                  {filteredPosts.slice(0, activeTab === 'all' ? 5 : 50).map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {filteredBusinesses.length === 0 &&
              filteredPosts.length === 0 &&
              filteredPeople.length === 0 &&
              filteredJobs.length === 0 &&
              filteredNeeds.length === 0 &&
              filteredEvents.length === 0 && (
                <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <SearchIcon className="size-6" />
                  </div>
                  <h3 className="mt-3 text-base font-bold text-navy">No results found</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try searching for different keywords or clear your search term.
                  </p>
                </div>
              )}
          </>
        )}
      </div>
    </AppShell>
  )
}
