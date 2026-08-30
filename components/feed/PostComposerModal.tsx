'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { ref, push, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { getUserAvatar } from '@/lib/imageUtils'
import {
  X,
  Image as ImageIcon,
  Sparkles,
  MapPin,
  Calendar,
  Vote,
  HandHeart,
  Briefcase,
  ArrowRight,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'

type PostCreationTab = 'normal' | 'event' | 'poll' | 'need' | 'job'

const POST_CATEGORIES = [
  'General',
  'News & Updates',
  'Food',
  'Shopping',
  'Services',
  'Education',
  'Medical',
  'Jobs',
  'Events',
] as const

const IMAGE_WORKER_URL = 'https://buzzly-image-delete.vigneshtechnologyservice.workers.dev'
const MAX_IMAGES = 5

interface PostComposerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PostComposerModal({ isOpen, onClose, onSuccess }: PostComposerModalProps) {
  const { user, userProfile, publicProfiles } = useAuth()
  const [activeTab, setActiveTab] = useState<PostCreationTab>('normal')

  // Normal Post Fields
  const [text, setText] = useState('')
  const [category, setCategory] = useState<string>('General')
  const [area, setArea] = useState('')
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; preview: string }[]>([])

  // Event Fields
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventVenue, setEventVenue] = useState('')
  const [eventDesc, setEventDesc] = useState('')

  // Poll Fields
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])

  // Need Fields
  const [needTitle, setNeedTitle] = useState('')
  const [needDesc, setNeedDesc] = useState('')
  const [needUrgency, setNeedUrgency] = useState('Medium')
  const [needPhone, setNeedPhone] = useState('')

  // Job Fields
  const [jobTitle, setJobTitle] = useState('')
  const [jobBizName, setJobBizName] = useState('')
  const [jobType, setJobType] = useState('Full-time')
  const [jobSalary, setJobSalary] = useState('')
  const [jobDesc, setJobDesc] = useState('')

  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setArea(userProfile?.area || userProfile?.city || '')
      setError(null)

      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserCoords({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            })
          },
          () => {},
          { timeout: 5000, maximumAge: 60000 }
        )
      }
    }
  }, [isOpen, userProfile])

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (selectedFiles.length + files.length > MAX_IMAGES) {
      setError(`You can upload up to ${MAX_IMAGES} photos per post`)
      return
    }

    const newEntries: { file: File; preview: string }[] = []
    for (const f of files) {
      if (f.size > 8 * 1024 * 1024) {
        setError('Each photo must be under 8MB')
        return
      }
      newEntries.push({
        file: f,
        preview: URL.createObjectURL(f),
      })
    }

    setSelectedFiles((prev) => [...prev, ...newEntries])
    setError(null)
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => {
      const copy = [...prev]
      const [removed] = copy.splice(index, 1)
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      return copy
    })
  }

  const uploadImages = async (): Promise<{ urls: string[]; publicIds: string[] }> => {
    if (!user || selectedFiles.length === 0) {
      return { urls: [], publicIds: [] }
    }

    const urls: string[] = []
    const publicIds: string[] = []

    for (let i = 0; i < selectedFiles.length; i++) {
      setLoadingStep(`Uploading photo ${i + 1} of ${selectedFiles.length}...`)
      const entry = selectedFiles[i]

      try {
        const idToken = await user.getIdToken(true)
        const sigRes = await fetch(IMAGE_WORKER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            action: 'create-upload-signature',
            imageType: 'post',
          }),
        })

        if (sigRes.ok) {
          const sigData = await sigRes.json()
          if (sigData.success && sigData.cloudName && sigData.signature) {
            const formData = new FormData()
            formData.append('file', entry.file)
            formData.append('api_key', sigData.apiKey)
            formData.append('timestamp', String(sigData.timestamp))
            formData.append('signature', sigData.signature)
            if (sigData.context) formData.append('context', sigData.context)

            const cloudRes = await fetch(
              `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
              { method: 'POST', body: formData }
            )

            if (cloudRes.ok) {
              const cloudData = await cloudRes.json()
              if (cloudData.secure_url) {
                urls.push(cloudData.secure_url)
                publicIds.push(cloudData.public_id || '')
                continue
              }
            }
          }
        }
      } catch (err) {
        console.warn('Worker upload error, falling back to base64 encoding:', err)
      }

      // Fallback
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(entry.file)
      })
      urls.push(base64)
      publicIds.push('')
    }

    return { urls, publicIds }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)
    const now = Date.now()
    const finalArea = area.trim() || userProfile?.area || userProfile?.city || ''
    const authorAvatar = getUserAvatar(userProfile, publicProfiles) || user.photoURL || ''
    const authorName = userProfile?.name || user.displayName || 'Circular Member'

    try {
      if (activeTab === 'normal') {
        if (!text.trim() && selectedFiles.length === 0) {
          setError('Please enter post text or select a photo')
          setLoading(false)
          return
        }

        const { urls, publicIds } = await uploadImages()
        setLoadingStep('Publishing post...')

        const postRef = push(ref(db, 'posts'))
        const postPayload = {
          postType: 'regular',
          text: text.trim(),
          category,
          userId: user.uid,
          userEmail: user.email || '',
          userName: authorName,
          profileImage: authorAvatar,
          area: finalArea,
          areaName: finalArea,
          city: userProfile?.city || finalArea,
          latitude: userCoords?.latitude || null,
          longitude: userCoords?.longitude || null,
          radiusKm: 25,
          imageUrl: urls[0] || '',
          imageUrls: urls,
          imageCount: urls.length,
          imagePublicIds: publicIds,
          likesCount: 0,
          commentsCount: 0,
          createdAt: now,
          updatedAt: now,
          postScope: 'local',
        }
        await set(postRef, postPayload)
      } else if (activeTab === 'event') {
        if (!eventTitle.trim() || !eventVenue.trim()) {
          setError('Please provide event title and venue')
          setLoading(false)
          return
        }

        const { urls } = await uploadImages()
        const eventRef = push(ref(db, 'events'))
        const postRef = push(ref(db, 'posts'))

        const eventData = {
          title: eventTitle.trim(),
          venue: eventVenue.trim(),
          eventDate: eventDate || '',
          time: eventTime || '',
          description: eventDesc.trim(),
          imageUrl: urls[0] || '',
          userId: user.uid,
          userName: authorName,
          area: finalArea,
          createdAt: now,
        }

        await set(eventRef, eventData)
        await set(postRef, {
          postType: 'event',
          text: `📅 Event: ${eventTitle.trim()} at ${eventVenue.trim()}`,
          category: 'Events',
          userId: user.uid,
          userName: authorName,
          profileImage: authorAvatar,
          area: finalArea,
          event: eventData,
          createdAt: now,
          likesCount: 0,
          commentsCount: 0,
        })
      } else if (activeTab === 'poll') {
        const validOpts = pollOptions.filter((o) => o.trim())
        if (!pollQuestion.trim() || validOpts.length < 2) {
          setError('Please provide a question and at least 2 poll options')
          setLoading(false)
          return
        }

        const postRef = push(ref(db, 'posts'))
        await set(postRef, {
          postType: 'poll',
          text: pollQuestion.trim(),
          category: 'General',
          userId: user.uid,
          userName: authorName,
          profileImage: authorAvatar,
          area: finalArea,
          poll: {
            question: pollQuestion.trim(),
            options: validOpts,
            totalVotes: 0,
          },
          createdAt: now,
          likesCount: 0,
          commentsCount: 0,
        })
      } else if (activeTab === 'need') {
        if (!needTitle.trim() || !needDesc.trim()) {
          setError('Please provide need title and description')
          setLoading(false)
          return
        }

        const needRef = push(ref(db, 'needPosts'))
        await set(needRef, {
          title: needTitle.trim(),
          description: needDesc.trim(),
          urgency: needUrgency,
          contactPhone: needPhone.trim(),
          category: 'Needs',
          userId: user.uid,
          userName: authorName,
          area: finalArea,
          createdAt: now,
        })
      } else if (activeTab === 'job') {
        if (!jobTitle.trim() || !jobBizName.trim()) {
          setError('Please provide job title and business name')
          setLoading(false)
          return
        }

        const jobRef = push(ref(db, 'jobs'))
        await set(jobRef, {
          title: jobTitle.trim(),
          businessName: jobBizName.trim(),
          jobType,
          salary: jobSalary.trim(),
          description: jobDesc.trim(),
          category: 'Jobs',
          userId: user.uid,
          userName: authorName,
          area: finalArea,
          createdAt: now,
        })
      }

      onClose()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error('Post creation error:', err)
      setError(err.message || 'Failed to publish. Please try again.')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const authorAvatar = getUserAvatar(userProfile, publicProfiles) || '/circular-logo.png'
  const displayPostingArea = area.trim() || userProfile?.area || userProfile?.city || 'your community'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h3 className="text-sm sm:text-base font-black text-navy dark:text-white">Create Content</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Type Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/60 p-2 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'normal', label: 'Post', icon: Sparkles },
            { id: 'event', label: 'Event', icon: Calendar },
            { id: 'poll', label: 'Poll', icon: Vote },
            { id: 'need', label: 'Need', icon: HandHeart },
            { id: 'job', label: 'Job', icon: Briefcase },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as PostCreationTab)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive font-semibold">
              {error}
            </div>
          )}

          {/* User Info Bar */}
          <div className="flex items-center gap-3">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border">
              <Image src={authorAvatar} alt="Avatar" fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-navy dark:text-white truncate">
                {userProfile?.name || 'Circular Member'}
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span>Posting to</span>
                <span className="font-semibold text-primary truncate max-w-[150px]">
                  {displayPostingArea}
                </span>
              </div>
            </div>
          </div>

          {/* Tab 1: Normal Post */}
          {activeTab === 'normal' && (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="What's happening in your local neighborhood? (Supports English, தமிழ், etc.)"
                className="w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-primary focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
              />

              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedFiles.map((item, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-muted ring-1 ring-border">
                      <Image src={item.preview} alt="Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/75 text-white hover:bg-rose-600"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold"
                  >
                    {POST_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Area</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Gandhi Nagar"
                    className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>
            </>
          )}

          {/* Tab 2: Event */}
          {activeTab === 'event' && (
            <div className="space-y-3">
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Event Title *"
                className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2 text-xs"
                />
                <input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  placeholder="e.g. 6:00 PM"
                  className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2 text-xs"
                />
              </div>
              <input
                type="text"
                value={eventVenue}
                onChange={(e) => setEventVenue(e.target.value)}
                placeholder="Venue / Address *"
                className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2.5 text-xs"
              />
              <textarea
                value={eventDesc}
                onChange={(e) => setEventDesc(e.target.value)}
                rows={2}
                placeholder="Event details or instructions..."
                className="w-full resize-none rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2.5 text-xs"
              />
            </div>
          )}

          {/* Tab 3: Poll */}
          {activeTab === 'poll' && (
            <div className="space-y-3">
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Ask a question for your community... *"
                className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold"
              />
              <div className="space-y-2">
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const copy = [...pollOptions]
                        copy[idx] = e.target.value
                        setPollOptions(copy)
                      }}
                      placeholder={`Option ${idx + 1} *`}
                      className="flex-1 rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2 text-xs font-semibold"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary"
                >
                  <Plus className="size-3.5" />
                  <span>Add Option</span>
                </button>
              )}
            </div>
          )}

          {/* Tab 4: Need */}
          {activeTab === 'need' && (
            <div className="space-y-3">
              <input
                type="text"
                value={needTitle}
                onChange={(e) => setNeedTitle(e.target.value)}
                placeholder="What do you need help with? *"
                className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold"
              />
              <textarea
                value={needDesc}
                onChange={(e) => setNeedDesc(e.target.value)}
                rows={3}
                placeholder="Describe your need in detail... *"
                className="w-full resize-none rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2.5 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={needUrgency}
                  onChange={(e) => setNeedUrgency(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2 text-xs font-semibold"
                >
                  <option value="High">Urgency: High</option>
                  <option value="Medium">Urgency: Medium</option>
                  <option value="Low">Urgency: Low</option>
                </select>
                <input
                  type="tel"
                  value={needPhone}
                  onChange={(e) => setNeedPhone(e.target.value)}
                  placeholder="Contact Phone (optional)"
                  className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2 text-xs"
                />
              </div>
            </div>
          )}

          {/* Tab 5: Job */}
          {activeTab === 'job' && (
            <div className="space-y-3">
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Job Position Title *"
                className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-bold"
              />
              <input
                type="text"
                value={jobBizName}
                onChange={(e) => setJobBizName(e.target.value)}
                placeholder="Company / Business Name *"
                className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-semibold"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2 text-xs font-semibold"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
                <input
                  type="text"
                  value={jobSalary}
                  onChange={(e) => setJobSalary(e.target.value)}
                  placeholder="Salary (e.g. ₹15,000/mo)"
                  className="w-full rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2 text-xs"
                />
              </div>
              <textarea
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                rows={2}
                placeholder="Job description and requirements..."
                className="w-full resize-none rounded-xl border border-border bg-slate-50 dark:bg-slate-800 p-2.5 text-xs"
              />
            </div>
          )}

          {/* Actions & Submit Button */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3.5">
            {(activeTab === 'normal' || activeTab === 'event') ? (
              <label
                className={`flex items-center gap-1.5 rounded-xl border border-border bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer transition-colors ${
                  selectedFiles.length >= MAX_IMAGES ? 'opacity-40 pointer-events-none' : ''
                }`}
              >
                <ImageIcon className="size-4 text-primary" />
                <span>Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={selectedFiles.length >= MAX_IMAGES || loading}
                />
              </label>
            ) : <div />}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-purple-600 to-pink-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>{loadingStep || 'Publishing...'}</span>
                </>
              ) : (
                <>
                  <span>Publish</span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
