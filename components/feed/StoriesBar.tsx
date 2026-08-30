'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { ref, get, query, limitToLast } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { getUserAvatar } from '@/lib/imageUtils'
import { Plus } from 'lucide-react'

interface UserStatus {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  mediaUrl?: string
  text?: string
  createdAt: number
}

export function StoriesBar() {
  const { userProfile, publicProfiles } = useAuth()
  const [statuses, setStatuses] = useState<UserStatus[]>([])

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const snap = await get(query(ref(db, 'statuses'), limitToLast(20)))
        if (snap.exists()) {
          const list: UserStatus[] = []
          const now = Date.now()
          const oneDayAgo = now - 24 * 60 * 60 * 1000
          snap.forEach((child) => {
            const val = child.val()
            if (val.createdAt && val.createdAt > oneDayAgo) {
              list.push({ id: child.key as string, ...val })
            }
          })
          setStatuses(list.reverse())
        }
      } catch (err) {
        console.warn('Statuses fetch warning:', err)
      }
    }
    fetchStatuses()
  }, [])

  const avatar = getUserAvatar(userProfile, publicProfiles) || '/circular-logo.png'

  return (
    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
      {/* Current User Story Launcher */}
      <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border/70 bg-card px-2.5 py-1.5 cursor-pointer group hover:border-primary/40 hover:bg-muted/50 transition-all">
        <div className="relative size-7 rounded-full overflow-hidden bg-muted ring-1 ring-primary/30">
          <Image src={avatar} alt="Your Story" fill className="object-cover" />
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-navy group-hover:text-primary">
          <Plus className="size-3 text-primary stroke-[3]" />
          <span>Add Story</span>
        </div>
      </div>

      {/* Community Statuses if active */}
      {statuses.map((item) => {
        const itemAvatar =
          getUserAvatar(item, publicProfiles) || item.mediaUrl || '/circular-logo.png'
        const displayName =
          publicProfiles?.[item.userId]?.name?.split(' ')[0] ||
          item.userName?.split(' ')[0] ||
          'Member'

        return (
          <div
            key={item.id}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-border/70 bg-card px-2.5 py-1.5 cursor-pointer group hover:border-pink-500/40 hover:bg-muted/50 transition-all"
          >
            <div className="relative size-7 rounded-full overflow-hidden bg-muted ring-2 ring-pink-500">
              <Image
                src={itemAvatar}
                alt={displayName}
                fill
                className="object-cover"
              />
            </div>
            <span className="max-w-[80px] truncate text-[11px] font-semibold text-foreground">
              {displayName}
            </span>
          </div>
        )
      })}
    </div>
  )
}
