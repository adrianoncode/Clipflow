import type { MetadataRoute } from 'next'

import { ALL_COMPETITOR_IDS, COMPETITORS } from '@/lib/landing/competitors'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://clipflow.to'
  const now = new Date()

  const competitorPages: MetadataRoute.Sitemap = ALL_COMPETITOR_IDS.flatMap((id) => {
    const c = COMPETITORS[id]
    return [
      {
        url: `${base}/compare/clipflow-vs-${c.slug}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      },
      {
        url: `${base}/${c.slug}-alternative`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      },
    ]
  })

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },

    // Signup funnel — higher priority than login so crawlers weight the
    // conversion page appropriately.
    { url: `${base}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },

    // On-page section anchors — indexable as deep-links so queries like
    // "clipflow pricing" or "clipflow features" land directly on the
    // right fold of the homepage.
    { url: `${base}/#pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/#how-it-works`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/#features`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/#faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },

    // Comparison hub + one page per competitor — high-intent SEO pages
    // targeting "<competitor> alternative" and "clipflow vs <competitor>"
    // queries. Competitor pages are kept at priority 0.8 so they rank
    // close to but below the homepage.
    {
      url: `${base}/compare`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...competitorPages,

    // Legal
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
