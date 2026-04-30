import Link from 'next/link'
import { ArrowRight, Check, X } from 'lucide-react'

import { ComparisonMatrix } from '@/components/landing/comparison-matrix'
import { SmoothScroll } from '@/components/landing/smooth-scroll'
import { COMPETITORS, type CompetitorId } from '@/lib/landing/competitors'

/**
 * Shared layout for "<Competitor>-alternative" landing pages.
 *
 * These target high-intent queries like "opusclip alternative" —
 * prospects who are actively churning from the competitor. The page
 * flow is different from /compare/clipflow-vs-X:
 *   1. Hero: "Looking for an X alternative?" — match the query intent
 *   2. "What's not working with X" — pain-led callout, 3 bullets
 *   3. Matrix (filtered to that one competitor)
 *   4. Social-proof strip
 *   5. CTA
 *
 * Each alternative page is a thin wrapper that just passes the
 * competitor id in.
 */
interface AlternativePageProps {
  competitor: CompetitorId
  /** Pain bullets — specific complaints about the incumbent.
   *  Phrased from the user's POV, not marketing-speak. */
  painPoints: string[]
}

export function AlternativePageBody({ competitor, painPoints }: AlternativePageProps) {
  const c = COMPETITORS[competitor]

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

        {/* ── Hero ── */}
        <section className="mx-auto max-w-[1240px] px-6 pb-10 pt-16 sm:pt-24">
          <p className="lv2-mono-label mb-4">{c.name} alternative</p>
          <h1
            className="lv2-display max-w-[900px] text-[48px] leading-[1] sm:text-[76px]"
            style={{ color: 'var(--lv2-primary)' }}
          >
            Looking for a{' '}
            <span
              className="lv2-display italic"
              style={{ color: 'var(--lv2-muted)' }}
            >
              {c.name}
            </span>{' '}
            alternative?
          </h1>
          <p
            className="mt-6 max-w-[680px] text-[17px] leading-relaxed"
            style={{ color: 'var(--lv2-fg-soft)' }}
          >
            Clipflow turns one long recording into a month of platform-native
            posts — with captions in your brand voice, full Brand Kit on every
            render, A/B hook testing, scheduler, and white-label client review
            links. {c.name} covers the clip-finder step; Clipflow covers
            everything after.
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
              Start free — no card
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/compare/clipflow-vs-${c.slug}`}
              className="text-[13.5px] font-semibold"
              style={{ color: 'var(--lv2-muted)' }}
            >
              See the full side-by-side →
            </Link>
          </div>

          <p
            className="lv2-mono mt-4 text-[10.5px]"
            style={{ color: 'var(--lv2-muted)', letterSpacing: '0.04em' }}
          >
            NO CARD · IMPORT YOUR FIRST VIDEO IN UNDER 2 MINUTES
          </p>
        </section>

        {/* ── Pain bullets ── */}
        <section
          className="mx-auto max-w-[1240px] px-6 py-12"
          style={{ borderTop: '1px solid var(--lv2-border)' }}
        >
          <div className="grid gap-10 md:grid-cols-[1fr_1.3fr]">
            <div>
              <p className="lv2-mono-label mb-3">What isn&rsquo;t working</p>
              <h2
                className="lv2-display text-[32px] leading-[1.02] sm:text-[40px]"
                style={{ color: 'var(--lv2-primary)' }}
              >
                The three things {c.name} users complain about most.
              </h2>
              <p
                className="mt-4 text-[14px] leading-relaxed"
                style={{ color: 'var(--lv2-muted)' }}
              >
                Patterns we&rsquo;ve seen from dozens of switchers. If any of
                these sound familiar, Clipflow probably solves them.
              </p>
            </div>
            <ul className="space-y-3">
              {painPoints.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-3 rounded-xl px-5 py-4"
                  style={{
                    background: 'var(--lv2-card)',
                    border: '1px solid var(--lv2-border)',
                  }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: '#F8E3E0', color: '#9B2018' }}
                  >
                    <X className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span
                    className="text-[14.5px] leading-snug"
                    style={{ color: 'var(--lv2-fg)' }}
                  >
                    {p}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── What Clipflow does instead ── */}
        <section
          className="mx-auto max-w-[1240px] px-6 py-12"
          style={{ borderTop: '1px solid var(--lv2-border)' }}
        >
          <div className="grid gap-10 md:grid-cols-[1fr_1.3fr]">
            <div>
              <p className="lv2-mono-label mb-3">What Clipflow does instead</p>
              <h2
                className="lv2-display text-[32px] leading-[1.02] sm:text-[40px]"
                style={{ color: 'var(--lv2-primary)' }}
              >
                Switchers stick because of these three.
              </h2>
            </div>
            <ul className="space-y-3">
              {c.topReasons.map((r, i) => (
                <li
                  key={r}
                  className="flex items-start gap-3 rounded-xl p-5"
                  style={{
                    background: 'var(--lv2-primary)',
                    color: 'var(--lv2-accent)',
                    boxShadow: '0 10px 28px -16px rgba(15,15,15,.32)',
                  }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: 'var(--lv2-accent)',
                      color: 'var(--lv2-primary)',
                    }}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <div className="flex-1">
                    <p className="text-[14.5px] font-semibold leading-snug">{r}</p>
                    <p
                      className="lv2-mono mt-0.5 text-[9.5px]"
                      style={{ color: 'rgba(214,255,62,.55)', letterSpacing: '0.06em' }}
                    >
                      REASON {String(i + 1).padStart(2, '0')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Filtered matrix ── */}
        <ComparisonMatrix
          competitors={[c.id]}
          eyebrow="Side-by-side"
          headline={
            <>
              Ten rows.{' '}
              <em className="lv2-display italic" style={{ color: 'var(--lv2-muted)' }}>
                Zero hand-waving.
              </em>
            </>
          }
        />

        {/* ── CTA ── */}
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
              Import a video. See the difference in 90 seconds.
            </h2>
            <p
              className="mx-auto mt-4 max-w-[520px] text-[15.5px]"
              style={{ color: 'rgba(255,255,255,.72)' }}
            >
              Free tier, no credit card. Your first draft lands in about two
              minutes — and you can cancel in two clicks if it&rsquo;s not for
              you.
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
              Try Clipflow free
              <ArrowRight className="h-4 w-4" />
            </Link>
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
        --lv2-muted: #5f5850; --lv2-muted-2: #ECE5D8;
        --lv2-border: #E5DDCE; --lv2-card: #FFFDF8;
        --lv2-primary: #0F0F0F; --lv2-primary-soft: #EDE6F5;
        --lv2-accent: #D6FF3E; --lv2-accent-ink: #1a2000;
        font-family: var(--font-inter), system-ui, sans-serif;
      }
      .lv2-root .lv2-display { font-family: var(--font-instrument-serif), 'Times New Roman', serif; letter-spacing: -.015em; }
      .lv2-root .lv2-mono { font-family: var(--font-jetbrains-mono), monospace; }
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
