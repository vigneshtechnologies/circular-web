/**
 * Geographic and Distance Utilities for Circular 2.0 Web
 * Reuses the official Haversine distance formula from locationUtils.ts in Android app.
 */

export const CIRCULAR_RADIUS_OPTIONS = [1, 3, 5, 10, 25] as const
export type CircularRadiusOption = (typeof CIRCULAR_RADIUS_OPTIONS)[number]
export const DEFAULT_RADIUS_KM: CircularRadiusOption = 25
export const MAX_RADIUS_KM: CircularRadiusOption = 25

/**
 * Returns clean user locality name, never returning 'Unknown', 'null', or hardcoded fallbacks.
 */
export function getUserCommunityLocation(userProfile?: any): string {
  if (!userProfile) return 'Your Community'
  const area = userProfile.area || userProfile.areaName || userProfile.city || ''
  if (typeof area === 'string' && area.trim().length > 0) {
    const clean = area.trim()
    if (
      clean.toLowerCase() !== 'unknown' &&
      clean.toLowerCase() !== 'undefined' &&
      clean.toLowerCase() !== 'null'
    ) {
      return clean
    }
  }
  return 'Your Community'
}

/**
 * Checks if a coordinate pair is physically valid and not a placeholder (0,0).
 */
export function isValidCoordinate(
  latitude: number | string | undefined | null,
  longitude: number | string | undefined | null
): boolean {
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    return false
  }
  const lat = Number(latitude)
  const lng = Number(longitude)

  if (isNaN(lat) || isNaN(lng)) return false
  if (lat === 0 && lng === 0) return false
  if (lat < -90 || lat > 90) return false
  if (lng < -180 || lng > 180) return false

  return true
}

/**
 * Calculates the great-circle distance between two points in kilometers using Haversine formula.
 */
export function getDistanceKm(
  lat1: number | string,
  lon1: number | string,
  lat2: number | string,
  lon2: number | string
): number {
  const nLat1 = Number(lat1)
  const nLon1 = Number(lon1)
  const nLat2 = Number(lat2)
  const nLon2 = Number(lon2)

  if (
    isNaN(nLat1) ||
    isNaN(nLon1) ||
    isNaN(nLat2) ||
    isNaN(nLon2) ||
    (nLat1 === 0 && nLon1 === 0) ||
    (nLat2 === 0 && nLon2 === 0)
  ) {
    return 0
  }

  const earthRadiusKm = 6371
  const toRadians = (deg: number) => deg * (Math.PI / 180)

  const dLat = toRadians(nLat2 - nLat1)
  const dLon = toRadians(nLon2 - nLon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(nLat1)) *
      Math.cos(toRadians(nLat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

/**
 * Formats a distance in kilometers into a clean, human-readable string.
 */
export function formatDistanceKm(distanceKm: number | undefined | null): string {
  if (typeof distanceKm !== 'number' || isNaN(distanceKm) || distanceKm <= 0) {
    return ''
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`
  }
  return `${distanceKm.toFixed(1)} km`
}
