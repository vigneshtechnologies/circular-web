import type { Metadata } from 'next'
import {
  getPublicBusinessesList,
  getPublicUsersList,
  getPublicPostsList,
  getPublicJobsList,
  getPublicNeedsList,
  getPublicEventsList,
} from '@/lib/serverPublicData'
import SearchClientContainer from './search-client'

export const revalidate = 300 // ISR revalidation every 5 minutes

export const metadata: Metadata = {
  title: 'Search Circular | Local Businesses, Community Members, Jobs & Events',
  description:
    'Search and discover verified local businesses, neighbor updates, jobs, needs, and events in your neighborhood on Circular.',
  alternates: {
    canonical: 'https://circularapp.in/search',
  },
  openGraph: {
    title: 'Search Circular | Local Social & Business Directory',
    description:
      'Search and discover verified local businesses, neighbor updates, jobs, needs, and events in your neighborhood on Circular.',
    url: 'https://circularapp.in/search',
    siteName: 'Circular',
    images: [
      {
        url: 'https://circularapp.in/circular-logo.png',
        width: 512,
        height: 512,
        alt: 'Circular Logo',
      },
    ],
    type: 'website',
  },
}

export default async function SearchPage() {
  const [
    initialBusinesses,
    initialPeople,
    initialPosts,
    initialJobs,
    initialNeeds,
    initialEvents,
  ] = await Promise.all([
    getPublicBusinessesList(100),
    getPublicUsersList(100),
    getPublicPostsList(60),
    getPublicJobsList(60),
    getPublicNeedsList(60),
    getPublicEventsList(60),
  ])

  return (
    <SearchClientContainer
      initialBusinesses={initialBusinesses}
      initialPeople={initialPeople}
      initialPosts={initialPosts}
      initialJobs={initialJobs}
      initialNeeds={initialNeeds}
      initialEvents={initialEvents}
    />
  )
}
