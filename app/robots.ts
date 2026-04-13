import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/workspace/', '/settings/', '/onboarding/', '/api/'],
      },
    ],
    sitemap: 'https://clipflow.to/sitemap.xml',
  }
}
