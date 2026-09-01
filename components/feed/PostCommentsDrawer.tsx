'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { ref, onValue, off, push, set, runTransaction } from 'firebase/database'
import { db } from '@/lib/firebase'
import { PostComment } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'
import { X, Send, MessageSquare } from 'lucide-react'

interface PostCommentsDrawerProps {
  postId: string | null
  onClose: () => void
}

export function PostCommentsDrawer({ postId, onClose }: PostCommentsDrawerProps) {
  const { user, userProfile } = useAuth()
  const [comments, setComments] = useState<PostComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!postId) return

    const commentsRef = ref(db, `postComments/${postId}`)
    const callback = (snap: any) => {
      if (snap.exists()) {
        const list: PostComment[] = []
        snap.forEach((child: any) => {
          list.push({ id: child.key, ...child.val() })
        })
        setComments(list.sort((a, b) => b.createdAt - a.createdAt))
      } else {
        setComments([])
      }
    }

    onValue(commentsRef, callback)
    return () => off(commentsRef)
  }, [postId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postId || !user || !newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      const commentRef = push(ref(db, `postComments/${postId}`))
      const commentData: PostComment = {
        id: commentRef.key as string,
        postId,
        userId: user.uid,
        userName: userProfile?.name || user.displayName || 'Circular Member',
        userAvatar: userProfile?.photoURL || user.photoURL || undefined,
        text: newComment.trim(),
        createdAt: Date.now(),
      }

      await set(commentRef, commentData)
      await runTransaction(ref(db, `posts/${postId}/commentsCount`), (curr) => (curr || 0) + 1)
      setNewComment('')
    } catch (err) {
      console.error('Comment error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (!postId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[80vh] w-full max-w-lg flex-col rounded-3xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Comments</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
              {comments.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No comments yet. Be the first to start the conversation!
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border">
                  <Image
                    src={c.userAvatar || '/circular-logo.png'}
                    alt={c.userName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 rounded-2xl bg-muted/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{c.userName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-foreground">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Composer Form */}
        <form onSubmit={handleSubmit} className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 p-1.5 focus-within:border-primary">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="flex size-8 items-center justify-center rounded-xl bg-primary text-white transition-all hover:bg-primary/90 disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
