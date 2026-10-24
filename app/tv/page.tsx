'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { ref, get, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import { getUserAvatar } from '@/lib/imageUtils'
import {
  Tv,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Radio,
  ArrowRight,
} from 'lucide-react'

function TVAuthContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const codeParam = searchParams.get('code') || ''

  const { user, userProfile, loading: authLoading } = useAuth()

  const [inputCode, setInputCode] = useState(codeParam.toUpperCase().slice(0, 6))
  const [requestStatus, setRequestStatus] = useState<'checking' | 'valid' | 'invalid' | 'approved' | 'denied'>('checking')
  const [processing, setProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Sync param
  useEffect(() => {
    if (codeParam) {
      setInputCode(codeParam.toUpperCase().slice(0, 6))
    }
  }, [codeParam])

  // Check the code in Firebase RTDB
  useEffect(() => {
    if (!inputCode || inputCode.length !== 6) {
      if (!inputCode) {
        setRequestStatus('invalid')
      }
      return
    }

    let isMounted = true
    setRequestStatus('checking')
    setErrorMsg(null)

    const checkRequest = async () => {
      try {
        const snapshot = await get(ref(db, `tvAuthRequests/${inputCode}`))
        if (!isMounted) return

        if (snapshot.exists()) {
          const val = snapshot.val()
          if (val.status === 'pending') {
            setRequestStatus('valid')
          } else if (val.status === 'approved') {
            setRequestStatus('approved')
          } else {
            setRequestStatus('invalid')
            setErrorMsg('This TV sign-in request has expired or has already been used.')
          }
        } else {
          setRequestStatus('invalid')
          setErrorMsg('No active TV sign-in request found for code: ' + inputCode)
        }
      } catch (err: any) {
        if (!isMounted) return
        setRequestStatus('invalid')
        setErrorMsg('Unable to verify TV request. Please check your connection.')
      }
    }

    checkRequest()
    return () => {
      isMounted = false
    }
  }, [inputCode])

  // Handle Approve Action
  const handleApprove = async () => {
    if (!user || !inputCode || processing) return

    try {
      setProcessing(true)
      setErrorMsg(null)

      const avatar = getUserAvatar(userProfile) || user.photoURL || ''
      const name = userProfile?.name || user.displayName || 'Circular Member'

      // Update RTDB node /tvAuthRequests/<code> with approved status and authenticated UID
      await update(ref(db, `tvAuthRequests/${inputCode}`), {
        status: 'approved',
        uid: user.uid,
        userName: name,
        userAvatar: avatar,
        approvedAt: Date.now(),
      })

      setRequestStatus('approved')
    } catch (err: any) {
      console.error('TV sign-in approval error:', err)
      setErrorMsg('Failed to approve TV sign in. Please verify your permissions and try again.')
    } finally {
      setProcessing(false)
    }
  }

  // Handle Deny Action
  const handleDeny = async () => {
    if (!inputCode || processing) return

    try {
      setProcessing(true)
      await update(ref(db, `tvAuthRequests/${inputCode}`), {
        status: 'denied',
        deniedAt: Date.now(),
      })
      setRequestStatus('denied')
    } catch (err) {
      console.error('TV deny error:', err)
      setRequestStatus('denied')
    } finally {
      setProcessing(false)
    }
  }

  // Global Auth Loading
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm">Verifying your Circular session...</p>
      </div>
    )
  }

  // Unauthenticated User State
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl text-center">
        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-500">
          <Tv className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Sign in to Circular First</h1>
        <p className="text-sm text-slate-400 mb-6">
          You need to be logged into your Circular account on this browser before you can authorize your TV.
        </p>
        <Link
          href={`/login?redirect=/tv${inputCode ? `?code=${inputCode}` : ''}`}
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/20"
        >
          Sign In on this Phone
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  // Main TV Authorization Card
  return (
    <div className="max-w-lg mx-auto my-10 p-8 bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl text-center">
      {/* Brand Header */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Radio className="w-5 h-5" />
        </div>
        <span className="font-extrabold tracking-wider text-slate-200">CIRCULAR TV BRIDGE</span>
      </div>

      {/* Screen Title */}
      <div className="w-16 h-16 bg-blue-600/15 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400 shadow-inner">
        <Tv className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-black text-slate-100 mb-1">Sign in to Android TV</h1>
      <p className="text-sm text-slate-400 mb-6">
        A television device is requesting access to your Circular account.
      </p>

      {/* Code Display or Input */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 mb-6">
        <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase block mb-2">
          PAIRING CODE
        </span>
        <div className="flex items-center justify-center gap-2">
          {inputCode.length === 6 ? (
            <span className="text-3xl font-black tracking-[0.3em] text-blue-400 font-mono">
              {inputCode}
            </span>
          ) : (
            <input
              type="text"
              maxLength={6}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="ENTER 6 DIGIT CODE"
              className="bg-transparent text-center text-xl font-mono font-bold tracking-widest text-slate-200 outline-none placeholder:text-slate-600 w-full"
            />
          )}
        </div>
      </div>

      {/* User Identity Preview */}
      <div className="flex items-center gap-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 mb-6 text-left">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {getUserAvatar(userProfile) ? (
            <img
              src={getUserAvatar(userProfile)}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{(userProfile?.name || user.displayName || 'U').charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-200 truncate">
            {userProfile?.name || user.displayName || 'Circular Member'}
          </p>
          <p className="text-xs text-slate-400 truncate">{user.email || 'Phone account'}</p>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Active</span>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg ? (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-left mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      ) : null}

      {/* Status-Driven Actions */}
      {requestStatus === 'approved' ? (
        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-emerald-300 mb-1">TV Sign-In Approved!</h2>
          <p className="text-xs text-emerald-400/80 mb-4">
            Your Android TV is now securely logged in. You can now put down your phone and enjoy Circular on the big screen!
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center py-2 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Go to Web Home
          </Link>
        </div>
      ) : requestStatus === 'denied' ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-red-300 mb-1">Request Denied</h2>
          <p className="text-xs text-red-400/80 mb-4">
            The TV sign-in request was rejected. The TV device will not be granted access.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center py-2 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Go to Web Home
          </Link>
        </div>
      ) : requestStatus === 'checking' ? (
        <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-xs">Verifying code with TV...</span>
        </div>
      ) : requestStatus === 'valid' ? (
        <div className="space-y-3">
          <button
            onClick={handleApprove}
            disabled={processing}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Approve TV Sign-In</span>
              </>
            )}
          </button>

          <button
            onClick={handleDeny}
            disabled={processing}
            className="w-full py-3 px-6 bg-transparent hover:bg-red-500/10 text-slate-400 hover:text-red-400 font-semibold text-sm rounded-xl transition border border-transparent hover:border-red-500/20 cursor-pointer"
          >
            Deny Request
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Please verify the 6-character code on your TV screen and try again.
          </p>
          <button
            onClick={() => {
              setRequestStatus('checking')
              setInputCode(codeParam.toUpperCase().slice(0, 6))
            }}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Retry Verification
          </button>
        </div>
      )}
    </div>
  )
}

export default function TVAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm">Loading TV Bridge...</p>
        </div>
      }
    >
      <TVAuthContent />
    </Suspense>
  )
}
