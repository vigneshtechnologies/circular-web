import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community Events in Rajapalayam & Region',
  description:
    'Discover upcoming community gatherings, exhibitions, festivals, and local events in Rajapalayam and surrounding areas on Circular.',
  alternates: {
    canonical: 'https://circularapp.in/events',
  },
  openGraph: {
    title: 'Community Events in Rajapalayam & Region | Circular',
    description:
      'Discover upcoming community gatherings, exhibitions, festivals, and local events in Rajapalayam and surrounding areas on Circular.',
    url: 'https://circularapp.in/events',
  },
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
