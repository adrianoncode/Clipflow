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
    },
  }
}

export default function FeatureDetailPage({ params }: PageProps) {
  const id = ALL_FEATURE_IDS.find((i) => FEATURES[i].slug === params.slug) as
    | FeatureId
    | undefined
  if (!id) notFound()
  const entry = FEATURES[id]

  return (
    <ExploreLayout>
      <ExploreDetail entry={entry} kind="feature" />
    </ExploreLayout>
  )
}
