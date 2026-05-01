import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ExploreLayout } from '@/components/explore/explore-layout'
import { ExploreDetail } from '@/components/explore/explore-detail'
import { ALL_FEATURE_IDS, FEATURES, type FeatureId } from '@/lib/landing/features'

export function generateStaticParams() {
  return ALL_FEATURE_IDS.map((id) => ({ slug: FEATURES[id].slug }))
}

interface PageProps {
  params: { slug: string }
}

export function generateMetadata({ params }: PageProps): Metadata {
  const id = ALL_FEATURE_IDS.find((i) => FEATURES[i].slug === params.slug)
  if (!id) return { title: 'Feature not found' }
  const f = FEATURES[id]
  // Dynamic OG image pulled from our /api/thumbnail route so every
  // feature page unfurls with its own headline on X/LinkedIn/Slack
  // instead of falling back to the root favicon.
  const ogImage = `https://clipflow.to/api/thumbnail?title=${encodeURIComponent(
    f.name,
  )}&sub=${encodeURIComponent('Clipflow feature')}&layout=link&variant=bold`
  return {
    title: `${f.name} — Clipflow`,
    description: f.description,
    alternates: {
      canonical: `https://clipflow.to/features/${f.slug}`,
    },
    openGraph: {
      title: `${f.name} — Clipflow`,
      description: f.description,
      url: `https://clipflow.to/features/${f.slug}`,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 627, alt: f.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${f.name} — Clipflow`,
      description: f.description,
      images: [ogImage],
    },
  }
}

export default function FeatureDetailPage({ params }: PageProps) {
  const id = ALL_FEATURE_IDS.find((i) => FEATURES[i].slug === params.slug) as
    | FeatureId
    | undefined
  if (!id) notFound()
  const entry = FEATURES[id]

  // BreadcrumbList JSON-LD — surfaces the trail "Clipflow ▸ Features ▸ <name>"
  // in SERP rich snippets so the path replaces the raw URL.
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Clipflow', item: 'https://clipflow.to' },
      { '@type': 'ListItem', position: 2, name: 'Features', item: 'https://clipflow.to/features' },
      {
        '@type': 'ListItem',
        position: 3,
        name: entry.name,
        item: `https://clipflow.to/features/${entry.slug}`,
      },
    ],
  }

  return (
    <ExploreLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <ExploreDetail entry={entry} kind="feature" />
    </ExploreLayout>
  )
}
