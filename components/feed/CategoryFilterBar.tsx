'use client'

import React, { useRef, useEffect } from 'react'
import { getCategoryDef, getCategoryPillClass } from '@/lib/categoryColors'
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
  Cpu,
} from 'lucide-react'

export const CIRCULAR_CATEGORIES = [
  { name: 'All', icon: Sparkles, color: 'text-purple-500' },
  { name: 'General', icon: Layers, color: 'text-blue-500' },
  { name: 'Food', icon: Utensils, color: 'text-orange-500' },
  { name: 'Shopping', icon: ShoppingBag, color: 'text-pink-500' },
  { name: 'Services', icon: Wrench, color: 'text-teal-500' },
  { name: 'Education', icon: GraduationCap, color: 'text-purple-500' },
  { name: 'Medical', icon: HeartPulse, color: 'text-emerald-500' },
  { name: 'Jobs', icon: Briefcase, color: 'text-emerald-500' },
  { name: 'Events', icon: Calendar, color: 'text-orange-500' },
  { name: 'Offers', icon: Tag, color: 'text-amber-500' },
  { name: 'Needs', icon: HandHeart, color: 'text-rose-500' },
  { name: 'Technology', icon: Cpu, color: 'text-violet-500' },
  { name: 'News & Updates', icon: Megaphone, color: 'text-indigo-500' },
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
        const pillClass = getCategoryPillClass(cat.name, isSelected)

        return (
          <button
            key={cat.name}
            ref={isSelected ? activeBtnRef : null}
            type="button"
            onClick={() => onSelectCategory(cat.name)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all duration-150 ${pillClass} ${
              isSelected ? 'scale-102' : ''
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
