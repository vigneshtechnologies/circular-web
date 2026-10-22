import { push, ref, set, get, query, orderByChild, limitToLast } from 'firebase/database'
import { db } from '@/lib/firebase'

export interface AdminActivityLogEntry {
  id?: string
  actorUid: string
  actorName?: string
  role?: string
  actionType:
    | 'delete_post'
    | 'ban_user'
    | 'unban_user'
    | 'verify_business'
    | 'close_job'
    | 'moderate_story'
    | 'broadcast'
    | 'role_assigned'
    | 'delete_comment'
  targetId: string
  targetType: 'user' | 'post' | 'story' | 'location' | 'job' | 'application' | 'broadcast'
  timestamp: number
  reason?: string
  details?: Record<string, any>
}

export async function logAdminActivity(
  entry: Omit<AdminActivityLogEntry, 'id' | 'timestamp'> & { timestamp?: number }
): Promise<string | null> {
  try {
    const logsRef = push(ref(db, 'adminActivityLogs'))
    const logId = logsRef.key
    const finalEntry: AdminActivityLogEntry = {
      ...entry,
      id: logId || undefined,
      timestamp: entry.timestamp || Date.now(),
    }
    await set(logsRef, finalEntry)
    return logId
  } catch (err) {
    console.error('Failed to log admin activity:', err)
    return null
  }
}

export async function getRecentAdminActivity(limit = 25): Promise<AdminActivityLogEntry[]> {
  try {
    const q = query(ref(db, 'adminActivityLogs'), orderByChild('timestamp'), limitToLast(limit))
    const snap = await get(q)
    if (!snap.exists()) return []
    const list: AdminActivityLogEntry[] = []
    snap.forEach((child) => {
      list.push({ id: child.key as string, ...child.val() })
    })
    return list.reverse()
  } catch (err) {
    console.error('Failed to fetch admin activity logs:', err)
    return []
  }
}
