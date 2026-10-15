'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { ref, get, query, limitToLast, push, set, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { getUserAvatar } from '@/lib/imageUtils'
import { Plus, X, BarChart2, Globe, Users, Lock, Check } from 'lucide-react'

interface UserStatus {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  mediaUrl?: string
  text?: string
  createdAt: number
  audience?: 'everyone' | 'followers'
  poll?: {
    question: string
    option1: string
    option2: string
    option1Votes?: number
    option2Votes?: number
  }
}

export function StoriesBar() {
  const { user, userProfile, publicProfiles } = useAuth()
  const [statuses, setStatuses] = useState<UserStatus[]>([])
  const [activeStory, setActiveStory] = useState<UserStatus | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Creation form states
  const [storyText, setStoryText] = useState('')
  const [storyImageUrl, setStoryImageUrl] = useState('')
  const [audience, setAudience] = useState<'everyone' | 'followers'>('everyone')
  const [hasPoll, setHasPoll] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOption1, setPollOption1] = useState('Yes 👍')
  const [pollOption2, setPollOption2] = useState('No 👎')
  const [submitting, setSubmitting] = useState(false)

  // Poll voting state
  const [userVotes, setUserVotes] = useState<Record<string, number>>({})

  const isUserPrivate = Boolean(
    userProfile?.isPrivate === true ||
    (userProfile as any)?.accountPrivacy === 'private'
  )

  useEffect(() => {
    if (isUserPrivate) {
      setAudience('followers')
    }
  }, [isUserPrivate])

  const fetchStatuses = async () => {
    try {
      const snap = await get(query(ref(db, 'statuses'), limitToLast(30)))
      if (snap.exists()) {
        const list: UserStatus[] = []
        const now = Date.now()
        const oneDayAgo = now - 24 * 60 * 60 * 1000
        snap.forEach((child) => {
          const val = child.val()
          if (val.createdAt && val.createdAt > oneDayAgo) {
            list.push({ id: child.key as string, ...val })
          }
        })
        setStatuses(list.reverse())
      }
    } catch (err) {
      console.warn('Statuses fetch warning:', err)
    }
  }

  useEffect(() => {
    fetchStatuses()
  }, [])

  const handleCreateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!storyText.trim() && !storyImageUrl.trim() && !hasPoll) return

    setSubmitting(true)
    try {
      const newStatusRef = push(ref(db, 'statuses'))
      const now = Date.now()

      const statusData: any = {
        id: newStatusRef.key,
        userId: user.uid,
        userName: userProfile?.name || user.displayName || 'Member',
        text: storyText.trim() || undefined,
        mediaUrl: storyImageUrl.trim() || undefined,
        createdAt: now,
        expiresAt: now + 24 * 60 * 60 * 1000,
        audience: isUserPrivate ? 'followers' : audience,
      }

      if (hasPoll && pollQuestion.trim()) {
        statusData.poll = {
          question: pollQuestion.trim(),
          option1: pollOption1.trim() || 'Yes',
          option2: pollOption2.trim() || 'No',
          option1Votes: 0,
          option2Votes: 0,
        }
      }

      await set(newStatusRef, statusData)
      setIsCreateOpen(false)
      setStoryText('')
      setStoryImageUrl('')
      setHasPoll(false)
      setPollQuestion('')
      fetchStatuses()
    } catch (err) {
      console.error('Error creating story:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (story: UserStatus, option: 1 | 2) => {
    if (!user || !story.poll) return
    if (userVotes[story.id]) return

    setUserVotes((prev) => ({ ...prev, [story.id]: option }))

    try {
      const currentOp1 = story.poll.option1Votes || 0
      const currentOp2 = story.poll.option2Votes || 0

      const updates: Record<string, any> = {
        [`statusVotes/${story.id}/${user.uid}`]: option,
      }

      if (option === 1) {
        updates[`statuses/${story.id}/poll/option1Votes`] = currentOp1 + 1
      } else {
        updates[`statuses/${story.id}/poll/option2Votes`] = currentOp2 + 1
      }

      await update(ref(db), updates)

      // Update local status record
      setActiveStory((prev) => {
        if (!prev || prev.id !== story.id || !prev.poll) return prev
        return {
          ...prev,
          poll: {
            ...prev.poll,
            option1Votes: option === 1 ? currentOp1 + 1 : currentOp1,
            option2Votes: option === 2 ? currentOp2 + 1 : currentOp2,
          },
        }
      })
    } catch (err) {
      console.error('Vote error:', err)
    }
  }

  const avatar = getUserAvatar(userProfile, publicProfiles) || '/circular-logo.png'

  return (
    <>
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
        {/* Current User Story Launcher */}
        <div
          onClick={() => setIsCreateOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-1.5 cursor-pointer group hover:border-purple-500/40 hover:bg-muted/60 transition-all shadow-sm"
        >
          <div className="relative size-9 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-purple-600 via-pink-500 to-orange-500 shrink-0 shadow-sm">
            <div className="relative size-full rounded-full overflow-hidden bg-card">
              <Image src={avatar} alt="Your Status" fill className="object-cover" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white shadow ring-2 ring-card">
              <Plus className="size-2.5 stroke-[3]" />
            </div>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
              Your Status
            </span>
            <span className="text-[9px] text-muted-foreground font-medium">Add Update</span>
          </div>
        </div>

        {/* Community Statuses if active */}
        {statuses.map((item, idx) => {
          const itemAvatar =
            getUserAvatar(item, publicProfiles) || item.mediaUrl || '/circular-logo.png'
          const displayName =
            publicProfiles?.[item.userId]?.name?.split(' ')[0] ||
            item.userName?.split(' ')[0] ||
            'Member'

          const ringGradients = [
            'from-purple-500 via-pink-500 to-orange-500',
            'from-blue-500 via-teal-500 to-emerald-500',
            'from-pink-500 via-rose-500 to-amber-500',
            'from-indigo-500 via-purple-500 to-pink-500',
          ]
          const ringGradient = ringGradients[idx % ringGradients.length]

          return (
            <div
              key={item.id}
              onClick={() => setActiveStory(item)}
              className="flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-card px-2.5 py-1.5 cursor-pointer group hover:border-pink-500/40 hover:bg-muted/60 transition-all shadow-sm"
            >
              <div className={`relative size-8 rounded-full p-0.5 bg-gradient-to-tr ${ringGradient} shrink-0`}>
                <div className="relative size-full rounded-full overflow-hidden bg-card">
                  <Image
                    src={itemAvatar}
                    alt={displayName}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col text-left">
                <span className="max-w-[85px] truncate text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  {displayName}
                </span>
                {item.poll && (
                  <span className="text-[9px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-0.5">
                    <BarChart2 className="size-2.5" />
                    <span>Poll</span>
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Story Creator Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add Story / Status</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStatus} className="mt-4 space-y-3.5">
              {/* Audience selector */}
              <div className="flex items-center justify-between bg-muted/40 p-2 rounded-xl border border-border">
                <span className="text-xs font-bold text-foreground">Audience:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAudience('everyone')}
                    disabled={isUserPrivate}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      audience === 'everyone'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    } ${isUserPrivate ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Globe className="size-3" />
                    <span>Everyone</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudience('followers')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      audience === 'followers'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Users className="size-3" />
                    <span>Followers only</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Status Text</label>
                <textarea
                  rows={3}
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  placeholder="Share a quick highlight or update..."
                  className="w-full rounded-2xl border border-border bg-muted/40 p-3 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Photo URL (Optional)</label>
                <input
                  type="url"
                  value={storyImageUrl}
                  onChange={(e) => setStoryImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Story Poll Toggle */}
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="size-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Include Story Poll</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasPoll}
                    onChange={(e) => setHasPoll(e.target.checked)}
                    className="size-4 rounded accent-purple-600 cursor-pointer"
                  />
                </div>

                {hasPoll && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="Ask your community a question..."
                      className="w-full rounded-xl border border-border bg-card p-2 text-xs text-foreground placeholder-muted-foreground focus:border-purple-500 focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={pollOption1}
                        onChange={(e) => setPollOption1(e.target.value)}
                        placeholder="Option 1"
                        className="rounded-xl border border-border bg-card p-2 text-xs text-foreground focus:border-purple-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={pollOption2}
                        onChange={(e) => setPollOption2(e.target.value)}
                        placeholder="Option 2"
                        className="rounded-xl border border-border bg-card p-2 text-xs text-foreground focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-border bg-muted px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (!storyText.trim() && !storyImageUrl.trim() && !hasPoll)}
                  className="rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                >
                  {submitting ? 'Sharing...' : 'Share to Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Story Viewer Modal with interactive Polls */}
      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative flex flex-col w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 text-white shadow-2xl overflow-hidden min-h-[460px]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
              <div className="flex items-center gap-2.5">
                <div className="relative size-9 rounded-full overflow-hidden border border-white/20">
                  <Image
                    src={getUserAvatar(activeStory, publicProfiles) || '/circular-logo.png'}
                    alt={activeStory.userName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{activeStory.userName}</div>
                  <div className="text-[10px] text-white/70">
                    {activeStory.audience === 'followers' ? 'Followers only' : 'Public'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveStory(null)}
                className="rounded-full bg-black/40 p-1 text-white/80 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="relative flex-1 flex flex-col items-center justify-center p-6 text-center">
              {activeStory.mediaUrl && (
                <div className="absolute inset-0 size-full">
                  <Image
                    src={activeStory.mediaUrl}
                    alt="Status media"
                    fill
                    className="object-cover opacity-60"
                  />
                </div>
              )}

              {activeStory.text && (
                <div className="relative z-10 max-w-xs text-base sm:text-lg font-bold text-white drop-shadow-md leading-relaxed whitespace-pre-line">
                  {activeStory.text}
                </div>
              )}

              {/* Story Poll Overlay */}
              {activeStory.poll && (() => {
                const myVote = userVotes[activeStory.id]
                const op1Votes = activeStory.poll.option1Votes || 0
                const op2Votes = activeStory.poll.option2Votes || 0
                const totalVotes = op1Votes + op2Votes
                const pct1 = totalVotes > 0 ? Math.round((op1Votes / totalVotes) * 100) : 50
                const pct2 = totalVotes > 0 ? 100 - pct1 : 50

                return (
                  <div className="relative z-10 mt-6 w-full rounded-2xl border border-white/20 bg-black/60 p-4 backdrop-blur-md text-left shadow-lg">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase text-purple-400 mb-1">
                      <BarChart2 className="size-3.5" />
                      <span>Story Poll</span>
                    </div>
                    <div className="text-xs font-bold text-white mb-3">
                      {activeStory.poll.question}
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleVote(activeStory, 1)}
                        className={`relative w-full overflow-hidden rounded-xl border p-2.5 text-left text-xs font-bold transition-all ${
                          myVote === 1
                            ? 'border-purple-400 bg-purple-500/30'
                            : 'border-white/20 bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        {totalVotes > 0 && (
                          <div
                            className="absolute inset-y-0 left-0 bg-purple-500/40 transition-all duration-500"
                            style={{ width: `${pct1}%` }}
                          />
                        )}
                        <div className="relative flex items-center justify-between text-white">
                          <span className="flex items-center gap-1.5">
                            {myVote === 1 && <Check className="size-3.5 text-purple-300" />}
                            {activeStory.poll.option1}
                          </span>
                          <span className="text-xs font-extrabold">{pct1}%</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleVote(activeStory, 2)}
                        className={`relative w-full overflow-hidden rounded-xl border p-2.5 text-left text-xs font-bold transition-all ${
                          myVote === 2
                            ? 'border-pink-400 bg-pink-500/30'
                            : 'border-white/20 bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        {totalVotes > 0 && (
                          <div
                            className="absolute inset-y-0 left-0 bg-pink-500/40 transition-all duration-500"
                            style={{ width: `${pct2}%` }}
                          />
                        )}
                        <div className="relative flex items-center justify-between text-white">
                          <span className="flex items-center gap-1.5">
                            {myVote === 2 && <Check className="size-3.5 text-pink-300" />}
                            {activeStory.poll.option2}
                          </span>
                          <span className="text-xs font-extrabold">{pct2}%</span>
                        </div>
                      </button>
                    </div>

                    <div className="mt-2 text-right text-[10px] text-white/60">
                      {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
