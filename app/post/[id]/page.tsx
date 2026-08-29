import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MessageSquare, Heart, MapPin, Tag, Share2 } from 'lucide-react'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import { OpenInCircularBanner } from '@/components/public/open-in-circular-banner'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const title = `Local Post | Circular`
  const description = `View this post and join the discussion on Circular – Local Social & Business.`
  const canonicalUrl = `https://circularapp.in/post/${id}`

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
          alt: 'Circular Post',
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

export default async function PublicPostPage({ params }: Props) {
  const { id } = await params

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    headline: `Circular Community Post #${id}`,
    url: `https://circularapp.in/post/${id}`,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CircularHeader />

      <main className="min-h-[80vh] bg-secondary/30 py-10 md:py-16">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {/* Back breadcrumb */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Home</span>
          </Link>

          {/* Post Card */}
          <article className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-lg md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="relative size-12 overflow-hidden rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <Image
                    src="/circular-logo.png"
                    alt="Author Avatar"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-base font-bold text-navy">Circular Community Post</h1>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3 text-primary" />
                    <span>Local Area</span>
                    <span>•</span>
                    <span>Shared on Circular</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Tag className="size-3" />
                <span>Post</span>
              </div>
            </div>

            {/* Post Content Body */}
            <div className="py-6">
              <p className="text-base leading-relaxed text-foreground md:text-lg">
                This post was shared on Circular. To view full images, read all comments, like, and interact with the author in real time, open this post directly in the Circular mobile app.
              </p>
            </div>

            {/* Engagement Bar */}
            <div className="flex items-center justify-between border-t border-border pt-4 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 hover:text-red-500">
                  <Heart className="size-4" />
                  <span>Likes</span>
                </span>
                <span className="flex items-center gap-1.5 hover:text-blue-500">
                  <MessageSquare className="size-4" />
                  <span>Comments</span>
                </span>
              </div>
              <span className="flex items-center gap-1.5">
                <Share2 className="size-4" />
                <span>Canonical Link</span>
              </span>
            </div>
          </article>

          {/* Deep link CTA Banner */}
          <div className="mt-8">
            <OpenInCircularBanner path={`/post/${id}`} title="Post" />
          </div>
        </div>
      </main>

      <CircularFooter />
    </>
  )
}
