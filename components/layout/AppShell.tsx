'use client'

import React, { useState } from 'react'
import { SidebarNav } from './SidebarNav'
import { RightSidebar } from './RightSidebar'
import { MobileNav } from './MobileNav'
import { PostComposerModal } from '@/components/feed/PostComposerModal'
import { PostCommentsDrawer } from '@/components/feed/PostCommentsDrawer'
import { useAuth } from '@/context/AuthContext'

interface AppShellProps {
  children: React.ReactNode
  currentArea?: string
  onRefreshFeed?: () => void
}

export function AppShell({ children, currentArea, onRefreshFeed }: AppShellProps) {
  const { userProfile } = useAuth()
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null)

  const resolvedArea = currentArea?.trim() || userProfile?.area || userProfile?.city || ''

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left Navigation Sidebar (Desktop & Tablet) */}
      <div className="hidden md:flex shrink-0">
        <SidebarNav onOpenPostComposer={() => setIsComposerOpen(true)} />
      </div>

      {/* Center Main Scrollable Content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-6">
        {children}
      </main>

      {/* Right Local Info Sidebar (Large Desktop) */}
      <RightSidebar currentArea={resolvedArea} />

      {/* Mobile Bottom Navigation */}
      <MobileNav onOpenPostComposer={() => setIsComposerOpen(true)} />

      {/* Modals */}
      <PostComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSuccess={() => {
          if (onRefreshFeed) onRefreshFeed()
        }}
      />

      <PostCommentsDrawer
        postId={commentsPostId}
        onClose={() => setCommentsPostId(null)}
      />
    </div>
  )
}
