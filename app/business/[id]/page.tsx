import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Store, Star, MapPin, CheckCircle2, Phone, Compass, Share2 } from 'lucide-react'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import { OpenInCircularBanner } from '@/components/public/open-in-circular-banner'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const title = `Local Business Profile | Circular`
  const description = `Discover ratings, location, operating hours, photos, and reviews for this local business on Circular.`
  const canonicalUrl = `https://circularapp.in/business/${id}`

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
          alt: 'Circular Local Business',
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

export default async function PublicBusinessPage({ params }: Props) {
  const { id } = await params

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Circular Business #${id}`,
    url: `https://circularapp.in/business/${id}`,
    image: 'https://circularapp.in/circular-logo.png',
    priceRange: '₹₹',
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
          {/* Breadcrumb */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Home</span>
          </Link>

          {/* Business Profile Card */}
          <article className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-lg md:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-purple-500/10 ring-2 ring-purple-500/20">
                  <Image
                    src="/circular-logo.png"
                    alt="Business Logo"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-navy md:text-2xl">
                      Local Business on Circular
                    </h1>
                    <CheckCircle2 className="size-5 text-emerald-500 fill-emerald-500/20" />
                  </div>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Verified Merchant • Local Directory
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-amber-500 font-bold">
                    <Star className="size-4 fill-amber-400" />
                    <span>Top Rated Local Business</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-600">
                <Store className="size-3.5" />
                <span>Business</span>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6 border-t border-border pt-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy">About Business</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                This local business is registered on Circular. Open the Circular mobile app to browse their full photo catalog, explore genuine customer reviews, see live operating hours, chat directly with the owner, and get turn-by-turn map directions.
              </p>
            </div>

            {/* Location & Details pill row */}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-6 sm:grid-cols-3">
              <div className="rounded-xl bg-muted/50 p-3 text-center sm:text-left">
                <div className="text-xs text-muted-foreground">Location</div>
                <div className="mt-1 flex items-center justify-center gap-1 text-xs font-bold text-navy sm:justify-start">
                  <MapPin className="size-3.5 text-primary" />
                  <span>Local Area</span>
                </div>
              </div>

              <div className="rounded-xl bg-muted/50 p-3 text-center sm:text-left">
                <div className="text-xs text-muted-foreground">Customer Reviews</div>
                <div className="mt-1 text-xs font-bold text-navy">1 Review per User</div>
              </div>

              <div className="col-span-2 rounded-xl bg-muted/50 p-3 text-center sm:col-span-1 sm:text-left">
                <div className="text-xs text-muted-foreground">Map Directions</div>
                <div className="mt-1 flex items-center justify-center gap-1 text-xs font-bold text-emerald-600 sm:justify-start">
                  <Compass className="size-3.5" />
                  <span>Available in App</span>
                </div>
              </div>
            </div>
          </article>

          {/* Deep link Banner */}
          <div className="mt-8">
            <OpenInCircularBanner path={`/business/${id}`} title="Business Profile" />
          </div>
        </div>
      </main>

      <CircularFooter />
    </>
  )
}
