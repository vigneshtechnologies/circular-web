/**
 * Circular 2.0 Web Theme Colors & Multi-Color Palette
 *
 * Cohesive 6-color system matching mobile:
 * - Navy Blue (#1E3A8A / #1D4ED8)
 * - Royal Premium Blue (#2563EB / #4F46E5)
 * - Vibrant Purple (#7C3AED / #9333EA)
 * - Warm Orange (#EA580C / #F97316)
 * - Vibrant Pink (#DB2777 / #EC4899)
 * - Crimson Red (#DC2626 / #EF4444)
 */

export interface AvatarColorInfo {
  name: string
  primary: string
  dark: string
  gradient: [string, string]
  bg: string
  darkBg: string
  border: string
  text: string
  tailwindText: string
  tailwindBg: string
  tailwindRing: string
}

export const MULTI_COLOR_PALETTE: AvatarColorInfo[] = [
  {
    name: 'royalBlue',
    primary: '#2563EB',
    dark: '#3B82F6',
    gradient: ['#2563EB', '#4F46E5'],
    bg: 'rgba(37, 99, 235, 0.12)',
    darkBg: 'rgba(59, 130, 246, 0.20)',
    border: 'rgba(37, 99, 235, 0.30)',
    text: '#FFFFFF',
    tailwindText: 'text-blue-600 dark:text-blue-400',
    tailwindBg: 'bg-blue-500/15',
    tailwindRing: 'ring-blue-500/40',
  },
  {
    name: 'purple',
    primary: '#7C3AED',
    dark: '#8B5CF6',
    gradient: ['#7C3AED', '#9333EA'],
    bg: 'rgba(124, 58, 237, 0.12)',
    darkBg: 'rgba(139, 92, 246, 0.20)',
    border: 'rgba(124, 58, 237, 0.30)',
    text: '#FFFFFF',
    tailwindText: 'text-purple-600 dark:text-purple-400',
    tailwindBg: 'bg-purple-500/15',
    tailwindRing: 'ring-purple-500/40',
  },
  {
    name: 'pink',
    primary: '#DB2777',
    dark: '#EC4899',
    gradient: ['#DB2777', '#EC4899'],
    bg: 'rgba(219, 39, 119, 0.12)',
    darkBg: 'rgba(236, 72, 153, 0.20)',
    border: 'rgba(219, 39, 119, 0.30)',
    text: '#FFFFFF',
    tailwindText: 'text-pink-600 dark:text-pink-400',
    tailwindBg: 'bg-pink-500/15',
    tailwindRing: 'ring-pink-500/40',
  },
  {
    name: 'orange',
    primary: '#EA580C',
    dark: '#F97316',
    gradient: ['#EA580C', '#F97316'],
    bg: 'rgba(234, 88, 12, 0.12)',
    darkBg: 'rgba(249, 115, 22, 0.20)',
    border: 'rgba(234, 88, 12, 0.30)',
    text: '#FFFFFF',
    tailwindText: 'text-orange-600 dark:text-orange-400',
    tailwindBg: 'bg-orange-500/15',
    tailwindRing: 'ring-orange-500/40',
  },
  {
    name: 'red',
    primary: '#DC2626',
    dark: '#EF4444',
    gradient: ['#DC2626', '#EF4444'],
    bg: 'rgba(220, 38, 38, 0.12)',
    darkBg: 'rgba(239, 68, 68, 0.20)',
    border: 'rgba(220, 38, 38, 0.30)',
    text: '#FFFFFF',
    tailwindText: 'text-red-600 dark:text-red-400',
    tailwindBg: 'bg-red-500/15',
    tailwindRing: 'ring-red-500/40',
  },
  {
    name: 'navy',
    primary: '#1E3A8A',
    dark: '#1D4ED8',
    gradient: ['#1E3A8A', '#1D4ED8'],
    bg: 'rgba(30, 58, 138, 0.12)',
    darkBg: 'rgba(29, 78, 216, 0.20)',
    border: 'rgba(30, 58, 138, 0.30)',
    text: '#FFFFFF',
    tailwindText: 'text-indigo-600 dark:text-indigo-400',
    tailwindBg: 'bg-indigo-500/15',
    tailwindRing: 'ring-indigo-500/40',
  },
]

export function hashStringToIndex(str?: string, modulus: number = MULTI_COLOR_PALETTE.length): number {
  if (!str) return 0
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % modulus
}

export function getAvatarColor(userIdOrName?: string): string {
  const index = hashStringToIndex(userIdOrName, MULTI_COLOR_PALETTE.length)
  return MULTI_COLOR_PALETTE[index].primary
}

export function getAvatarColorInfo(userIdOrName?: string): AvatarColorInfo {
  const index = hashStringToIndex(userIdOrName, MULTI_COLOR_PALETTE.length)
  return MULTI_COLOR_PALETTE[index]
}

export const FOLLOW_BUTTON_CLASS =
  'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-sm shadow-blue-500/25 active:scale-95'
