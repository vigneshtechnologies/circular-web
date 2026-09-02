import type { Metadata } from 'next'
import { getPublicPost } from '@/lib/serverPublicData'
import { PostDetailClient } from './post-detail-client'

export const revalidate = 300 // Revalidate every 5 minutes

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = await getPublicPost(id)

  if (!post) {
    return {
      title: 'Community Post | Circular',
      description: 'View this community post on Circular – Local Social & Business Platform.',
      alternates: {
        canonical: `https://circularapp.in/post/${id}`,
      },
      openGraph: {
        title: 'Community Post | Circular',
        description: 'View this community post on Circular – Local Social & Business Platform.',
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

  const isBusinessAuthor = Boolean(post?.hasBusinessProfile && post?.businessId)
  const authorType: 'Person' | 'Organization' = isBusinessAuthor ? 'Organization' : 'Person'
  const authorUrl = isBusinessAuthor
    ? `https://circularapp.in/business/${post?.businessId}`
    : post?.authorId
      ? `https://circularapp.in/user/${post?.authorId}`
      : undefined

  const structuredData = post ? {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    headline: post.text ? (post.text.length > 100 ? `${post.text.substring(0, 100)}...` : post.text) : `Post by ${post.authorName}`,
    articleBody: post.text || '',
    url: `https://circularapp.in/post/${id}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://circularapp.in/post/${id}`,
    },
    datePublished: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
    author: {
      '@type': authorType,
      name: post.authorName,
      ...(authorUrl ? { url: authorUrl } : {}),
      ...(post.authorAvatar ? { image: post.authorAvatar } : {}),
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
  } : null

  const postHeadline = post?.text
    ? (post.text.length > 40 ? `${post.text.substring(0, 40)}...` : post.text)
    : (post?.authorName ? `Post by ${post.authorName}` : 'Post')

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
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <PostDetailClient id={id} initialPost={post} />
    </>
  )
}