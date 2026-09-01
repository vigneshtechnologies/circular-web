'use client'

import React, { useRef, useEffect } from 'react'
import {
  Sparkles,
  Layers,
  Megaphone,
  Utensils,
  ShoppingBag,
  Wrench,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Calendar,
  Tag,
  HandHeart,
} from 'lucide-react'

export const CIRCULAR_CATEGORIES = [
  { name: 'All', icon: Sparkles, color: 'text-purple-500' },
  { name: 'General', icon: Layers, color: 'text-blue-500' },
  { name: 'News & Updates', icon: Megaphone, color: 'text-pink-500' },
  { name: 'Food', icon: Utensils, color: 'text-orange-500' },
  { name: 'Shopping', icon: ShoppingBag, color: 'text-pink-500' },
  { name: 'Services', icon: Wrench, color: 'text-sky-500' },
  { name: 'Education', icon: GraduationCap, color: 'text-purple-500' },
  { name: 'Medical', icon: HeartPulse, color: 'text-rose-500' },
  { name: 'Jobs', icon: Briefcase, color: 'text-emerald-500' },
  { name: 'Events', icon: Calendar, color: 'text-orange-500' },
  { name: 'Offers', icon: Tag, color: 'text-amber-500' },
  { name: 'Needs', icon: HandHeart, color: 'text-teal-500' },
] as const

export function CategoryFilterBar({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: string
  onSelectCategory: (cat: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeBtnRef = useRef<HTMLButtonElement>(null)

  // Auto-scroll selected category pill into view if off-screen
  useEffect(() => {
    if (activeBtnRef.current && containerRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  }, [selectedCategory])

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-2 overflow-x-auto py-1.5 no-scrollbar scroll-smooth"
    >
      {CIRCULAR_CATEGORIES.map((cat) => {
        const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase()
        const Icon = cat.icon
        return (
          <button
            key={cat.name}
            ref={isSelected ? activeBtnRef : null}
            type="button"
            onClick={() => onSelectCategory(cat.name)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
              isSelected
                ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-400/30 scale-102'
                : 'border border-border bg-card text-slate-700 dark:text-slate-300 hover:border-purple-500/40 hover:bg-muted/80'
            }`}
          >
            <Icon className={`size-3.5 ${isSelected ? 'text-white' : cat.color}`} />
            <span>{cat.name}</span>
          </button>
        )
      })}
    </div>
  )
}
