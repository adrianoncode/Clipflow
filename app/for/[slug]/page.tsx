import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ExploreLayout } from '@/components/explore/explore-layout'
import { ExploreDetail } from '@/components/explore/explore-detail'
import { ALL_USE_CASE_IDS, USE_CASES, type UseCaseId } from '@/lib/landing/features'

export function generateStaticParams() {
  return ALL_USE_CASE_IDS.map((id) => ({ slug: USE_CASES[id].slug }))
}

interface PageProps {
  params: { slug: string }
}

export function generateMetadata({ params }: PageProps): Metadata {
  const id = ALL_USE_CASE_IDS.find((i) => USE_CASES[i].slug === params.slug)
  if (!id) return { title: 'Use case not found' }
  const u = USE_CASES[id]
  const ogImage = `https://clipflow.to/api/thumbnail?title=${encodeURIComponent(
    `Clipflow for ${u.name}`,
  )}&sub=${encodeURIComponent('Use case')}&layout=link&variant=bold`
  return {
    title: `Clipflow ${u.name.toLowerCase()}`,
    description: u.description,
    alternates: {
      canonical: `https://clipflow.to/for/${u.slug}`,
    },
    openGraph: {
      title: `Clipflow ${u.name.toLowerCase()}`,
      description: u.description,
      url: `https://clipflow.to/for/${u.slug}`,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 627, alt: u.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Clipflow for ${u.name}`,
      description: u.description,
      images: [ogImage],
    },
  }
}

export default function UseCaseDetailPage({ params }: PageProps) {
  const id = ALL_USE_CASE_IDS.find((i) => USE_CASES[i].slug === params.slug) as
    | UseCaseId
    | undefined
  if (!id) notFound()
  const entry = USE_CASES[id]

  // BreadcrumbList JSON-LD — surfaces the trail "Clipflow ▸ Use cases ▸ <name>"
  // in SERP rich snippets so the path replaces the raw URL.
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Clipflow', item: 'https://clipflow.to' },
      { '@type': 'ListItem', position: 2, name: 'Use cases', item: 'https://clipflow.to/for' },
      {
        '@type': 'ListItem',
        position: 3,
        name: entry.name,
        item: `https://clipflow.to/for/${entry.slug}`,
      },
    ],
  }

  return (
    <ExploreLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <ExploreDetail entry={entry} kind="use-case" />
    </ExploreLayout>
  )
}
