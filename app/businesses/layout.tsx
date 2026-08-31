import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Local Business Directory',
  description: 'Browse verified local shops, services, tuition academies, and businesses on Circular.',
  alternates: {
    canonical: 'https://circularapp.in/businesses',
  },
  openGraph: {
    title: 'Local Business Directory | Circular',
    description: 'Browse verified local shops, services, tuition academies, and businesses on Circular.',
    url: 'https://circularapp.in/businesses',
  },
}

export default function BusinessesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}