import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Clock, Tag } from 'lucide-react'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import { OpenInCircularBanner } from '@/components/public/open-in-circular-banner'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const title = `Local Community Event | Circular`
  const description = `Discover this upcoming local event, schedule, and venue on Circular – Local Social & Business.`
  const canonicalUrl = `https://circularapp.in/event/${id}`

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
          alt: 'Circular Community Event',
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

export default async function PublicEventPage({ params }: Props) {
  const { id } = await params

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `Circular Community Event #${id}`,
    url: `https://circularapp.in/event/${id}`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
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

          {/* Event Card */}
          <article className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-lg md:p-8">
            <div className="flex items-start justify-between border-b border-border pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600">
                  <Calendar className="size-3.5" />
                  <span>Community Event</span>
                </div>
                <h1 className="mt-3 text-2xl font-bold text-navy">Local Event on Circular</h1>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 text-primary" />
                  <span>Local Community Venue</span>
                </div>
              </div>
            </div>

            <div className="py-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy">Event Information</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                An exciting community event has been published on Circular. Open the Circular mobile app to view full event timings, venue directions, ticket info, and RSVP with other attendees.
              </p>
            </div>
          </article>

          {/* Deep link Banner */}
          <div className="mt-8">
            <OpenInCircularBanner path={`/event/${id}`} title="Community Event" />
          </div>
        </div>
      </main>

      <CircularFooter />
    </>
  )
}
