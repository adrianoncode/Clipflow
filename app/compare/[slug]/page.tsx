import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Check } from 'lucide-react'

import { ComparisonMatrix } from '@/components/landing/comparison-matrix'
import { SmoothScroll } from '@/components/landing/smooth-scroll'
import {
  ALL_COMPETITOR_IDS,
  COMPETITORS,
  type CompetitorId,
} from '@/lib/landing/competitors'

/** Static params — one page per known competitor. */
export function generateStaticParams() {
  return ALL_COMPETITOR_IDS.map((id) => ({ slug: `clipflow-vs-${id}` }))
}

/** Extract the competitor id from a URL slug like `clipflow-vs-opusclip`. */
function parseSlug(slug: string): CompetitorId | null {
  const match = /^clipflow-vs-([a-z0-9-]+)$/.exec(slug)
  if (!match) return null
  const candidate = match[1] as CompetitorId
  return ALL_COMPETITOR_IDS.includes(candidate) ? candidate : null
}

interface PageProps {
  params: { slug: string }
}

export function generateMetadata({ params }: PageProps): Metadata {
  const id = parseSlug(params.slug)
  if (!id) return { title: 'Comparison not found' }
  const c = COMPETITORS[id]

  const title = `Clipflow vs ${c.name} — honest side-by-side comparison`
  const description = `Switching from ${c.name}? See exactly where Clipflow is a superset: Brand Voice, Brand Kit on every render, A/B hook testing, white-label client review links, unlimited client workspaces, and BYOK AI pricing.`
  const ogImage = `https://clipflow.to/api/thumbnail?title=${encodeURIComponent(
    `Clipflow vs ${c.name}`,
  )}&sub=${encodeURIComponent('Honest side-by-side')}&layout=link&variant=split`

  return {
    title,
    description,
    alternates: {
      canonical: `https://clipflow.to/compare/clipflow-vs-${c.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://clipflow.to/compare/clipflow-vs-${c.slug}`,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 627, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default function CompareClipflowVsCompetitor({ params }: PageProps) {
  const id = parseSlug(params.slug)
  if (!id) notFound()
  const c = COMPETITORS[id]

  // BreadcrumbList JSON-LD helps Google show the nav trail in SERP
  // rich snippets: Clipflow > Compare > Clipflow vs <X>.
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Clipflow', item: 'https://clipflow.to' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Compare',
        item: 'https://clipflow.to/compare',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Clipflow vs ${c.name}`,
        item: `https://clipflow.to/compare/clipflow-vs-${c.slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <SmoothScroll />
      <CompareBody id={id} />
    </>
  )
}

function CompareBody({ id }: { id: CompetitorId }) {
  const c = COMPETITORS[id]
  const otherCompetitors = ALL_COMPETITOR_IDS.filter((x) => x !== id)

  return (
    <div
      className="lv2-root"
      style={{
        background: 'var(--lv2-bg, #FAF7F2)',
        color: 'var(--lv2-fg, #181511)',
        minHeight: '100vh',
      }}
    >
      <InlineVars />

      {/* Mini header — just logo + back-to-home. This is a deep-link
          landing page, so the full sticky nav would be overkill. */}
      <header style={{ borderBottom: '1px solid var(--lv2-border)' }}>
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-6">
          <Link href="/" className="group flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-transform group-hover:-rotate-[8deg]"
              style={{ background: 'var(--lv2-primary)' }}
            >
              <span
                className="block h-3 w-3 rounded-[3px]"
                style={{ background: 'var(--lv2-accent)' }}
              />
            </span>
            <span
              className="lv2-display text-[24px] leading-none"
              style={{ color: 'var(--lv2-primary)' }}
            >
              Clipflow
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-[13px] font-semibold">
            <Link
              href="/#pricing"
              className="rounded-lg px-3 py-1.5 hover:bg-black/[.04]"
              style={{ color: 'var(--lv2-fg-soft)' }}
            >
              Pricing
            </Link>
            <Link
              href="/signup"
              className="rounded-xl px-4 py-2 text-[13px] font-bold"
              style={{
                background: 'var(--lv2-primary)',
                color: 'var(--lv2-accent)',
              }}
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-[1240px] px-6 pb-10 pt-16 sm:pt-24">
        <nav
          className="lv2-mono mb-6 flex items-center gap-2 text-[10.5px]"
          style={{ color: 'var(--lv2-muted)', letterSpacing: '0.06em' }}
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-[var(--lv2-fg)]">
            CLIPFLOW
          </Link>
          <span>·</span>
          <Link href="/compare" className="hover:text-[var(--lv2-fg)]">
            COMPARE
          </Link>
          <span>·</span>
          <span style={{ color: 'var(--lv2-fg)' }}>CLIPFLOW VS {c.name.toUpperCase()}</span>
        </nav>

        <h1
          className="lv2-display max-w-[900px] text-[52px] leading-[1] sm:text-[72px]"
          style={{ color: 'var(--lv2-primary)' }}
        >
          Clipflow vs {c.name}.{' '}
          <em
            className="lv2-display italic"
            style={{ color: 'var(--lv2-muted)' }}
          >
            The honest version.
          </em>
        </h1>

        <p
          className="mt-6 max-w-[680px] text-[17px] leading-relaxed"
          style={{ color: 'var(--lv2-fg-soft)' }}
        >
          {c.tagline}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-bold"
            style={{
              background: 'var(--lv2-primary)',
              color: 'var(--lv2-accent)',
              boxShadow: '0 10px 28px -12px rgba(15,15,15,.4)',
            }}
          >
            Start free on Clipflow
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

        <p
          className="lv2-mono mt-4 text-[10.5px]"
          style={{ color: 'var(--lv2-muted)', letterSpacing: '0.04em' }}
        >
          NO CARD · CANCEL IN 2 CLICKS · 14-DAY FULL REFUND
        </p>
      </section>

      {/* ── Credit where it's due: What the competitor does well ── */}
      <section
        className="mx-auto max-w-[1240px] px-6 py-12"
        style={{ borderTop: '1px solid var(--lv2-border)' }}
      >
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="lv2-mono-label mb-3">Credit where due</p>
            <h2
              className="lv2-display text-[32px] leading-[1.02] sm:text-[40px]"
              style={{ color: 'var(--lv2-primary)' }}
            >
              What {c.name} gets right.
            </h2>
            <p
              className="mt-4 max-w-[480px] text-[14.5px] leading-relaxed"
              style={{ color: 'var(--lv2-muted)' }}
            >
              We&rsquo;re not here to write a hit-piece. {c.name} is a serious
              product with a real user base — it solves a specific job well.
              Here&rsquo;s what we think they nailed.
            </p>
          </div>
          <ul className="space-y-3">
            {c.strongPoints.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{
                  background: 'var(--lv2-card)',
                  border: '1px solid var(--lv2-border)',
                }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: 'var(--lv2-muted-2)',
                    color: 'var(--lv2-fg)',
                  }}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="text-[14px]" style={{ color: 'var(--lv2-fg)' }}>
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── The switch pitch ── */}
      <section
        className="mx-auto max-w-[1240px] px-6 py-12"
        style={{ borderTop: '1px solid var(--lv2-border)' }}
      >
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="lv2-mono-label mb-3">Why switch</p>
            <h2
              className="lv2-display text-[32px] leading-[1.02] sm:text-[40px]"
              style={{ color: 'var(--lv2-primary)' }}
            >
              Where Clipflow wins.
            </h2>
          </div>
          <div>
            <p
              className="text-[15.5px] leading-relaxed"
              style={{ color: 'var(--lv2-fg-soft)' }}
            >
              {c.switchPitch}
            </p>

            <ul className="mt-8 space-y-3">
              {c.topReasons.map((reason, i) => (
                <li
                  key={reason}
                  className="flex items-start gap-3 rounded-xl p-4"
                  style={{
                    background: 'var(--lv2-primary)',
                    color: 'var(--lv2-accent)',
                    boxShadow: '0 10px 28px -16px rgba(15,15,15,.32)',
                  }}
                >
                  <span
                    className="lv2-mono lv2-tabular mt-0.5 w-5 shrink-0 text-[10px] font-bold"
                    style={{ color: 'rgba(214,255,62,.6)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[14.5px] font-semibold leading-snug">
                    {reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Matrix (filtered to this competitor only) ── */}
      <ComparisonMatrix
        competitors={[c.id]}
        eyebrow={`Clipflow vs ${c.name}`}
        headline={
          <>
            Capability-by-capability.{' '}
            <em className="lv2-display italic" style={{ color: 'var(--lv2-muted)' }}>
              No spin.
            </em>
          </>
        }
      />

      {/* ── Final CTA ── */}
      <section
        className="mx-auto max-w-[1240px] px-6 pb-24 pt-4"
        style={{ borderTop: '1px solid var(--lv2-border)' }}
      >
        <div
          className="relative overflow-hidden rounded-[28px] p-10 text-center sm:p-16"
          style={{ background: 'var(--lv2-primary)' }}
        >
          <h2
            className="lv2-display mx-auto max-w-[580px] text-[36px] leading-[1.02] sm:text-[52px]"
            style={{ color: 'var(--lv2-accent)' }}
          >
            Ready to stop copy-pasting between tools?
          </h2>
          <p
            className="mx-auto mt-4 max-w-[520px] text-[15.5px]"
            style={{ color: 'rgba(255,255,255,.72)' }}
          >
            Import a video. Get clips, captions, schedule, and publish —
            on-brand, in your voice, across four platforms. No credit card to
            start.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14.5px] font-bold"
            style={{
              background: 'var(--lv2-accent)',
              color: 'var(--lv2-accent-ink)',
              boxShadow: '0 0 0 4px rgba(214,255,62,.2)',
            }}
          >
            Start free — no card
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Compare-to sidebar at footer: link to the other pages ── */}
      <section
        className="mx-auto max-w-[1240px] px-6 pb-20"
        style={{ borderTop: '1px solid var(--lv2-border)' }}
      >
        <p className="lv2-mono-label mb-4 pt-10">Also comparing</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {otherCompetitors.map((otherId) => {
            const other = COMPETITORS[otherId]
            return (
              <Link
                key={other.id}
                href={`/compare/clipflow-vs-${other.slug}`}
                className="group flex items-center justify-between rounded-xl px-5 py-4 transition-all hover:-translate-y-px"
                style={{
                  background: 'var(--lv2-card)',
                  border: '1px solid var(--lv2-border)',
                }}
              >
                <div>
                  <p
                    className="text-[14px] font-bold"
                    style={{ color: 'var(--lv2-fg)' }}
                  >
                    Clipflow vs {other.name}
                  </p>
                  <p
                    className="lv2-mono mt-0.5 text-[10px]"
                    style={{ color: 'var(--lv2-muted)' }}
                  >
                    {other.topReasons[0]}
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
    </div>
  )
}

/** Mirror the CSS custom properties used elsewhere so the compare page
 *  looks like the rest of Clipflow without pulling in the full
 *  `new-landing.tsx` style sheet. */
function InlineVars() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      .lv2-root {
        --lv2-bg: #FAF7F2; --lv2-bg-2: #F3EDE3;
        --lv2-fg: #181511; --lv2-fg-soft: #3a342c;
        --lv2-muted: #5f5850; --lv2-muted-2: #ECE5D8;
        --lv2-border: #E5DDCE; --lv2-card: #FFFDF8;
        --lv2-primary: #0F0F0F; --lv2-primary-soft: #EDE6F5;
        --lv2-accent: #F4D93D; --lv2-accent-ink: #1a2000;
        font-family: var(--font-inter), system-ui, sans-serif;
      }
      .lv2-root .lv2-display { font-family: var(--font-instrument-serif), 'Times New Roman', serif; letter-spacing: -.015em; }
      .lv2-root .lv2-mono { font-family: var(--font-jetbrains-mono), monospace; }
      .lv2-root .lv2-tabular { font-variant-numeric: tabular-nums; }
      .lv2-root .lv2-mono-label {
        font-family: var(--font-jetbrains-mono), monospace;
        font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
        color: var(--lv2-muted); font-weight: 600; display: inline-block;
      }
      .lv2-root .lv2-reveal { opacity: 1; transform: none; }
    `,
      }}
    />
  )
}
