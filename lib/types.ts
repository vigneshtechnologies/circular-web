export interface UserProfile {
  uid: string
  email: string
  name: string
  username?: string
  photoURL?: string
  profileImage?: string
  bio?: string
  area?: string
  areaName?: string
  city?: string
  phone?: string
  isRestricted?: boolean
  businessName?: string
  businessTrustLabel?: string
  showBusinessDetails?: boolean
  createdAt?: number
  followersCount?: number
  followingCount?: number
}

export type CircularPostType =
  | 'standard'
  | 'regular'
  | 'link'
  | 'poll'
  | 'event'
  | 'smart'
  | 'announcement'

export type LinkPreviewData = {
  originalUrl: string
  canonicalUrl?: string
  title?: string
  description?: string
  imageUrl?: string
  siteName?: string
  domain?: string
  fetchedAt?: number
  previewStatus?: 'ready' | 'fallback'
}

export type SmartPostTemplate =
  | 'list'
  | 'checklist'
  | 'table'
  | 'comparison'
  | 'priceList'
  | 'schedule'
  | 'availability'
  | 'progress'
  | 'notice'

export type SmartColumnType =
  | 'text'
  | 'number'
  | 'price'
  | 'date'
  | 'time'
  | 'status'
  | 'phone'
  | 'link'
  | 'percentage'

export type SmartColumn = {
  id: string
  title: string
  type: SmartColumnType
  order: number
  sortable?: boolean
  filterable?: boolean
}

export type SmartRow = {
  id: string
  order: number
  cells: Record<string, any>
}

export type SmartListItem = {
  id: string
  text: string
  order: number
}

export type SmartPostData = {
  template: SmartPostTemplate
  title: string
  description?: string
  items?: SmartListItem[]
  columns?: SmartColumn[]
  rows?: SmartRow[]
  progress?: {
    current: number
    target: number
    unit?: string
  }
  settings?: {
    sortable?: boolean
    filterable?: boolean
    allowSuggestions?: boolean
  }
}

export interface Post {
  id: string
  userId: string
  userEmail?: string
  userName?: string
  profileImage?: string
  businessName?: string
  businessTrustLabel?: string
  showBusinessDetails?: boolean
  text?: string
  category?: string
  area?: string
  areaName?: string
  city?: string
  latitude?: number | null
  longitude?: number | null
  imageUrl?: string
  imageUrls?: string[]
  imageCount?: number
  imagePublicId?: string
  imagePublicIds?: string[]
  createdAt: number
  updatedAt?: number
  likesCount?: number
  commentsCount?: number
  postType?: CircularPostType
  postScope?: string
  isAdminPost?: boolean
  isGlobal?: boolean
  linkPreview?: LinkPreviewData
  smart?: SmartPostData
  poll?: {
    question?: string
    options?: string[] | Record<string, { id: string; text: string; order: number }>
    votes?: Record<string, number>
    totalVotes?: number
  }
  event?: {
    title?: string
    startAt?: number
    endAt?: number
    eventDate?: string
    time?: string
    venue?: string
    description?: string
    imageUrl?: string
    contactPhone?: string
    status?: 'active' | 'cancelled' | 'completed'
  }
}

export interface PostComment {
  id: string
  postId: string
  userId: string
  userName: string
  userAvatar?: string
  text: string
  createdAt: number
}

export interface BusinessProfile {
  id: string
  userId: string
  name: string
  category: string
  description?: string
  address?: string
  area?: string
  city?: string
  latitude?: number
  longitude?: number
  phone?: string
  email?: string
  website?: string
  logoUrl?: string
  imageUrl?: string
  photoUrl?: string
  photoURL?: string
  profileImage?: string
  logo?: string
  businessLogo?: string
  businessImage?: string
  image?: string
  picture?: string
  coverImage?: string
  bannerUrl?: string
  thumbnail?: string
  photos?: string[]
  imageUrls?: string[]
  rating?: number
  ratingCount?: number
  isVerified?: boolean
  trustLabel?: string
  operatingHours?: string
  isNew?: boolean
  createdAt: number
  updatedAt?: number
}

export interface BusinessRating {
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  review?: string
  createdAt: number
}

export interface LocalJob {
  id: string
  userId: string
  businessName: string
  title: string
  category: string
  jobType: 'Full-time' | 'Part-time' | 'Freelance' | 'Internship'
  salary?: string
  area: string
  phone?: string
  email?: string
  description: string
  createdAt: number
}

export interface NeedPost {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  title: string
  category: string
  urgency: 'Low' | 'Medium' | 'High' | 'Urgent'
  area: string
  phone?: string
  description: string
  createdAt: number
  isResolved?: boolean
}

export interface CommunityEvent {
  id: string
  userId: string
  organizerName?: string
  userName?: string
  title: string
  category?: string
  eventDate: string
  time?: string
  eventTime?: string
  venue: string
  area: string
  description: string
  imageUrl?: string
  contactPhone?: string
  createdAt: number
  attendeesCount?: number
}

export interface NotificationItem {
  id: string
  userId: string
  type: 'like' | 'comment' | 'follow' | 'system' | 'mention'
  title: string
  message: string
  senderId?: string
  senderName?: string
  senderAvatar?: string
  targetId?: string
  targetType?: string
  read: boolean
  createdAt: number
}

export interface ChatConversation {
  id: string
  conversationId?: string
  participantIds: string[]
  lastMessage?: string
  lastMessageText?: string
  lastMessageAt?: number
  updatedAt?: number
  unreadCount?: number
  otherParticipant?: UserProfile
  otherUserName?: string
  otherUserAvatar?: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName?: string
  senderAvatar?: string
  text: string
  timestamp?: number
  createdAt?: number
  read?: boolean
}
