import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Local Need Board in Rajapalayam & Region',
  description:
    'Discover genuine community requests, help-needed notices, and neighborhood needs in Rajapalayam and surrounding areas on Circular.',
  alternates: {
    canonical: 'https://circularapp.in/needs',
  },
  openGraph: {
    title: 'Local Need Board in Rajapalayam & Region | Circular',
    description:
      'Discover genuine community requests, help-needed notices, and neighborhood needs in Rajapalayam and surrounding areas on Circular.',
    url: 'https://circularapp.in/needs',
  },
}

export default function NeedsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
