import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Local Jobs & Openings in Rajapalayam',
  description:
    'Find local jobs, staff vacancies, and hiring announcements from businesses in Rajapalayam and surrounding areas on Circular.',
  alternates: {
    canonical: 'https://circularapp.in/jobs',
  },
  openGraph: {
    title: 'Local Jobs & Openings in Rajapalayam | Circular',
    description:
      'Find local jobs, staff vacancies, and hiring announcements from businesses in Rajapalayam and surrounding areas on Circular.',
    url: 'https://circularapp.in/jobs',
  },
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
