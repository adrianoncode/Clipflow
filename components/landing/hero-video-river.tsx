'use client'

/**
 * Hero "River of Clips" — three parallel columns of mock Viral
 * Moments output cards that scroll continuously at different speeds,
 * selling the product-output visually without any external video
 * assets or fabricated testimonials.
 *
 * Why a mock-river beats real video:
 * - Zero bandwidth — all cards are styled gradients + SVG
 * - No external CDN dependency, no waiting for video buffer
 * - No autoplay / muted / iOS-quirks issues
 * - Content is literally what Clipflow produces (9:16 clip previews
 *   with hook overlays, karaoke captions, virality scores) so the
 *   visitor sees the feature
 *
 * Motion rules:
 * - Outer columns scroll up + down at different speeds for parallax
 * - Middle column is slower so the eye has a focal point
 * - 60s loop per column, staggered start so they don't sync
 * - Top + bottom mask fade so cards feel like they "stream in/out"
 * - prefers-reduced-motion → static grid (zero animation)
 * - Hover → the whole river pauses so users can read one
 *
 * Zero client JS for the animation itself — CSS `@keyframes` only.
 * Framer Motion is already on the landing for other animations, but
 * using pure CSS here keeps the hero hydrate-light.
 */

import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Card data — 18 mock clip outputs, grouped into 3 column slices.
// Each card is one of Clipflow's canonical "look" variants: a warm
// gradient, a cool-blue podcast look, a plum product look, a green
// founder-story look, etc. Captions + hooks are generic-creator
// content that doesn't claim to be any real person's quote.
// ---------------------------------------------------------------------------

interface RiverCard {
  hook: string
  caption: string
  score: number
  duration: string
  grad: string
  tint: string
  waveformSeed: number
}

const CARDS: RiverCard[] = [
  {
    hook: 'Nobody tells you this',
    caption: 'So I quit the job',
    score: 91,
    duration: '0:42',
    grad: 'linear-gradient(135deg,#2A1A3D 0%,#5B3A8E 55%,#8E3A5B 100%)',
    tint: '#D6FF3E',
    waveformSeed: 1,
  },
  {
    hook: 'The 6 min rule',
    caption: 'Every draft starts',
    score: 84,
    duration: '0:38',
    grad: 'linear-gradient(160deg,#3A5B8E 0%,#2A1A3D 100%)',
    tint: '#FFE600',
    waveformSeed: 2,
  },
  {
    hook: 'Most creators miss',
    caption: 'The hook is the',
    score: 78,
    duration: '0:52',
    grad: 'linear-gradient(135deg,#8E3A5B 0%,#5B3A8E 50%,#3A5B8E 100%)',
    tint: '#FFFFFF',
    waveformSeed: 3,
  },
  {
    hook: 'I was wrong about hiring',
    caption: 'First 90 days',
    score: 88,
    duration: '0:48',
    grad: 'linear-gradient(145deg,#1A4D3A 0%,#2A1A3D 100%)',
    tint: '#D6FF3E',
    waveformSeed: 4,
  },
  {
    hook: 'Stop doing this',
    caption: 'Yesterday I learned',
    score: 72,
    duration: '0:31',
    grad: 'linear-gradient(120deg,#5B3A8E 0%,#8E5B3A 100%)',
    tint: '#FFFFFF',
    waveformSeed: 5,
  },
  {
    hook: 'The calendar test',
    caption: 'Every Monday we',
    score: 67,
    duration: '0:55',
    grad: 'linear-gradient(135deg,#2A1A3D 0%,#3A5B8E 100%)',
    tint: '#FFE600',
    waveformSeed: 6,
  },
  {
    hook: '$50k in 6 months',
    caption: 'Here is the stack',
    score: 94,
    duration: '0:44',
    grad: 'linear-gradient(160deg,#8E3A5B 0%,#2A1A3D 100%)',
    tint: '#D6FF3E',
    waveformSeed: 7,
  },
  {
    hook: 'POV you just quit',
    caption: 'The first phone call',
    score: 82,
    duration: '0:36',
    grad: 'linear-gradient(135deg,#3A5B8E 0%,#1A4D3A 100%)',
    tint: '#FFFFFF',
    waveformSeed: 8,
  },
  {
    hook: 'Why I stopped charging',
    caption: 'Billable hours break',
    score: 76,
    duration: '0:49',
    grad: 'linear-gradient(145deg,#5B3A8E 0%,#2A1A3D 100%)',
    tint: '#D6FF3E',
    waveformSeed: 9,
  },
  {
    hook: 'One playbook rule',
    caption: 'Post before you polish',
    score: 69,
    duration: '0:33',
    grad: 'linear-gradient(120deg,#2A1A3D 0%,#8E3A5B 100%)',
    tint: '#FFE600',
    waveformSeed: 10,
  },
  {
    hook: 'Agency rebuild day 1',
    caption: 'We fired the client',
    score: 86,
    duration: '0:41',
    grad: 'linear-gradient(135deg,#1A4D3A 0%,#3A5B8E 100%)',
    tint: '#FFFFFF',
    waveformSeed: 11,
  },
  {
    hook: 'Four words fixed it',
    caption: 'So I asked them',
    score: 80,
    duration: '0:28',
    grad: 'linear-gradient(145deg,#8E5B3A 0%,#2A1A3D 100%)',
    tint: '#D6FF3E',
    waveformSeed: 12,
  },
  {
    hook: 'My founder therapy',
    caption: 'Journal entry 47',
    score: 73,
    duration: '0:47',
    grad: 'linear-gradient(160deg,#5B3A8E 0%,#8E3A5B 100%)',
    tint: '#FFFFFF',
    waveformSeed: 13,
  },
  {
    hook: 'The Slack message',
    caption: 'That changed everything',
    score: 89,
    duration: '0:37',
    grad: 'linear-gradient(135deg,#2A1A3D 0%,#5B3A8E 100%)',
    tint: '#FFE600',
    waveformSeed: 14,
  },
  {
    hook: 'Cheap advice I ignored',
    caption: 'Would have saved me',
    score: 77,
    duration: '0:50',
    grad: 'linear-gradient(145deg,#3A5B8E 0%,#8E3A5B 100%)',
    tint: '#D6FF3E',
    waveformSeed: 15,
  },
  {
    hook: 'Burnout math',
    caption: 'Counting hours wrong',
    score: 68,
    duration: '0:42',
    grad: 'linear-gradient(120deg,#8E3A5B 0%,#1A4D3A 100%)',
    tint: '#FFFFFF',
    waveformSeed: 16,
  },
  {
    hook: 'My content OS',
    caption: 'One recording a week',
    score: 92,
    duration: '0:39',
    grad: 'linear-gradient(135deg,#2A1A3D 0%,#1A4D3A 100%)',
    tint: '#D6FF3E',
    waveformSeed: 17,
  },
  {
    hook: 'Two clients ruined a year',
    caption: 'Red flags in week one',
    score: 85,
    duration: '0:46',
    grad: 'linear-gradient(160deg,#8E5B3A 0%,#5B3A8E 100%)',
    tint: '#FFE600',
    waveformSeed: 18,
  },
]

// 3 columns × 6 cards (with 2× duplication in the keyframe for seamless loop)
const columnA = CARDS.slice(0, 6)
const columnB = CARDS.slice(6, 12)
const columnC = CARDS.slice(12, 18)

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export function HeroVideoRiver() {
  return (
    <div className="lv2-river relative h-[640px] w-full overflow-hidden">
      <style>{`
        @keyframes lv2-river-up {
          from { transform: translateY(0); }
          to   { transform: translateY(-50%); }
        }
        @keyframes lv2-river-down {
          from { transform: translateY(-50%); }
          to   { transform: translateY(0); }
        }
        .lv2-river-col {
          will-change: transform;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .lv2-river:hover .lv2-river-col {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .lv2-river-col {
            animation: none !important;
          }
        }
      `}</style>

      {/* Ambient plum glow behind the columns for depth */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(214,255,62,0.28), rgba(42,26,61,0.12) 55%, transparent 75%)',
        }}
      />

      {/* The three parallel columns */}
      <div className="relative grid h-full grid-cols-1 gap-4 px-2 sm:grid-cols-2 lg:grid-cols-3">
        <RiverColumn
          cards={columnA}
          direction="up"
          duration={48}
          rotate={-1.5}
          visibility="all"
        />
        <RiverColumn
          cards={columnB}
          direction="down"
          duration={58}
          rotate={1.2}
          visibility="sm+"
        />
        <RiverColumn
          cards={columnC}
          direction="up"
          duration={52}
          rotate={-0.8}
          visibility="lg+"
        />
      </div>

      {/* Mask fade — cards feel like they emerge/vanish */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{
          background:
            'linear-gradient(to bottom, var(--lv2-bg, #FAF7F2) 0%, transparent 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
        style={{
          background:
            'linear-gradient(to top, var(--lv2-bg, #FAF7F2) 0%, transparent 100%)',
        }}
      />
    </div>
  )
}

function RiverColumn({
  cards,
  direction,
  duration,
  rotate,
  visibility,
}: {
  cards: RiverCard[]
  direction: 'up' | 'down'
  duration: number
  rotate: number
  visibility: 'all' | 'sm+' | 'lg+'
}) {
  const animationName = direction === 'up' ? 'lv2-river-up' : 'lv2-river-down'
  const visibilityClass =
    visibility === 'sm+' ? 'hidden sm:block' : visibility === 'lg+' ? 'hidden lg:block' : ''
  return (
    <div className={`relative ${visibilityClass}`}>
      <div
        className="lv2-river-col flex flex-col gap-5"
        style={{
          animationName,
          animationDuration: `${duration}s`,
        }}
      >
        {/* Render cards 2× for seamless loop */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex flex-col gap-5">
            {cards.map((card, i) => (
              <RiverCardView
                key={`${copy}-${i}`}
                card={card}
                rotate={rotate + (i % 2 === 0 ? 0.4 : -0.4)}
                ariaHidden={copy === 1}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function RiverCardView({
  card,
  rotate,
  ariaHidden,
}: {
  card: RiverCard
  rotate: number
  ariaHidden: boolean
}) {
  const scoreTone =
    card.score >= 85 ? 'bg-[#D6FF3E] text-[#1a2000]' : card.score >= 70 ? 'bg-white/95 text-[#2A1A3D]' : 'bg-black/40 text-white'

  return (
    <article
      aria-hidden={ariaHidden ? true : undefined}
      className="relative aspect-[9/16] w-full overflow-hidden rounded-[22px]"
      style={{
        background: card.grad,
        transform: `rotate(${rotate}deg)`,
        boxShadow:
          '0 30px 60px -20px rgba(42,26,61,0.35), 0 12px 24px -12px rgba(42,26,61,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Subtle radial glow for video-like depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18), transparent 55%)',
        }}
      />

      {/* Top bar — score chip + duration */}
      <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums ${scoreTone}`}
        >
          {card.score}
          <span className="opacity-60">/100</span>
        </span>
        <span className="font-mono text-[10px] tabular-nums text-white/80">
          {card.duration}
        </span>
      </div>

      {/* Hook text — big, TikTok-bold style, centered horizontal */}
      <div className="absolute inset-x-3 top-[38%] text-center">
        <p
          className="leading-[1.05] [text-shadow:0_2px_0_rgba(0,0,0,0.22),_0_0_20px_rgba(0,0,0,0.18)]"
          style={{
            color: card.tint,
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontSize: 'clamp(20px, 3.2vw, 32px)',
            fontWeight: 900,
            letterSpacing: '-0.5px',
            WebkitTextStroke: card.tint === '#FFFFFF' ? '0' : '1.5px rgba(0,0,0,0.35)',
          }}
        >
          {card.hook}
        </p>
      </div>

      {/* Caption chip (karaoke style) */}
      <div className="absolute inset-x-0 bottom-14 flex justify-center">
        <span
          className="rounded-md px-2.5 py-1 font-bold uppercase"
          style={{
            background: 'rgba(0,0,0,0.65)',
            color: '#FFFFFF',
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontSize: 11,
            letterSpacing: '-0.3px',
            backdropFilter: 'blur(4px)',
          }}
        >
          {card.caption}
        </span>
      </div>

      {/* Waveform + progress — bottom strip */}
      <div className="absolute inset-x-3 bottom-3 flex items-end gap-[2px]">
        {Array.from({ length: 28 }).map((_, i) => {
          const h = heightAt(card.waveformSeed, i)
          return (
            <span
              key={i}
              className="flex-1 rounded-sm bg-white/85"
              style={{
                height: `${h}%`,
              }}
            />
          )
        })}
      </div>

      {/* Progress bar overlay at very bottom */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
        <div
          className="h-full"
          style={{
            width: `${30 + (card.waveformSeed * 7) % 55}%`,
            background: card.tint,
          }}
        />
      </div>
    </article>
  )
}

/**
 * Pseudo-random waveform height generator. Deterministic per-card
 * so the animation doesn't re-roll on every render, and distinct
 * enough per-seed that cards don't look identical.
 */
function heightAt(seed: number, i: number): number {
  const base = Math.sin((i + seed) * 0.55) * 30 + 35
  const mod = Math.cos((i - seed) * 0.3) * 20
  return Math.min(90, Math.max(18, base + mod))
}

// Named-export fallback for consumers that import a wrapper node
export function HeroVideoRiverWrapped({ children }: { children?: ReactNode }) {
  return (
    <>
      <HeroVideoRiver />
      {children}
    </>
  )
}
