import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://clipflow.to'
  const now = new Date()

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

    // Legal
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
