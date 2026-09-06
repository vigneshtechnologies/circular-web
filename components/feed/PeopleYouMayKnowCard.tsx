'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  getPeopleYouMayKnow,
  followUserOptimistic,
  SuggestedPerson,
} from '@/lib/peopleDiscoveryService'
import { Users, UserPlus, UserCheck, X, Sparkles, MapPin, CheckCircle2, ChevronRight } from 'lucide-react'

interface PeopleYouMayKnowCardProps {
  currentLocation?: { latitude: number; longitude: number } | null
  title?: string
  className?: string
}

const DISMISSED_STORAGE_KEY = 'circular_dismissed_pymk'

export function PeopleYouMayKnowCard({
  currentLocation,
  title = 'People You May Know',
  className = '',
}: PeopleYouMayKnowCardProps) {
  const { user, userProfile } = useAuth()
  const [people, setPeople] = useState<SuggestedPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({})
  const [dismissedUids, setDismissedUids] = useState<string[]>([])

  // Load dismissed UIDs from session
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DISMISSED_STORAGE_KEY)
      if (saved) {
        setDismissedUids(JSON.parse(saved))
      }
    } catch {}
  }, [])

  const loadSuggestions = useCallback(async () => {
    if (!user?.uid) {
      setPeople([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const list = await getPeopleYouMayKnow({
        currentUid: user.uid,
        currentLocation: currentLocation || undefined,
        maxResults: 10,
        dismissedUids,
      })
      setPeople(list)
    } catch (err) {
      console.error('Failed to load people suggestions:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.uid, currentLocation, dismissedUids])

  useEffect(() => {
    loadSuggestions()
  }, [loadSuggestions])

  const handleDismiss = (uid: string) => {
    const updated = [...dismissedUids, uid]
    setDismissedUids(updated)
    setPeople((prev) => prev.filter((p) => p.uid !== uid))
    try {
      sessionStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(updated))
    } catch {}
  }

  const handleFollow = async (person: SuggestedPerson) => {
    if (!user?.uid || followingMap[person.uid]) return

    // Optimistic UI update
    setFollowingMap((prev) => ({ ...prev, [person.uid]: true }))

    const success = await followUserOptimistic({
      currentUid: user.uid,
      targetUid: person.uid,
      actorName: userProfile?.name || user.displayName || 'Circular Member',
    })

    if (!success) {
      // Revert if write failed
      setFollowingMap((prev) => ({ ...prev, [person.uid]: false }))
    }
  }

  if (!user || loading || people.length === 0) {
    return null
  }

  return (
    <div
      className={`rounded-2xl border border-purple-500/20 bg-card/95 p-3.5 sm:p-4 shadow-sm backdrop-blur-sm transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
            <Users className="size-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Based on mutual connections &amp; nearby community
            </p>
          </div>
        </div>

        <Link
          href="/search"
          className="flex items-center gap-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
        >
          <span>Explore</span>
          <ChevronRight className="size-3 stroke-[2.5]" />
        </Link>
      </div>

      {/* Horizontal Carousel */}
      <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar pb-1 pt-0.5">
        {people.map((person) => {
          const isFollowing = followingMap[person.uid] === true
          const avatarUrl = person.avatar || '/circular-logo.png'

          return (
            <div
              key={person.uid}
              className="group relative flex w-[140px] sm:w-[150px] shrink-0 flex-col items-center justify-between rounded-xl border border-border/80 bg-card p-3 shadow-xs hover:border-purple-500/40 hover:shadow-md transition-all text-center"
            >
              {/* Dismiss button */}
              <button
                type="button"
                onClick={() => handleDismiss(person.uid)}
                className="absolute top-1.5 right-1.5 size-5 flex items-center justify-center rounded-full bg-muted/80 text-muted-foreground opacity-60 hover:opacity-100 hover:bg-muted transition-all"
                title="Dismiss"
              >
                <X className="size-3" />
              </button>

              {/* Tappable Profile Content */}
              <Link
                href={`/user/${person.uid}`}
                className="flex flex-col items-center w-full"
              >
                <div className="relative size-14 rounded-full overflow-hidden bg-purple-500/10 ring-2 ring-border/60 group-hover:ring-purple-500/40 transition-all mb-2">
                  <Image
                    src={avatarUrl}
                    alt={person.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex items-center justify-center gap-1 w-full px-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {person.name}
                  </span>
                  {person.isVerified && (
                    <CheckCircle2 className="size-3 text-blue-500 shrink-0" />
                  )}
                </div>

                <span className="text-[10px] text-muted-foreground truncate w-full px-1">
                  @{person.username}
                </span>

                {/* Explainable badge */}
                <div className="mt-1.5 mb-2 w-full">
                  <span className="inline-block max-w-full truncate rounded-full bg-purple-500/10 px-2 py-0.5 text-[9px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-500/20">
                    {person.reasonLabel}
                  </span>
                </div>
              </Link>

              {/* Follow / Following Button */}
              <button
                type="button"
                onClick={() => handleFollow(person)}
                disabled={isFollowing}
                className={`mt-auto flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                  isFollowing
                    ? 'border border-border bg-muted/60 text-muted-foreground cursor-default'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-xs active:scale-95'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="size-3 text-purple-600 dark:text-purple-400" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="size-3" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
