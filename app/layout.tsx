import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClientProviders } from '@/components/providers/client-providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://circularapp.in'),

  title: {
    default: 'Circular – Local Social & Business',
    template: '%s | Circular',
  },

  description:
    'Circular is a hyperlocal social and business discovery platform. Discover nearby shops, events, jobs, offers, and connect with your neighborhood.',

  keywords: [
    'Circular',
    'Circular App',
    'Local Social',
    'Local Business',
    'Nearby Posts',
    'Hyperlocal App',
    'Local Jobs',
    'Need Board',
    'Community Events',
    'Business Directory',
    'Rajapalayam',
    'Tamil Nadu',
    'India',
  ],

  applicationName: 'Circular',

  authors: [
    {
      name: 'Vignesh Technologies',
      url: 'https://circularapp.in',
    },
  ],

  creator: 'Vignesh Technologies',
  publisher: 'Vignesh Technologies',

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  alternates: {
    canonical: 'https://circularapp.in',
  },

  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://circularapp.in',
    siteName: 'Circular – Local Social & Business',
    title: 'Circular – Local Social & Business',
    description:
      'Discover nearby shops, events, jobs, offers, and connect with your neighborhood on Circular.',
    images: [
      {
        url: '/circular-logo.png',
        width: 1200,
        height: 1200,
        alt: 'Circular – Local Social & Business',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Circular – Local Social & Business',
    description:
      'Discover nearby shops, events, jobs, offers, and connect with your neighborhood on Circular.',
    images: ['/circular-logo.png'],
  },

  icons: {
    icon: [
      {
        url: '/circular-logo.png',
      },
      {
        url: '/circular-logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/circular-logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: '/circular-logo.png',
    shortcut: '/circular-logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0B0F17',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${inter.variable}`}>
        <ClientProviders>{children}</ClientProviders>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Circular',
              operatingSystem: 'Android',
              applicationCategory: 'SocialNetworkingApplication',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'INR',
              },
              description:
                'Hyperlocal social and business discovery platform for discovering nearby posts, events, jobs, and local businesses.',
              url: 'https://circularapp.in',
              downloadUrl:
                'https://play.google.com/store/apps/details?id=com.vigneshtechnologies.circular',
              author: {
                '@type': 'Organization',
                name: 'Vignesh Technologies',
                url: 'https://circularapp.in',
              },
            }),
          }}
        />

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
