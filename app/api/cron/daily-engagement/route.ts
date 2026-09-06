import { NextRequest, NextResponse } from 'next/server'
import {
  evaluateDailyEngagementForAllUsers,
  evaluateAndDispatchDailyEngagementForUser,
  getDailyEngagementDateKey,
} from '@/lib/dailyEngagementServer'

export const dynamic = 'force-dynamic'

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || process.env.DAILY_ENGAGEMENT_SECRET
  if (!cronSecret) {
    // In local dev without secret configured, permit execution
    if (process.env.NODE_ENV !== 'production') return true
    return false
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader === `Bearer ${cronSecret}`) return true

  const url = new URL(req.url)
  const secretParam = url.searchParams.get('secret')
  if (secretParam === cronSecret) return true

  return false
}

export async function GET(req: NextRequest) {
  return handleRequest(req)
}

export async function POST(req: NextRequest) {
  return handleRequest(req)
}

async function handleRequest(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide valid Authorization header or secret query parameter.' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const targetUid = url.searchParams.get('uid')

    if (targetUid) {
      // Evaluate for a single specific user (useful for testing and on-demand trigger)
      const result = await evaluateAndDispatchDailyEngagementForUser(targetUid)
      return NextResponse.json({
        success: true,
        mode: 'single_user',
        result,
      })
    }

    // Evaluate for all users on the platform
    const summary = await evaluateDailyEngagementForAllUsers()
    return NextResponse.json({
      success: true,
      mode: 'all_users',
      dateKey: summary.dateKey,
      totalUsers: summary.totalUsers,
      dispatched: summary.dispatched,
      alreadySent: summary.alreadySent,
      skippedPreference: summary.skippedPreference,
      skippedQuietHours: summary.skippedQuietHours,
      noCandidate: summary.noCandidate,
      errors: summary.errors,
      results: summary.results,
    })
  } catch (error: any) {
    console.error('[CronDailyEngagement] Execution error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error),
        dateKey: getDailyEngagementDateKey(),
      },
      { status: 500 }
    )
  }
}
