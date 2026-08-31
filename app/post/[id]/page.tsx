import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MessageSquare, Heart, MapPin, Tag, Share2, Sparkles } from 'lucide-react'
import { CircularHeader } from '@/components/circular-header'
import { CircularFooter } from '@/components/circular-footer'
import { OpenInCircularBanner } from '@/components/public/open-in-circular-banner'
import { getPublicPost } from '@/lib/serverPublicData'

export const revalidate = 300 // Revalidate every 5 minutes

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = await getPublicPost(id)

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested community post is not available on Circular.',
      alternates: {
        canonical: `https://circularapp.in/post/${id}`,
      },
      openGraph: {
        title: 'Community Post | Circular',
        description: 'The requested community post is not available on Circular.',
        url: `https://circularapp.in/post/${id}`,
      },
    }
  }

  const excerpt = post.text
    ? post.text.length > 60
      ? `${post.text.substring(0, 60)}...`
      : post.text
    : `Post by ${post.authorName}`

  const title = `${excerpt} – ${post.area}`
  const description = post.text
    ? `${post.text.substring(0, 150)}... Shared by ${post.authorName} on Circular.`
    : `View this ${post.category} post shared by ${post.authorName} in ${post.area} on Circular.`
  const canonicalUrl = `https://circularapp.in/post/${id}`
  const photo = (post.images && post.images.length > 0) ? post.images[0] : '/circular-logo.png'

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
          alt: post.authorName,
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

export default async function PublicPostPage({ params }: Props) {
  const { id } = await params
  const post = await getPublicPost(id)

  if (!post) {
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
          name: 'Community Posts',
          item: 'https://circularapp.in',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Post',
          item: `https://circularapp.in/post/${id}`,
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
              <Sparkles className="size-8" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-navy">Community Post Not Found</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              This post does not exist, is private, or has been removed.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/"
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
              >
                Back to Home Feed
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
    '@type': 'SocialMediaPosting',
    headline: post.text ? post.text.substring(0, 100) : `Post by ${post.authorName}`,
    articleBody: post.text || '',
    url: `https://circularapp.in/post/${id}`,
    datePublished: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
    author: {
      '@type': 'Person',
      name: post.authorName,
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
    ...(post.images && post.images.length > 0 ? { image: post.images } : {}),
  }

  const postHeadline = post.text
    ? (post.text.length > 40 ? `${post.text.substring(0, 40)}...` : post.text)
    : `Post by ${post.authorName}`

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
        name: 'Posts',
        item: 'https://circularapp.in',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: postHeadline,
        item: `https://circularapp.in/post/${id}`,
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
            <Link href="/" className="hover:text-primary">Posts</Link>
            <span>/</span>
            <span className="text-foreground truncate">{post.authorName}</span>
          </nav>

          {/* Post Card */}
          <article className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-lg md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="relative size-12 overflow-hidden rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <Image
                    src={post.authorAvatar || '/circular-logo.png'}
                    alt={post.authorName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-base font-bold text-navy">{post.authorName}</h1>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3 text-primary" />
                    <span>{post.area}</span>
                    <span>•</span>
                    <span>{post.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Tag className="size-3" />
                <span>{post.category}</span>
              </div>
            </div>

            {/* Post Content Body */}
            <div className="py-6">
              {post.text && (
                <p className="text-base leading-relaxed text-foreground md:text-lg whitespace-pre-line">
                  {post.text}
                </p>
              )}

              {/* Public Images */}
              {post.images && post.images.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {post.images.map((imgUrl, idx) => (
                    <div key={`post-img-${idx}`} className="relative h-64 overflow-hidden rounded-2xl bg-muted border border-border">
                      <Image
                        src={imgUrl}
                        alt={`Post image ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Engagement Notice Bar */}
            <div className="flex items-center justify-between border-t border-border pt-4 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Heart className="size-4 text-rose-500" />
                  <span>Like &amp; React in App</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="size-4 text-blue-500" />
                  <span>Discussion in App</span>
                </span>
              </div>
              <span className="flex items-center gap-1.5">
                <Share2 className="size-4 text-primary" />
                <span>Circular Verified</span>
              </span>
            </div>
          </article>

          {/* Deep link CTA Banner */}
          <div className="mt-8">
            <OpenInCircularBanner path={`/post/${id}`} title="Community Post" />
          </div>
        </div>
      </main>

      <CircularFooter />
    </>
  )
}