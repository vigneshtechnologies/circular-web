// Centralized semantic category color mapping for Circular
// Ensures complete consistency across Search, Feed, Business Directory, Filters, and Cards.

export interface CategoryColorDef {
  name: string
  color: string // Tailwind text color class
  darkColor: string // Dark mode text class
  bg: string // Subtle tinted bg
  darkBg: string // Subtle dark tinted bg
  border: string // Subtle border
  activePill: string // Full active pill class
  dotColor: string // Hex or inline style
  hex: string
}

export const CATEGORY_COLORS: Record<string, CategoryColorDef> = {
  general: {
    name: 'General',
    color: 'text-blue-600',
    darkColor: 'dark:text-blue-400',
    bg: 'bg-blue-500/10',
    darkBg: 'dark:bg-blue-500/15',
    border: 'border-blue-500/25',
    activePill: 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 border-blue-600',
    dotColor: '#2563EB',
    hex: '#2563EB',
  },
  food: {
    name: 'Food',
    color: 'text-orange-600',
    darkColor: 'dark:text-orange-400',
    bg: 'bg-orange-500/10',
    darkBg: 'dark:bg-orange-500/15',
    border: 'border-orange-500/25',
    activePill: 'bg-orange-500 text-white shadow-sm shadow-orange-500/30 border-orange-500',
    dotColor: '#EA580C',
    hex: '#EA580C',
  },
  shopping: {
    name: 'Shopping',
    color: 'text-pink-600',
    darkColor: 'dark:text-pink-400',
    bg: 'bg-pink-500/10',
    darkBg: 'dark:bg-pink-500/15',
    border: 'border-pink-500/25',
    activePill: 'bg-pink-600 text-white shadow-sm shadow-pink-500/30 border-pink-600',
    dotColor: '#DB2777',
    hex: '#DB2777',
  },
  services: {
    name: 'Services',
    color: 'text-teal-600',
    darkColor: 'dark:text-teal-400',
    bg: 'bg-teal-500/10',
    darkBg: 'dark:bg-teal-500/15',
    border: 'border-teal-500/25',
    activePill: 'bg-teal-600 text-white shadow-sm shadow-teal-500/30 border-teal-600',
    dotColor: '#0D9488',
    hex: '#0D9488',
  },
  education: {
    name: 'Education',
    color: 'text-purple-600',
    darkColor: 'dark:text-purple-400',
    bg: 'bg-purple-500/10',
    darkBg: 'dark:bg-purple-500/15',
    border: 'border-purple-500/25',
    activePill: 'bg-purple-600 text-white shadow-sm shadow-purple-500/30 border-purple-600',
    dotColor: '#7C3AED',
    hex: '#7C3AED',
  },
  medical: {
    name: 'Medical',
    color: 'text-emerald-600',
    darkColor: 'dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    darkBg: 'dark:bg-emerald-500/15',
    border: 'border-emerald-500/25',
    activePill: 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 border-emerald-600',
    dotColor: '#059669',
    hex: '#059669',
  },
  jobs: {
    name: 'Jobs',
    color: 'text-emerald-600',
    darkColor: 'dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    darkBg: 'dark:bg-emerald-500/15',
    border: 'border-emerald-500/25',
    activePill: 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 border-emerald-600',
    dotColor: '#10B981',
    hex: '#10B981',
  },
  events: {
    name: 'Events',
    color: 'text-orange-600',
    darkColor: 'dark:text-orange-400',
    bg: 'bg-orange-500/10',
    darkBg: 'dark:bg-orange-500/15',
    border: 'border-orange-500/25',
    activePill: 'bg-orange-600 text-white shadow-sm shadow-orange-500/30 border-orange-600',
    dotColor: '#F97316',
    hex: '#F97316',
  },
  offers: {
    name: 'Offers',
    color: 'text-amber-600',
    darkColor: 'dark:text-amber-400',
    bg: 'bg-amber-500/10',
    darkBg: 'dark:bg-amber-500/15',
    border: 'border-amber-500/25',
    activePill: 'bg-amber-500 text-white shadow-sm shadow-amber-500/30 border-amber-500',
    dotColor: '#F59E0B',
    hex: '#F59E0B',
  },
  needs: {
    name: 'Needs',
    color: 'text-rose-600',
    darkColor: 'dark:text-rose-400',
    bg: 'bg-rose-500/10',
    darkBg: 'dark:bg-rose-500/15',
    border: 'border-rose-500/25',
    activePill: 'bg-rose-600 text-white shadow-sm shadow-rose-500/30 border-rose-600',
    dotColor: '#F43F5E',
    hex: '#F43F5E',
  },
  technology: {
    name: 'Technology',
    color: 'text-violet-600',
    darkColor: 'dark:text-violet-400',
    bg: 'bg-violet-500/10',
    darkBg: 'dark:bg-violet-500/15',
    border: 'border-violet-500/25',
    activePill: 'bg-violet-600 text-white shadow-sm shadow-violet-500/30 border-violet-600',
    dotColor: '#8B5CF6',
    hex: '#8B5CF6',
  },
  news: {
    name: 'News & Updates',
    color: 'text-indigo-600',
    darkColor: 'dark:text-indigo-400',
    bg: 'bg-indigo-500/10',
    darkBg: 'dark:bg-indigo-500/15',
    border: 'border-indigo-500/25',
    activePill: 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 border-indigo-600',
    dotColor: '#6366F1',
    hex: '#6366F1',
  },
  all: {
    name: 'All',
    color: 'text-purple-600',
    darkColor: 'dark:text-purple-400',
    bg: 'bg-purple-500/10',
    darkBg: 'dark:bg-purple-500/15',
    border: 'border-purple-500/25',
    activePill: 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-sm shadow-purple-500/30 border-transparent',
    dotColor: '#8B5CF6',
    hex: '#8B5CF6',
  },
}

// Fallback is ALWAYS neutral slate, NEVER blue!
export const NEUTRAL_CATEGORY_DEF: CategoryColorDef = {
  name: 'Community',
  color: 'text-slate-600',
  darkColor: 'dark:text-slate-400',
  bg: 'bg-slate-500/10',
  darkBg: 'dark:bg-slate-500/15',
  border: 'border-slate-500/20',
  activePill: 'bg-slate-700 text-white shadow-sm border-slate-700',
  dotColor: '#64748B',
  hex: '#64748B',
}

export function getCategoryDef(category?: string): CategoryColorDef {
  if (!category) return NEUTRAL_CATEGORY_DEF
  const cat = category.toLowerCase().trim()

  if (cat === 'all') return CATEGORY_COLORS.all
  if (cat.includes('food') || cat.includes('restaurant') || cat.includes('hotel') || cat.includes('dine') || cat.includes('bakery')) return CATEGORY_COLORS.food
  if (cat.includes('shop') || cat.includes('store') || cat.includes('textile') || cat.includes('wear') || cat.includes('mart')) return CATEGORY_COLORS.shopping
  if (cat.includes('serv') || cat.includes('repair') || cat.includes('salon') || cat.includes('plumb') || cat.includes('elect')) return CATEGORY_COLORS.services
  if (cat.includes('edu') || cat.includes('school') || cat.includes('college') || cat.includes('tuition') || cat.includes('coach')) return CATEGORY_COLORS.education
  if (cat.includes('med') || cat.includes('health') || cat.includes('clinic') || cat.includes('hosp') || cat.includes('pharma') || cat.includes('doctor')) return CATEGORY_COLORS.medical
  if (cat.includes('job') || cat.includes('career') || cat.includes('hiring') || cat.includes('vacancy')) return CATEGORY_COLORS.jobs
  if (cat.includes('event') || cat.includes('fest') || cat.includes('gather') || cat.includes('meet') || cat.includes('show')) return CATEGORY_COLORS.events
  if (cat.includes('offer') || cat.includes('deal') || cat.includes('discount') || cat.includes('sale')) return CATEGORY_COLORS.offers
  if (cat.includes('need') || cat.includes('blood') || cat.includes('help') || cat.includes('urgent') || cat.includes('request')) return CATEGORY_COLORS.needs
  if (cat.includes('tech') || cat.includes('software') || cat.includes('it') || cat.includes('comput') || cat.includes('web')) return CATEGORY_COLORS.technology
  if (cat.includes('news') || cat.includes('update') || cat.includes('alert') || cat.includes('announc') || cat.includes('notice')) return CATEGORY_COLORS.news
  if (cat === 'general') return CATEGORY_COLORS.general

  return NEUTRAL_CATEGORY_DEF
}

export function getCategoryBadgeClass(category?: string): string {
  const def = getCategoryDef(category)
  return def.bg + ' ' + def.darkBg + ' ' + def.color + ' ' + def.darkColor + ' border ' + def.border
}

export function getCategoryPillClass(category: string, isSelected: boolean): string {
  const def = getCategoryDef(category)
  if (isSelected) {
    return def.activePill + ' font-bold ring-2 ring-current/20'
  }
  return 'bg-card border border-border text-slate-700 dark:text-slate-300 hover:border-border/80 hover:bg-muted font-medium'
}
