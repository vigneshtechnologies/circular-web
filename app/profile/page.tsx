'use client'

import { getUserCommunityLocation } from '@/lib/locationUtils'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { ref, get, query, orderByChild, equalTo, set, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Post, BusinessProfile, UserProfile } from '@/lib/types'
import { PostCard } from '@/components/feed/PostCard'
import { User, MapPin, Edit3, Settings, Store, Sparkles, X, Shield } from 'lucide-react'

export default function ProfilePage() {
  const { user, userProfile, isAdmin, refreshProfile, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<'posts' | 'businesses'>('posts')
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [myBusinesses, setMyBusinesses] = useState<BusinessProfile[]>([])
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Edit fields
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [area, setArea] = useState('')
  const [phone, setPhone] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '')
      setUsername(userProfile.username || '')
      setBio(userProfile.bio || '')
      setArea(userProfile.area || '')
      setPhone(userProfile.phone || '')
      setPhotoURL(userProfile.photoURL || '')
    }
  }, [userProfile])

  useEffect(() => {
    if (!user) return

    const loadUserContent = async () => {
      try {
        // Fetch my posts
        const pSnap = await get(query(ref(db, 'posts'), orderByChild('userId'), equalTo(user.uid)))
        if (pSnap.exists()) {
          const list: Post[] = []
          pSnap.forEach((c) => {
            list.push({ id: c.key as string, ...c.val() })
          })
          setMyPosts(list.reverse())
        }

        // Fetch my businesses
        const bSnap = await get(query(ref(db, 'businessProfiles'), orderByChild('userId'), equalTo(user.uid)))
        if (bSnap.exists()) {
          const list: BusinessProfile[] = []
          bSnap.forEach((c) => {
            list.push({ id: c.key as string, ...c.val() })
          })
          setMyBusinesses(list)
        }
      } catch (e) {
        console.error('Error fetching user content:', e)
      }
    }

    loadUserContent()
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    try {
      const updatedData = {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        area: area.trim(),
        phone: phone.trim(),
        photoURL: photoURL.trim(),
      }
      await update(ref(db, `users/${user.uid}`), updatedData)
      await update(ref(db, `publicProfiles/${user.uid}`), updatedData)
      await refreshProfile()
      setIsEditOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
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
    <AppShell currentArea={getUserCommunityLocation(userProfile)}>
      {/* Header Profile Cover */}
      <div className="relative h-36 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 md:h-48" />

      <div className="mx-auto max-w-3xl px-4 md:px-6">
        {/* Profile Card Header */}
        <div className="relative -mt-16 rounded-3xl border border-border bg-card p-6 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-3xl bg-primary/10 ring-4 ring-card shadow-xl">
                <Image
                  src={userProfile?.photoURL || '/circular-logo.png'}
                  alt={userProfile?.name || 'Profile Avatar'}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-navy">{userProfile?.name || 'Circular Member'}</h1>
                  {isAdmin && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      <Shield className="size-3" />
                      <span>Admin</span>
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-muted-foreground">@{userProfile?.username || 'member'}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3 text-primary" />
                  <span>{getUserCommunityLocation(userProfile)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted"
              >
                <Edit3 className="size-3.5" />
                <span>Edit Profile</span>
              </button>
              <Link
                href="/settings"
                className="rounded-xl border border-border bg-muted/60 p-2 text-muted-foreground hover:bg-muted"
              >
                <Settings className="size-4" />
              </Link>
            </div>
          </div>

          {userProfile?.bio && (
            <p className="mt-4 text-xs leading-relaxed text-foreground/90">{userProfile.bio}</p>
          )}

          {/* Stats Bar */}
          <div className="mt-5 flex items-center gap-6 border-t border-border pt-4 text-xs">
            <div>
              <span className="font-black text-navy">{myPosts.length}</span>{' '}
              <span className="text-muted-foreground">Posts</span>
            </div>
            <div>
              <span className="font-black text-navy">{userProfile?.followersCount || 0}</span>{' '}
              <span className="text-muted-foreground">Followers</span>
            </div>
            <div>
              <span className="font-black text-navy">{userProfile?.followingCount || 0}</span>{' '}
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
            My Posts ({myPosts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('businesses')}
            className={`border-b-2 px-6 py-3 text-xs font-bold transition-colors ${
              activeTab === 'businesses'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            My Businesses ({myBusinesses.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="py-6 space-y-4">
          {activeTab === 'posts' ? (
            myPosts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-xs text-muted-foreground">
                You haven't posted any updates yet. Share what's happening around you!
              </div>
            ) : (
              myPosts.map((p) => <PostCard key={p.id} post={p} />)
            )
          ) : myBusinesses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-xs text-muted-foreground">
              You haven't listed any businesses yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {myBusinesses.map((b) => (
                <Link
                  key={b.id}
                  href={`/business/${b.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40"
                >
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-primary/10">
                    <Image src={b.logoUrl || '/circular-logo.png'} alt={b.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy">{b.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{b.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-navy">Edit Your Profile</h2>
              <button type="button" onClick={() => setIsEditOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Area / Locality</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Bio</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your neighbors about yourself..."
                  className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
