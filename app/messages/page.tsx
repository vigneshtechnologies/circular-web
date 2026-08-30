'use client'

import { getUserCommunityLocation } from '@/lib/locationUtils'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { ref, onValue, off, get, query, limitToLast } from 'firebase/database'
import { db } from '@/lib/firebase'
import { ChatConversation, UserProfile } from '@/lib/types'
import { MessageSquare, Search, PlusCircle, User, Sparkles } from 'lucide-react'

export default function MessagesPage() {
  const { user, userProfile, loading } = useAuth()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [usersList, setUsersList] = useState<UserProfile[]>([])

  useEffect(() => {
    if (!user) return

    const convRef = ref(db, `userConversations/${user.uid}`)
    const cb = (snap: any) => {
      if (snap.exists()) {
        const list: ChatConversation[] = []
        snap.forEach((c: any) => {
          list.push({ conversationId: c.key as string, ...c.val() })
        })
        setConversations(list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)))
      } else {
        setConversations([])
      }
    }

    onValue(convRef, cb)
    return () => off(convRef)
  }, [user])

  const openNewChatDialog = async () => {
    setIsNewChatOpen(true)
    try {
      const snap = await get(query(ref(db, 'publicProfiles'), limitToLast(30)))
      if (snap.exists()) {
        const list: UserProfile[] = []
        snap.forEach((c) => {
          if (c.key !== user?.uid) {
            list.push({ uid: c.key as string, ...c.val() })
          }
        })
        setUsersList(list)
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <AuthPortal />
  }

  const filtered = conversations.filter((c) => {
    const q = searchQuery.toLowerCase().trim()
    return (
      !q ||
      c.otherUserName?.toLowerCase().includes(q) ||
      c.lastMessageText?.toLowerCase().includes(q)
    )
  })

  return (
    <AppShell currentArea={getUserCommunityLocation(userProfile)}>
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-navy">Messages</h1>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Chat directly with neighbors and local businesses
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openNewChatDialog}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90"
          >
            <PlusCircle className="size-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-3 relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-xl border border-border bg-muted/60 py-2 pl-10 pr-4 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
          />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <MessageSquare className="size-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-navy">No messages yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Connect with local businesses or message a friend to start a conversation!
            </p>
            <button
              type="button"
              onClick={openNewChatDialog}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow"
            >
              <PlusCircle className="size-4" />
              <span>Start a Chat</span>
            </button>
          </div>
        ) : (
          filtered.map((conv) => (
            <Link
              key={conv.conversationId}
              href={`/chat/${conv.conversationId}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-all hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border">
                  <Image
                    src={conv.otherUserAvatar || '/circular-logo.png'}
                    alt={conv.otherUserName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-bold text-navy">{conv.otherUserName}</h3>
                  <p className="truncate text-xs text-muted-foreground">{conv.lastMessageText || 'Chat started'}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-muted-foreground">
                  {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
                {conv.unreadCount > 0 && (
                  <span className="mt-1 block rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-white">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-base font-bold text-navy border-b border-border pb-3">Start a Conversation</h2>
            <div className="mt-3 max-h-80 overflow-y-auto space-y-2">
              {usersList.map((u) => {
                const convId = [user.uid, u.uid].sort().join('_')
                return (
                  <Link
                    key={u.uid}
                    href={`/chat/${convId}`}
                    onClick={() => setIsNewChatOpen(false)}
                    className="flex items-center justify-between rounded-xl p-2.5 hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border">
                        <Image src={u.photoURL || '/circular-logo.png'} alt={u.name} fill className="object-cover" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-navy">{u.name}</h4>
                        <p className="text-[11px] text-muted-foreground">@{u.username || 'member'}</p>
                      </div>
                    </div>
                    <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">Chat</span>
                  </Link>
                )
              })}
            </div>
            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={() => setIsNewChatOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
