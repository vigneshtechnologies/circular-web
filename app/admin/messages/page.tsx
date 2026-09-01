'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { ref, onValue, off, get } from 'firebase/database'
import { db } from '@/lib/firebase'
import { ChatMessage } from '@/lib/types'
import { getUserCommunityLocation } from '@/lib/locationUtils'
import { getUserAvatar } from '@/lib/imageUtils'
import {
  Shield,
  MessageSquare,
  Search,
  User,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  Loader2,
  Clock,
  Eye,
  X,
  RefreshCw,
  MapPin
} from 'lucide-react'

interface AdminConversationItem {
  id: string
  participantIds: string[]
  lastMessageText?: string
  lastMessageSenderId?: string
  lastMessageSenderName?: string
  lastMessageTime?: number
  updatedAt?: number
  unreadCount?: number
}

export default function AdminMessagesPage() {
  const { user, userProfile, isAdmin, loading, publicProfiles } = useAuth()
  const [conversations, setConversations] = useState<AdminConversationItem[]>([])
  const [resolvedProfiles, setResolvedProfiles] = useState<Record<string, any>>({})
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Comprehensive Platform Conversation Discovery
  const loadAllConversations = async () => {
    if (!user || !isAdmin) return
    setLoadingConversations(true)
    setError(null)

    try {
      // A. Fetch all publicProfiles & users to resolve participant identities
      const [pubSnap, usersSnap] = await Promise.all([
        get(ref(db, 'publicProfiles')).catch(() => null),
        get(ref(db, 'users')).catch(() => null),
      ])

      const allPublic = pubSnap && pubSnap.exists() ? pubSnap.val() : {}
      const allUsers = usersSnap && usersSnap.exists() ? usersSnap.val() : {}

      const mergedProfiles: Record<string, any> = { ...allPublic }
      Object.keys(allUsers).forEach((uid) => {
        mergedProfiles[uid] = { ...(mergedProfiles[uid] || {}), ...allUsers[uid] }
      })
      setResolvedProfiles(mergedProfiles)

      // B. Read userConversations for all platform users in parallel batches
      const uids = Array.from(new Set([...Object.keys(mergedProfiles), user.uid]))
      const convMap = new Map<string, AdminConversationItem>()

      const batchSize = 20
      for (let i = 0; i < uids.length; i += batchSize) {
        const batch = uids.slice(i, i + batchSize)
        const results = await Promise.all(
          batch.map((uid) => get(ref(db, `userConversations/${uid}`)).catch(() => null))
        )

        results.forEach((snap, idx) => {
          if (snap && snap.exists()) {
            const uid = batch[idx]
            const userConvs = snap.val()
            Object.keys(userConvs).forEach((convId) => {
              const c = userConvs[convId]
              const existing = convMap.get(convId)

              const participantIds = convId.includes('_')
                ? convId.split('_')
                : [uid, c.otherUserId].filter(Boolean)

              const updatedAt = Math.max(
                existing?.updatedAt || 0,
                c.updatedAt || 0,
                c.lastMessageTime || 0
              )

              const lastMessageText = c.lastMessageText || existing?.lastMessageText || ''
              const lastMessageSenderId = c.lastMessageSenderId || existing?.lastMessageSenderId || ''
              const lastMessageSenderName = c.otherUserName || existing?.lastMessageSenderName || ''
              const lastMessageTime = c.lastMessageTime || existing?.lastMessageTime || updatedAt

              convMap.set(convId, {
                id: convId,
                participantIds,
                lastMessageText,
                lastMessageSenderId,
                lastMessageSenderName,
                lastMessageTime,
                updatedAt,
                unreadCount: (existing?.unreadCount || 0) + (c.unreadCount || 0),
              })
            })
          }
        })
      }

      // Also try conversations root if permitted
      try {
        const convsSnap = await get(ref(db, 'conversations')).catch(() => null)
        if (convsSnap && convsSnap.exists()) {
          const val = convsSnap.val()
          Object.keys(val).forEach((k) => {
            const item = val[k]
            const existing = convMap.get(k)
            const participantIds = item.participantIds || (k.includes('_') ? k.split('_') : [])
            const lastMsg = item.lastMessage || {}

            convMap.set(k, {
              id: k,
              participantIds: participantIds.length > 0 ? participantIds : (existing?.participantIds || []),
              lastMessageText: lastMsg.text || item.lastMessageText || existing?.lastMessageText || '',
              lastMessageSenderId: lastMsg.senderId || item.lastMessageSenderId || existing?.lastMessageSenderId || '',
              lastMessageSenderName: lastMsg.senderName || item.lastMessageSenderName || existing?.lastMessageSenderName || '',
              lastMessageTime: lastMsg.timestamp || item.lastMessageTime || existing?.lastMessageTime || 0,
              updatedAt: item.updatedAt || lastMsg.timestamp || existing?.updatedAt || 0,
              unreadCount: existing?.unreadCount || 0,
            })
          })
        }
      } catch {}

      const sortedList = Array.from(convMap.values()).sort(
        (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
      )
      setConversations(sortedList)
    } catch (err: any) {
      console.error('Error loading admin conversations:', err)
      setError(err?.message || 'Failed to load conversations')
    } finally {
      setLoadingConversations(false)
    }
  }

  useEffect(() => {
    loadAllConversations()
  }, [user, isAdmin])

  // 2. Real-time Message Stream for Selected Conversation
  useEffect(() => {
    if (!selectedConvId || !user || !isAdmin) {
      setMessages([])
      return
    }

    setLoadingMessages(true)
    const messagesRef = ref(db, `messages/${selectedConvId}`)
    const unsub = onValue(
      messagesRef,
      (snap) => {
        if (snap.exists()) {
          const list: ChatMessage[] = []
          snap.forEach((c) => {
            list.push({ id: c.key as string, ...c.val() })
          })
          setMessages(list.sort((a, b) => (a.createdAt || a.timestamp || 0) - (b.createdAt || b.timestamp || 0)))
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        } else {
          setMessages([])
        }
        setLoadingMessages(false)
      },
      (err) => {
        console.error('Error loading messages for conv:', err)
        setLoadingMessages(false)
      }
    )

    return () => unsub()
  }, [selectedConvId, user, isAdmin])

  // 3. Search Filter Logic (Case-Insensitive across Name, Username, Business, Locality, ID, Text)
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return conversations

    return conversations.filter((c) => {
      // A. Match Conversation ID
      if (c.id.toLowerCase().includes(q)) return true

      // B. Match Last Message Text
      if (c.lastMessageText?.toLowerCase().includes(q)) return true

      // C. Match Participant Profiles
      for (const pId of c.participantIds) {
        if (pId.toLowerCase().includes(q)) return true

        const prof = resolvedProfiles[pId] || publicProfiles?.[pId]
        if (prof) {
          if (prof.name?.toLowerCase().includes(q)) return true
          if (prof.username?.toLowerCase().includes(q)) return true
          if (prof.businessName?.toLowerCase().includes(q)) return true
          if (prof.email?.toLowerCase().includes(q)) return true
          if (prof.area?.toLowerCase().includes(q)) return true
          if (prof.areaName?.toLowerCase().includes(q)) return true
          if (prof.city?.toLowerCase().includes(q)) return true
        }
      }

      return false
    })
  }, [conversations, searchQuery, resolvedProfiles, publicProfiles])

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

  if (!isAdmin) {
    return (
      <AppShell currentArea={getUserCommunityLocation(userProfile)}>
        <div className="mx-auto max-w-md py-20 px-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-7" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Access Denied</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            You do not have administrator permissions to access Admin Messages.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
          >
            <span>Return Home</span>
          </Link>
        </div>
      </AppShell>
    )
  }

  const selectedConv = conversations.find((c) => c.id === selectedConvId)

  return (
    <AppShell currentArea={getUserCommunityLocation(userProfile)}>
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
              <Shield className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 dark:text-white">ADMIN MESSAGES</h1>
                <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-[10px] font-black text-blue-600">
                  Oversight
                </span>
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Platform-wide conversation oversight and support management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadAllConversations}
              disabled={loadingConversations}
              className="flex items-center gap-1 rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-all active:scale-95"
              title="Refresh conversation list"
            >
              <RefreshCw className={`size-3.5 ${loadingConversations ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <span className="text-xs font-bold text-muted-foreground">
              {conversations.length} {conversations.length === 1 ? 'Conversation' : 'Conversations'}
            </span>
          </div>
        </div>
      </header>

      {/* Master-Detail Layout */}
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-170px)] min-h-[500px]">
          {/* Left Column: Conversation List */}
          <div
            className={`md:col-span-5 flex flex-col rounded-3xl border border-border bg-card overflow-hidden shadow-sm ${
              selectedConvId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search Bar */}
            <div className="p-3 border-b border-border bg-muted/20">
              <div className="relative flex items-center">
                <Search className="absolute left-3 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user, name, username, or text..."
                  className="w-full rounded-xl border border-border bg-card pl-9 pr-8 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-blue-600 focus:outline-none shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {searchQuery && (
                <div className="mt-2 flex items-center justify-between text-[11px] px-1 text-muted-foreground">
                  <span>
                    Found <strong className="text-slate-900 dark:text-white">{filtered.length}</strong> matching{' '}
                    {filtered.length === 1 ? 'chat' : 'chats'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            {/* Conversation Stream List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {loadingConversations ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-6 animate-spin text-blue-600" />
                  <p>Loading platform conversations...</p>
                </div>
              ) : error ? (
                <div className="py-12 text-center text-xs text-destructive p-4">
                  <AlertCircle className="size-7 mx-auto mb-2" />
                  <p className="font-bold">{error}</p>
                  <button
                    type="button"
                    onClick={loadAllConversations}
                    className="mt-3 inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow"
                  >
                    Retry
                  </button>
                </div>
              ) : conversations.length === 0 ? (
                <div className="py-16 text-center text-xs text-muted-foreground p-4">
                  <MessageSquare className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="font-bold text-slate-900 dark:text-white">No conversations on platform</p>
                  <p className="mt-1 text-[11px]">User-to-user conversations will appear here once started.</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-xs text-muted-foreground p-4">
                  <Search className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="font-bold text-slate-900 dark:text-white">No matching conversations</p>
                  <p className="mt-1 text-[11px]">No chats matched &quot;{searchQuery}&quot;.</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-3 inline-block rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-sm hover:bg-muted"
                  >
                    Show All ({conversations.length})
                  </button>
                </div>
              ) : (
                filtered.map((conv) => {
                  const isSelected = selectedConvId === conv.id
                  const participants = conv.participantIds.map((pId) => {
                    const p = resolvedProfiles[pId] || publicProfiles?.[pId]
                    return {
                      uid: pId,
                      name: p?.name || p?.businessName || `User_${pId.substring(0, 5)}`,
                      avatar: getUserAvatar(p, resolvedProfiles) || '/circular-logo.png',
                      username: p?.username ? `@${p.username}` : '',
                      area: p?.area || p?.areaName || '',
                    }
                  })

                  const title = participants.map((p) => p.name).join(' & ') || conv.id

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full text-left p-3.5 transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-blue-50/90 border-l-4 border-l-blue-600'
                          : 'hover:bg-muted/40'
                      }`}
                    >
                      {/* Avatars */}
                      <div className="flex -space-x-2 shrink-0 mt-0.5">
                        {participants.slice(0, 2).map((p) => (
                          <div
                            key={p.uid}
                            className="relative size-9 overflow-hidden rounded-full ring-2 ring-card bg-primary/10"
                          >
                            <Image src={p.avatar} alt={p.name} fill className="object-cover" />
                          </div>
                        ))}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{title}</h4>
                          <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                            <Clock className="size-3" />
                            {conv.updatedAt
                              ? new Date(conv.updatedAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : ''}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conv.lastMessageText || 'Chat conversation'}
                        </p>

                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[130px]">
                            {conv.id}
                          </span>
                          {participants.some((p) => p.area) && (
                            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 truncate">
                              <MapPin className="size-2.5 text-primary" />
                              <span className="truncate">{participants.find((p) => p.area)?.area}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column: Message History Detail */}
          <div
            className={`md:col-span-7 flex flex-col rounded-3xl border border-border bg-card overflow-hidden shadow-sm ${
              selectedConvId ? 'flex' : 'hidden md:flex'
            }`}
          >
            {selectedConvId && selectedConv ? (
              <>
                {/* Header */}
                <div className="p-3.5 border-b border-border flex items-center justify-between bg-muted/20">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedConvId(null)}
                      className="md:hidden rounded-lg p-1 text-muted-foreground hover:bg-muted"
                    >
                      <ChevronLeft className="size-5" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-900 dark:text-white">Conversation:</span>
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[200px]">
                          {selectedConv.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {selectedConv.participantIds.map((pId) => {
                          const prof = resolvedProfiles[pId] || publicProfiles?.[pId]
                          const pName = prof?.name || `User_${pId.substring(0, 5)}`
                          return (
                            <Link
                              key={pId}
                              href={`/user/${pId}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                            >
                              <User className="size-3" />
                              <span>{pName}</span>
                              <ExternalLink className="size-2.5" />
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Eye className="size-3" />
                      <span>Admin View</span>
                    </span>
                  </div>
                </div>

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-6 animate-spin text-blue-600" />
                      <p>Loading message history...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-20 text-center text-xs text-muted-foreground">
                      <p>No messages recorded in this conversation.</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const senderProfile = resolvedProfiles[m.senderId] || publicProfiles?.[m.senderId]
                      const senderAvatar =
                        getUserAvatar(senderProfile, resolvedProfiles) ||
                        m.senderAvatar ||
                        '/circular-logo.png'
                      const senderName =
                        m.senderName ||
                        senderProfile?.name ||
                        `User_${m.senderId.substring(0, 5)}`

                      return (
                        <div key={m.id} className="flex items-start gap-2.5 max-w-xl">
                          <div className="relative size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-border bg-primary/10 mt-0.5">
                            <Image src={senderAvatar} alt={senderName} fill className="object-cover" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-900 dark:text-white">{senderName}</span>
                              <span className="text-[9px] text-muted-foreground">
                                {new Date(m.createdAt || m.timestamp || Date.now()).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>

                            <div className="mt-1 rounded-2xl border border-border bg-card p-3 text-xs shadow-sm text-foreground">
                              <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </>
            ) : (
              /* No Conversation Selected Placeholder */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <div className="flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <Shield className="size-7 text-blue-600" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Select a Conversation</h3>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground leading-relaxed">
                  Choose a conversation from the left to inspect participant messages, timestamps, and account details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
