'use client'

import { getUserCommunityLocation } from '@/lib/locationUtils'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { ref, get, query, limitToLast, push, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { NeedPost } from '@/lib/types'
import { HandHeart, MapPin, PlusCircle, Search, Sparkles, X, AlertTriangle } from 'lucide-react'

export default function NeedsPage() {
  const { user, userProfile, loading } = useAuth()
  const [needs, setNeeds] = useState<NeedPost[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUrgency, setSelectedUrgency] = useState('All')
  const [dataLoading, setDataLoading] = useState(true)
  const [isPostNeedOpen, setIsPostNeedOpen] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('General')
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium')
  const [area, setArea] = useState(getUserCommunityLocation(userProfile))
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const urgencies = ['All', 'Urgent', 'High', 'Medium', 'Low']

  const fetchNeeds = async () => {
    setDataLoading(true)
    try {
      const snap = await get(query(ref(db, 'needPosts'), limitToLast(50)))
      if (snap.exists()) {
        const list: NeedPost[] = []
        snap.forEach((c) => {
          list.push({ id: c.key as string, ...c.val() })
        })
        setNeeds(list.reverse())
      }
    } catch (e) {
      console.error('Error fetching needs:', e)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchNeeds()
  }, [user])

  const handleCreateNeed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!title.trim() || !description.trim()) return

    setSubmitting(true)
    try {
      const newRef = push(ref(db, 'needPosts'))
      const needData: NeedPost = {
        id: newRef.key as string,
        userId: user.uid,
        userName: userProfile?.name || 'Community Member',
        userAvatar: userProfile?.photoURL || undefined,
        title: title.trim(),
        category,
        urgency,
        area: area.trim() || getUserCommunityLocation(userProfile),
        description: description.trim(),
        createdAt: Date.now(),
      }
      await set(newRef, needData)
      setIsPostNeedOpen(false)
      setTitle('')
      setDescription('')
      fetchNeeds()
    } catch (e) {
      console.error('Error posting need:', e)
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

  const filtered = needs.filter((n) => {
    const matchesUrg = selectedUrgency === 'All' || n.urgency === selectedUrgency
    const matchesQ =
      !searchQuery.trim() ||
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.area?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesUrg && matchesQ
  })

  return (
    <AppShell currentArea={getUserCommunityLocation(userProfile)}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500">
              <HandHeart className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-navy">Need Board</h1>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Ask neighbors for help, items, recommendations or services
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPostNeedOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-pink-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-pink-700"
          >
            <PlusCircle className="size-4" />
            <span>Post Need</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-3 relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search needs, items required, recommendations..."
            className="w-full rounded-xl border border-border bg-muted/60 py-2 pl-10 pr-4 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
          />
        </div>

        {/* Urgency Filter */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {urgencies.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setSelectedUrgency(u)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedUrgency === u
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-4">
        {dataLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-2">Loading need board...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <HandHeart className="size-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-navy">No requests on the board</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Need something from your neighborhood? Post it here!
            </p>
          </div>
        ) : (
          filtered.map((need) => (
            <Link
              key={need.id}
              href={`/need/${need.id}`}
              className="block rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:border-pink-500/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-navy">{need.title}</h3>
                  <p className="text-xs text-muted-foreground">Posted by {need.userName || 'Member'}</p>
                </div>
                <span
                  className={`rounded-xl px-3 py-1 text-[11px] font-bold ${
                    need.urgency === 'Urgent'
                      ? 'bg-rose-500/15 text-rose-600'
                      : need.urgency === 'High'
                      ? 'bg-amber-500/15 text-amber-600'
                      : 'bg-blue-500/15 text-blue-600'
                  }`}
                >
                  {need.urgency || 'Medium'}
                </span>
              </div>

              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-foreground/80">
                {need.description}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-primary" />
                  <span>{need.area || getUserCommunityLocation(userProfile)}</span>
                </span>
                <span className="text-[11px]">
                  {need.createdAt ? new Date(need.createdAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Post Need Modal */}
      {isPostNeedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-navy">Post a Need / Request</h2>
              <button
                type="button"
                onClick={() => setIsPostNeedOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNeed} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">What do you need? *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Electrician recommendation, Need a book, Blood donor"
                  className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Urgency</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder={getUserCommunityLocation(userProfile)}
                    className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Details / Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide all relevant details so neighbors can help you effectively..."
                  className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostNeedOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-pink-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-pink-700 disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Publish Need'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
