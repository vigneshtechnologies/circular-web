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
  postType?: 'regular' | 'event' | 'poll' | 'smart' | 'announcement'
  postScope?: string
  isAdminPost?: boolean
  isGlobal?: boolean
  poll?: {
    question?: string
    options?: string[]
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
  coverImage?: string
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
  businessName?: string
  title: string
  category?: string
  description: string
  jobType?: 'Full-time' | 'Part-time' | 'Freelance' | 'Internship'
  salary?: string
  area?: string
  phone?: string
  email?: string
  createdAt: number
}

export interface NeedPost {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  title: string
  category?: string
  description: string
  urgency?: 'Low' | 'Medium' | 'High' | 'Urgent'
  area?: string
  createdAt: number
}

export interface CommunityEvent {
  id: string
  userId: string
  userName?: string
  title: string
  category?: string
  description: string
  venue: string
  eventDate?: string
  eventTime?: string
  startAt?: number
  area?: string
  imageUrl?: string
  createdAt: number
}

export interface NotificationItem {
  id: string
  recipientId: string
  senderId?: string
  senderName?: string
  senderAvatar?: string
  type: 'like' | 'comment' | 'follow' | 'review' | 'chat' | 'broadcast' | 'report' | 'job' | 'need' | 'event'
  title: string
  message: string
  targetId?: string
  targetType?: 'post' | 'business' | 'job' | 'need' | 'event' | 'chat' | 'profile'
  read: boolean
  createdAt: number
}

export interface ChatConversation {
  conversationId: string
  otherUserId: string
  otherUserName: string
  otherUserAvatar?: string
  otherUserUsername?: string
  isBusiness?: boolean
  businessName?: string
  lastMessageText: string
  lastMessageSenderId: string
  lastMessageTime: number
  unreadCount: number
  updatedAt: number
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  text: string
  createdAt: number
  read: boolean
}
