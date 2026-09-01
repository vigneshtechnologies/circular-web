'use client'

import React, { useState, useEffect, useRef, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { ref, onValue, off, push, set, update, get } from 'firebase/database'
import { db } from '@/lib/firebase'
import { ChatMessage, UserProfile } from '@/lib/types'
import { ArrowLeft, Send, User, ChevronLeft } from 'lucide-react'

export default function ChatRoomPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params)
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Identify other user UID from conversationId (which is uid1_uid2)
  const otherUid = conversationId.includes('_')
    ? conversationId.split('_').find((id) => id !== user?.uid)
    : null

  // 1. Fetch other user profile data
  useEffect(() => {
    if (!otherUid) return

    const loadOtherProfile = async () => {
      const pubSnap = await get(ref(db, `publicProfiles/${otherUid}`)).catch(() => null)
      if (pubSnap && pubSnap.exists()) {
        setOtherUser(pubSnap.val())
        return
      }
      const userSnap = await get(ref(db, `users/${otherUid}`)).catch(() => null)
      if (userSnap && userSnap.exists()) {
        setOtherUser(userSnap.val())
      }
    }

    loadOtherProfile()
  }, [otherUid])

  // 2. Real-time subscription to messages in this conversation
  useEffect(() => {
    if (!conversationId || !user) return

    const messagesRef = ref(db, `messages/${conversationId}`)
    const cb = (snap: any) => {
      if (snap.exists()) {
        const list: ChatMessage[] = []
        snap.forEach((c: any) => {
          list.push({ id: c.key as string, ...c.val() })
        })
        setMessages(list.sort((a, b) => (a.createdAt || a.timestamp || 0) - (b.createdAt || b.timestamp || 0)))
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        setMessages([])
      }
    }

    onValue(messagesRef, cb)

    // Clear unread count on conversation open
    update(ref(db, `userConversations/${user.uid}/${conversationId}`), { unreadCount: 0 }).catch(() => null)

    return () => off(messagesRef)
  }, [conversationId, user])

  // 3. Send Message Handler (Multi-path atomic updates matching Android schema)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !inputMessage.trim() || sending) return

    const text = inputMessage.trim()
    setInputMessage('')
    setSending(true)

    try {
      const newMsgRef = push(ref(db, `messages/${conversationId}`))
      const now = Date.now()
      const msgId = newMsgRef.key as string

      const msgData: ChatMessage = {
        id: msgId,
        conversationId,
        senderId: user.uid,
        senderName: userProfile?.name || userProfile?.username || 'Member',
        senderAvatar: userProfile?.photoURL || userProfile?.profileImage || '',
        text,
        createdAt: now,
        timestamp: now,
        read: false,
      }

      await set(newMsgRef, msgData)

      // Update conversations parent metadata
      const convUpdates: Record<string, any> = {
        [`conversations/${conversationId}/lastMessage`]: {
          text,
          senderId: user.uid,
          senderName: userProfile?.name || 'Member',
          timestamp: now,
        },
        [`conversations/${conversationId}/updatedAt`]: now,
      }

      // Update sender's userConversations
      convUpdates[`userConversations/${user.uid}/${conversationId}`] = {
        conversationId,
        otherUserId: otherUid || '',
        otherUserName: otherUser?.name || otherUser?.businessName || otherUser?.username || 'Member',
        otherUserAvatar: otherUser?.photoURL || otherUser?.profileImage || '',
        lastMessageText: text,
        lastMessageSenderId: user.uid,
        lastMessageTime: now,
        unreadCount: 0,
        updatedAt: now,
      }

      // Update recipient's userConversations
      if (otherUid) {
        const otherConvRef = ref(db, `userConversations/${otherUid}/${conversationId}`)
        const existing = await get(otherConvRef).catch(() => null)
        const currentUnread = existing && existing.exists() ? (existing.val().unreadCount || 0) : 0

        convUpdates[`userConversations/${otherUid}/${conversationId}`] = {
          conversationId,
          otherUserId: user.uid,
          otherUserName: userProfile?.name || userProfile?.businessName || userProfile?.username || 'Member',
          otherUserAvatar: userProfile?.photoURL || userProfile?.profileImage || '',
          lastMessageText: text,
          lastMessageSenderId: user.uid,
          lastMessageTime: now,
          unreadCount: currentUnread + 1,
          updatedAt: now,
        }
      }

      await update(ref(db), convUpdates)
    } catch (e) {
      console.error('Error sending message:', e)
    } finally {
      setSending(false)
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

  const isParticipant = conversationId.includes('_')
    ? conversationId.split('_').includes(user.uid)
    : true

  if (!isParticipant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Private Conversation</h2>
        <p className="mt-1 text-xs text-muted-foreground">You do not have access to this conversation.</p>
        <Link href="/messages" className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow">
          Back to Messages
        </Link>
      </div>
    )
  }

  const otherAvatar = otherUser?.photoURL || otherUser?.profileImage || '/circular-logo.png'
  const otherName = otherUser?.name || otherUser?.businessName || 'Circular Member'
  const otherUsername = otherUser?.username ? `@${otherUser.username}` : ''

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top Chat Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back()
              } else {
                router.push('/messages')
              }
            }}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted transition-colors"
            title="Go back"
          >
            <ChevronLeft className="size-5" />
          </button>

          <Link
            href={otherUid ? `/user/${otherUid}` : '#'}
            className="flex items-center gap-2.5 group focus:outline-none"
            title="View member profile"
          >
            <div className="relative size-10 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border group-hover:ring-primary transition-all">
              <Image
                src={otherAvatar}
                alt={otherName}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate max-w-[200px] sm:max-w-xs">
                {otherName}
              </h2>
              {otherUsername ? (
                <p className="text-[10px] font-medium text-muted-foreground">{otherUsername}</p>
              ) : (
                <p className="text-[10px] font-medium text-emerald-600">Active Member</p>
              )}
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {otherUid && (
            <Link
              href={`/user/${otherUid}`}
              className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-all"
            >
              <User className="size-3.5" />
              <span>View Profile</span>
            </Link>
          )}
          <Link
            href="/messages"
            className="rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-all"
          >
            <span>All Messages</span>
          </Link>
        </div>
      </header>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 md:px-8">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-xs text-muted-foreground gap-2">
            <div className="flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <Send className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">Start conversation with {otherName}</h3>
            <p className="max-w-xs text-muted-foreground">
              Send a friendly greeting or inquiry. Messages are private and delivered in real-time.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === user.uid
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-sm md:max-w-md ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-card border border-border text-foreground rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  <span
                    className={`mt-1 block text-[9px] ${
                      isMe ? 'text-blue-100 text-right' : 'text-muted-foreground text-left'
                    }`}
                  >
                    {new Date(m.createdAt || m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input */}
      <footer className="border-t border-border bg-card p-3 md:px-8">
        <form onSubmit={handleSendMessage} className="mx-auto flex max-w-3xl items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-2xl border border-border bg-muted/60 px-4 py-2.5 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || sending}
            className="flex size-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </form>
      </footer>
    </div>
  )
}
