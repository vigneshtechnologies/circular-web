'use client'

import React from 'react'

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
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      {CIRCULAR_CATEGORIES.map((cat) => {
        const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase()
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              isSelected
                ? 'bg-primary text-white shadow-sm shadow-primary/30 scale-102'
                : 'border border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
