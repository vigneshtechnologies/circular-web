import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Local Jobs & Openings',
  description: 'Find local jobs, vacancies, and hiring announcements in your neighborhood on Circular.',
  alternates: {
    canonical: 'https://circularapp.in/jobs',
  },
  openGraph: {
    title: 'Local Jobs & Openings | Circular',
    description: 'Find local jobs, vacancies, and hiring announcements in your neighborhood on Circular.',
    url: 'https://circularapp.in/jobs',
  },
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}