'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { ref, get, query, limitToLast, push, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { CommunityEvent } from '@/lib/types'
import { Calendar, MapPin, PlusCircle, Search, Sparkles, X, Clock } from 'lucide-react'

export default function EventsPage() {
  const { user, userProfile, loading } = useAuth()
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [dataLoading, setDataLoading] = useState(true)
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [venue, setVenue] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [area, setArea] = useState('Rajapalayam')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchEvents = async () => {
    setDataLoading(true)
    try {
      const snap = await get(query(ref(db, 'events'), limitToLast(50)))
      if (snap.exists()) {
        const list: CommunityEvent[] = []
        snap.forEach((c) => {
          list.push({ id: c.key as string, ...c.val() })
        })
        setEvents(list.reverse())
      }
    } catch (e) {
      console.error('Error fetching events:', e)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchEvents()
  }, [user])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!title.trim() || !venue.trim()) return

    setSubmitting(true)
    try {
      const newRef = push(ref(db, 'events'))
      const eventData: CommunityEvent = {
        id: newRef.key as string,
        userId: user.uid,
        userName: userProfile?.name || 'Community Organizer',
        title: title.trim(),
        venue: venue.trim(),
        eventDate: eventDate.trim(),
        eventTime: eventTime.trim(),
        area: area.trim() || 'Rajapalayam',
        description: description.trim(),
        createdAt: Date.now(),
      }
      await set(newRef, eventData)
      setIsCreateEventOpen(false)
      setTitle('')
      setVenue('')
      setDescription('')
      fetchEvents()
    } catch (e) {
      console.error('Error posting event:', e)
    } finally {
      setSubmitting(false)
    }
  }

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

  const filtered = events.filter((ev) => {
    const q = searchQuery.toLowerCase().trim()
    return !q || ev.title?.toLowerCase().includes(q) || ev.venue?.toLowerCase().includes(q) || ev.description?.toLowerCase().includes(q)
  })

  return (
    <AppShell currentArea={userProfile?.area || 'Rajapalayam'}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <Calendar className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-navy">Community Events</h1>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Workshops, exhibitions, cultural &amp; local gatherings
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateEventOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
          >
            <PlusCircle className="size-4" />
            <span>Create Event</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-3 relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search upcoming events, venues..."
            className="w-full rounded-xl border border-border bg-muted/60 py-2 pl-10 pr-4 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
          />
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-4">
        {dataLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-2">Loading events...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Calendar className="size-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-navy">No upcoming events found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Know of an event happening nearby? Share it with the community!
            </p>
          </div>
        ) : (
          filtered.map((event) => (
            <Link
              key={event.id}
              href={`/event/${event.id}`}
              className="block rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:border-purple-500/40 hover:shadow-md"
            >
              <h3 className="text-base font-bold text-navy">{event.title}</h3>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-foreground/80">
                {event.description}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border pt-3 text-xs text-muted-foreground sm:grid-cols-2">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">{event.venue || 'Local Venue'}</span>
                </span>
                {(event.eventDate || event.eventTime) && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-purple-500 shrink-0" />
                    <span>{event.eventDate} {event.eventTime}</span>
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Create Event Modal */}
      {isCreateEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-navy">Create an Event</h2>
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

              <div className="mt-5 flex items-center justify-end gap-3 pt-2">
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
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
