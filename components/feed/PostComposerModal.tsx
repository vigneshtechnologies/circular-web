'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { ref, push, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { getUserAvatar } from '@/lib/imageUtils'
import { X, Image as ImageIcon, Sparkles, MapPin, Tag, ArrowRight, Loader2 } from 'lucide-react'

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
  const [text, setText] = useState('')
  const [category, setCategory] = useState<string>('General')
  const [area, setArea] = useState('')
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; preview: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setArea(userProfile?.area || userProfile?.city || '')
      setError(null)

      // Try acquiring browser location for the new post
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserCoords({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            })
          },
          () => {
            // Geolocation not available or denied
          },
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

      // Safe Fallback: Base64 data URL
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!text.trim() && selectedFiles.length === 0) {
      setError('Please add post text or select at least one photo')
      return
    }

    setLoading(true)
    setError(null)
    setLoadingStep('Preparing post...')

    try {
      const { urls, publicIds } = await uploadImages()
      setLoadingStep('Publishing to community...')

      const postsRef = push(ref(db, 'posts'))
      const postId = postsRef.key
      if (!postId) throw new Error('Could not create post record')

      const finalArea = area.trim() || userProfile?.area || userProfile?.city || ''
      const authorAvatar = getUserAvatar(userProfile, publicProfiles) || user.photoURL || ''

      const now = Date.now()
      const postPayload: Record<string, any> = {
        postType: 'regular',
        text: text.trim(),
        category,
        userId: user.uid,
        userEmail: user.email || '',
        userName: userProfile?.name || user.displayName || 'Circular Member',
        profileImage: authorAvatar,
        businessName: userProfile?.businessName || '',
        businessTrustLabel: userProfile?.businessTrustLabel || '',
        showBusinessDetails: userProfile?.showBusinessDetails !== false,
        area: finalArea,
        areaName: finalArea,
        city: userProfile?.city || finalArea,
        latitude: userCoords?.latitude || null,
        longitude: userCoords?.longitude || null,
        radiusKm: 25,
        imageUrl: urls[0] || '',
        imageUrls: urls,
        imageCount: urls.length,
        imagePublicId: publicIds[0] || '',
        imagePublicIds: publicIds,
        likesCount: 0,
        commentsCount: 0,
        createdAt: now,
        updatedAt: now,
        postScope: 'local',
        isAdminPost: false,
        isGlobal: false,
      }

      await set(postsRef, postPayload)

      selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview))
      setText('')
      setSelectedFiles([])
      onClose()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error('Post creation error:', err)
      setError(err.message || 'Failed to create post. Please try again.')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const authorAvatar = getUserAvatar(userProfile, publicProfiles) || '/circular-logo.png'
  const displayPostingArea = area.trim() || userProfile?.area || userProfile?.city || 'your community'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h3 className="text-sm sm:text-base font-bold text-navy">Create Post</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleCreatePost} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* User & Location Info */}
          <div className="flex items-center gap-3">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border">
              <Image
                src={authorAvatar}
                alt="Avatar"
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-navy truncate">
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

          {/* Text Area with Character Counter */}
          <div className="space-y-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="What's happening in your local neighborhood? (Supports English, தமிழ், etc.)"
              className="w-full resize-none rounded-2xl border border-border bg-muted/30 p-3.5 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end text-[10px] text-muted-foreground">
              {text.length}/1000
            </div>
          </div>

          {/* Image Previews Grid */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Photos ({selectedFiles.length}/{MAX_IMAGES})</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {selectedFiles.map((item, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-muted ring-1 ring-border group">
                    <Image src={item.preview} alt={`Preview ${idx + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/75 text-white hover:bg-rose-600 transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selectors Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
              >
                {POST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Area / Locality Input */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Area / Locality
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Rajapalayam, Gandhi Nagar"
                className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Actions & Submit Button */}
          <div className="flex items-center justify-between border-t border-border pt-3.5">
            <label
              className={`flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors ${
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

            <button
              type="submit"
              disabled={loading || (!text.trim() && selectedFiles.length === 0)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-purple-600 to-pink-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>{loadingStep || 'Posting...'}</span>
                </>
              ) : (
                <>
                  <span>Post Now</span>
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
