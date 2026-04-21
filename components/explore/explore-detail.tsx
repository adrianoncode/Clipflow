import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import type { ExploreEntry, FeatureId } from '@/lib/landing/features'
import { FEATURES } from '@/lib/landing/features'
import { FeatureVisual } from './feature-visual'

interface ExploreDetailProps {
  entry: ExploreEntry
  /** Which collection the entry came from — drives cross-link paths. */
  kind: 'feature' | 'use-case'
}

/**
 * Rich detail-page body used by every /features/[slug] and /for/[slug]
 * page. The entire page surface is data-driven from the ExploreEntry
 * so adding a new feature or use case is a single edit in
 * `lib/landing/features.ts` — no new JSX required.
 */
export function ExploreDetail({ entry, kind }: ExploreDetailProps) {
  return (
    <article className="space-y-16 pb-24">
      {/* ── Hero ── */}
      <header>
        <p className="lv2-mono-label mb-4">
          {kind === 'feature' ? 'Feature' : 'Use case'} · {entry.availability}
        </p>
        <h1
          className="lv2-display text-[48px] leading-[1.02] sm:text-[64px]"
          style={{ color: 'var(--lv2-primary)' }}
        >
          {entry.name}
        </h1>
        <p
          className="mt-5 max-w-[680px] text-[17.5px] leading-relaxed"
          style={{ color: 'var(--lv2-fg-soft)' }}
        >
          {entry.tagline}
        </p>

        {/* Highlight metrics — pinned trio under the hero */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {entry.highlights.map((h) => (
            <div
              key={h.label}
              className="rounded-2xl p-5"
              style={{
                background: 'var(--lv2-card)',
                border: '1px solid var(--lv2-border)',
              }}
            >
              <p
                className="lv2-display text-[32px] leading-none"
                style={{ color: 'var(--lv2-primary)' }}
              >
                {h.value}
              </p>
              <p
                className="mt-2 text-[12px] leading-snug"
                style={{ color: 'var(--lv2-muted)' }}
              >
                {h.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-bold"
            style={{
              background: 'var(--lv2-primary)',
              color: 'var(--lv2-accent)',
              boxShadow: '0 10px 28px -12px rgba(42,26,61,.4)',
            }}
          >
            {entry.ctaText}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/#pricing"
            className="text-[13.5px] font-semibold"
            style={{ color: 'var(--lv2-muted)' }}
          >
            Or see pricing →
          </Link>
        </div>
      </header>

      {/* ── Visual — live demo / flow diagram / static preview ── */}
      {entry.visual ? (
        <section>
          <FeatureVisual id={entry.visual} />
        </section>
      ) : null}

      {/* ── Long-form sections ── */}
      {entry.sections.map((section, i) => (
        <section
          key={section.title}
          className="grid gap-6 pt-12 md:grid-cols-[0.9fr_1.2fr]"
          style={{ borderTop: '1px solid var(--lv2-border)' }}
        >
          <div>
            <p className="lv2-mono-label mb-3">{section.eyebrow}</p>
            <h2
              className="lv2-display text-[32px] leading-[1.04] sm:text-[40px]"
              style={{ color: 'var(--lv2-primary)' }}
            >
              {section.title}
            </h2>
          </div>
          <div>
            <p
              className="text-[16px] leading-relaxed"
              style={{ color: 'var(--lv2-fg-soft)' }}
            >
              {section.body}
            </p>
            {section.bullets && section.bullets.length > 0 ? (
              <ul className="mt-5 space-y-2.5">
                {section.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-3 rounded-xl px-4 py-3"
                    style={{
                      background: 'var(--lv2-card)',
                      border: '1px solid var(--lv2-border)',
                    }}
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: 'var(--lv2-primary)',
                        color: 'var(--lv2-accent)',
                      }}
                      aria-hidden
                    >
                      <span
                        className="lv2-mono text-[9px] font-bold"
                        style={{ letterSpacing: 0 }}
                      >
                        {(i + 1).toString().padStart(2, '0')}
                      </span>
                    </span>
                    <span
                      className="text-[14px] leading-snug"
                      style={{ color: 'var(--lv2-fg)' }}
                    >
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ))}

      {/* ── Works well with ── */}
      {entry.relatedFeatures && entry.relatedFeatures.length > 0 ? (
        <section
          className="pt-12"
          style={{ borderTop: '1px solid var(--lv2-border)' }}
        >
          <p className="lv2-mono-label mb-5">Works well with</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entry.relatedFeatures.map((featureId: FeatureId) => {
              const related = FEATURES[featureId]
              return (
                <Link
                  key={related.id}
                  href={`/features/${related.slug}`}
                  className="group flex items-start gap-3 rounded-xl p-4 transition-all hover:-translate-y-px"
                  style={{
                    background: 'var(--lv2-card)',
                    border: '1px solid var(--lv2-border)',
                  }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[16px]"
                    style={{ background: 'var(--lv2-primary-soft)' }}
                    aria-hidden
                  >
                    {related.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[13.5px] font-bold leading-tight"
                      style={{ color: 'var(--lv2-fg)' }}
                    >
                      {related.name}
                    </p>
                    <p
                      className="mt-0.5 text-[11.5px] leading-snug"
                      style={{ color: 'var(--lv2-muted)' }}
                    >
                      {related.tagline.slice(0, 90)}
                      {related.tagline.length > 90 ? '…' : ''}
                    </p>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--lv2-muted)' }}
                  />
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* ── Final CTA ── */}
      <section
        className="rounded-[28px] p-10 text-center sm:p-16"
        style={{ background: 'var(--lv2-primary)' }}
      >
        <h2
          className="lv2-display mx-auto max-w-[520px] text-[32px] leading-[1.04] sm:text-[44px]"
          style={{ color: 'var(--lv2-accent)' }}
        >
          Try {entry.name} on your next recording.
        </h2>
        <p
          className="mx-auto mt-4 max-w-[480px] text-[15px]"
          style={{ color: 'rgba(255,255,255,.7)' }}
        >
          Free tier, no credit card. Your first draft lands in about two minutes.
        </p>
        <Link
          href="/signup"
          className="mt-7 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-bold"
          style={{
            background: 'var(--lv2-accent)',
            color: 'var(--lv2-accent-ink)',
          }}
        >
          Start free — no card
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </article>
  )
}
