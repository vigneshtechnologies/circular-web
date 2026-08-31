import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Local Business Directory in Rajapalayam & Region',
  description:
    'Explore local shops, textile stores, tuition centers, technology businesses, and services in Rajapalayam, Dhalavaipuram, Muhavur, and surrounding areas on Circular.',
  alternates: {
    canonical: 'https://circularapp.in/businesses',
  },
  openGraph: {
    title: 'Local Business Directory in Rajapalayam & Region | Circular',
    description:
      'Explore local shops, textile stores, tuition centers, technology businesses, and services in Rajapalayam, Dhalavaipuram, Muhavur, and surrounding areas on Circular.',
    url: 'https://circularapp.in/businesses',
  },
}

export default function BusinessesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
