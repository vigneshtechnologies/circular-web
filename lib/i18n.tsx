'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type AppLanguage = 'en' | 'ta' | 'hi'

export interface TranslationDictionary {
  // Navigation
  navHome: string
  navNearby: string
  navCreate: string
  navNotifications: string
  navSearch: string
  navMessages: string
  navProfile: string
  navFollowing: string
  navJobs: string
  navBusinesses: string
  navEvents: string
  navNeeds: string

  // Feeds
  forYou: string
  following: string
  nearbyFeed: string
  noPostsYet: string
  noFollowingPosts: string
  noNearbyPosts: string
  refreshFeed: string

  // Photos Gallery
  photos: string
  allPhotos: string
  postPhotos: string
  profilePictures: string
  noPhotosYet: string
  viewPost: string
  uploadPhoto: string

  // Create Post
  whatsOnYourMind: string
  postButton: string
  posting: string
  addPhotos: string
  audienceEveryone: string
  audienceFollowers: string
  whoCanSeePost: string

  // Privacy & Profiles
  accountPrivacy: string
  publicAccount: string
  privateAccount: string
  switchProfile: string
  addNewProfile: string

  // Jobs
  jobs: string
  searchJobs: string
  nearMe: string
  allModes: string
  onsite: string
  hybrid: string
  remote: string
  applyNow: string
  applied: string
  myResume: string
  myApplications: string
  accessValidUntil: string
  accessExpiredOrRevoked: string
  revokeAccess: string
  updateStatus: string

  // Common UI
  cancel: string
  save: string
  delete: string
  edit: string
  share: string
  like: string
  comment: string
  language: string
  selectLanguage: string
  logout: string
}

export const translations: Record<AppLanguage, TranslationDictionary> = {
  en: {
    navHome: 'Home',
    navNearby: 'Nearby',
    navCreate: 'Create',
    navNotifications: 'Alerts',
    navSearch: 'Search',
    navMessages: 'Messages',
    navProfile: 'Profile',
    navFollowing: 'Following',
    navJobs: 'Jobs',
    navBusinesses: 'Businesses',
    navEvents: 'Events',
    navNeeds: 'Needs Board',

    forYou: 'For You',
    following: 'Following',
    nearbyFeed: 'Nearby Feed',
    noPostsYet: 'No updates here yet. Be the first to share something!',
    noFollowingPosts: 'No posts from people you follow yet. Discover people in For You!',
    noNearbyPosts: 'No local posts found in this radius. Try widening your radius or exploring nearby.',
    refreshFeed: 'Refresh feed',

    photos: 'Photos',
    allPhotos: 'All Photos',
    postPhotos: 'Timeline Photos',
    profilePictures: 'Profile Pictures',
    noPhotosYet: 'No photos yet',
    viewPost: 'View Post',
    uploadPhoto: 'Upload Photo',

    whatsOnYourMind: "What's on your mind?",
    postButton: 'Post',
    posting: 'Publishing...',
    addPhotos: 'Add Photos',
    audienceEveryone: 'Everyone',
    audienceFollowers: 'Followers only',
    whoCanSeePost: 'Who can see this post?',

    accountPrivacy: 'Account Privacy',
    publicAccount: 'Public Account',
    privateAccount: 'Private Account',
    switchProfile: 'Switch Profile',
    addNewProfile: 'Add New Profile',

    jobs: 'Jobs',
    searchJobs: 'Search jobs by title, skill, shop, or area...',
    nearMe: 'Near me',
    allModes: 'All Modes',
    onsite: 'On-site',
    hybrid: 'Hybrid',
    remote: 'Remote',
    applyNow: 'Apply Now',
    applied: 'Applied',
    myResume: 'My Resume',
    myApplications: 'My Applications',
    accessValidUntil: 'Access valid until',
    accessExpiredOrRevoked: 'Access expired or revoked by applicant.',
    revokeAccess: 'Revoke Access',
    updateStatus: 'Update Status',

    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    share: 'Share',
    like: 'Like',
    comment: 'Comment',
    language: 'Language',
    selectLanguage: 'Select Language',
    logout: 'Logout',
  },
  ta: {
    navHome: 'முகப்பு',
    navNearby: 'அருகில்',
    navCreate: 'உருவாக்கு',
    navNotifications: 'அறிவிப்புகள்',
    navSearch: 'தேடு',
    navMessages: 'செய்திகள்',
    navProfile: 'சுயவிவரம்',
    navFollowing: 'பின்பற்றுபவை',
    navJobs: 'வேலைகள்',
    navBusinesses: 'வணிகங்கள்',
    navEvents: 'நிகழ்வுகள்',
    navNeeds: 'தேவைகள் பலகை',

    forYou: 'உங்களுக்காக',
    following: 'பின்பற்றுபவை',
    nearbyFeed: 'அருகிலுள்ள பதிவுகள்',
    noPostsYet: 'இங்கு இன்னும் பதிவுகள் இல்லை. முதலில் பகிருங்கள்!',
    noFollowingPosts: 'நீங்கள் பின்தொடரும் கணக்குகளிலிருந்து புதிய பதிவுகள் இல்லை.',
    noNearbyPosts: 'உங்கள் பகுதியில் பதிவுகள் இல்லை.',
    refreshFeed: 'புதுப்பிக்கவும்',

    photos: 'புகைப்படங்கள்',
    allPhotos: 'அனைத்து புகைப்படங்கள்',
    postPhotos: 'பதிவு புகைப்படங்கள்',
    profilePictures: 'சுயவிவரப் படங்கள்',
    noPhotosYet: 'இன்னும் புகைப்படங்கள் இல்லை',
    viewPost: 'பதிவைப் பார்க்க',
    uploadPhoto: 'புகைப்படம் பதிவேற்றுக',

    whatsOnYourMind: 'உங்கள் மனதில் என்ன தோன்றுகிறது?',
    postButton: 'பதிவிடு',
    posting: 'பதிவேற்றுகிறது...',
    addPhotos: 'படங்களைச் சேர்',
    audienceEveryone: 'அனைவரும்',
    audienceFollowers: 'பின்பற்றுபவர்கள் மட்டும்',
    whoCanSeePost: 'இப்பதிவை யார் பார்க்கலாம்?',

    accountPrivacy: 'கணக்கு தனியுரிமை',
    publicAccount: 'பொது கணக்கு',
    privateAccount: 'தனியார் கணக்கு',
    switchProfile: 'சுயவிவரத்தை மாற்று',
    addNewProfile: 'புதிய சுயவிவரம் சேர்',

    jobs: 'வேலை வாய்ப்புகள்',
    searchJobs: 'வேலை, திறமை அல்லது ஊர் வாரியாகத் தேடுங்கள்...',
    nearMe: 'என் அருகில்',
    allModes: 'அனைத்து முறைகளும்',
    onsite: 'நேரடி வேலை',
    hybrid: 'கலப்பு முறை',
    remote: 'வீட்டிலிருந்து வேலை',
    applyNow: 'விண்ணப்பியுங்கள்',
    applied: 'விண்ணப்பிக்கப்பட்டது',
    myResume: 'என் பயோடேட்டா',
    myApplications: 'என் விண்ணப்பங்கள்',
    accessValidUntil: 'அணுகல் செல்லுபடியாகும் தேதி',
    accessExpiredOrRevoked: 'விண்ணப்பதாரரால் அணுகல் திரும்பப் பெறப்பட்டது அல்லது காலாவதியானது.',
    revokeAccess: 'அணுகலை ரத்து செய்',
    updateStatus: 'நிலையை மாற்று',

    cancel: 'ரத்து',
    save: 'சேமி',
    delete: 'நீக்கு',
    edit: 'திருத்து',
    share: 'பகிர்',
    like: 'விருப்பம்',
    comment: 'கருத்து',
    language: 'மொழி',
    selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    logout: 'வெளியேறு',
  },
  hi: {
    navHome: 'होम',
    navNearby: 'आस-पास',
    navCreate: 'बनाएं',
    navNotifications: 'सूचनाएं',
    navSearch: 'खोजें',
    navMessages: 'संदेश',
    navProfile: 'प्रोफ़ाइल',
    navFollowing: 'फॉलोइंग',
    navJobs: 'नौकरियां',
    navBusinesses: 'व्यवसाय',
    navEvents: 'इवेंट्स',
    navNeeds: 'ज़रूरतें',

    forYou: 'आपके लिए',
    following: 'फॉलोइंग',
    nearbyFeed: 'आस-पास की फ़ीड',
    noPostsYet: 'अभी कोई पोस्ट नहीं है। पहली पोस्ट साझा करें!',
    noFollowingPosts: 'जिन लोगों को आप फ़ॉलो करते हैं उनकी कोई नई पोस्ट नहीं है।',
    noNearbyPosts: 'इस क्षेत्र में कोई पोस्ट नहीं मिली।',
    refreshFeed: 'रिफ्रेश करें',

    photos: 'फ़ोटो',
    allPhotos: 'सभी फ़ोटो',
    postPhotos: 'पोस्ट फ़ोटो',
    profilePictures: 'प्रोफ़ाइल फ़ोटो',
    noPhotosYet: 'अभी कोई फ़ोटो नहीं है',
    viewPost: 'पोस्ट देखें',
    uploadPhoto: 'फ़ोटो अपलोड करें',

    whatsOnYourMind: 'आपके मन में क्या है?',
    postButton: 'पोस्ट करें',
    posting: 'प्रकाशित हो रहा है...',
    addPhotos: 'फ़ोटो जोड़ें',
    audienceEveryone: 'सभी लोग',
    audienceFollowers: 'केवल फ़ॉलोअर्स',
    whoCanSeePost: 'यह पोस्ट कौन देख सकता है?',

    accountPrivacy: 'खाता गोपनीयता',
    publicAccount: 'सार्वजनिक खाता',
    privateAccount: 'निजी खाता',
    switchProfile: 'प्रोफ़ाइल बदलें',
    addNewProfile: 'नई प्रोफ़ाइल जोड़ें',

    jobs: 'नौकरियां',
    searchJobs: 'नौकरी, कौशल या क्षेत्र के अनुसार खोजें...',
    nearMe: 'मेरे पास',
    allModes: 'सभी प्रकार',
    onsite: 'ऑन-साइट',
    hybrid: 'हाइब्रिड',
    remote: 'घर से काम',
    applyNow: 'आवेदन करें',
    applied: 'आवेदित',
    myResume: 'मेरा बायोडाटा',
    myApplications: 'मेरे आवेदन',
    accessValidUntil: 'पहुंच की वैधता तिथि',
    accessExpiredOrRevoked: 'आवेदक द्वारा पहुंच रद्द या समाप्त कर दी गई है।',
    revokeAccess: 'पहुंच रद्द करें',
    updateStatus: 'स्थिति अपडेट करें',

    cancel: 'रद्द करें',
    save: 'सहेजें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    share: 'साझा करें',
    like: 'पसंद करें',
    comment: 'टिप्पणी',
    language: 'भाषा',
    selectLanguage: 'भाषा चुनें',
    logout: 'लॉग आउट',
  },
}

interface LanguageContextType {
  language: AppLanguage
  setLanguage: (lang: AppLanguage) => void
  t: TranslationDictionary
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('@circular_app_language') as AppLanguage
      if (saved && (saved === 'en' || saved === 'ta' || saved === 'hi')) {
        setLanguageState(saved)
      }
    } catch {}
  }, [])

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang)
    try {
      localStorage.setItem('@circular_app_language', lang)
    } catch {}
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] || translations.en }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

export function useTranslation() {
  const { t, language, setLanguage } = useLanguage()
  return { t, language, setLanguage }
}
