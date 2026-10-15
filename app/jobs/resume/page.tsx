'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import { getUserResume, saveUserResume, UserResume } from '@/lib/jobApplicationService'
import { useTranslation } from '@/lib/i18n'
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Save,
  Clock,
  Sparkles,
  Shield,
  Briefcase,
} from 'lucide-react'

export default function MyResumePage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

  const [resume, setResume] = useState<UserResume | null>(null)
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [summary, setSummary] = useState('')
  const [skills, setSkills] = useState('')
  const [experience, setExperience] = useState('')
  const [education, setEducation] = useState('')

  useEffect(() => {
    if (!user) return
    const loadResume = async () => {
      setFetching(true)
      try {
        const data = await getUserResume(user.uid)
        if (data) {
          setResume(data)
          setName(data.name || '')
          setPhone(data.phone || '')
          setEmail(data.email || '')
          setSummary(data.summary || '')
          setSkills(data.skills || '')
          setExperience(data.experience || '')
          setEducation(data.education || '')
        } else if (userProfile) {
          // Pre-populate defaults from profile
          setName(userProfile.name || '')
          setPhone(userProfile.phone || '')
          setEmail(userProfile.email || user.email || '')
        }
      } catch (err) {
        console.error('Failed to load resume:', err)
      } finally {
        setFetching(false)
      }
    }
    loadResume()
  }, [user, userProfile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setSavedSuccess(false)
    try {
      await saveUserResume(user.uid, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        summary: summary.trim(),
        skills: skills.trim(),
        experience: experience.trim() || undefined,
        education: education.trim() || undefined,
      })
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      console.error('Save resume error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <AuthPortal />
  }

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="size-4 text-indigo-600 dark:text-indigo-400" />
                <span>{t.myResume}</span>
              </h1>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Private, reusable career profile for Circular direct applications
              </p>
            </div>
          </div>

          <Link
            href="/jobs/applications"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-xs hover:bg-muted"
          >
            <Briefcase className="size-3.5" />
            <span>Applications</span>
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-6">
        {/* Privacy Assurance Card */}
        <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-sm">
              <Lock className="size-4.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Protected Private Career Profile
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Your résumé is kept strictly private and is never public on search engines or feeds. When you apply to a job, you grant the employer access for 7, 15, 30, 60 or 90 days. You can revoke access early at any time.
              </p>
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>Résumé updated successfully! You can now apply for jobs in one tap.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Contact &amp; Basic Info
            </h2>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Professional Profile
            </h2>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Professional Summary *</label>
              <textarea
                rows={3}
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of your professional background, strengths, and career objectives..."
                className="w-full rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Core Skills *</label>
              <input
                type="text"
                required
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. React, Next.js, Sales, Account Management, UI Design"
                className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">Separate skills with commas</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Work Experience</label>
              <textarea
                rows={3}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Recent roles, employers, responsibilities, or years of experience..."
                className="w-full rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Education &amp; Certifications</label>
              <textarea
                rows={2}
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="Degrees, colleges, technical diplomas, certifications..."
                className="w-full rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/jobs"
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
            >
              <Save className="size-4" />
              <span>{saving ? 'Saving...' : 'Save Résumé'}</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
