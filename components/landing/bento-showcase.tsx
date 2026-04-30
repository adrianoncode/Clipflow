'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * Bento-grid feature showcase — six cells, each with a looping mini
 * micro-demo of one capability. No video files; everything runs as
 * CSS + React state so the page weight stays flat and a11y tools
 * can read the text.
 *
 * The goal is attio.com / linear.app polish: each cell should feel
 * like a live snapshot of the actual product rather than stock
 * marketing illustration.
 */
export function BentoShowcase() {
  return (
    <section id="bento" className="mx-auto max-w-[1240px] px-6 py-20" style={{ scrollMarginTop: 80 }}>
      <div className="lv2-reveal mb-10 text-center">
        <p className="lv2-mono-label mb-3">Under the hood</p>
        <h2
          className="lv2-display mx-auto max-w-[620px] text-[44px] leading-[1.02] sm:text-[56px]"
          style={{ color: 'var(--lv2-primary)' }}
        >
          Six quiet superpowers doing the heavy lifting.
        </h2>
      </div>

      <div className="lv2-reveal-stagger grid auto-rows-[260px] grid-cols-1 gap-4 md:grid-cols-3">
        {/* Row 1: Clip Finder (wide) + Brand Kit */}
        <div className="md:col-span-2">
          <BentoCell title="Virality-ranked clips" tag="Clip Finder">
            <ClipFinderDemo />
          </BentoCell>
        </div>
        <BentoCell title="Stays on brand, always" tag="Brand Kit">
          <BrandKitDemo />
        </BentoCell>

        {/* Row 2: Schedule (square) + Hooks A/B (wide) */}
        <BentoCell title="Drop onto a day" tag="Schedule">
          <ScheduleDemo />
        </BentoCell>
        <div className="md:col-span-2">
          <BentoCell title="Test three hooks, pick the winner" tag="A/B Hooks">
            <HookTestDemo />
          </BentoCell>
        </div>

        {/* Row 3: White-label review (wide) + Analytics */}
        <div className="md:col-span-2">
          <BentoCell title="Client review links without Clipflow's logo" tag="White-label">
            <ReviewLinkDemo />
          </BentoCell>
        </div>
        <BentoCell title="See what's working" tag="Analytics">
          <AnalyticsDemo />
        </BentoCell>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────
 * Shell — every cell shares the same chrome so the bento reads as a
 * single grid rather than six unrelated widgets.
 * ──────────────────────────────────────────────────────────────── */
function BentoCell({
  title,
  tag,
  children,
}: {
  title: string
  tag: string
  children: React.ReactNode
}) {
  return (
    <div
      className="group relative flex h-full flex-col overflow-hidden rounded-[20px] p-5 transition-all hover:-translate-y-1"
      style={{
        background: 'var(--lv2-card)',
        border: '1px solid var(--lv2-border)',
        boxShadow: '0 1px 0 rgba(24,21,17,.04)',
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="lv2-mono-label" style={{ color: 'var(--lv2-muted)' }}>
          {tag}
        </span>
        <span
          className="lv2-mono text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: 'var(--lv2-muted)' }}
        >
          Live →
        </span>
      </div>
      <p
        className="lv2-sans-d mb-4 text-[17px] font-semibold leading-tight"
        style={{ color: 'var(--lv2-fg)' }}
      >
        {title}
      </p>
      <div className="relative flex flex-1 items-end overflow-hidden">{children}</div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
 * Mini-demos — each is a self-contained loop.
 * ──────────────────────────────────────────────────────────────── */

/** Clip Finder — scrolling list of clips with virality scores that
 *  pulse as the "active" one rotates. */
export function ClipFinderDemo() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const clips = [
    { score: 94, bucket: 'FIRE', text: "Speed isn't about effort." },
    { score: 87, bucket: 'STRONG', text: 'Most creators plateau here.' },
    { score: 82, bucket: 'STRONG', text: 'Algorithm doesn\u2019t care.' },
    { score: 71, bucket: 'OK', text: "Here's the real trap." },
  ]
  useEffect(() => {
    if (reduce) return
    const t = window.setInterval(() => setActive((i) => (i + 1) % clips.length), 1600)
    return () => window.clearInterval(t)
  }, [reduce, clips.length])

  return (
    <div className="flex w-full flex-col gap-1.5">
      {clips.map((c, i) => {
        const isActive = i === active
        return (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all"
            style={{
              background: isActive ? 'var(--lv2-primary)' : 'var(--lv2-bg-2)',
              color: isActive ? 'var(--lv2-accent)' : 'var(--lv2-fg-soft)',
              transform: isActive ? 'translateX(6px)' : 'translateX(0)',
            }}
          >
            <span
              className="lv2-mono lv2-tabular shrink-0 text-[10.5px] font-bold"
              style={{
                color: isActive
                  ? 'var(--lv2-accent)'
                  : c.bucket === 'FIRE'
                  ? '#A0530B'
                  : c.bucket === 'STRONG'
                  ? 'var(--lv2-primary)'
                  : 'var(--lv2-muted)',
              }}
            >
              {c.score}
            </span>
            <span
              className="lv2-mono shrink-0 text-[8.5px]"
              style={{
                color: isActive ? 'rgba(214,255,62,.6)' : 'var(--lv2-muted)',
                fontWeight: 700,
                letterSpacing: '.08em',
              }}
            >
              {c.bucket}
            </span>
            <span className="truncate text-[11.5px] font-semibold">{c.text}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Brand Kit — 4 color-swap tiles that demo how the same clip
 *  adopts the client's brand palette. */
export function BrandKitDemo() {
  const reduce = useReducedMotion()
  const palettes = [
    { bg: '#0F0F0F', fg: '#F4D93D', label: 'Clipflow' },
    { bg: '#0E1729', fg: '#3B82F6', label: 'Acme' },
    { bg: '#6E1A1A', fg: '#FDF8EC', label: 'Bordeaux' },
    { bg: '#1F3B2D', fg: '#D4A017', label: 'Forest' },
  ]
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduce) return
    const t = window.setInterval(() => setI((v) => (v + 1) % palettes.length), 1800)
    return () => window.clearInterval(t)
  }, [reduce, palettes.length])
  const p = palettes[i]!
  return (
    <div className="flex w-full flex-col gap-2">
      <div
        className="flex h-[90px] items-center justify-center rounded-lg transition-colors duration-700"
        style={{ background: p.bg }}
      >
        <span
          className="lv2-display text-[24px] transition-colors duration-700"
          style={{ color: p.fg }}
        >
          one video. <em>a month.</em>
        </span>
      </div>
      <div className="flex gap-1.5">
        {palettes.map((pal, idx) => (
          <button
            key={pal.label}
            type="button"
            aria-label={pal.label}
            onClick={() => setI(idx)}
            className="h-6 flex-1 rounded-md transition-all"
            style={{
              background: pal.bg,
              border:
                idx === i ? '2px solid var(--lv2-primary)' : '2px solid transparent',
            }}
          />
        ))}
      </div>
      <p
        className="lv2-mono text-center text-[9.5px]"
        style={{ color: 'var(--lv2-muted)' }}
      >
        LOGO · COLOR · FONT · INTRO/OUTRO
      </p>
    </div>
  )
}

/** Schedule — draft drops onto Wednesday with a small motion bob. */
export function ScheduleDemo() {
  const reduce = useReducedMotion()
  const [dropped, setDropped] = useState(false)
  useEffect(() => {
    if (reduce) return
    let a: ReturnType<typeof setTimeout>
    const loop = () => {
      setDropped(false)
      a = setTimeout(() => {
        setDropped(true)
        a = setTimeout(loop, 2200)
      }, 900)
    }
    loop()
    return () => clearTimeout(a)
  }, [reduce])

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex gap-1">
        {days.map((d, i) => {
          const isTarget = i === 2
          return (
            <div
              key={i}
              className="flex aspect-square flex-1 flex-col items-center justify-center rounded-md"
              style={{
                background: 'var(--lv2-bg-2)',
                border: isTarget
                  ? `1.5px ${dropped ? 'solid' : 'dashed'} var(--lv2-primary)`
                  : '1px solid var(--lv2-border)',
                transition: 'border-color .3s, background .3s',
              }}
            >
              <span
                className="lv2-mono text-[9px]"
                style={{ color: 'var(--lv2-muted)' }}
              >
                {d}
              </span>
              {isTarget && dropped ? (
                <div
                  className="mt-0.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: 'var(--lv2-accent)' }}
                />
              ) : null}
            </div>
          )
        })}
      </div>
      <div
        className="rounded-lg p-2 text-center transition-all"
        style={{
          background: dropped ? 'var(--lv2-accent)' : 'var(--lv2-primary-soft)',
          color: dropped ? 'var(--lv2-accent-ink)' : 'var(--lv2-primary)',
          transform: dropped ? 'translateY(0)' : 'translateY(-14px)',
          opacity: dropped ? 1 : 0.85,
        }}
      >
        <p className="lv2-mono text-[9.5px] font-bold">
          {dropped ? 'SCHEDULED · WED 9:00' : 'TIKTOK · Draft'}
        </p>
      </div>
    </div>
  )
}

/** Hook A/B Test — three hook variants with the winner highlighting. */
export function HookTestDemo() {
  const reduce = useReducedMotion()
  const hooks = [
    { text: 'Why most creators plateau at 10K followers.', score: 76 },
    { text: 'The algorithm update nobody\u2019s talking about.', score: 94 },
    { text: 'Stop optimizing. Start observing.', score: 82 },
  ]
  const [winner, setWinner] = useState(-1)
  useEffect(() => {
    if (reduce) {
      setWinner(1)
      return
    }
    let a: ReturnType<typeof setTimeout>
    const loop = () => {
      setWinner(-1)
      a = setTimeout(() => {
        setWinner(1)
        a = setTimeout(loop, 2200)
      }, 800)
    }
    loop()
    return () => clearTimeout(a)
  }, [reduce])

  return (
    <div className="flex w-full flex-col gap-1.5">
      {hooks.map((h, i) => {
        const isWinner = i === winner
        return (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
            style={{
              background: isWinner ? 'var(--lv2-accent)' : 'var(--lv2-bg-2)',
              color: isWinner ? 'var(--lv2-accent-ink)' : 'var(--lv2-fg-soft)',
              outline: isWinner ? '2px solid var(--lv2-primary)' : '0 solid transparent',
              outlineOffset: 2,
            }}
          >
            <span
              className="lv2-mono lv2-tabular w-6 shrink-0 text-center text-[9.5px] font-bold"
              style={{ color: isWinner ? 'var(--lv2-primary)' : 'var(--lv2-muted)' }}
            >
              {'ABC'[i]}
            </span>
            <span className="flex-1 truncate text-[12px] font-semibold">{h.text}</span>
            <span
              className="lv2-mono lv2-tabular shrink-0 text-[10.5px] font-bold"
              style={{ color: isWinner ? 'var(--lv2-primary)' : 'var(--lv2-muted)' }}
            >
              {h.score}
            </span>
            {isWinner && (
              <span
                className="lv2-mono shrink-0 rounded px-1.5 py-0.5 text-[8.5px] font-bold"
                style={{ background: 'var(--lv2-primary)', color: 'var(--lv2-accent)' }}
              >
                WIN
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** White-label Review — shows a review link header swap. */
export function ReviewLinkDemo() {
  const reduce = useReducedMotion()
  const [white, setWhite] = useState(false)
  useEffect(() => {
    if (reduce) {
      setWhite(true)
      return
    }
    const t = window.setInterval(() => setWhite((v) => !v), 2400)
    return () => window.clearInterval(t)
  }, [reduce])

  return (
    <div className="flex w-full flex-col gap-2">
      <div
        className="flex items-center gap-3 rounded-xl border-2 border-dashed p-3 transition-all"
        style={{
          borderColor: white ? 'var(--lv2-border)' : 'var(--lv2-border)',
          background: 'var(--lv2-card)',
        }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-md font-bold transition-all"
          style={{
            background: white ? '#FD6E2A' : 'var(--lv2-primary)',
            color: white ? 'white' : 'var(--lv2-accent)',
            fontSize: 13,
          }}
        >
          {white ? 'B' : 'C'}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[13px] font-bold transition-colors"
            style={{ color: 'var(--lv2-fg)' }}
          >
            {white ? 'Byrne Agency' : 'Clipflow'}
          </p>
          <p
            className="lv2-mono truncate text-[9px]"
            style={{ color: 'var(--lv2-muted)' }}
          >
            {white ? 'review.byrne.co/clip-47' : 'clipflow.to/review/x5k2'}
          </p>
        </div>
        <span
          className="lv2-chip shrink-0"
          style={{
            background: 'var(--lv2-primary-soft)',
            color: 'var(--lv2-primary)',
            fontSize: 9,
          }}
        >
          {white ? 'YOUR BRAND' : 'DEFAULT'}
        </span>
      </div>
      <p
        className="lv2-mono text-center text-[9.5px]"
        style={{ color: 'var(--lv2-muted)' }}
      >
        CLIENTS SEE YOUR NAME, NOT OURS
      </p>
    </div>
  )
}

/** Analytics — three sparkline bars that grow in. */
export function AnalyticsDemo() {
  const reduce = useReducedMotion()
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (reduce) {
      setTick(8)
      return
    }
    const t = window.setInterval(() => setTick((v) => (v + 1) % 9), 220)
    return () => window.clearInterval(t)
  }, [reduce])
  const bars = [4, 6, 3, 8, 5, 9, 7, 11, 6]
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-end gap-1" style={{ height: 76 }}>
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md transition-all duration-500"
            style={{
              height: `${(i <= tick ? h : 0) * 8}%`,
              background:
                i === tick
                  ? 'var(--lv2-accent)'
                  : i === 7
                  ? 'var(--lv2-primary)'
                  : 'var(--lv2-muted-2)',
            }}
          />
        ))}
      </div>
      <div className="flex items-baseline justify-between">
        <p
          className="lv2-display text-[22px] leading-none"
          style={{ color: 'var(--lv2-primary)' }}
        >
          +38%
        </p>
        <p className="lv2-mono text-[9px]" style={{ color: 'var(--lv2-muted)' }}>
          WoW · TIKTOK
        </p>
      </div>
    </div>
  )
}
