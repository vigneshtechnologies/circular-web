import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/landing',
        '/businesses',
        '/jobs',
        '/events',
        '/needs',
        '/post/',
        '/business/',
        '/user/',
        '/job/',
        '/need/',
        '/event/',
        '/terms',
      ],
      disallow: [
        '/api/',
        '/admin/',
        '/messages',
        '/chat/',
        '/notifications',
        '/settings',
      ],
    },
    sitemap: 'https://circularapp.in/sitemap.xml',
  }
}
