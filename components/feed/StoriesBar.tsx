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
    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
      {/* Current User Story Launcher */}
      <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-1.5 cursor-pointer group hover:border-purple-500/40 hover:bg-muted/60 transition-all shadow-sm">
        <div className="relative size-8 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 shrink-0">
          <div className="relative size-full rounded-full overflow-hidden bg-card">
            <Image src={avatar} alt="Your Status" fill className="object-cover" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow ring-1 ring-card">
            <Plus className="size-2.5 stroke-[3]" />
          </div>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
            Your Status
          </span>
          <span className="text-[9px] text-muted-foreground font-medium">Add Update</span>
        </div>
      </div>

      {/* Community Statuses if active */}
      {statuses.map((item, idx) => {
        const itemAvatar =
          getUserAvatar(item, publicProfiles) || item.mediaUrl || '/circular-logo.png'
        const displayName =
          publicProfiles?.[item.userId]?.name?.split(' ')[0] ||
          item.userName?.split(' ')[0] ||
          'Member'

        // Cycle through Circular accent gradients
        const ringGradients = [
          'from-purple-500 via-pink-500 to-orange-500',
          'from-blue-500 via-teal-500 to-emerald-500',
          'from-pink-500 via-rose-500 to-amber-500',
          'from-indigo-500 via-purple-500 to-pink-500',
        ]
        const ringGradient = ringGradients[idx % ringGradients.length]

        return (
          <div
            key={item.id}
            className="flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-card px-2.5 py-1.5 cursor-pointer group hover:border-pink-500/40 hover:bg-muted/60 transition-all shadow-sm"
          >
            <div className={`relative size-8 rounded-full p-0.5 bg-gradient-to-tr ${ringGradient} shrink-0`}>
              <div className="relative size-full rounded-full overflow-hidden bg-card">
                <Image
                  src={itemAvatar}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <span className="max-w-[85px] truncate text-[11px] font-bold text-slate-800 dark:text-slate-200">
              {displayName}
            </span>
          </div>
        )
      })}
    </div>
  )
}
