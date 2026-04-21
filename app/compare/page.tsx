import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { SmoothScroll } from '@/components/landing/smooth-scroll'
import { ALL_COMPETITOR_IDS, COMPETITORS } from '@/lib/landing/competitors'

export const metadata: Metadata = {
  title: 'Compare Clipflow — head-to-head with OpusClip, Klap, Descript',
  description:
    'Honest side-by-side comparisons of Clipflow against every major clip-and-caption tool. Pick a competitor to see how Clipflow stacks up on Brand Voice, scheduling, agency features, and BYOK pricing.',
  alternates: { canonical: 'https://clipflow.to/compare' },
}

export default function CompareIndexPage() {
  return (
    <>
      <SmoothScroll />
      <div
        className="lv2-root"
        style={{
          background: 'var(--lv2-bg, #FAF7F2)',
          color: 'var(--lv2-fg, #181511)',
          minHeight: '100vh',
        }}
      >
        <InlineVars />
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

        <section className="mx-auto max-w-[1040px] px-6 pb-16 pt-16 sm:pt-24">
          <p className="lv2-mono-label mb-3">Compare</p>
          <h1
            className="lv2-display text-[44px] leading-[1] sm:text-[64px]"
            style={{ color: 'var(--lv2-primary)' }}
          >
            Head-to-head. No spin.
          </h1>
          <p
            className="mt-5 max-w-[640px] text-[17px] leading-relaxed"
            style={{ color: 'var(--lv2-fg-soft)' }}
          >
            Pick a tool you&rsquo;re evaluating — we&rsquo;ve got a capability-by-
            capability comparison page with the real trade-offs. Every row is
            defensible from public docs; we don&rsquo;t list anything we can&rsquo;t ship.
          </p>
        </section>

        <section className="mx-auto max-w-[1040px] px-6 pb-24">
          <div className="grid gap-4 md:grid-cols-3">
            {ALL_COMPETITOR_IDS.map((id) => {
              const c = COMPETITORS[id]
              return (
                <Link
                  key={id}
                  href={`/compare/clipflow-vs-${c.slug}`}
                  className="group flex flex-col rounded-2xl p-6 transition-all hover:-translate-y-1"
                  style={{
                    background: 'var(--lv2-card)',
                    border: '1px solid var(--lv2-border)',
                    boxShadow: '0 1px 0 rgba(24,21,17,.04)',
                  }}
                >
                  <p className="lv2-mono-label mb-4">Compare</p>
                  <h2
                    className="lv2-display text-[28px] leading-tight"
                    style={{ color: 'var(--lv2-primary)' }}
                  >
                    Clipflow vs {c.name}
                  </h2>
                  <p
                    className="mt-3 flex-1 text-[13.5px] leading-relaxed"
                    style={{ color: 'var(--lv2-muted)' }}
                  >
                    {c.tagline}
                  </p>
                  <span
                    className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
                    style={{ color: 'var(--lv2-primary)' }}
                  >
                    Read comparison
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}

function InlineVars() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      .lv2-root {
        --lv2-bg: #FAF7F2; --lv2-bg-2: #F3EDE3;
        --lv2-fg: #181511; --lv2-fg-soft: #3a342c;
        --lv2-muted: #7c7468; --lv2-muted-2: #ECE5D8;
        --lv2-border: #E5DDCE; --lv2-card: #FFFDF8;
        --lv2-primary: #2A1A3D; --lv2-primary-soft: #EDE6F5;
        --lv2-accent: #D6FF3E; --lv2-accent-ink: #1a2000;
        font-family: var(--font-inter), system-ui, sans-serif;
      }
      .lv2-root .lv2-display { font-family: var(--font-instrument-serif), 'Times New Roman', serif; letter-spacing: -.015em; }
      .lv2-root .lv2-mono-label {
        font-family: var(--font-jetbrains-mono), monospace;
        font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
        color: var(--lv2-muted); font-weight: 600; display: inline-block;
      }
    `,
      }}
    />
  )
}
