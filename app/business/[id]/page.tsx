import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Store, Star, MapPin, CheckCircle2, Compass, Tag } from 'lucide-react'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import { OpenInCircularBanner } from '@/components/public/open-in-circular-banner'
import { getPublicBusiness } from '@/lib/serverPublicData'

export const revalidate = 300 // Revalidate every 5 minutes

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const business = await getPublicBusiness(id)

  if (!business) {
    return {
      title: 'Business Not Found',
      description: 'The requested local business profile is not available on Circular.',
    }
  }

  const title = `${business.name} – ${business.category} in ${business.area}`
  const description = business.description
    ? `${business.description.substring(0, 150)}... Discover ratings, photos, and reviews on Circular.`
    : `Discover ratings, location, photos, and customer reviews for ${business.name} in ${business.area} on Circular.`
  const canonicalUrl = `https://circularapp.in/business/${id}`
  const photo = business.photoUrl || '/circular-logo.png'

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
      type: 'profile',
      images: [
        {
          url: photo,
          width: 1200,
          height: 1200,
          alt: business.name,
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

export default async function PublicBusinessPage({ params }: Props) {
  const { id } = await params
  const business = await getPublicBusiness(id)

  if (!business) {
    const fallbackBreadcrumbs = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://circularapp.in',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Businesses',
          item: 'https://circularapp.in/businesses',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Business Directory',
          item: `https://circularapp.in/business/${id}`,
        },
      ],
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(fallbackBreadcrumbs) }}
        />
        <CircularHeader />
        <main className="min-h-[70vh] bg-secondary/30 py-16 text-center">
          <div className="mx-auto max-w-md px-4">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
              <Store className="size-8" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-navy">Business Profile Not Found</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              This business listing does not exist or may have been removed.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/businesses"
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
              >
                Browse Business Directory
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-sm hover:bg-muted"
              >
                Home
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
    '@type': 'LocalBusiness',
    name: business.name,
    url: `https://circularapp.in/business/${id}`,
    image: business.photoUrl || 'https://circularapp.in/circular-logo.png',
    description: business.description || `${business.name} – verified local business on Circular.`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.area,
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
    },
    ...(business.rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: business.rating.toFixed(1),
            reviewCount: 1,
          },
        }
      : {}),
  }

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://circularapp.in',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Businesses',
        item: 'https://circularapp.in/businesses',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: business.name,
        item: `https://circularapp.in/business/${id}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <CircularHeader />

      <main className="min-h-[80vh] bg-secondary/30 py-10 md:py-16">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/businesses" className="hover:text-primary">Businesses</Link>
            <span>/</span>
            <span className="text-foreground truncate">{business.name}</span>
          </nav>

          {/* Business Profile Card */}
          <article className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-lg md:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-purple-500/10 ring-2 ring-purple-500/20">
                  <Image
                    src={business.photoUrl || '/circular-logo.png'}
                    alt={business.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-navy md:text-2xl">
                      {business.name}
                    </h1>
                    {business.isVerified && (
                      <span title="Verified Merchant" className="inline-flex items-center shrink-0">
                        <CheckCircle2 className="size-5 text-emerald-500 fill-emerald-500/20" />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {business.category} • {business.area}
                  </p>
                  {business.rating && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-amber-500 font-bold">
                      <Star className="size-4 fill-amber-400" />
                      <span>{business.rating.toFixed(1)} Rating</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-600 shrink-0 self-start">
                <Store className="size-3.5" />
                <span>{business.category}</span>
              </div>
            </div>

            {/* Description */}
            {business.description && (
              <div className="mt-6 border-t border-border pt-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-navy">About this Business</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base whitespace-pre-line">
                  {business.description}
                </p>
              </div>
            )}

            {/* Location & Details pill row */}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-6 sm:grid-cols-3">
              <div className="rounded-xl bg-muted/50 p-3 text-center sm:text-left">
                <div className="text-xs text-muted-foreground">Locality</div>
                <div className="mt-1 flex items-center justify-center gap-1 text-xs font-bold text-navy sm:justify-start">
                  <MapPin className="size-3.5 text-primary" />
                  <span>{business.area}</span>
                </div>
              </div>

              <div className="rounded-xl bg-muted/50 p-3 text-center sm:text-left">
                <div className="text-xs text-muted-foreground">Category</div>
                <div className="mt-1 flex items-center justify-center gap-1 text-xs font-bold text-navy sm:justify-start">
                  <Tag className="size-3.5 text-purple-600" />
                  <span>{business.category}</span>
                </div>
              </div>

              <div className="col-span-2 rounded-xl bg-muted/50 p-3 text-center sm:col-span-1 sm:text-left">
                <div className="text-xs text-muted-foreground">Interactive Actions</div>
                <div className="mt-1 flex items-center justify-center gap-1 text-xs font-bold text-emerald-600 sm:justify-start">
                  <Compass className="size-3.5" />
                  <span>Chat &amp; Reviews in App</span>
                </div>
              </div>
            </div>
          </article>

          {/* Deep link Banner */}
          <div className="mt-8">
            <OpenInCircularBanner path={`/business/${id}`} title={business.name} />
          </div>
        </div>
      </main>

      <CircularFooter />
    </>
  )
}