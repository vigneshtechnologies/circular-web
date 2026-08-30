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
  const { user, userProfile } = useAuth()
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
        console.error('Error fetching statuses:', err)
      }
    }
    fetchStatuses()
  }, [])

  const avatar = getUserAvatar(userProfile) || '/circular-logo.png'

  return (
    <div className="flex items-center gap-3 overflow-x-auto py-1 no-scrollbar">
      {/* Current User Story Launcher */}
      <div className="flex shrink-0 flex-col items-center gap-1 cursor-pointer group">
        <div className="relative size-13 rounded-full p-0.5 ring-2 ring-dashed ring-primary/40 transition-all group-hover:ring-primary">
          <div className="relative size-full overflow-hidden rounded-full bg-muted">
            <Image
              src={avatar}
              alt="Your Story"
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute bottom-0 right-0 flex size-4 items-center justify-center rounded-full bg-primary text-white shadow">
            <Plus className="size-3 stroke-[3]" />
          </div>
        </div>
        <span className="max-w-[64px] truncate text-[10px] font-medium text-muted-foreground">
          Your Story
        </span>
      </div>

      {/* Community Statuses */}
      {statuses.map((item) => (
        <div key={item.id} className="flex shrink-0 flex-col items-center gap-1 cursor-pointer group">
          <div className="relative size-13 rounded-full p-0.5 ring-2 ring-pink-500 transition-all group-hover:scale-105">
            <div className="relative size-full overflow-hidden rounded-full bg-muted">
              <Image
                src={item.userAvatar || item.mediaUrl || '/circular-logo.png'}
                alt={item.userName || 'Member'}
                fill
                className="object-cover"
              />
            </div>
          </div>
          <span className="max-w-[64px] truncate text-[10px] font-medium text-foreground">
            {item.userName?.split(' ')[0] || 'Member'}
          </span>
        </div>
      ))}
    </div>
  )
}
