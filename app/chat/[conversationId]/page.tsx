'use client'

import React, { useState, useEffect, useRef, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { ref, onValue, off, push, set, update, get } from 'firebase/database'
import { db } from '@/lib/firebase'
import { ChatMessage, UserProfile } from '@/lib/types'
import { ArrowLeft, Send, User } from 'lucide-react'

export default function ChatRoomPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params)
  const { user, userProfile, loading } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Identify other user UID from conversationId (which is uid1_uid2)
  const otherUid = conversationId.split('_').find((id) => id !== user?.uid)

  useEffect(() => {
    if (!otherUid) return
    get(ref(db, `publicProfiles/${otherUid}`)).then((snap) => {
      if (snap.exists()) {
        setOtherUser(snap.val())
      }
    })
  }, [otherUid])

  useEffect(() => {
    if (!conversationId || !user) return

    const messagesRef = ref(db, `messages/${conversationId}`)
    const cb = (snap: any) => {
      if (snap.exists()) {
        const list: ChatMessage[] = []
        snap.forEach((c: any) => {
          list.push({ id: c.key as string, ...c.val() })
        })
        setMessages(list)
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        setMessages([])
      }
    }

    onValue(messagesRef, cb)

    // Clear unread count on open
    update(ref(db, `userConversations/${user.uid}/${conversationId}`), { unreadCount: 0 })

    return () => off(messagesRef)
  }, [conversationId, user])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !inputMessage.trim()) return

    const text = inputMessage.trim()
    setInputMessage('')

    try {
      const newMsgRef = push(ref(db, `messages/${conversationId}`))
      const now = Date.now()
      const msgData: ChatMessage = {
        id: newMsgRef.key as string,
        conversationId,
        senderId: user.uid,
        senderName: userProfile?.name || 'Member',
        senderAvatar: userProfile?.photoURL || undefined,
        text,
        createdAt: now,
        read: false,
      }
      await set(newMsgRef, msgData)

      // Update both userConversations
      const myConvUpdate = {
        conversationId,
        otherUserId: otherUid || '',
        otherUserName: otherUser?.name || 'Member',
        otherUserAvatar: otherUser?.photoURL || '',
        lastMessageText: text,
        lastMessageSenderId: user.uid,
        lastMessageTime: now,
        unreadCount: 0,
        updatedAt: now,
      }
      await set(ref(db, `userConversations/${user.uid}/${conversationId}`), myConvUpdate)

      if (otherUid) {
        const otherConvRef = ref(db, `userConversations/${otherUid}/${conversationId}`)
        const existing = await get(otherConvRef)
        const currentUnread = existing.exists() ? (existing.val().unreadCount || 0) : 0
        const otherConvUpdate = {
          conversationId,
          otherUserId: user.uid,
          otherUserName: userProfile?.name || 'Member',
          otherUserAvatar: userProfile?.photoURL || '',
          lastMessageText: text,
          lastMessageSenderId: user.uid,
          lastMessageTime: now,
          unreadCount: currentUnread + 1,
          updatedAt: now,
        }
        await set(otherConvRef, otherConvUpdate)
      }
    } catch (e) {
      console.error('Error sending message:', e)
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

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top Chat Bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <ArrowLeft className="size-5" />
          </Link>

          <Link href={otherUid ? `/user/${otherUid}` : '#'} className="flex items-center gap-2.5">
            <div className="relative size-10 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border">
              <Image
                src={otherUser?.photoURL || '/circular-logo.png'}
                alt={otherUser?.name || 'Member'}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy">{otherUser?.name || 'Circular Member'}</h2>
              <p className="text-[10px] text-muted-foreground">@{otherUser?.username || 'member'}</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 md:px-8">
        {messages.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <p>No messages yet. Send a greeting to start chatting!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === user.uid
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-sm md:max-w-md ${
                    isMe
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-card border border-border text-foreground rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  <span
                    className={`mt-1 block text-[9px] ${
                      isMe ? 'text-blue-100 text-right' : 'text-muted-foreground text-left'
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            disabled={!inputMessage.trim()}
            className="flex size-10 items-center justify-center rounded-2xl bg-primary text-white shadow transition-all hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </form>
      </footer>
    </div>
  )
}
