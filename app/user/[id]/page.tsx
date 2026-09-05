'use client'

import React, { useState, useEffect, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { ref, get, query, orderByChild, equalTo, onValue, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Post, BusinessProfile, UserProfile } from '@/lib/types'
import { PostCard } from '@/components/feed/PostCard'
import { PostGridTile } from '@/components/profile/PostGridTile'
import { PostCommentsDrawer } from '@/components/feed/PostCommentsDrawer'
import { ImageViewerModal } from '@/components/ui/ImageViewerModal'
import { getUserAvatar } from '@/lib/imageUtils'
import {
  User,
  MapPin,
  MessageCircle,
  UserPlus,
  UserCheck,
  Share2,
  Edit3,
  Shield,
  Sparkles,
  ArrowLeft,
  Loader2,
  Check,
  LayoutGrid,
  List,
} from 'lucide-react'

const VIEW_PREF_KEY = 'circular_profile_view'

type PageProps = {
  params: Promise<{ id: string }>
}

export default function UserProfilePage({ params }: PageProps) {
  const resolvedParams = use(params)
  const targetUserId = resolvedParams.id
  const router = useRouter()

  const { user: currentUser, publicProfiles } = useAuth()
  const isOwnProfile = Boolean(currentUser && currentUser.uid === targetUserId)

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Follow State
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  // Content State
  const [activeTab, setActiveTab] = useState<'posts' | 'businesses'>('posts')
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [userBusinesses, setUserBusinesses] = useState<BusinessProfile[]>([])
  const [postsLoading, setPostsLoading] = useState(true)

  // Modals & Drawers
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null)
  const [imageViewerSrc, setImageViewerSrc] = useState<string | null>(null)
  const [copiedShare, setCopiedShare] = useState(false)

  // Grid/Feed toggle
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('grid')
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)

  // Restore viewMode from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_PREF_KEY)
      if (saved === 'feed' || saved === 'grid') setViewMode(saved)
    } catch {}
  }, [])

  // Persist viewMode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_PREF_KEY, viewMode)
    } catch {}
  }, [viewMode])

  // 1. Load User Profile from publicProfiles and users node

  useEffect(() => {
    if (!targetUserId) return
    setLoading(true)
    setNotFound(false)

    const loadProfileData = async () => {
      try {
        let loadedProfile: any = null

        // A. publicProfiles/{id}
        const pubSnap = await get(ref(db, `publicProfiles/${targetUserId}`)).catch(() => null)
        if (pubSnap && pubSnap.exists()) {
          loadedProfile = { uid: targetUserId, ...pubSnap.val() }
        }

        // B. fallback to users/{id}
        if (!loadedProfile) {
          const userSnap = await get(ref(db, `users/${targetUserId}`)).catch(() => null)
          if (userSnap && userSnap.exists()) {
            loadedProfile = { uid: targetUserId, ...userSnap.val() }
          }
        }

        if (loadedProfile) {
          setProfile(loadedProfile)
          setNotFound(false)
        } else {
          setProfile(null)
          setNotFound(true)
        }
      } catch (err) {
        console.error('Error loading user profile:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [targetUserId])

  // 2. Real-time Followers & Following Counts
  useEffect(() => {
    if (!targetUserId) return

    const followersRef = ref(db, `followers/${targetUserId}`)
    const unsubFollowers = onValue(followersRef, (snap) => {
      setFollowersCount(snap.exists() ? Object.keys(snap.val()).length : 0)
    })

    const followingRef = ref(db, `following/${targetUserId}`)
    const unsubFollowing = onValue(followingRef, (snap) => {
      setFollowingCount(snap.exists() ? Object.keys(snap.val()).length : 0)
    })

    return () => {
      unsubFollowers()
      unsubFollowing()
    }
  }, [targetUserId])

  // 3. Real-time Follow Status
  useEffect(() => {
    if (!currentUser || !targetUserId || isOwnProfile) {
      setIsFollowing(false)
      return
    }

    const followStatusRef = ref(db, `followers/${targetUserId}/${currentUser.uid}`)
    const unsubStatus = onValue(followStatusRef, (snap) => {
      setIsFollowing(snap.exists() && Boolean(snap.val()))
    })

    return () => unsubStatus()
  }, [currentUser, targetUserId, isOwnProfile])

  // 4. Load Public Posts and Businesses created by this user
  useEffect(() => {
    if (!targetUserId) return
    setPostsLoading(true)

    const loadUserContent = async () => {
      try {
        // A. Load User Posts
        let loadedPosts: Post[] = []
        try {
          const pSnap = await get(query(ref(db, 'posts'), orderByChild('userId'), equalTo(targetUserId)))
          if (pSnap.exists()) {
            pSnap.forEach((c) => {
              loadedPosts.push({ id: c.key as string, ...c.val() })
            })
          }
        } catch {
          // Fallback: scan all posts if index is building
          const allSnap = await get(ref(db, 'posts')).catch(() => null)
          if (allSnap && allSnap.exists()) {
            const data = allSnap.val()
            Object.keys(data).forEach((k) => {
              if (data[k].userId === targetUserId) {
                loadedPosts.push({ id: k, ...data[k] })
              }
            })
          }
        }

        setUserPosts(loadedPosts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))

        // B. Load User Businesses
        let loadedBiz: BusinessProfile[] = []
        try {
          const bSnap = await get(query(ref(db, 'businessProfiles'), orderByChild('userId'), equalTo(targetUserId)))
          if (bSnap.exists()) {
            bSnap.forEach((c) => {
              loadedBiz.push({ id: c.key as string, ...c.val() })
            })
          }
        } catch {
          const allBizSnap = await get(ref(db, 'businessProfiles')).catch(() => null)
          if (allBizSnap && allBizSnap.exists()) {
            const data = allBizSnap.val()
            Object.keys(data).forEach((k) => {
              if (data[k].userId === targetUserId || data[k].ownerId === targetUserId) {
                loadedBiz.push({ id: k, ...data[k] })
              }
            })
          }
        }
        setUserBusinesses(loadedBiz)
      } catch (err) {
        console.error('Error fetching user content:', err)
      } finally {
        setPostsLoading(false)
      }
    }

    loadUserContent()
  }, [targetUserId])

  // 5. Follow Toggle Handler
  const handleFollowToggle = async () => {
    if (!currentUser) {
      router.push('/login')
      return
    }
    if (isOwnProfile || followLoading) return

    setFollowLoading(true)
    try {
      const updates: Record<string, boolean | null> = {}
      if (isFollowing) {
        updates[`followers/${targetUserId}/${currentUser.uid}`] = null
        updates[`following/${currentUser.uid}/${targetUserId}`] = null
      } else {
        updates[`followers/${targetUserId}/${currentUser.uid}`] = true
        updates[`following/${currentUser.uid}/${targetUserId}`] = true
      }
      await update(ref(db), updates)
    } catch (err) {
      console.error('Error toggling follow:', err)
    } finally {
      setFollowLoading(false)
    }
  }

  // 6. Direct Message Handler
  const handleStartChat = () => {
    if (!currentUser) {
      router.push('/login')
      return
    }
    const conversationId = [currentUser.uid, targetUserId].sort().join('_')
    router.push(`/chat/${conversationId}`)
  }

  // 7. Share Profile
  const handleShareProfile = async () => {
    const canonicalUrl = `https://circularapp.in/user/${targetUserId}`
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(canonicalUrl)
        setCopiedShare(true)
        setTimeout(() => setCopiedShare(false), 2500)
      }
    } catch (err) {
      console.error('Failed to copy share link:', err)
    }
  }

  const avatarUrl = getUserAvatar(profile, publicProfiles) || '/circular-logo.png'
  const displayName = profile?.name || profile?.businessName || 'Circular Member'
  const username = profile?.username ? `@${profile.username}` : `@user_${targetUserId.substring(0, 6)}`
  const locality = profile?.area || profile?.areaName || profile?.city || 'Local Member'
  const userBio = profile?.bio || ''

  if (loading) {
    return (
      <AppShell currentArea="Local Community">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted-foreground">Loading member profile...</p>
        </div>
      </AppShell>
    )
  }

  if (notFound || !profile) {
    return (
      <AppShell currentArea="Local Community">
        <div className="mx-auto max-w-2xl px-4 py-12 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
            <User className="size-8" />
          </div>
          <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">User Not Found</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            This profile does not exist or may have been deactivated.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Feed</span>
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-sm hover:bg-muted"
            >
              <span>Search Members</span>
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell currentArea={locality}>
      {/* Top Header Banner (Refined Accent Banner) */}
      <div className="relative h-24 sm:h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="absolute top-4 left-4 z-10 md:hidden">
          <Link
            href="/"
            className="flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 md:px-6">
        {/* Profile Card Header */}
        <div className="relative -mt-12 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {/* Profile Avatar (Clickable to Lightbox) */}
              <button
                type="button"
                onClick={() => setImageViewerSrc(avatarUrl)}
                className="group relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-2xl sm:rounded-3xl bg-primary/10 ring-4 ring-card shadow-lg focus:outline-none"
                title="View profile photo"
              >
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white truncate">{displayName}</h1>
                  {profile.businessTrustLabel && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                      <Shield className="size-3" />
                      <span>{profile.businessTrustLabel}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-muted-foreground">{username}</p>

                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">{locality}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              {isOwnProfile ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all"
                >
                  <Edit3 className="size-3.5" />
                  <span>Edit Profile</span>
                </Link>
              ) : (
                <>
                  {/* Follow / Following Button */}
                  <button
                    type="button"
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm active:scale-95 ${
                      isFollowing
                        ? 'border border-border bg-card text-foreground hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {followLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="size-3.5 text-blue-600" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="size-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  {/* Direct Message Button */}
                  <button
                    type="button"
                    onClick={handleStartChat}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm active:scale-95"
                    title="Send a direct message"
                  >
                    <MessageCircle className="size-3.5 text-blue-600" />
                    <span>Message</span>
                  </button>
                </>
              )}

              {/* Share Profile Button */}
              <button
                type="button"
                onClick={handleShareProfile}
                className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-all"
                title="Share profile link"
              >
                {copiedShare ? <Check className="size-4 text-emerald-600" /> : <Share2 className="size-4" />}
              </button>
            </div>
          </div>

          {/* Bio Description */}
          {userBio && (
            <p className="mt-4 text-xs leading-relaxed text-foreground/90 whitespace-pre-line border-t border-border/60 pt-3">
              {userBio}
            </p>
          )}

          {/* Follower & Following Stats */}
          <div className="mt-5 flex items-center gap-6 border-t border-border pt-4 text-xs">
            <div>
              <span className="font-black text-slate-900 dark:text-white">{userPosts.length}</span>{' '}
              <span className="text-muted-foreground">Posts</span>
            </div>
            <div>
              <span className="font-black text-slate-900 dark:text-white">{followersCount}</span>{' '}
              <span className="text-muted-foreground">Followers</span>
            </div>
            <div>
              <span className="font-black text-slate-900 dark:text-white">{followingCount}</span>{' '}
              <span className="text-muted-foreground">Following</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mt-6 flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`border-b-2 px-6 py-3 text-xs font-bold transition-colors ${
              activeTab === 'posts'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Public Posts ({userPosts.length})
          </button>
          {userBusinesses.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('businesses')}
              className={`border-b-2 px-6 py-3 text-xs font-bold transition-colors ${
                activeTab === 'businesses'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Businesses ({userBusinesses.length})
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="py-6 space-y-4">
          {activeTab === 'posts' ? (
            postsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p>Loading posts...</p>
              </div>
            ) : userPosts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center space-y-2">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="size-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">No public posts yet</h3>
                <p className="text-xs text-muted-foreground">
                  {displayName} hasn&apos;t posted any updates to the community yet.
                </p>
              </div>
            ) : (
              <>
                {/* Grid/Feed Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {userPosts.length} {userPosts.length === 1 ? 'post' : 'posts'}
                  </span>
                  <div className="flex overflow-hidden rounded-xl border border-border">
                    <button
                      type="button"
                      onClick={() => { setViewMode('grid'); setSelectedPostId(null) }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-primary text-white'
                          : 'bg-card text-muted-foreground hover:bg-muted'
                      }`}
                      title="Grid view"
                    >
                      <LayoutGrid className="size-3.5" />
                      <span>Grid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setViewMode('feed'); setSelectedPostId(null) }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${
                        viewMode === 'feed'
                          ? 'bg-primary text-white'
                          : 'bg-card text-muted-foreground hover:bg-muted'
                      }`}
                      title="Feed view"
                    >
                      <List className="size-3.5" />
                      <span>Feed</span>
                    </button>
                  </div>
                </div>

                {viewMode === 'grid' ? (
                  <>
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      {userPosts.map((post) => (
                        <PostGridTile
                          key={post.id}
                          post={post}
                          onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
                        />
                      ))}
                    </div>
                    {/* Expanded post card below grid */}
                    {selectedPostId && (() => {
                      const expandedPost = userPosts.find((p) => p.id === selectedPostId)
                      if (!expandedPost) return null
                      return (
                        <div className="mt-2 rounded-3xl border border-primary/30 bg-card shadow-md transition-all">
                          <PostCard
                            post={expandedPost}
                            onOpenComments={(pId) => setActiveCommentsPostId(pId)}
                          />
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  userPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onOpenComments={(pId) => setActiveCommentsPostId(pId)}
                    />
                  ))
                )}
              </>
            )

          ) : userBusinesses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-xs text-muted-foreground">
              No registered businesses listed.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {userBusinesses.map((b) => (
                <Link
                  key={b.id}
                  href={`/business/${b.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-all hover:shadow"
                >
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-primary/10">
                    <Image src={b.logoUrl || b.imageUrl || '/circular-logo.png'} alt={b.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{b.name}</h4>
                    <p className="text-[11px] text-muted-foreground truncate">{b.category}</p>
                    {b.area && <p className="text-[10px] text-muted-foreground truncate">{b.area}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawers & Lightbox */}
      <PostCommentsDrawer
        postId={activeCommentsPostId}
        onClose={() => setActiveCommentsPostId(null)}
      />

      <ImageViewerModal
        isOpen={Boolean(imageViewerSrc)}
        images={imageViewerSrc ? [imageViewerSrc] : []}
        onClose={() => setImageViewerSrc(null)}
      />
    </AppShell>
  )
}
