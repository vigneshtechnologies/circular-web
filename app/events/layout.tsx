import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community Events',
  description: 'Explore upcoming community gatherings, festivals, and local events on Circular.',
  alternates: {
    canonical: 'https://circularapp.in/events',
  },
  openGraph: {
    title: 'Community Events | Circular',
    description: 'Explore upcoming community gatherings, festivals, and local events on Circular.',
    url: 'https://circularapp.in/events',
  },
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}