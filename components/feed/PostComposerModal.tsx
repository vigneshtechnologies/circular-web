'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { ref, push, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { Post } from '@/lib/types'
import { X, Image as ImageIcon, Sparkles, MapPin, Tag, ArrowRight } from 'lucide-react'

const categories = [
  'General',
  'Business',
  'Jobs',
  'Needs',
  'Events',
  'Local News',
  'Offers',
]

interface PostComposerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PostComposerModal({ isOpen, onClose, onSuccess }: PostComposerModalProps) {
  const { user, userProfile } = useAuth()
  const [text, setText] = useState('')
  const [category, setCategory] = useState('General')
  const [area, setArea] = useState(userProfile?.area || 'Rajapalayam')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!text.trim() && !imagePreview) {
      setError('Please add text or an image')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const postsRef = push(ref(db, 'posts'))
      const newPost: Post = {
        id: postsRef.key as string,
        userId: user.uid,
        userEmail: user.email || undefined,
        userName: userProfile?.name || user.displayName || 'Circular Member',
        profileImage: userProfile?.photoURL || user.photoURL || undefined,
        text: text.trim(),
        category,
        area: area.trim() || 'Rajapalayam',
        imageUrl: imagePreview || undefined,
        createdAt: Date.now(),
        likesCount: 0,
        commentsCount: 0,
        postType: 'regular',
      }

      await set(postsRef, newPost)
      setText('')
      setImagePreview(null)
      onClose()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to create post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h3 className="text-base font-bold text-navy">Create Post</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreatePost} className="p-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="relative size-10 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border">
              <Image
                src={userProfile?.photoURL || '/circular-logo.png'}
                alt="Avatar"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="text-xs font-bold text-navy">
                {userProfile?.name || 'Circular Member'}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Posting to <span className="font-semibold text-primary">{area}</span>
              </div>
            </div>
          </div>

          {/* Post Text Area */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="What's happening in your local neighborhood?"
            className="w-full resize-none rounded-2xl border border-border bg-muted/30 p-3.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
              <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Selectors Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Category Select */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Area Input */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Area / Locality
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Rajapalayam"
                className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Upload & Actions */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
              <ImageIcon className="size-4 text-primary" />
              <span>Add Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={loading || (!text.trim() && !imagePreview)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-purple-600 to-pink-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:opacity-95 disabled:opacity-50"
            >
              <span>{loading ? 'Posting...' : 'Post Now'}</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
