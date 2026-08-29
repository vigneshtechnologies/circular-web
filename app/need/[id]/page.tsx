import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, HandHeart, MapPin, Tag, HeartHandshake } from 'lucide-react'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import { OpenInCircularBanner } from '@/components/public/open-in-circular-banner'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const title = `Community Need Request | Circular`
  const description = `View this community need request on Circular – Local Social & Business.`
  const canonicalUrl = `https://circularapp.in/need/${id}`

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
      type: 'article',
      images: [
        {
          url: '/circular-logo.png',
          width: 1200,
          height: 1200,
          alt: 'Circular Community Need',
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

export default async function PublicNeedPage({ params }: Props) {
  const { id } = await params

  return (
    <>
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

          {/* Need Card */}
          <article className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-lg md:p-8">
            <div className="flex items-start justify-between border-b border-border pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
                  <HandHeart className="size-3.5" />
                  <span>Need Board</span>
                </div>
                <h1 className="mt-3 text-2xl font-bold text-navy">Community Need Request</h1>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 text-primary" />
                  <span>Local Community</span>
                </div>
              </div>
            </div>

            <div className="py-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Request Details</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                A community member has posted a need or requirement on Circular. Open the Circular mobile app to view full details, reply, offer assistance, or contact the requester directly.
              </p>
            </div>
          </article>

          {/* Deep link Banner */}
          <div className="mt-8">
            <OpenInCircularBanner path={`/need/${id}`} title="Need Board Request" />
          </div>
        </div>
      </main>

      <CircularFooter />
    </>
  )
}
