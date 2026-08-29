'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Mail, Lock, User, MapPin, Sparkles, ArrowRight, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react'

export function AuthPortal() {
  const { login, register, loginWithGoogle } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [area, setArea] = useState('Rajapalayam')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Please enter your full name')
        if (password.length < 6) throw new Error('Password must be at least 6 characters')
        await register(email, password, name, area)
      } else {
        await login(email, password)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message?.replace('Firebase: ', '') || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      await loginWithGoogle()
    } catch (err: any) {
      console.error(err)
      setError(err.message?.replace('Firebase: ', '') || 'Google Sign-In failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy via-slate-950 to-slate-900 text-white flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-white/10 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative size-10 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/20">
              <Image
                src="/circular-logo.png"
                alt="Circular Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">Circular</span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Local Social &amp; Business
              </span>
            </div>
          </div>

          <a
            href="https://play.google.com/store/apps/details?id=com.vigneshtechnologies.circular"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-white/20"
          >
            <Smartphone className="size-4 text-primary" />
            <span className="hidden sm:inline">Get Android App</span>
            <span className="sm:hidden">App</span>
          </a>
        </div>
      </header>

      {/* Main Form Center */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 text-white shadow-lg">
                <Sparkles className="size-7" />
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
                {isRegister ? 'Create Your Account' : 'Welcome to Circular'}
              </h1>
              <p className="mt-2 text-xs text-slate-300 sm:text-sm">
                {isRegister
                  ? 'Connect with your neighborhood, local shops, jobs, and events'
                  : 'Sign in to access your local feed and community updates'}
              </p>
            </div>

            {error && (
              <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white shadow transition-all hover:bg-white/20 hover:border-white/30 active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.4 0 10.6 0 13s.6 4.6 1.6 6.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full border-t border-white/10" />
              <span className="absolute bg-slate-900 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Or with email
              </span>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 size-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-primary focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Area / Locality
                    </label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3.5 size-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="Rajapalayam / Your Area"
                        className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-primary focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 size-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-primary focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 size-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-primary focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-purple-600 to-pink-600 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
              >
                <span>{loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="size-4" />
              </button>
            </form>

            {/* Toggle Login/Register */}
            <div className="mt-6 text-center text-xs text-slate-400">
              {isRegister ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false)
                      setError(null)
                    }}
                    className="font-bold text-primary hover:underline"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  New to Circular?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true)
                      setError(null)
                    }}
                    className="font-bold text-primary hover:underline"
                  >
                    Create an account
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/terms" className="hover:text-slate-300">
            Terms of Service
          </Link>
          <span>•</span>
          <a
            href="https://sites.google.com/view/circular-privacy-policy/home"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300"
          >
            Privacy Policy
          </a>
          <span>•</span>
          <a
            href="https://sites.google.com/view/circular-privacy-policy/community-guidelines"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300"
          >
            Community Guidelines
          </a>
        </div>
      </footer>
    </div>
  )
}
