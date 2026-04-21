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
    },
  }
}

export default function UseCaseDetailPage({ params }: PageProps) {
  const id = ALL_USE_CASE_IDS.find((i) => USE_CASES[i].slug === params.slug) as
    | UseCaseId
    | undefined
  if (!id) notFound()
  const entry = USE_CASES[id]

  return (
    <ExploreLayout>
      <ExploreDetail entry={entry} kind="use-case" />
    </ExploreLayout>
  )
}
