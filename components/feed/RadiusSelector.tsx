'use client'

import React, { useState, useRef, useEffect } from 'react'
import { CircularRadiusOption, DEFAULT_RADIUS_KM } from '@/lib/locationUtils'
import { Navigation, ChevronDown, Check, MapPinOff } from 'lucide-react'

const EXACT_RADIUS_OPTIONS: CircularRadiusOption[] = [1, 3, 5, 10, 25]

interface RadiusSelectorProps {
  selectedRadius: CircularRadiusOption
  onSelectRadius: (radius: CircularRadiusOption) => void
  hasUserLocation: boolean
  onRequestLocation?: () => void
}

export function RadiusSelector({
  selectedRadius,
  onSelectRadius,
  hasUserLocation,
  onRequestLocation,
}: RadiusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!hasUserLocation && onRequestLocation) {
            onRequestLocation()
          }
        }}
        className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-navy shadow-sm transition-all hover:border-primary/40 hover:bg-muted/80"
        title={hasUserLocation ? `Filtering posts within ${selectedRadius} km` : 'Click to enable location-based distance filter'}
      >
        {hasUserLocation ? (
          <Navigation className="size-3.5 text-primary fill-primary/20" />
        ) : (
          <MapPinOff className="size-3.5 text-amber-500" />
        )}
        <span>{selectedRadius} km</span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-44 rounded-2xl border border-border bg-card p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border mb-1">
            Distance Radius
          </div>

          {!hasUserLocation && (
            <div className="px-2.5 py-1.5 text-[10px] text-amber-600 bg-amber-500/10 rounded-lg mb-1 leading-tight">
              Location access required for exact distance calculation.
            </div>
          )}

          <div className="space-y-0.5">
            {EXACT_RADIUS_OPTIONS.map((r) => {
              const isSelected = Number(selectedRadius) === Number(r)
              return (
                <button
                  key={`radius-opt-${r}`}
                  type="button"
                  onClick={() => {
                    onSelectRadius(r)
                    setIsOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-foreground hover:bg-muted font-medium'
                  }`}
                >
                  <span>{r} km</span>
                  {isSelected && <Check className="size-3.5 text-white stroke-[2.5]" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
