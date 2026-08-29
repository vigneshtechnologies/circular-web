'use client'

import React from 'react'

const categories = [
  'All',
  'Business',
  'Jobs',
  'Needs',
  'Events',
  'Local News',
  'Offers',
  'General',
]

export function CategoryFilterBar({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: string
  onSelectCategory: (cat: string) => void
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              isSelected
                ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
