import type { MetadataRoute } from 'next'
import {
  getPublicBusinessesList,
  getPublicJobsList,
  getPublicEventsList,
  getPublicNeedsList,
  getPublicPostsList,
} from '@/lib/serverPublicData'

export const revalidate = 3600 // Revalidate sitemap dynamically every 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://circularapp.in'
  const currentDate = new Date()

  // 1. Static Core Discovery Hubs
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/landing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/businesses`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/needs`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // 2. Fetch Live Dynamic Public Entities
  try {
    const [businesses, jobs, events, needs, posts] = await Promise.all([
      getPublicBusinessesList(200),
      getPublicJobsList(100),
      getPublicEventsList(100),
      getPublicNeedsList(100),
      getPublicPostsList(200),
    ])

    const businessUrls: MetadataRoute.Sitemap = businesses.map((b) => ({
      url: `${baseUrl}/business/${b.id}`,
      lastModified: b.createdAt ? new Date(b.createdAt) : currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    const jobUrls: MetadataRoute.Sitemap = jobs.map((j) => ({
      url: `${baseUrl}/job/${j.id}`,
      lastModified: j.createdAt ? new Date(j.createdAt) : currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    }))

    const eventUrls: MetadataRoute.Sitemap = events.map((e) => ({
      url: `${baseUrl}/event/${e.id}`,
      lastModified: e.createdAt ? new Date(e.createdAt) : currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    }))

    const needUrls: MetadataRoute.Sitemap = needs.map((n) => ({
      url: `${baseUrl}/need/${n.id}`,
      lastModified: n.createdAt ? new Date(n.createdAt) : currentDate,
      changeFrequency: 'daily',
      priority: 0.7,
    }))

    const postUrls: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${baseUrl}/post/${p.id}`,
      lastModified: p.createdAt ? new Date(p.createdAt) : currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    return [...staticUrls, ...businessUrls, ...jobUrls, ...eventUrls, ...needUrls, ...postUrls]
  } catch (err) {
    console.warn('[sitemap] Failed to fetch dynamic entities for sitemap:', err)
    return staticUrls
  }
}
