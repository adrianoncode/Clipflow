import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { ExploreLayout } from '@/components/explore/explore-layout'
import { ALL_USE_CASE_IDS, USE_CASES } from '@/lib/landing/features'

export const metadata: Metadata = {
  title: 'Built for podcasters, agencies, coaches, founders, creators',
  description:
    'Clipflow adapts to your niche. Pick your use case to see how the repurposing workflow lines up with your role — podcasters, agencies, coaches, SaaS founders, solo creators.',
  alternates: { canonical: 'https://clipflow.to/for' },
  openGraph: {
    title: 'Built for podcasters, agencies, coaches, founders, creators',
    description:
      'Clipflow adapts to your niche — see how the repurposing workflow fits podcasters, agencies, coaches, SaaS founders, and solo creators.',
    url: 'https://clipflow.to/for',
    type: 'website',
  },
}

export default function UseCasesHubPage() {
  const useCases = ALL_USE_CASE_IDS.map((id) => USE_CASES[id])

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Clipflow', item: 'https://clipflow.to' },
      { '@type': 'ListItem', position: 2, name: 'Use cases', item: 'https://clipflow.to/for' },
    ],
  }

  return (
    <ExploreLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <div className="space-y-10 pb-24">
        <header>
          <p className="lv2-mono-label mb-3">Use cases</p>
          <h1
            className="lv2-display text-[48px] leading-[1.02] sm:text-[64px]"
            style={{ color: 'var(--lv2-primary)' }}
          >
            Your niche matters. Your tool should too.
          </h1>
          <p
            className="mt-5 max-w-[680px] text-[17px] leading-relaxed"
            style={{ color: 'var(--lv2-fg-soft)' }}
          >
            Generic AI captions read the same across every creator. Clipflow
            uses niche-specific presets — coaches, podcasters, SaaS founders,
            agencies, solo creators — layered on top of your Brand Voice so
            output always sounds correct for your audience.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {useCases.map((u) => (
            <Link
              key={u.id}
              href={`/for/${u.slug}`}
              className="group flex flex-col rounded-2xl p-6 transition-all hover:-translate-y-1"
              style={{
                background: 'var(--lv2-card)',
                border: '1px solid var(--lv2-border)',
                boxShadow: '0 1px 0 rgba(24,21,17,.04)',
              }}
            >
              <span
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-[20px]"
                style={{ background: 'var(--lv2-primary-soft)' }}
                aria-hidden
              >
                {u.emoji}
              </span>
              <h2
                className="lv2-display text-[24px] leading-tight"
                style={{ color: 'var(--lv2-primary)' }}
              >
                {u.name}
              </h2>
              <p
                className="mt-2 flex-1 text-[13.5px] leading-relaxed"
                style={{ color: 'var(--lv2-muted)' }}
              >
                {u.tagline}
              </p>
              <span
                className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
                style={{ color: 'var(--lv2-primary)' }}
              >
                See the workflow
                <ArrowRight
                  aria-hidden
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </ExploreLayout>
  )
}
