/**
 * Circular 2.0 - People Discovery Engine (Web)
 * 
 * People You May Know + Mutual Connections + Nearby People
 * Hyperlocal, explainable, privacy-preserving recommendations.
 */

import { get, ref, update } from 'firebase/database';
import { db } from './firebase';
import { getDistanceKm, formatDistanceKm } from './locationUtils';
import { notifyFollow } from './notifications';

export interface MutualConnectionsResult {
  count: number;
  sampleNames: string[];
  connectionUids: string[];
}

export interface SuggestedPerson {
  uid: string;
  name: string;
  username: string;
  avatar?: string;
  occupation?: string;
  city?: string;
  area?: string;
  approxDistance?: string;
  distanceKm?: number;
  mutualCount: number;
  mutualSampleNames: string[];
  score: number;
  reasonLabel: string;
  isVerified?: boolean;
}

export interface PeopleDiscoveryOptions {
  currentUid: string;
  currentLocation?: { latitude: number; longitude: number };
  maxResults?: number;
  dismissedUids?: string[];
}

// In-memory session cache
const mutualCache = new Map<string, { result: MutualConnectionsResult; timestamp: number }>();
let suggestionsCache: { key: string; results: SuggestedPerson[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export function invalidateWebPeopleDiscoveryCache() {
  mutualCache.clear();
  suggestionsCache = null;
}

/**
 * Calculate mutual connections between current user and target user:
 * Mutuals(A, C) = following(A) ∩ (following(C) ∪ followers(C))
 */
export async function getMutualConnections(
  currentUid: string,
  targetUid: string
): Promise<MutualConnectionsResult> {
  if (!currentUid || !targetUid || currentUid === targetUid) {
    return { count: 0, sampleNames: [], connectionUids: [] };
  }

  const cacheKey = [currentUid, targetUid].sort().join('_');
  const cached = mutualCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  try {
    const [myFollowingSnap, targetFollowersSnap, targetFollowingSnap] = await Promise.all([
      get(ref(db, `following/${currentUid}`)),
      get(ref(db, `followers/${targetUid}`)),
      get(ref(db, `following/${targetUid}`)),
    ]);

    const myFollowing: Record<string, boolean> = myFollowingSnap.val() || {};
    const targetFollowers: Record<string, boolean> = targetFollowersSnap.val() || {};
    const targetFollowing: Record<string, boolean> = targetFollowingSnap.val() || {};

    const targetGraph = new Set<string>([
      ...Object.keys(targetFollowers),
      ...Object.keys(targetFollowing),
    ]);

    const mutualUids: string[] = [];
    for (const followedUid of Object.keys(myFollowing)) {
      if (followedUid !== targetUid && followedUid !== currentUid && targetGraph.has(followedUid)) {
        mutualUids.push(followedUid);
      }
    }

    // Resolve up to 3 sample names
    const sampleNames: string[] = [];
    const sampleUids = mutualUids.slice(0, 3);
    for (const mUid of sampleUids) {
      try {
        const snap = await get(ref(db, `publicProfiles/${mUid}`));
        if (snap.exists()) {
          const val = snap.val();
          const name = val?.name || val?.username;
          if (name) sampleNames.push(name.trim());
        }
      } catch {}
    }

    const result: MutualConnectionsResult = {
      count: mutualUids.length,
      sampleNames,
      connectionUids: mutualUids,
    };

    mutualCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error('Error computing mutual connections:', error);
    return { count: 0, sampleNames: [], connectionUids: [] };
  }
}

/**
 * Generates explainable badge label for suggestion card
 */
function buildReasonLabel(
  mutuals: MutualConnectionsResult,
  distanceKm: number | null,
  areaName: string | null
): string {
  if (mutuals.count > 0) {
    if (mutuals.sampleNames.length > 0) {
      const topNames = mutuals.sampleNames.slice(0, 2).join(', ');
      return `${mutuals.count} mutual${mutuals.count > 1 ? 's' : ''} (${topNames})`;
    }
    return `${mutuals.count} mutual connection${mutuals.count > 1 ? 's' : ''}`;
  }

  if (distanceKm !== null && distanceKm <= 25) {
    const formatted = formatDistanceKm(distanceKm);
    if (areaName) {
      return `Nearby in ${areaName} • ${formatted}`;
    }
    return `${formatted} away`;
  }

  if (areaName) {
    return `In ${areaName}`;
  }

  return 'Active in your community';
}

/**
 * Retrieve ranked People You May Know recommendations
 */
export async function getPeopleYouMayKnow({
  currentUid,
  currentLocation,
  maxResults = 10,
  dismissedUids = [],
}: PeopleDiscoveryOptions): Promise<SuggestedPerson[]> {
  if (!currentUid) return [];

  const cacheKey = `${currentUid}_${currentLocation ? `${currentLocation.latitude.toFixed(2)}_${currentLocation.longitude.toFixed(2)}` : 'none'}_${maxResults}`;
  if (suggestionsCache && suggestionsCache.key === cacheKey && Date.now() - suggestionsCache.timestamp < CACHE_TTL_MS) {
    const dismissedSet = new Set(dismissedUids);
    return suggestionsCache.results.filter((p) => !dismissedSet.has(p.uid));
  }

  try {
    // 1. Fetch current user graph & public profiles
    const [followingSnap, blockedSnap, myProfileSnap, publicProfilesSnap] = await Promise.all([
      get(ref(db, `following/${currentUid}`)),
      get(ref(db, `blockedUsers/${currentUid}`)),
      get(ref(db, `publicProfiles/${currentUid}`)),
      get(ref(db, 'publicProfiles')),
    ]);

    const followingMap: Record<string, boolean> = followingSnap.val() || {};
    const blockedMap: Record<string, boolean> = blockedSnap.val() || {};
    const myProfile = myProfileSnap.val() || {};
    const allProfiles: Record<string, any> = publicProfilesSnap.val() || {};

    const myArea = (myProfile.area || myProfile.city || '').trim().toLowerCase();
    const excludedUids = new Set<string>([
      currentUid,
      ...Object.keys(followingMap),
      ...Object.keys(blockedMap),
      ...dismissedUids,
    ]);

    // 2. Filter candidates
    const candidateUids = Object.keys(allProfiles).filter((uid) => {
      if (excludedUids.has(uid)) return false;
      const p = allProfiles[uid];
      if (!p || p.isDeleted || p.isBanned || p.accountStatus === 'suspended') return false;
      return true;
    });

    const pool = candidateUids.slice(0, 40);

    // 3. Compute mutual connections and score
    const suggestions: SuggestedPerson[] = [];

    for (const uid of pool) {
      const p = allProfiles[uid];
      const mutuals = await getMutualConnections(currentUid, uid);

      let score = 0;

      // A. Mutual connections (+50 each, max 150)
      score += Math.min(mutuals.count * 50, 150);

      // B. Geographic proximity
      let distanceKm: number | null = null;
      let approxDist: string | undefined;

      if (
        currentLocation &&
        typeof p.latitude === 'number' &&
        typeof p.longitude === 'number' &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude)
      ) {
        distanceKm = getDistanceKm(
          currentLocation.latitude,
          currentLocation.longitude,
          p.latitude,
          p.longitude
        );

        if (distanceKm <= 25) {
          approxDist = formatDistanceKm(distanceKm);
          if (distanceKm <= 3) {
            score += 30;
          } else if (distanceKm <= 10) {
            score += 20;
          } else {
            score += 10;
          }
        }
      }

      // C. Locality match
      const pArea = (p.area || p.city || '').trim();
      if (myArea && pArea && pArea.toLowerCase() === myArea) {
        score += 25;
      }

      // D. Recent activity
      if (p.lastActiveAt && Date.now() - p.lastActiveAt < 7 * 24 * 60 * 60 * 1000) {
        score += 10;
      } else if (p.createdAt && Date.now() - p.createdAt < 14 * 24 * 60 * 60 * 1000) {
        score += 10;
      }

      const reasonLabel = buildReasonLabel(mutuals, distanceKm, pArea || null);

      suggestions.push({
        uid,
        name: p.name || p.username || 'Circular Member',
        username: p.username || 'user',
        avatar: p.profileImage || p.avatar || '',
        occupation: p.occupation || p.category || '',
        city: p.city || '',
        area: p.area || '',
        approxDistance: approxDist,
        distanceKm: distanceKm ?? undefined,
        mutualCount: mutuals.count,
        mutualSampleNames: mutuals.sampleNames,
        score,
        reasonLabel,
        isVerified: Boolean(p.isVerified),
      });
    }

    // 4. Rank suggestions descending by score
    suggestions.sort((a, b) => b.score - a.score);
    const topResults = suggestions.slice(0, maxResults);

    suggestionsCache = {
      key: cacheKey,
      results: topResults,
      timestamp: Date.now(),
    };

    return topResults;
  } catch (error) {
    console.error('Error fetching People You May Know:', error);
    return [];
  }
}

/**
 * Optimistic follow helper
 */
export async function followUserOptimistic({
  currentUid,
  targetUid,
  actorName,
}: {
  currentUid: string;
  targetUid: string;
  actorName?: string;
}): Promise<boolean> {
  if (!currentUid || !targetUid || currentUid === targetUid) return false;

  try {
    const updates: Record<string, boolean> = {
      [`following/${currentUid}/${targetUid}`]: true,
      [`followers/${targetUid}/${currentUid}`]: true,
    };

    await update(ref(db), updates);

    // Invalidate local caches
    invalidateWebPeopleDiscoveryCache();

    // Dispatch follow notification
    notifyFollow({
      targetUserId: targetUid,
      actorId: currentUid,
      actorName: actorName || 'Circular Member',
    }).catch(() => {});

    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
}
