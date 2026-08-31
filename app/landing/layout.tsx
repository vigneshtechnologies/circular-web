import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore Circular',
  description: 'Discover nearby shops, events, jobs, offers, and connect with your neighborhood on Circular.',
  alternates: {
    canonical: 'https://circularapp.in/landing',
  },
  openGraph: {
    title: 'Explore Circular – Local Social & Business Platform',
    description: 'Discover nearby shops, events, jobs, offers, and connect with your neighborhood on Circular.',
    url: 'https://circularapp.in/landing',
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}