import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, User, Users, MapPin, Sparkles } from 'lucide-react'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import { OpenInCircularBanner } from '@/components/public/open-in-circular-banner'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const title = `User Profile | Circular`
  const description = `View this user's profile, public posts, and activity on Circular – Local Social & Business.`
  const canonicalUrl = `https://circularapp.in/user/${id}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Circular – Local Social & Business',
      type: 'profile',
      images: [
        {
          url: '/circular-logo.png',
          width: 1200,
          height: 1200,
          alt: 'Circular Profile',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/circular-logo.png'],
    },
  }
}

export default async function PublicUserPage({ params }: Props) {
  const { id } = await params

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: `Circular User #${id}`,
    url: `https://circularapp.in/user/${id}`,
    image: 'https://circularapp.in/circular-logo.png',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CircularHeader />

      <main className="min-h-[80vh] bg-secondary/30 py-10 md:py-16">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Home</span>
          </Link>

          {/* Profile Card */}
          <article className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-lg md:p-8">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:gap-6">
              <div className="relative size-24 overflow-hidden rounded-full bg-primary/10 ring-4 ring-primary/20">
                <Image
                  src="/circular-logo.png"
                  alt="Profile Avatar"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="mt-4 sm:mt-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                  <User className="size-3" />
                  <span>Circular Member</span>
                </div>
                <h1 className="mt-1 text-2xl font-bold text-navy">Circular User</h1>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground sm:justify-start">
                  <MapPin className="size-3.5 text-primary" />
                  <span>Local Community</span>
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                This user is active on Circular. Open the Circular mobile app to follow this profile, view their public posts, see mutual followers, and chat directly.
              </p>
            </div>
          </article>

          {/* Deep Link Banner */}
          <div className="mt-8">
            <OpenInCircularBanner path={`/user/${id}`} title="User Profile" />
          </div>
        </div>
      </main>

      <CircularFooter />
    </>
  )
}
