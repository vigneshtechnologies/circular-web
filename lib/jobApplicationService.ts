import { get, push, ref, update } from 'firebase/database'
import { auth, db } from './firebase'
import type { ApplicationStatus, JobApplicationRecord, UserResume } from './types'

export { type ApplicationStatus, type JobApplicationRecord, type UserResume }

/**
 * Gets the current user's private resume.
 */
export async function getUserResume(uid: string): Promise<UserResume | null> {
  try {
    const snap = await get(ref(db, `users/${uid}/resume`))
    if (snap.exists()) {
      return snap.val() as UserResume
    }
    return null
  } catch (err) {
    console.log('Error loading user resume:', err)
    return null
  }
}

/**
 * Saves or updates the user's private resume.
 */
export async function saveUserResume(
  uid: string,
  resume: Omit<UserResume, 'updatedAt'>
): Promise<void> {
  await update(ref(db), {
    [`users/${uid}/resume`]: {
      ...resume,
      updatedAt: Date.now(),
    },
  })
}

/**
 * Submits an in-app job application with a granted access duration.
 */
export async function submitJobApplication({
  jobId,
  jobTitle,
  businessName,
  employerId,
  accessDurationDays,
  resume,
}: {
  jobId: string
  jobTitle: string
  businessName: string
  employerId: string
  accessDurationDays: number
  resume: UserResume
}): Promise<JobApplicationRecord> {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('Must be signed in to apply.')
  }

  const appRef = push(ref(db, `users/${currentUser.uid}/myApplications`))
  const applicationId = appRef.key || `app_${Date.now()}`

  const appliedAt = Date.now()
  const accessExpiresAt = appliedAt + accessDurationDays * 24 * 60 * 60 * 1000

  const applicationRecord: JobApplicationRecord = {
    id: applicationId,
    jobId,
    jobTitle,
    businessName,
    employerId,
    applicantId: currentUser.uid,
    applicantName: resume.name,
    applicantPhone: resume.phone,
    applicantEmail: resume.email,
    summary: resume.summary,
    skills: resume.skills,
    experience: resume.experience || '',
    education: resume.education || '',
    appliedAt,
    accessDurationDays,
    accessExpiresAt,
    status: 'Submitted',
    revoked: false,
  }

  const updates: Record<string, any> = {
    [`users/${currentUser.uid}/myApplications/${jobId}`]: applicationRecord,
  }

  await update(ref(db), updates)

  // Notify employer via notifications node
  try {
    const notifRef = push(ref(db, `notifications/${employerId}`))
    await update(ref(db), {
      [`notifications/${employerId}/${notifRef.key}`]: {
        id: notifRef.key,
        userId: employerId,
        type: 'job_application',
        title: 'New Job Application 📄',
        body: `${resume.name} applied for "${jobTitle}"`,
        actorId: currentUser.uid,
        actorName: resume.name,
        jobId,
        screen: 'MyJobs',
        params: { jobId, applicantId: currentUser.uid },
        createdAt: Date.now(),
        read: false,
      },
    })
  } catch (notifyErr) {
    console.log('Failed to notify employer:', notifyErr)
  }

  return applicationRecord
}

/**
 * Fetches all applications submitted by the current user.
 */
export async function getMyApplications(uid: string): Promise<JobApplicationRecord[]> {
  try {
    const snap = await get(ref(db, `users/${uid}/myApplications`))
    if (!snap.exists()) return []

    const data = snap.val()
    const apps: JobApplicationRecord[] = []

    for (const key of Object.keys(data)) {
      const app = data[key] as JobApplicationRecord
      if (app && app.id) {
        try {
          const statusSnap = await get(
            ref(db, `users/${app.employerId}/candidateStatuses/${app.id}`)
          )
          if (statusSnap.exists()) {
            app.status = statusSnap.val() as ApplicationStatus
          }
        } catch {}
        apps.push(app)
      }
    }

    return apps.sort((a, b) => b.appliedAt - a.appliedAt)
  } catch (err) {
    console.log('Error loading my applications:', err)
    return []
  }
}

/**
 * Revokes employer access to a resume for a specific application.
 */
export async function revokeResumeAccess(uid: string, jobId: string): Promise<void> {
  await update(ref(db), {
    [`users/${uid}/myApplications/${jobId}/revoked`]: true,
  })
}

/**
 * Employer: Updates candidate status for an application.
 */
export async function updateCandidateStatus(
  employerUid: string,
  applicantUid: string,
  applicationId: string,
  jobTitle: string,
  newStatus: ApplicationStatus
): Promise<void> {
  await update(ref(db), {
    [`users/${employerUid}/candidateStatuses/${applicationId}`]: newStatus,
  })

  try {
    const notifRef = push(ref(db, `notifications/${applicantUid}`))
    await update(ref(db), {
      [`notifications/${applicantUid}/${notifRef.key}`]: {
        id: notifRef.key,
        userId: applicantUid,
        type: 'job_application',
        title: 'Application Status Update 📢',
        body: `Your application for "${jobTitle}" is now: ${newStatus}`,
        actorId: employerUid,
        actorName: 'Employer',
        screen: 'MyApplications',
        createdAt: Date.now(),
        read: false,
      },
    })
  } catch (err) {
    console.log('Failed to notify applicant:', err)
  }
}

/**
 * Checks whether an employer currently has valid access to a candidate's resume.
 */
export function isApplicationAccessValid(app: JobApplicationRecord): boolean {
  if (app.revoked) return false
  return Date.now() <= app.accessExpiresAt
}

/**
 * Fetches all candidate applications for a specific job posted by the employer.
 */
export async function getApplicationsForJob(
  jobId: string,
  employerUid: string
): Promise<JobApplicationRecord[]> {
  try {
    const notifsSnap = await get(ref(db, `notifications/${employerUid}`))
    if (!notifsSnap.exists()) return []

    const notifsData = notifsSnap.val()
    const applicantIds = new Set<string>()

    for (const key of Object.keys(notifsData)) {
      const n = notifsData[key]
      if (
        (n.type === 'job_application' || n.screen === 'MyJobs') &&
        (n.jobId === jobId || n.params?.jobId === jobId)
      ) {
        const applicantId = n.params?.applicantId || n.actorId
        if (applicantId) {
          applicantIds.add(applicantId)
        }
      }
    }

    const applications: JobApplicationRecord[] = []

    for (const applicantId of applicantIds) {
      try {
        const appSnap = await get(
          ref(db, `users/${applicantId}/myApplications/${jobId}`)
        )
        if (appSnap.exists()) {
          const app = appSnap.val() as JobApplicationRecord
          try {
            const statusSnap = await get(
              ref(db, `users/${employerUid}/candidateStatuses/${app.id}`)
            )
            if (statusSnap.exists()) {
              app.status = statusSnap.val() as ApplicationStatus
            }
          } catch {}
          applications.push(app)
        }
      } catch (appErr) {
        console.log(`Failed to fetch application for ${applicantId}:`, appErr)
      }
    }

    return applications.sort((a, b) => b.appliedAt - a.appliedAt)
  } catch (err) {
    console.log('Error fetching applications for job:', err)
    return []
  }
}
