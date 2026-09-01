'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import { OpenInCircularBanner } from '@/components/public/open-in-circular-banner'
import { getUserCommunityLocation } from '@/lib/locationUtils'
import { PublicEventData } from '@/lib/serverPublicData'
import { ref, push, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Calendar, MapPin, PlusCircle, Search, Sparkles, X, Clock } from 'lucide-react'

interface EventsClientProps {
  initialEvents: PublicEventData[]
}

export default function EventsClientContainer({ initialEvents }: EventsClientProps) {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [events, setEvents] = useState<any[]>(initialEvents || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [venue, setVenue] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push('/login')
      return
    }
    if (!title.trim() || !venue.trim()) return

    setSubmitting(true)
    try {
      const newEventRef = push(ref(db, 'events'))
      await set(newEventRef, {
        title: title.trim(),
        venue: venue.trim(),
        area: getUserCommunityLocation(userProfile),
        eventDate: eventDate || null,
        eventTime: eventTime || null,
        description: description.trim(),
        createdBy: user.uid,
        authorName: userProfile?.name || 'Community Member',
        createdAt: Date.now(),
        status: 'active',
      })

      setEvents((prev) => [
        {
          id: newEventRef.key,
          title: title.trim(),
          venue: venue.trim(),
          area: getUserCommunityLocation(userProfile),
          date: eventDate || undefined,
          time: eventTime || undefined,
          description: description.trim(),
          createdAt: Date.now(),
        },
        ...prev,
      ])

      setIsCreateEventOpen(false)
      setTitle('')
      setVenue('')
      setEventDate('')
      setEventTime('')
      setDescription('')
    } catch (err) {
      console.error('Error creating event:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Allow immediate SSR rendering of public catalog without blocking on auth loading

  const q = searchQuery.toLowerCase().trim()
  const filtered = events.filter((ev) => {
    const titleMatch = (ev.title || '').toLowerCase().includes(q)
    const venueMatch = (ev.venue || '').toLowerCase().includes(q)
    const areaMatch = (ev.area || '').toLowerCase().includes(q)
    const descMatch = (ev.description || '').toLowerCase().includes(q)
    return !q || titleMatch || venueMatch || areaMatch || descMatch
  })

  const displayArea = getUserCommunityLocation(userProfile)

  const content = (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Calendar className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white">Community Events</h1>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Discover festivals, camps &amp; gatherings in {displayArea}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!user) router.push('/login')
              else setIsCreateEventOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95 active:scale-95"
          >
            <PlusCircle className="size-4" />
            <span>Post Event</span>
          </button>
        </div>

        <div className="mt-3 relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, venue, or keywords..."
            className="w-full rounded-2xl border border-border bg-muted/60 py-2 pl-10 pr-10 text-xs text-foreground placeholder-muted-foreground focus:border-orange-500 focus:bg-card focus:outline-none"
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
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
              <Calendar className="size-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">No events found</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No events match "${searchQuery}".`
                : 'There are currently no active listings in this section. Download the Circular mobile app to post a job opening, announce a community event, or submit a local request in your neighborhood.'}
            </p>
          </div>
        ) : (
          filtered.map((event) => (
            <Link
              key={event.id}
              href={`/event/${event.id}`}
              className="group block rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:border-orange-500/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">{event.title}</h3>
                  <p className="text-xs text-muted-foreground">Venue: {event.venue}</p>
                </div>
                <span className="rounded-xl bg-orange-500/10 px-3 py-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                  Event
                </span>
              </div>

              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {event.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{event.area || getUserCommunityLocation(userProfile)}</span>
                </span>
                {(event.date || event.eventDate) && (
                  <span className="flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                    <Clock className="size-3.5 text-orange-500 shrink-0" />
                    <span>{event.date || event.eventDate} {event.time || event.eventTime || ''}</span>
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {isCreateEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Create an Event</h2>
              <button
                type="button"
                onClick={() => setIsCreateEventOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Free Medical Camp, Book Fair, Dance Show"
                  className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Venue / Address *</label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Hall name, ground or full address"
                  className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Time</label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event schedule, organizers, entry details..."
                  className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateEventOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
          <OpenInCircularBanner path="/events" title="Community Events" />
        </div>
      </main>
      <CircularFooter />
    </div>
  )
}
