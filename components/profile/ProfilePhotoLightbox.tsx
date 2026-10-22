'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, ArrowRight } from 'lucide-react'
import { ProfilePhotoItem } from '@/lib/profileService'
import { useTranslation } from '@/lib/i18n'

interface ProfilePhotoLightboxProps {
  isOpen: boolean
  photos: ProfilePhotoItem[]
  initialIndex?: number
  onClose: () => void
}

export default function ProfilePhotoLightbox({
  isOpen,
  photos,
  initialIndex = 0,
  onClose,
}: ProfilePhotoLightboxProps) {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [captionExpanded, setCaptionExpanded] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, photos.length - 1)))
      setCaptionExpanded(false)
    }
  }, [isOpen, initialIndex, photos.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev))
    setCaptionExpanded(false)
  }, [])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : prev))
    setCaptionExpanded(false)
  }, [photos.length])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goToPrev()
      else if (e.key === 'ArrowRight') goToNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, goToPrev, goToNext])

  if (!isOpen || photos.length === 0) return null

  const currentPhoto = photos[currentIndex] || photos[0]

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return ''
    try {
      return new Date(timestamp).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b border-white/10 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {currentPhoto.authorName && (
            <div className="flex items-center gap-2">
              {currentPhoto.authorAvatar && (
                <img
                  src={currentPhoto.authorAvatar}
                  alt={currentPhoto.authorName}
                  className="w-8 h-8 rounded-full object-cover border border-white/20"
                />
              )}
              <div>
                <p className="text-sm font-bold text-white leading-tight">
                  {currentPhoto.authorName}
                </p>
                {currentPhoto.createdAt > 0 && (
                  <p className="text-xs text-slate-400">
                    {formatTimestamp(currentPhoto.createdAt)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-white tracking-wide">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Main Photo Container with Prev/Next Controls */}
      <div className="relative flex-1 flex items-center justify-center p-4 min-h-0">
        {currentIndex > 0 && (
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-105 z-10"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Center Main Image */}
        <div className="max-w-4xl max-h-[72vh] flex items-center justify-center">
          <img
            src={currentPhoto.imageUrl || currentPhoto.thumbnailUrl}
            alt={currentPhoto.caption || 'Profile photo'}
            className="max-h-[72vh] max-w-full object-contain rounded-md shadow-2xl transition-opacity duration-200"
          />
        </div>

        {currentIndex < photos.length - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-105 z-10"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Details Overlay */}
      <div className="px-4 py-3 bg-black/80 border-t border-white/10 z-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          {currentPhoto.caption && (
            <div
              onClick={() => setCaptionExpanded(!captionExpanded)}
              className="cursor-pointer"
            >
              <p className={`text-sm text-slate-200 ${captionExpanded ? '' : 'line-clamp-2'}`}>
                {currentPhoto.caption}
              </p>
              {currentPhoto.caption.length > 100 && !captionExpanded && (
                <span className="text-xs text-sky-400 hover:underline">...more</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-4 text-xs text-slate-300">
              {currentPhoto.likesCount !== undefined && currentPhoto.likesCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  <span>{currentPhoto.likesCount}</span>
                </div>
              )}
              {currentPhoto.commentsCount !== undefined && currentPhoto.commentsCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-slate-400" />
                  <span>{currentPhoto.commentsCount}</span>
                </div>
              )}
              {currentPhoto.type === 'profile' && (
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-medium">
                  {t.profilePictures || 'Profile Picture'}
                </span>
              )}
              {currentPhoto.type === 'cover' && (
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-medium">
                  Cover Photo
                </span>
              )}
            </div>

            {currentPhoto.postId && (
              <Link
                href={`/post/${currentPhoto.postId}`}
                onClick={onClose}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-semibold shadow transition-colors"
              >
                <span>{t.viewPost || 'View Post'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
