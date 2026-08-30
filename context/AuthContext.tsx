'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { ref, get, set, update } from 'firebase/database'
import { auth, db, googleProvider } from '@/lib/firebase'
import { UserProfile } from '@/lib/types'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  publicProfiles: Record<string, any>
  isAdmin: boolean
  loading: boolean
  login: (email: string, pass: string) => Promise<void>
  register: (email: string, pass: string, name: string, area: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  publicProfiles: {},
  isAdmin: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [publicProfiles, setPublicProfiles] = useState<Record<string, any>>({})
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchProfile = async (uid: string, emailStr?: string, displayName?: string) => {
    try {
      // 1. Check admin status
      const adminSnap = await get(ref(db, `admins/${uid}`))
      setIsAdmin(adminSnap.exists() && adminSnap.val() === true)

      // 2. Fetch both users and publicProfiles in parallel to get full data and avatar
      const [userSnap, publicSnap, allPublicSnap] = await Promise.all([
        get(ref(db, `users/${uid}`)),
        get(ref(db, `publicProfiles/${uid}`)),
        get(ref(db, 'publicProfiles')),
      ])

      if (allPublicSnap.exists()) {
        setPublicProfiles(allPublicSnap.val() || {})
      }

      const userData = userSnap.val() || {}
      const publicData = publicSnap.val() || {}

      if (userSnap.exists() || publicSnap.exists()) {
        const resolvedAvatar =
          publicData.profileImage ||
          userData.profileImage ||
          publicData.avatar ||
          userData.avatar ||
          publicData.photoURL ||
          userData.photoURL ||
          auth.currentUser?.photoURL ||
          ''

        const merged: UserProfile = {
          uid,
          email: userData.email || publicData.email || emailStr || '',
          name: publicData.name || userData.name || displayName || 'Circular Member',
          username: publicData.username || userData.username || (emailStr ? emailStr.split('@')[0] : 'user'),
          profileImage: resolvedAvatar,
          photoURL: resolvedAvatar,
          area: publicData.area || userData.area || publicData.areaName || userData.areaName || '',
          city: publicData.city || userData.city || '',
          bio: publicData.bio || userData.bio || '',
          businessName: publicData.businessName || userData.businessName || '',
          businessTrustLabel: publicData.businessTrustLabel || userData.businessTrustLabel || '',
          showBusinessDetails: publicData.showBusinessDetails !== false && userData.showBusinessDetails !== false,
          ...userData,
          ...publicData,
        }
        setUserProfile(merged)
      } else {
        // Initialize default profile
        const newProf: UserProfile = {
          uid,
          email: emailStr || '',
          name: displayName || 'Circular Member',
          username: (emailStr ? emailStr.split('@')[0] : 'user') + Math.floor(100 + Math.random() * 900),
          area: '',
          createdAt: Date.now(),
          followersCount: 0,
          followingCount: 0,
        }
        await set(ref(db, `users/${uid}`), newProf)
        await set(ref(db, `publicProfiles/${uid}`), newProf)
        setUserProfile(newProf)
      }
    } catch (e) {
      console.error('Error fetching profile:', e)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        await fetchProfile(u.uid, u.email || undefined, u.displayName || undefined)
      } else {
        setUserProfile(null)
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass)
    await fetchProfile(cred.user.uid, cred.user.email || undefined, cred.user.displayName || undefined)
  }

  const register = async (email: string, pass: string, name: string, area: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass)
    const uid = cred.user.uid
    const newProf: UserProfile = {
      uid,
      email: email.trim(),
      name: name.trim(),
      username: email.split('@')[0].toLowerCase() + Math.floor(100 + Math.random() * 900),
      area: area.trim(),
      createdAt: Date.now(),
      followersCount: 0,
      followingCount: 0,
    }
    await set(ref(db, `users/${uid}`), newProf)
    await set(ref(db, `publicProfiles/${uid}`), newProf)
    setUserProfile(newProf)
  }

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider)
    await fetchProfile(cred.user.uid, cred.user.email || undefined, cred.user.displayName || undefined)
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setUserProfile(null)
    setIsAdmin(false)
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid, user.email || undefined, user.displayName || undefined)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        publicProfiles,
        isAdmin,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
