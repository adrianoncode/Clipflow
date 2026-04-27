import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { ExploreLayout } from '@/components/explore/explore-layout'
import { ALL_FEATURE_IDS, FEATURES } from '@/lib/landing/features'

export const metadata: Metadata = {
  title: 'Features — everything Clipflow does for you',
  description:
    'Brand Voice, Clip Finder, Brand Kit, A/B Hook Testing, Scheduler, White-label Review, Thumbnail Studio, Creator Research. One tool for the whole repurposing pipeline.',
  alternates: { canonical: 'https://clipflow.to/features' },
}

export default function FeaturesHubPage() {
  const features = ALL_FEATURE_IDS.map((id) => FEATURES[id])

  return (
    <ExploreLayout>
      <div className="space-y-10 pb-24">
        <header>
          <p className="lv2-mono-label mb-3">Features</p>
          <h1
            className="lv2-display text-[48px] leading-[1.02] sm:text-[64px]"
            style={{ color: 'var(--lv2-primary)' }}
          >
            Everything in the repurposing pipeline.
          </h1>
          <p
            className="mt-5 max-w-[680px] text-[17px] leading-relaxed"
            style={{ color: 'var(--lv2-fg-soft)' }}
          >
            Clipflow replaces the stack most creators juggle — clip finder,
            caption writer, brand manager, scheduler, thumbnail studio. Every
            feature is built to work with the others, not to sell you another
            standalone tool.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <Link
              key={f.id}
              href={`/features/${f.slug}`}
              className="group flex flex-col rounded-2xl p-6 transition-all hover:-translate-y-1"
              style={{
                background: 'var(--lv2-card)',
                border: '1px solid var(--lv2-border)',
                boxShadow: '0 1px 0 rgba(24,21,17,.04)',
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[20px]"
                  style={{ background: 'var(--lv2-primary-soft)' }}
                  aria-hidden
                >
                  {f.emoji}
                </span>
                <span className="lv2-mono-label" style={{ fontSize: 9 }}>
                  {f.availability.includes('Studio plan only') ? 'Studio' : 'All plans'}
                </span>
              </div>
              <h2
                className="lv2-display text-[24px] leading-tight"
                style={{ color: 'var(--lv2-primary)' }}
              >
                {f.name}
              </h2>
              <p
                className="mt-2 flex-1 text-[13.5px] leading-relaxed"
                style={{ color: 'var(--lv2-muted)' }}
              >
                {f.tagline}
              </p>
              <span
                className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
                style={{ color: 'var(--lv2-primary)' }}
              >
                Read more
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </ExploreLayout>
  )
}
