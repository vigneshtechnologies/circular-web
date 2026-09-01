import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, HandHeart, MapPin, Tag, HeartHandshake, User, Sparkles } from 'lucide-react'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import { OpenInCircularBanner } from '@/components/public/open-in-circular-banner'
import { getPublicNeed } from '@/lib/serverPublicData'

export const revalidate = 300 // Revalidate every 5 minutes

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const need = await getPublicNeed(id)

  if (!need) {
    return {
      title: 'Request Not Found',
      description: 'The requested community need is no longer active on Circular.',
      alternates: {
        canonical: `https://circularapp.in/need/${id}`,
      },
      openGraph: {
        title: 'Community Need | Circular',
        description: 'The requested community need is no longer active on Circular.',
        url: `https://circularapp.in/need/${id}`,
      },
    }
  }

  const title = `${need.title} – ${need.area} | Circular`
  const description = need.description
    ? `${need.description.substring(0, 150)}... Help or reply on Circular.`
    : `View this community need request for ${need.title} in ${need.area} on Circular.`
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
      siteName: 'Circular – Local Social & Business Platform',
      type: 'article',
      images: [
        {
          url: '/circular-logo.png',
          width: 1200,
          height: 1200,
          alt: need.title,
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
  const need = await getPublicNeed(id)

  if (!need) {
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
          name: 'Needs',
          item: 'https://circularapp.in/needs',
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
              <HandHeart className="size-8" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Need Request Not Found</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              This community request does not exist, has been resolved, or was closed.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/needs"
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
              >
                Browse Community Need Board
              </Link>
            </div>
          </div>
        </main>
        <CircularFooter />
      </>
    )
  }

  const authorUrl = need.requesterId ? `https://circularapp.in/user/${need.requesterId}` : undefined

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: need.title,
    articleBody: need.description || '',
    url: `https://circularapp.in/need/${id}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://circularapp.in/need/${id}`,
    },
    datePublished: need.createdAt ? new Date(need.createdAt).toISOString() : undefined,
    author: {
      '@type': 'Person',
      name: need.requesterName || 'Community Member',
      ...(authorUrl ? { url: authorUrl } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Circular',
      url: 'https://circularapp.in',
      logo: {
        '@type': 'ImageObject',
        url: 'https://circularapp.in/circular-logo.png',
      },
    },
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
        name: 'Needs',
        item: 'https://circularapp.in/needs',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: need.title,
        item: `https://circularapp.in/need/${id}`,
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
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/needs" className="hover:text-primary">Needs</Link>
            <span>/</span>
            <span className="text-foreground truncate">{need.title}</span>
          </nav>

          {/* Need Card */}
          <article className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-lg md:p-8">
            <div className="flex items-start justify-between border-b border-border pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
                  <HandHeart className="size-3.5" />
                  <span>Need Board • {need.urgency}</span>
                </div>
                <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{need.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary" />
                    <span>{need.area}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="size-3.5 text-amber-600" />
                    <span>{need.category}</span>
                  </span>
                  {need.requesterName && (
                    <span className="flex items-center gap-1">
                      <User className="size-3.5 text-muted-foreground" />
                      <span>Posted by {need.requesterName}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="py-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Request Details</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground sm:text-base whitespace-pre-line">
                {need.description}
              </p>
            </div>
          </article>

          {/* Deep link Banner */}
          <div className="mt-8">
            <OpenInCircularBanner path={`/need/${id}`} title={need.title} />
          </div>
        </div>
      </main>

      <CircularFooter />
    </>
  )
}
