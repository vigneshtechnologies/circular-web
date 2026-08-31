'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import { OpenInCircularBanner } from '@/components/public/open-in-circular-banner'
import { getUserCommunityLocation } from '@/lib/locationUtils'
import { PublicJobData } from '@/lib/serverPublicData'
import { ref, push, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Briefcase, MapPin, PlusCircle, Search, Sparkles, X, Banknote, Building } from 'lucide-react'

interface JobsClientProps {
  initialJobs: PublicJobData[]
}

export default function JobsClientContainer({ initialJobs }: JobsClientProps) {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [jobs, setJobs] = useState<any[]>(initialJobs || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [isPostJobOpen, setIsPostJobOpen] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [bizName, setBizName] = useState('')
  const [category, setCategory] = useState('General')
  const [jobType, setJobType] = useState<'Full-time' | 'Part-time' | 'Freelance' | 'Internship'>('Full-time')
  const [salary, setSalary] = useState('')
  const [area, setArea] = useState(getUserCommunityLocation(userProfile))
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const jobTypes = ['All', 'Full-time', 'Part-time', 'Freelance', 'Internship']

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push('/login')
      return
    }
    if (!title.trim() || !bizName.trim()) return

    setSubmitting(true)
    try {
      const newJobRef = push(ref(db, 'jobs'))
      await set(newJobRef, {
        title: title.trim(),
        businessName: bizName.trim(),
        category,
        jobType,
        salary: salary.trim() || null,
        area: area.trim() || getUserCommunityLocation(userProfile),
        phone: phone.trim() || null,
        email: email.trim() || null,
        description: description.trim(),
        createdBy: user.uid,
        createdAt: Date.now(),
        status: 'active',
      })

      setJobs((prev) => [
        {
          id: newJobRef.key,
          title: title.trim(),
          businessName: bizName.trim(),
          category,
          jobType,
          salary: salary.trim() || undefined,
          area: area.trim() || getUserCommunityLocation(userProfile),
          description: description.trim(),
          createdAt: Date.now(),
        },
        ...prev,
      ])

      setIsPostJobOpen(false)
      setTitle('')
      setBizName('')
      setSalary('')
      setDescription('')
      setPhone('')
      setEmail('')
    } catch (err) {
      console.error('Error posting job:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Allow immediate SSR rendering of public catalog without blocking on auth loading

  const q = searchQuery.toLowerCase().trim()
  const filtered = jobs.filter((j) => {
    const matchesType = selectedType === 'All' || j.jobType === selectedType
    const titleMatch = (j.title || '').toLowerCase().includes(q)
    const bizMatch = (j.businessName || '').toLowerCase().includes(q)
    const areaMatch = (j.area || '').toLowerCase().includes(q)
    const descMatch = (j.description || '').toLowerCase().includes(q)
    return matchesType && (!q || titleMatch || bizMatch || areaMatch || descMatch)
  })

  const displayArea = getUserCommunityLocation(userProfile)

  const content = (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Briefcase className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-navy">Local Jobs</h1>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Find staff &amp; career opportunities in {displayArea}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!user) router.push('/login')
              else setIsPostJobOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <PlusCircle className="size-4" />
            <span>Post Job</span>
          </button>
        </div>

        <div className="mt-3 relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles, business, or keywords..."
            className="w-full rounded-2xl border border-border bg-muted/60 py-2 pl-10 pr-10 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {jobTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedType === type
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Briefcase className="size-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-navy">No jobs found</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No jobs match "${searchQuery}".`
                : 'There are currently no active listings in this section. Download the Circular mobile app to post a job opening, announce a community event, or submit a local request in your neighborhood.'}
            </p>
          </div>
        ) : (
          filtered.map((job) => (
            <Link
              key={job.id}
              href={`/job/${job.id}`}
              className="block rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-navy">{job.title}</h3>
                  <p className="text-xs font-semibold text-primary">{job.businessName || 'Local Business'}</p>
                </div>
                <span className="rounded-xl bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600">
                  {job.jobType || 'Full-time'}
                </span>
              </div>

              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-foreground/80">
                {job.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary" />
                    <span>{job.area || getUserCommunityLocation(userProfile)}</span>
                  </span>
                  {job.salary && (
                    <span className="font-semibold text-foreground">?? {job.salary}</span>
                  )}
                </div>
                <span className="text-[11px]">
                  {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {isPostJobOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-navy">Post a Job Opening</h2>
              <button
                type="button"
                onClick={() => setIsPostJobOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sales Executive, Cashier, Chef"
                  className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    placeholder="e.g. Royal Bakes"
                    className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Job Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Salary / Pay</label>
                  <input
                    type="text"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. ?15,000 - ?20,000 / mo"
                    className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Rajapalayam Main Road"
                    className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Job Description &amp; Requirements</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details regarding duties, timing, experience..."
                  className="w-full rounded-xl border border-border bg-muted/50 p-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostJobOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )

  if (user) {
    return <AppShell currentArea={displayArea}>{content}</AppShell>
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <CircularHeader />
      <main className="flex-1">
        {content}
        <div className="mx-auto max-w-2xl px-4 pb-12 md:px-6">
          <OpenInCircularBanner path="/jobs" title="Local Jobs" />
        </div>
      </main>
      <CircularFooter />
    </div>
  )
}
