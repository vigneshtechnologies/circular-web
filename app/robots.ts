import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/post/',
        '/business/',
        '/user/',
        '/job/',
        '/need/',
        '/event/',
        '/terms',
        '/competition',
      ],
      disallow: ['/api/', '/admin/', '/messages', '/chat/'],
    },
    sitemap: 'https://circularapp.in/sitemap.xml',
  }
}
