import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Need Board',
  description: 'Discover local requests, help wanted notices, and community needs on Circular.',
  alternates: {
    canonical: 'https://circularapp.in/needs',
  },
  openGraph: {
    title: 'Need Board | Circular',
    description: 'Discover local requests, help wanted notices, and community needs on Circular.',
    url: 'https://circularapp.in/needs',
  },
}

export default function NeedsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}