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
import { PublicNeedData } from '@/lib/serverPublicData'
import { ref, push, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { HandHeart, MapPin, PlusCircle, Search, Sparkles, X } from 'lucide-react'

const NEED_CATEGORIES = ['All', 'Blood', 'Emergency', 'Help', 'Item Required', 'Services', 'General']

interface NeedsClientProps {
  initialNeeds: PublicNeedData[]
}

export default function NeedsClientContainer({ initialNeeds }: NeedsClientProps) {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [needs, setNeeds] = useState<any[]>(initialNeeds || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCat, setSelectedCat] = useState('All')
  const [isPostNeedOpen, setIsPostNeedOpen] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('General')
  const [urgency, setUrgency] = useState<'Normal' | 'High' | 'Urgent'>('Normal')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCreateNeed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push('/login')
      return
    }
    if (!title.trim()) return

    setSubmitting(true)
    try {
      const newNeedRef = push(ref(db, 'needPosts'))
      await set(newNeedRef, {
        title: title.trim(),
        category,
        urgency,
        description: description.trim(),
        area: getUserCommunityLocation(userProfile),
        userId: user.uid,
        userName: userProfile?.name || 'Community Member',
        createdAt: Date.now(),
        status: 'active',
      })

      setNeeds((prev) => [
        {
          id: newNeedRef.key,
          title: title.trim(),
          category,
          urgency,
          description: description.trim(),
          area: getUserCommunityLocation(userProfile),
          requesterName: userProfile?.name || 'Community Member',
          createdAt: Date.now(),
        },
        ...prev,
      ])

      setIsPostNeedOpen(false)
      setTitle('')
      setDescription('')
    } catch (err) {
      console.error('Error posting need:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Allow immediate SSR rendering of public catalog without blocking on auth loading

  const q = searchQuery.toLowerCase().trim()
  const filtered = needs.filter((n) => {
    const matchesCat = selectedCat === 'All' || n.category === selectedCat
    const titleMatch = (n.title || '').toLowerCase().includes(q)
    const descMatch = (n.description || '').toLowerCase().includes(q)
    const areaMatch = (n.area || '').toLowerCase().includes(q)
    return matchesCat && (!q || titleMatch || descMatch || areaMatch)
  })

  const displayArea = getUserCommunityLocation(userProfile)

  const content = (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <HandHeart className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white">Need Board</h1>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Community requests &amp; help wanted in {displayArea}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!user) router.push('/login')
              else setIsPostNeedOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95 active:scale-95"
          >
            <PlusCircle className="size-4" />
            <span>Post Need</span>
          </button>
        </div>

        <div className="mt-3 relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search needs, blood requests, items..."
            className="w-full rounded-2xl border border-border bg-muted/60 py-2 pl-10 pr-10 text-xs text-foreground placeholder-muted-foreground focus:border-pink-500 focus:bg-card focus:outline-none"
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
          {NEED_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(cat)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedCat === cat
                  ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20 font-bold'
                  : 'bg-card border border-border text-slate-700 dark:text-slate-300 hover:bg-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-600">
              <HandHeart className="size-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">No requests on the board</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No requests match "${searchQuery}".`
                : 'There are currently no active listings in this section. Download the Circular mobile app to post a job opening, announce a community event, or submit a local request in your neighborhood.'}
            </p>
          </div>
        ) : (
          filtered.map((need) => (
            <Link
              key={need.id}
              href={`/need/${need.id}`}
              className="group block rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:border-pink-500/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400">{need.title}</h3>
                  <p className="text-xs text-muted-foreground">Posted by {need.requesterName || need.userName || 'Member'}</p>
                </div>
                <span
                  className={`rounded-xl px-3 py-1 text-[11px] font-bold ${
                    need.urgency === 'Urgent'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : need.urgency === 'High'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                  }`}
                >
                  {need.urgency || 'Normal'}
                </span>
              </div>

              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {need.description}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-pink-600 dark:text-pink-400" />
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

      {isPostNeedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Post a Need / Request</h2>
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
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent (Immediate Help)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    {NEED_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context, requirements, or contact method..."
                  className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
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
                  className="rounded-xl bg-pink-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-pink-700 disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Publish Need'}
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
          <OpenInCircularBanner path="/needs" title="Need Board" />
        </div>
      </main>
      <CircularFooter />
    </div>
  )
}
