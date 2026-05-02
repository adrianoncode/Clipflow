import type { MetadataRoute } from 'next'

import { ALL_COMPETITOR_IDS, COMPETITORS } from '@/lib/landing/competitors'
import {
  ALL_FEATURE_IDS,
  ALL_USE_CASE_IDS,
  FEATURES,
  USE_CASES,
} from '@/lib/landing/features'
import { GUIDES } from '@/lib/landing/playbook'
import { HELP_ARTICLES } from '@/lib/help/articles'

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

  const playbookGuides: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${base}/playbook/${g.slug}`,
    lastModified: new Date(g.updatedAt),
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

    // Auth pages (/signup, /login, /magic-link, /mfa) are intentionally
    // excluded — they're session walls with no indexable content and
    // are noindex'd via the (auth) layout. Letting them stay in the
    // sitemap creates the "Submitted URL marked noindex" GSC warning.
    //
    // Hash-anchor URLs (`/#pricing` etc.) used to live here but Google
    // ignores fragments — sitemap entries must resolve to unique URLs.

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

    // Playbook — operational / craft content. Each guide is a long-
    // form article with its own article-schema JSON-LD, so rich-card
    // rankings are the target here rather than raw keyword SEO.
    {
      url: `${base}/playbook`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...playbookGuides,

    // Help center — every article is a real Q&A page that can rank for
    // long-tail support queries ("how to schedule a tiktok post" etc.).
    // Priority below playbook (0.7) because help articles are reactive
    // troubleshooting content rather than authoritative guides.
    {
      url: `${base}/help`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...Object.keys(HELP_ARTICLES).map((slug) => ({
      url: `${base}/help/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),

    // Changelog — refreshed every release, surfaces "what's new"
    // queries from prospects evaluating activity.
    {
      url: `${base}/changelog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.4,
    },

    // Legal — yearly cadence, low priority but indexable for trust
    // signals (DMCA + Imprint are required by EU/US compliance and
    // surface in "<brand> contact" queries).
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/dmca`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/imprint`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
