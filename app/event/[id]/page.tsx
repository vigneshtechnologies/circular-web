import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, MapPin, Clock, Tag, User, Sparkles } from 'lucide-react'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import { OpenInCircularBanner } from '@/components/public/open-in-circular-banner'
import { getPublicEvent } from '@/lib/serverPublicData'

export const revalidate = 300 // Revalidate every 5 minutes

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const event = await getPublicEvent(id)

  if (!event) {
    return {
      title: 'Event Not Found',
      description: 'The requested community event is not available on Circular.',
    }
  }

  const title = `${event.title} – ${event.venue}, ${event.area}`
  const description = event.description
    ? `${event.description.substring(0, 150)}... Join on Circular.`
    : `Discover this local event: ${event.title} at ${event.venue} in ${event.area} on Circular.`
  const canonicalUrl = `https://circularapp.in/event/${id}`
  const photo = event.imageUrl || '/circular-logo.png'

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
      siteName: 'Circular – Local Social & Business Platform',
      type: 'article',
      images: [
        {
          url: photo,
          width: 1200,
          height: 1200,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [photo],
    },
  }
}

export default async function PublicEventPage({ params }: Props) {
  const { id } = await params
  const event = await getPublicEvent(id)

  if (!event) {
    return (
      <>
        <CircularHeader />
        <main className="min-h-[70vh] bg-secondary/30 py-16 text-center">
          <div className="mx-auto max-w-md px-4">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
              <Calendar className="size-8" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-navy">Event Not Found</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              This event does not exist, has finished, or was cancelled.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/events"
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
              >
                Browse All Events
              </Link>
            </div>
          </div>
        </main>
        <CircularFooter />
      </>
    )
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || `${event.title} community event on Circular.`,
    url: `https://circularapp.in/event/${id}`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.area,
        addressRegion: 'Tamil Nadu',
        addressCountry: 'IN',
      },
    },
    ...(event.date ? { startDate: event.date } : {}),
    ...(event.imageUrl ? { image: [event.imageUrl] } : {}),
    ...(event.organizerName
      ? {
          organizer: {
            '@type': 'Person',
            name: event.organizerName,
          },
        }
      : {}),
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
          <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/events" className="hover:text-primary">Events</Link>
            <span>/</span>
            <span className="text-foreground truncate">{event.title}</span>
          </nav>

          {/* Event Card */}
          <article className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-lg md:p-8">
            <div className="flex items-start justify-between border-b border-border pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600">
                  <Calendar className="size-3.5" />
                  <span>Community Event</span>
                </div>
                <h1 className="mt-3 text-2xl font-bold text-navy">{event.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary" />
                    <span>{event.venue}, {event.area}</span>
                  </span>
                  {event.date && (
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Calendar className="size-3.5 text-rose-500" />
                      <span>{event.date} {event.time ? `• ${event.time}` : ''}</span>
                    </span>
                  )}
                  {event.organizerName && (
                    <span className="flex items-center gap-1">
                      <User className="size-3.5 text-muted-foreground" />
                      <span>Organized by {event.organizerName}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Public Event Photo if available */}
            {event.imageUrl && (
              <div className="relative mt-6 h-64 sm:h-80 w-full overflow-hidden rounded-2xl bg-muted border border-border">
                <Image src={event.imageUrl} alt={event.title} fill className="object-cover" />
              </div>
            )}

            {/* Description */}
            <div className="py-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy">About this Event</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground sm:text-base whitespace-pre-line">
                {event.description}
              </p>
            </div>
          </article>

          {/* Deep link Banner */}
          <div className="mt-8">
            <OpenInCircularBanner path={`/event/${id}`} title={event.title} />
          </div>
        </div>
      </main>

      <CircularFooter />
    </>
  )
}
