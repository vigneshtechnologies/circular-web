'use client'

import React from 'react'
import { Check } from 'lucide-react'

export const CIRCULAR_CATEGORIES = [
  'All',
  'General',
  'News & Updates',
  'Food',
  'Shopping',
  'Services',
  'Education',
  'Medical',
  'Jobs',
  'Events',
  'Offers',
  'Needs',
] as const

export function CategoryFilterBar({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: string
  onSelectCategory: (cat: string) => void
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1.5 no-scrollbar scroll-smooth">
      {CIRCULAR_CATEGORIES.map((cat) => {
        const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase()
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`group relative shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all duration-150 ${
              isSelected
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/40 scale-102'
                : 'border border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            {isSelected && (
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
            )}
            <span>{cat}</span>
          </button>
        )
      })}
    </div>
  )
}
