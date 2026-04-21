import type { MetadataRoute } from 'next'

import { ALL_COMPETITOR_IDS, COMPETITORS } from '@/lib/landing/competitors'
import {
  ALL_FEATURE_IDS,
  ALL_USE_CASE_IDS,
  FEATURES,
  USE_CASES,
} from '@/lib/landing/features'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://clipflow.to'
  const now = new Date()

  const featurePages: MetadataRoute.Sitemap = ALL_FEATURE_IDS.map((id) => ({
    url: `${base}/features/${FEATURES[id].slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const useCasePages: MetadataRoute.Sitemap = ALL_USE_CASE_IDS.map((id) => ({
    url: `${base}/for/${USE_CASES[id].slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

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

    // Feature + use-case library — docs-style landing surfaces that
    // target mid-intent queries like "brand voice AI captions" or
    // "short-form for podcasters". Priority 0.7 so they're weighted
    // below the homepage and competitor landings.
    {
      url: `${base}/features`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...featurePages,
    {
      url: `${base}/for`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...useCasePages,

    // Legal
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
