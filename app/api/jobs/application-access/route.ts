import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { jobId, applicantId, employerId } = body

    if (!jobId || !applicantId || !employerId) {
      return NextResponse.json(
        { error: 'Missing required parameters: jobId, applicantId, employerId' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Backend database unavailable' },
        { status: 500 }
      )
    }

    // 1. Verify Job existence and employer authorization
    let jobSnap = await adminDb.ref(`localJobs/${jobId}`).once('value')
    if (!jobSnap.exists()) {
      jobSnap = await adminDb.ref(`jobs/${jobId}`).once('value')
    }

    if (!jobSnap.exists()) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const jobData = jobSnap.val()
    if (jobData.createdBy !== employerId) {
      return NextResponse.json(
        { error: 'Unauthorized: requester is not the job creator' },
        { status: 403 }
      )
    }

    // 2. Fetch Application record
    let appSnap = await adminDb.ref(`jobApplications/${jobId}/${applicantId}`).once('value')
    if (!appSnap.exists()) {
      appSnap = await adminDb.ref(`users/${applicantId}/myApplications/${jobId}`).once('value')
    }

    if (!appSnap.exists()) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const application = appSnap.val()
    const now = Date.now()

    // 3. Server-side validation of consent, duration, expiry, and revocation
    const isRevoked = Boolean(application.revoked)
    const isExpired = typeof application.accessExpiresAt === 'number' && now > application.accessExpiresAt

    if (isRevoked) {
      return NextResponse.json({
        accessGranted: false,
        status: 'revoked',
        message: 'Applicant has revoked access to their résumé.',
        application: {
          id: application.id,
          jobId: application.jobId,
          applicantName: application.applicantName,
          status: application.status,
          appliedAt: application.appliedAt,
          accessDurationDays: application.accessDurationDays,
          accessExpiresAt: application.accessExpiresAt,
          revoked: true,
        },
      })
    }

    if (isExpired) {
      return NextResponse.json({
        accessGranted: false,
        status: 'expired',
        message: 'The granted résumé access duration has expired.',
        application: {
          id: application.id,
          jobId: application.jobId,
          applicantName: application.applicantName,
          status: application.status,
          appliedAt: application.appliedAt,
          accessDurationDays: application.accessDurationDays,
          accessExpiresAt: application.accessExpiresAt,
          expired: true,
        },
      })
    }

    // 4. Access is valid: return application with consented resume snapshot
    return NextResponse.json({
      accessGranted: true,
      status: 'active',
      validUntil: application.accessExpiresAt,
      application,
    })
  } catch (error: any) {
    console.error('[ApplicationAccess API Error]:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
