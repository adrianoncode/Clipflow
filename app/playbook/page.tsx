import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'

import { PlaybookLayout } from '@/components/playbook/playbook-layout'
import { GUIDES, GUIDE_CATEGORIES } from '@/lib/landing/playbook'

export const metadata: Metadata = {
  title: 'Playbook — the craft behind Clipflow',
  description:
    'Deep workflow guides for Clipflow: Brand Voice training, podcast publishing cadence, hook formulas, agency onboarding. Written for operators, not marketers.',
  alternates: { canonical: 'https://clipflow.to/playbook' },
}

const DIFFICULTY_LABEL = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const

export default function PlaybookHubPage() {
  const categories = Object.values(GUIDE_CATEGORIES)

  return (
    <PlaybookLayout>
      <div className="space-y-12 pb-20">
        <header>
          <p className="lv2-mono-label mb-3">Playbook</p>
          <h1
            className="lv2-display text-[48px] leading-[1.02] sm:text-[64px]"
            style={{ color: 'var(--lv2-primary)' }}
          >
            The craft, not the marketing.
          </h1>
          <p
            className="mt-5 max-w-[680px] text-[17px] leading-relaxed"
            style={{ color: 'var(--lv2-fg-soft)' }}
          >
            These guides are written for operators — people actually running
            content pipelines, not prospects reading feature bullets. Every
            guide is specific, opinionated, and grounded in real workflows.
          </p>
        </header>

        {categories.map((cat) => {
          const items = GUIDES.filter((g) => g.category === cat.id)
          if (items.length === 0) return null

          return (
            <section key={cat.id}>
              <div className="mb-5 flex items-end justify-between gap-5">
                <div>
                  <p className="lv2-mono-label mb-2">
                    <span aria-hidden className="mr-1">
                      {cat.emoji}
                    </span>
                    {cat.name}
                  </p>
                  <p
                    className="text-[14px]"
                    style={{ color: 'var(--lv2-muted)' }}
                  >
                    {cat.description}
                  </p>
                </div>
                <p
                  className="lv2-mono text-[11px] uppercase tracking-[0.12em]"
                  style={{ color: 'var(--lv2-muted)' }}
                >
                  {items.length} {items.length === 1 ? 'guide' : 'guides'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((g) => (
                  <Link
                    key={g.id}
                    href={`/playbook/${g.slug}`}
                    className="group flex flex-col rounded-2xl p-5 transition-all hover:-translate-y-1"
                    style={{
                      background: 'var(--lv2-card)',
                      border: '1px solid var(--lv2-border)',
                      boxShadow: '0 1px 0 rgba(24,21,17,.04)',
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[18px]"
                        style={{ background: 'var(--lv2-primary-soft)' }}
                        aria-hidden
                      >
                        {g.emoji}
                      </span>
                      <span
                        className="lv2-mono flex items-center gap-1 text-[10px] uppercase tracking-[0.08em]"
                        style={{ color: 'var(--lv2-muted)' }}
                      >
                        <Clock className="h-3 w-3" />
                        {g.readTimeMinutes} min
                      </span>
                    </div>
                    <h3
                      className="lv2-display text-[22px] leading-tight"
                      style={{ color: 'var(--lv2-primary)' }}
                    >
                      {g.title}
                    </h3>
                    <p
                      className="mt-2 flex-1 text-[13.5px] leading-relaxed"
                      style={{ color: 'var(--lv2-muted)' }}
                    >
                      {g.subtitle}
                    </p>
                    <div
                      className="mt-4 flex items-center justify-between text-[12px] font-semibold"
                      style={{ color: 'var(--lv2-primary)' }}
                    >
                      <span
                        className="lv2-mono rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]"
                        style={{
                          background: 'var(--lv2-bg-2)',
                          color: 'var(--lv2-muted)',
                        }}
                      >
                        {DIFFICULTY_LABEL[g.difficulty]}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        Read guide
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </PlaybookLayout>
  )
}
