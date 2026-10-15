'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import {
  getUserProfiles,
  createSubProfile,
  getActiveProfileId,
  setActiveProfileId,
} from '@/lib/profileService'
import { ProfileType, SubProfile } from '@/lib/types'
import { getUserAvatar } from '@/lib/imageUtils'
import {
  X,
  Check,
  User,
  Building2,
  Sparkles,
  Plus,
  Briefcase,
  Users,
  FolderGit2,
} from 'lucide-react'

interface ProfileSwitcherModalProps {
  isOpen: boolean
  onClose: () => void
  onProfileSwitched?: (profile: SubProfile | null) => void
}

export function ProfileSwitcherModal({
  isOpen,
  onClose,
  onProfileSwitched,
}: ProfileSwitcherModalProps) {
  const { user, userProfile, publicProfiles } = useAuth()
  const [profiles, setProfiles] = useState<SubProfile[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)

  // Creation form
  const [newName, setNewName] = useState('')
  const [newHandle, setNewHandle] = useState('')
  const [newBio, setNewBio] = useState('')
  const [newType, setNewType] = useState<ProfileType>('personal')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !user) return
    setActiveId(getActiveProfileId())
    loadProfiles()
  }, [isOpen, user])

  const loadProfiles = async () => {
    if (!user) return
    const list = await getUserProfiles(user.uid)
    setProfiles(list)
  }

  if (!isOpen || !user) return null

  const handleSelectProfile = (profileId: string | null) => {
    setActiveProfileId(profileId)
    setActiveId(profileId)
    const selected = profiles.find((p) => p.id === profileId) || null
    if (onProfileSwitched) {
      onProfileSwitched(selected)
    }
    onClose()
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newHandle.trim()) {
      setErrorMsg('Please enter profile name and handle.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    try {
      const created = await createSubProfile(user.uid, {
        name: newName.trim(),
        handle: newHandle.trim(),
        profileType: newType,
        bio: newBio.trim() || undefined,
        area: userProfile?.area || userProfile?.city,
      })

      setProfiles((prev) => [...prev, created])
      setIsCreating(false)
      setNewName('')
      setNewHandle('')
      setNewBio('')
      handleSelectProfile(created.id)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create profile.')
    } finally {
      setLoading(false)
    }
  }

  const mainAvatar = getUserAvatar(userProfile, publicProfiles) || '/circular-logo.png'
  const mainName = userProfile?.name || user.displayName || 'Main Account'
  const mainHandle = userProfile?.username || userProfile?.phone || user.email || 'primary'

  const profileTypeIcons: Record<ProfileType, React.ElementType> = {
    personal: User,
    business: Building2,
    creator: Sparkles,
    organisation: Users,
    project: FolderGit2,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Switch Profile</h3>
              <p className="text-[11px] text-muted-foreground">Manage your personal and business personas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {!isCreating ? (
          <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto no-scrollbar">
            {/* Primary Account Item */}
            <div
              onClick={() => handleSelectProfile(null)}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                activeId === null
                  ? 'border-purple-500/50 bg-purple-500/10 shadow-xs'
                  : 'border-border bg-card hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative size-10 rounded-full overflow-hidden border border-border shrink-0">
                  <Image src={mainAvatar} alt={mainName} fill className="object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {mainName}
                    </span>
                    <span className="rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 text-[9px] font-extrabold uppercase">
                      Primary
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">@{mainHandle}</div>
                </div>
              </div>
              {activeId === null && (
                <div className="flex size-6 items-center justify-center rounded-full bg-purple-600 text-white shrink-0">
                  <Check className="size-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Sub-profiles List */}
            {profiles.map((p) => {
              const Icon = profileTypeIcons[p.profileType] || User
              const isSelected = activeId === p.id

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectProfile(p.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-purple-500/50 bg-purple-500/10 shadow-xs'
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 shrink-0">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {p.name}
                        </span>
                        <span className="rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 text-[9px] font-extrabold uppercase">
                          {p.profileType}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">@{p.handle}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex size-6 items-center justify-center rounded-full bg-purple-600 text-white shrink-0">
                      <Check className="size-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              )
            })}

            {/* Create Profile Button */}
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-3 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-500/5 transition-all"
            >
              <Plus className="size-4" />
              <span>Create New Persona or Business Profile</span>
            </button>
          </div>
        ) : (
          /* Create Sub-Profile Form */
          <form onSubmit={handleCreateProfile} className="mt-4 space-y-3">
            {errorMsg && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-600">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Profile Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Acme Studio or Tech Blog"
                className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Username / Handle</label>
              <div className="flex items-center rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs">
                <span className="text-muted-foreground mr-1">@</span>
                <input
                  type="text"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="acme_studio"
                  className="w-full bg-transparent text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Profile Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as ProfileType)}
                className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground focus:border-purple-500 focus:outline-none"
              >
                <option value="personal">Personal Alternate</option>
                <option value="business">Local Business / Store</option>
                <option value="creator">Creator / Public Figure</option>
                <option value="organisation">Community Organisation</option>
                <option value="project">Project / Initiative</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Bio / Tagline</label>
              <textarea
                rows={2}
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                placeholder="Brief introduction for this profile..."
                className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-xl border border-border bg-muted px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95"
              >
                {loading ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
