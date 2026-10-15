'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AuthPortal } from '@/components/auth/AuthPortal'
import { AppShell } from '@/components/layout/AppShell'
import {
  getMyApplications,
  revokeResumeAccess,
  updateCandidateStatus,
  isApplicationAccessValid,
  JobApplicationRecord,
  ApplicationStatus,
} from '@/lib/jobApplicationService'
import { ref, get, query, orderByChild, equalTo, update } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useTranslation } from '@/lib/i18n'
import {
  Briefcase,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Shield,
  Trash2,
  Lock,
  Phone,
  Mail,
  User,
  Building2,
  Check,
} from 'lucide-react'

export default function JobApplicationsPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

  const [activeTab, setActiveTab] = useState<'applicant' | 'employer'>('applicant')
  const [myApplications, setMyApplications] = useState<JobApplicationRecord[]>([])
  const [myPostedJobs, setMyPostedJobs] = useState<any[]>([])
  const [employerCandidates, setEmployerCandidates] = useState<Record<string, JobApplicationRecord[]>>({})
  const [fetching, setFetching] = useState(true)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // 1. Fetch Applicant Applications
  const loadApplicantData = useCallback(async () => {
    if (!user) return
    try {
      const apps = await getMyApplications(user.uid)
      setMyApplications(apps)
    } catch (err) {
      console.error('Error fetching applications:', err)
    }
  }, [user])

  // 2. Fetch Employer Jobs & Candidates
  const loadEmployerData = useCallback(async () => {
    if (!user) return
    try {
      // Find jobs posted by current user
      const jobsSnap = await get(
        query(ref(db, 'jobs'), orderByChild('createdBy'), equalTo(user.uid))
      ).catch(() => null)

      if (jobsSnap && jobsSnap.exists()) {
        const jobsList: any[] = []
        jobsSnap.forEach((child) => {
          jobsList.push({ id: child.key, ...child.val() })
        })
        setMyPostedJobs(jobsList)

        // For each job, check candidates
        // Candidates submit under users/${applicantId}/myApplications/${jobId}
        // In RTDB, employers store status updates at users/${employerId}/candidateStatuses/${applicationId}
        const candidatesByJob: Record<string, JobApplicationRecord[]> = {}

        // Query all candidate applications for these jobs
        const usersSnap = await get(ref(db, 'users')).catch(() => null)
        if (usersSnap && usersSnap.exists()) {
          const allUsers = usersSnap.val()
          Object.keys(allUsers).forEach((uid) => {
            const userApps = allUsers[uid]?.myApplications
            if (userApps) {
              Object.keys(userApps).forEach((jId) => {
                const appRecord: JobApplicationRecord = userApps[jId]
                if (appRecord.employerId === user.uid) {
                  if (!candidatesByJob[jId]) candidatesByJob[jId] = []
                  candidatesByJob[jId].push(appRecord)
                }
              })
            }
          })
        }

        setEmployerCandidates(candidatesByJob)
      }
    } catch (err) {
      console.error('Error loading employer data:', err)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    setFetching(true)
    Promise.all([loadApplicantData(), loadEmployerData()]).finally(() => setFetching(false))
  }, [user, loadApplicantData, loadEmployerData])

  // Handle Revoke Access
  const handleRevoke = async (jobId: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to revoke the employer’s access to your résumé early?')) {
      return
    }

    try {
      await revokeResumeAccess(user.uid, jobId)
      setActionSuccess('Access revoked. The employer can no longer view your contact details.')
      setTimeout(() => setActionSuccess(null), 3000)
      loadApplicantData()
    } catch (err) {
      console.error('Revoke error:', err)
    }
  }

  // Handle Status Update by Employer
  const handleStatusChange = async (
    application: JobApplicationRecord,
    newStatus: ApplicationStatus
  ) => {
    if (!user) return
    try {
      await updateCandidateStatus(
        user.uid,
        application.applicantId,
        application.id,
        application.jobTitle,
        newStatus
      )
      setActionSuccess(`Candidate status updated to "${newStatus}".`)
      setTimeout(() => setActionSuccess(null), 3000)
      loadEmployerData()
    } catch (err) {
      console.error('Status update error:', err)
    }
  }

  // Handle Vacancy Closure
  const handleCloseVacancy = async (jobId: string) => {
    if (!confirm('Close this vacancy? It will no longer accept new applications.')) return
    try {
      await update(ref(db, `jobs/${jobId}`), { status: 'closed' })
      setActionSuccess('Vacancy marked as closed.')
      setTimeout(() => setActionSuccess(null), 3000)
      loadEmployerData()
    } catch (err) {
      console.error('Close vacancy error:', err)
    }
  }

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <AuthPortal />
  }

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Hired':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
      case 'Shortlisted':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/30'
      case 'Under Review':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/30'
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/30'
      default:
        return 'bg-amber-500/10 text-amber-600 border-amber-500/30'
    }
  }

  return (
    <AppShell>
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3 md:px-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Briefcase className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Job Applications</span>
              </h1>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Track direct applications and review incoming candidates
              </p>
            </div>
          </div>

          <Link
            href="/jobs/resume"
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-xs hover:bg-indigo-500/20"
          >
            <FileText className="size-3.5" />
            <span>{t.myResume}</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 space-y-6">
        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setActiveTab('applicant')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'applicant'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="size-3.5" />
            <span>{t.myApplications} ({myApplications.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('employer')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'employer'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="size-3.5" />
            <span>Employer Management ({myPostedJobs.length})</span>
          </button>
        </div>

        {actionSuccess && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. APPLICANT VIEW (My Applications) */}
        {/* ======================================================== */}
        {activeTab === 'applicant' && (
          <div className="space-y-4">
            {myApplications.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-3">
                  <Briefcase className="size-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">No applications yet</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Apply directly to vacancies on Circular with reusable résumé profiles.
                </p>
                <Link
                  href="/jobs"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-sm"
                >
                  Browse Jobs
                </Link>
              </div>
            ) : (
              myApplications.map((app) => {
                const isValid = isApplicationAccessValid(app)
                const expiryDate = new Date(app.accessExpiresAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })

                return (
                  <div
                    key={app.id || app.jobId}
                    className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                          {app.jobTitle}
                        </h3>
                        <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Building2 className="size-3.5 text-primary" />
                          <span>{app.businessName}</span>
                          <span>•</span>
                          <span>Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${getStatusBadge(
                            app.status
                          )}`}
                        >
                          {app.status}
                        </span>
                      </div>
                    </div>

                    {/* Access Expiry & Revocation Details */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-muted/40 p-3 rounded-2xl border border-border">
                      <div className="flex items-center gap-2">
                        {isValid ? (
                          <>
                            <Clock className="size-4 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-bold text-foreground">Access valid until: </span>
                              <span className="text-muted-foreground">{expiryDate}</span>
                              <span className="ml-1 text-[10px] text-emerald-600 font-semibold">
                                ({app.accessDurationDays} days granted)
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <XCircle className="size-4 text-rose-500 shrink-0" />
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              {app.revoked ? 'Access Revoked by You' : 'Access Expired'}
                            </span>
                          </>
                        )}
                      </div>

                      {isValid && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(app.jobId)}
                          className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline shrink-0"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Revoke Access Early</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. EMPLOYER VIEW (Candidate Management) */}
        {/* ======================================================== */}
        {activeTab === 'employer' && (
          <div className="space-y-6">
            {myPostedJobs.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">No job openings posted</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Post a job vacancy to receive applications and manage candidates here.
                </p>
                <Link
                  href="/jobs"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-sm"
                >
                  Post Vacancy
                </Link>
              </div>
            ) : (
              myPostedJobs.map((job) => {
                const candidates = employerCandidates[job.id] || []
                const isClosed = job.status === 'closed'

                return (
                  <div
                    key={job.id}
                    className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {job.title}
                          </h3>
                          {isClosed ? (
                            <span className="rounded-md bg-rose-500/10 text-rose-600 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                              Closed
                            </span>
                          ) : (
                            <span className="rounded-md bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                              Active Vacancy
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {job.jobType} • {job.area} {job.salary && `• ${job.salary}`}
                        </div>
                      </div>

                      {!isClosed && (
                        <button
                          type="button"
                          onClick={() => handleCloseVacancy(job.id)}
                          className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-500/20 transition-all self-start sm:self-auto"
                        >
                          <XCircle className="size-3.5" />
                          <span>Close Vacancy</span>
                        </button>
                      )}
                    </div>

                    {/* Candidates List */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
                        Applicants ({candidates.length})
                      </h4>

                      {candidates.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          No applications received for this job yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {candidates.map((cand) => {
                            const accessValid = isApplicationAccessValid(cand)

                            return (
                              <div
                                key={cand.id || cand.applicantId}
                                className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                  <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                      <User className="size-4 text-purple-600" />
                                      <span>{cand.applicantName}</span>
                                    </div>

                                    {/* Contact Details (Only if access is still valid) */}
                                    {accessValid ? (
                                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                                        <a
                                          href={`tel:${cand.applicantPhone}`}
                                          className="flex items-center gap-1 text-emerald-600 font-semibold hover:underline"
                                        >
                                          <Phone className="size-3" />
                                          <span>{cand.applicantPhone}</span>
                                        </a>
                                        <a
                                          href={`mailto:${cand.applicantEmail}`}
                                          className="flex items-center gap-1 text-blue-600 font-semibold hover:underline"
                                        >
                                          <Mail className="size-3" />
                                          <span>{cand.applicantEmail}</span>
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-xs text-rose-600 font-semibold mt-1">
                                        <Lock className="size-3" />
                                        <span>Contact access expired / revoked by applicant</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Status Selector */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-semibold text-muted-foreground">Status:</span>
                                    <select
                                      value={cand.status}
                                      onChange={(e) =>
                                        handleStatusChange(cand, e.target.value as ApplicationStatus)
                                      }
                                      className="rounded-xl border border-border bg-card p-1.5 text-xs font-bold text-foreground focus:outline-none"
                                    >
                                      <option value="Submitted">Submitted</option>
                                      <option value="Under Review">Under Review</option>
                                      <option value="Shortlisted">Shortlisted</option>
                                      <option value="Rejected">Rejected</option>
                                      <option value="Hired">Hired</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Résumé Details */}
                                {cand.summary && (
                                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-card p-3 rounded-xl border border-border/60">
                                    {cand.summary}
                                  </p>
                                )}

                                {cand.skills && (
                                  <div className="flex flex-wrap gap-1">
                                    {cand.skills.split(',').map((skill, i) => (
                                      <span
                                        key={i}
                                        className="rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 px-2 py-0.5 text-[10px] font-semibold"
                                      >
                                        {skill.trim()}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
