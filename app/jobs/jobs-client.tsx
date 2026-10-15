'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import { getUserCommunityLocation } from '@/lib/locationUtils'
import { PublicJobData } from '@/lib/serverPublicData'
import { ref, push, set, get } from 'firebase/database'
import { db } from '@/lib/firebase'
import {
  getUserResume,
  submitJobApplication,
  getMyApplications,
  UserResume,
} from '@/lib/jobApplicationService'
import { useTranslation } from '@/lib/i18n'
import {
  Briefcase,
  MapPin,
  PlusCircle,
  Search,
  Sparkles,
  X,
  Banknote,
  Building,
  FileText,
  Clock,
  CheckCircle2,
  Lock,
  ChevronRight,
  Filter,
  Check,
} from 'lucide-react'

interface JobsClientProps {
  initialJobs: PublicJobData[]
}

export default function JobsClientContainer({ initialJobs }: JobsClientProps) {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const { t } = useTranslation()

  const [jobs, setJobs] = useState<any[]>(initialJobs || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedWorkMode, setSelectedWorkMode] = useState<'All' | 'On-site' | 'Hybrid' | 'Remote'>('All')
  const [nearMeOnly, setNearMeOnly] = useState(false)
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())

  // Modal states
  const [isPostJobOpen, setIsPostJobOpen] = useState(false)
  const [applyModalJob, setApplyModalJob] = useState<any | null>(null)
  const [applicantResume, setApplicantResume] = useState<UserResume | null>(null)
  const [accessDurationDays, setAccessDurationDays] = useState<number>(30)
  const [agreedConsent, setAgreedConsent] = useState(false)
  const [submittingApply, setSubmittingApply] = useState(false)
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null)

  // Post Job Form states
  const [title, setTitle] = useState('')
  const [bizName, setBizName] = useState('')
  const [category, setCategory] = useState('General')
  const [jobType, setJobType] = useState<'Full-time' | 'Part-time' | 'Freelance' | 'Internship'>('Full-time')
  const [workMode, setWorkMode] = useState<'On-site' | 'Hybrid' | 'Remote'>('On-site')
  const [salary, setSalary] = useState('')
  const [area, setArea] = useState(getUserCommunityLocation(userProfile))
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const jobTypes = ['All', 'Full-time', 'Part-time', 'Freelance', 'Internship']
  const workModes: ('All' | 'On-site' | 'Hybrid' | 'Remote')[] = ['All', 'On-site', 'Hybrid', 'Remote']
  const durationOptions = [7, 15, 30, 60, 90]

  // Load applicant's already applied jobs
  useEffect(() => {
    if (!user) return
    getMyApplications(user.uid)
      .then((apps) => {
        setAppliedJobIds(new Set(apps.map((a) => a.jobId)))
      })
      .catch(() => {})
  }, [user])

  // Open apply modal
  const handleOpenApplyModal = async (job: any) => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const resume = await getUserResume(user.uid)
      if (!resume || !resume.name || !resume.phone) {
        if (confirm('You need to create your private résumé profile first. Create it now?')) {
          router.push('/jobs/resume')
        }
        return
      }

      setApplicantResume(resume)
      setApplyModalJob(job)
      setAgreedConsent(false)
      setAccessDurationDays(30)
    } catch (err) {
      console.error('Error fetching resume for apply:', err)
    }
  }

  // Confirm and submit direct application
  const handleConfirmApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !applyModalJob || !applicantResume || !agreedConsent) return

    setSubmittingApply(true)
    try {
      await submitJobApplication({
        jobId: applyModalJob.id,
        jobTitle: applyModalJob.title,
        businessName: applyModalJob.businessName || 'Employer',
        employerId: applyModalJob.createdBy || applyModalJob.userId || 'employer',
        accessDurationDays,
        resume: applicantResume,
      })

      setAppliedJobIds((prev) => new Set([...Array.from(prev), applyModalJob.id]))
      setApplySuccessMsg(`Application sent to ${applyModalJob.businessName}! Access granted for ${accessDurationDays} days.`)
      setApplyModalJob(null)
      setTimeout(() => setApplySuccessMsg(null), 4000)
    } catch (err: any) {
      alert(err.message || 'Failed to submit application.')
    } finally {
      setSubmittingApply(false)
    }
  }

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
      const now = Date.now()
      const jobData = {
        id: newJobRef.key,
        title: title.trim(),
        businessName: bizName.trim(),
        category,
        jobType,
        workMode,
        salary: salary.trim() || null,
        area: area.trim() || getUserCommunityLocation(userProfile),
        phone: phone.trim() || null,
        email: email.trim() || null,
        description: description.trim(),
        createdBy: user.uid,
        createdAt: now,
        status: 'active',
      }

      await set(newJobRef, jobData)
      setJobs((prev) => [jobData, ...prev])
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

  const displayArea = getUserCommunityLocation(userProfile)

  // Filter jobs by search, jobType, workMode, and nearMeOnly
  const q = searchQuery.toLowerCase().trim()
  const filtered = jobs.filter((j) => {
    const matchesType = selectedType === 'All' || j.jobType === selectedType
    const matchesWorkMode =
      selectedWorkMode === 'All' ||
      j.workMode === selectedWorkMode ||
      (!j.workMode && selectedWorkMode === 'On-site')
    const matchesNearMe = !nearMeOnly || (j.area && displayArea && j.area.toLowerCase().includes(displayArea.toLowerCase()))

    const titleMatch = (j.title || '').toLowerCase().includes(q)
    const bizMatch = (j.businessName || '').toLowerCase().includes(q)
    const areaMatch = (j.area || '').toLowerCase().includes(q)
    const descMatch = (j.description || '').toLowerCase().includes(q)

    return matchesType && matchesWorkMode && matchesNearMe && (!q || titleMatch || bizMatch || areaMatch || descMatch)
  })

  return (
    <AppShell currentArea={displayArea}>
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Briefcase className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white">{t.jobs}</h1>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Career opportunities &amp; direct applications in {displayArea}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/jobs/resume"
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-xs hover:bg-muted"
            >
              <FileText className="size-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{t.myResume}</span>
            </Link>

            <Link
              href="/jobs/applications"
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-xs hover:bg-muted"
            >
              <Clock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Applications</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                if (!user) router.push('/login')
                else setIsPostJobOpen(true)
              }}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95 active:scale-95"
            >
              <PlusCircle className="size-4" />
              <span>Post Job</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles, skills, business, or keywords..."
            className="w-full rounded-2xl border border-border bg-muted/60 py-2 pl-10 pr-10 text-xs text-foreground placeholder-muted-foreground focus:border-emerald-500 focus:bg-card focus:outline-none"
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

        {/* Multi-facet Filter Bar */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Near Me Toggle */}
          <button
            type="button"
            onClick={() => setNearMeOnly(!nearMeOnly)}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
              nearMeOnly
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            <MapPin className="size-3" />
            <span>Near me</span>
          </button>

          {/* Work Mode Selectors */}
          {workModes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSelectedWorkMode(mode)}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                selectedWorkMode === mode
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'border border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {mode === 'All' ? 'All Modes' : mode}
            </button>
          ))}

          {/* Employment Types */}
          <div className="hidden sm:flex items-center gap-1 border-l border-border pl-2">
            {jobTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`rounded-xl px-2 py-0.5 text-[11px] font-bold transition-all ${
                  selectedType === type
                    ? 'bg-purple-600 text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-2xl px-4 py-4 md:px-6 space-y-3.5">
        {/* Success Banner */}
        {applySuccessMsg && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{applySuccessMsg}</span>
          </div>
        )}

        {/* Mobile Quick Links to Resume & Applications */}
        <div className="grid grid-cols-2 gap-2 sm:hidden">
          <Link
            href="/jobs/resume"
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-400"
          >
            <FileText className="size-3.5" />
            <span>{t.myResume}</span>
          </Link>
          <Link
            href="/jobs/applications"
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400"
          >
            <Clock className="size-3.5" />
            <span>My Applications</span>
          </Link>
        </div>

        {/* Jobs List */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-3">
              <Briefcase className="size-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              No vacancies match your filters
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search terms, work mode, or turning off the near me toggle.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedType('All')
                setSelectedWorkMode('All')
                setNearMeOnly(false)
              }}
              className="mt-4 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filtered.map((job) => {
            const hasApplied = appliedJobIds.has(job.id)

            return (
              <div
                key={job.id}
                className="rounded-3xl border border-border bg-card p-5 shadow-xs transition-all hover:border-emerald-500/40 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/job/${job.id}`}
                      className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors block truncate"
                    >
                      {job.title}
                    </Link>
                    <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Building className="size-3.5 text-primary shrink-0" />
                      <span className="truncate">{job.businessName}</span>
                      <span>•</span>
                      <MapPin className="size-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{job.area}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {job.jobType}
                    </span>
                    {job.workMode && job.workMode !== 'On-site' && (
                      <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                        {job.workMode}
                      </span>
                    )}
                  </div>
                </div>

                {job.description && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                )}

                <div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs">
                  {job.salary ? (
                    <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <Banknote className="size-3.5" />
                      <span>{job.salary}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Competitive Salary</span>
                  )}

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/job/${job.id}`}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground px-2 py-1"
                    >
                      Details
                    </Link>

                    {hasApplied ? (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
                        <Check className="size-3.5 text-emerald-600" />
                        <span>Applied</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenApplyModal(job)}
                        className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-95 active:scale-95 transition-all"
                      >
                        <Sparkles className="size-3.5" />
                        <span>Apply Directly</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Direct In-App Application Modal */}
      {applyModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Apply to {applyModalJob.title}</h3>
                <p className="text-[11px] font-semibold text-muted-foreground">{applyModalJob.businessName}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyModalJob(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmApply} className="mt-4 space-y-4">
              {/* Applicant Summary */}
              {applicantResume && (
                <div className="rounded-2xl border border-border bg-muted/40 p-3.5 space-y-1.5">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileText className="size-3.5 text-indigo-600" />
                    <span>Résumé: {applicantResume.name}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {applicantResume.phone} • {applicantResume.email}
                  </div>
                  {applicantResume.skills && (
                    <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold truncate">
                      Skills: {applicantResume.skills}
                    </div>
                  )}
                </div>
              )}

              {/* Duration Options */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Grant Résumé Access Duration
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {durationOptions.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAccessDurationDays(d)}
                      className={`py-2 text-center text-xs font-bold rounded-xl border transition-all ${
                        accessDurationDays === d
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  The employer can view your contact information for {accessDurationDays} days. You can revoke access early anytime.
                </p>
              </div>

              {/* Consent checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-foreground bg-muted/30 p-3 rounded-2xl border border-border">
                <input
                  type="checkbox"
                  required
                  checked={agreedConsent}
                  onChange={(e) => setAgreedConsent(e.target.checked)}
                  className="mt-0.5 size-4 rounded accent-emerald-600 cursor-pointer"
                />
                <span>
                  I agree to share my private résumé profile with {applyModalJob.businessName} for {accessDurationDays} days.
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalJob(null)}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApply || !agreedConsent}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
                >
                  {submittingApply ? 'Submitting...' : 'Confirm Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Job Modal */}
      {isPostJobOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-2xl overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Post a Job Opening</h3>
              <button
                type="button"
                onClick={() => setIsPostJobOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
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
                  placeholder="e.g. Retail Store Assistant or React Developer"
                  className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="e.g. Vignesh Technologies"
                  className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Employment Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Work Mode</label>
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. ₹20,000 - ₹35,000"
                    className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Description &amp; Requirements *</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Responsibilities, required skills, timing, work location..."
                  className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostJobOpen(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95"
                >
                  {submitting ? 'Posting...' : 'Publish Vacancy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
