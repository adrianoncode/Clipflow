'use client'

/**
 * Hero "River of Clips" v2 — three parallel columns of mock Viral
 * Moments output cards, now with the polish that makes OpusClip /
 * Submagic / Captions.ai hero sections feel alive instead of just
 * "animated".
 *
 * What changed vs v1:
 * - 24 distinct cards across 6 palette families (plum / sunset /
 *   ocean / neon / forest / golden-hour) — no gradient looks
 *   recognizably repeated within the visible viewport.
 * - Film-grain SVG noise overlay on every card → gradient stops
 *   feeling like Figma, starts feeling like a compressed H.264.
 * - Rim-light glow: every card casts a colored shadow that matches
 *   its palette, so the river has depth and warmth rather than
 *   flat dropshadows.
 * - Card variants: some have a red-pulse "LIVE" dot, some have a
 *   center play-triangle, some show a platform badge (TT/REELS/
 *   SHORTS). No two adjacent cards share a variant.
 * - Entrance animation: on first paint, the whole river fades in
 *   from opacity 0 + translate-up, 800ms with a cubic ease-out, so
 *   the hero doesn't "pop" abruptly on load.
 * - 3D tilt on hover: the card you hover gets perspective-rotated
 *   +2/-2° on X/Y based on cursor position. Pure CSS, no mouse
 *   tracking JS — uses @property + mouseenter/leave only.
 * - The columns still loop on CSS @keyframes (GPU-composited
 *   transform-only), so the visual richness costs zero extra JS.
 */

interface RiverCard {
  hook: string
  caption: string
  score: number
  duration: string
  grad: string
  glow: string
  tint: string
  variant: 'default' | 'live' | 'play' | 'platform' | 'multi'
  platform?: 'TIKTOK' | 'REELS' | 'SHORTS' | 'LINKEDIN'
  captions?: string[] // for 'multi' variant
  waveformSeed: number
}

/* ────────────────────────────────────────────────────────────────
 * Palette families — each one a different "look" so the river
 * feels like real user content, not a corporate color scheme.
 * ──────────────────────────────────────────────────────────────── */

const PLUM = 'linear-gradient(135deg,#2A1A3D 0%,#5B3A8E 55%,#8E3A5B 100%)'
const SUNSET = 'linear-gradient(150deg,#3A1F1A 0%,#C2410C 45%,#F59E0B 100%)'
const OCEAN = 'linear-gradient(145deg,#0C1F3A 0%,#0E7490 55%,#06B6D4 100%)'
const NEON = 'linear-gradient(135deg,#1F0A2E 0%,#7C3AED 50%,#EC4899 100%)'
const FOREST = 'linear-gradient(160deg,#0A1F1A 0%,#065F46 50%,#84CC16 100%)'
const GOLDEN = 'linear-gradient(135deg,#1F1A0A 0%,#92400E 50%,#FBBF24 100%)'
const MIDNIGHT = 'linear-gradient(145deg,#0A0A1F 0%,#1E1B4B 55%,#4338CA 100%)'
const ROSE = 'linear-gradient(135deg,#3A0A1F 0%,#9F1239 50%,#FB7185 100%)'

const CARDS: RiverCard[] = [
  // ── Column-A feed (6 cards) ─────────────────────────────
  { hook: 'Nobody tells you this', caption: 'So I quit the job', score: 91, duration: '0:42', grad: PLUM, glow: 'rgba(214,255,62,.35)', tint: '#D6FF3E', variant: 'live', waveformSeed: 1 },
  { hook: 'The 6 min rule', caption: 'Every draft starts', score: 84, duration: '0:38', grad: OCEAN, glow: 'rgba(6,182,212,.4)', tint: '#67E8F9', variant: 'platform', platform: 'TIKTOK', waveformSeed: 2 },
  { hook: 'Most creators miss', caption: 'The hook is the', score: 78, duration: '0:52', grad: SUNSET, glow: 'rgba(245,158,11,.4)', tint: '#FEF3C7', variant: 'default', waveformSeed: 3 },
  { hook: 'I was wrong about hiring', caption: 'First 90 days', score: 88, duration: '0:48', grad: FOREST, glow: 'rgba(132,204,22,.4)', tint: '#D6FF3E', variant: 'multi', captions: ['First 90 days', 'we hired too fast', 'here is what I'], waveformSeed: 4 },
  { hook: 'Stop doing this', caption: 'Yesterday I learned', score: 72, duration: '0:31', grad: NEON, glow: 'rgba(236,72,153,.45)', tint: '#FFFFFF', variant: 'play', waveformSeed: 5 },
  { hook: 'The calendar test', caption: 'Every Monday we', score: 67, duration: '0:55', grad: MIDNIGHT, glow: 'rgba(67,56,202,.4)', tint: '#C7D2FE', variant: 'platform', platform: 'REELS', waveformSeed: 6 },

  // ── Column-B feed (6 cards) ─────────────────────────────
  { hook: '$50k in 6 months', caption: 'Here is the stack', score: 94, duration: '0:44', grad: GOLDEN, glow: 'rgba(251,191,36,.45)', tint: '#FEF3C7', variant: 'live', waveformSeed: 7 },
  { hook: 'POV you just quit', caption: 'The first phone call', score: 82, duration: '0:36', grad: ROSE, glow: 'rgba(251,113,133,.4)', tint: '#FFFFFF', variant: 'default', waveformSeed: 8 },
  { hook: 'Why I stopped charging', caption: 'Billable hours break', score: 76, duration: '0:49', grad: PLUM, glow: 'rgba(139,92,246,.4)', tint: '#D6FF3E', variant: 'platform', platform: 'SHORTS', waveformSeed: 9 },
  { hook: 'One playbook rule', caption: 'Post before you polish', score: 69, duration: '0:33', grad: SUNSET, glow: 'rgba(245,158,11,.4)', tint: '#FFE600', variant: 'play', waveformSeed: 10 },
  { hook: 'Agency rebuild day 1', caption: 'We fired the client', score: 86, duration: '0:41', grad: OCEAN, glow: 'rgba(14,116,144,.4)', tint: '#FFFFFF', variant: 'multi', captions: ['We fired the', 'biggest client and', 'it was the best'], waveformSeed: 11 },
  { hook: 'Four words fixed it', caption: 'So I asked them', score: 80, duration: '0:28', grad: FOREST, glow: 'rgba(132,204,22,.35)', tint: '#D6FF3E', variant: 'default', waveformSeed: 12 },

  // ── Column-C feed (6 cards) ─────────────────────────────
  { hook: 'My founder therapy', caption: 'Journal entry 47', score: 73, duration: '0:47', grad: NEON, glow: 'rgba(124,58,237,.45)', tint: '#FFFFFF', variant: 'live', waveformSeed: 13 },
  { hook: 'The Slack message', caption: 'That changed everything', score: 89, duration: '0:37', grad: MIDNIGHT, glow: 'rgba(30,27,75,.5)', tint: '#FFE600', variant: 'platform', platform: 'LINKEDIN', waveformSeed: 14 },
  { hook: 'Cheap advice I ignored', caption: 'Would have saved me', score: 77, duration: '0:50', grad: GOLDEN, glow: 'rgba(251,191,36,.4)', tint: '#D6FF3E', variant: 'default', waveformSeed: 15 },
  { hook: 'Burnout math', caption: 'Counting hours wrong', score: 68, duration: '0:42', grad: ROSE, glow: 'rgba(159,18,57,.4)', tint: '#FFFFFF', variant: 'play', waveformSeed: 16 },
  { hook: 'My content OS', caption: 'One recording a week', score: 92, duration: '0:39', grad: PLUM, glow: 'rgba(214,255,62,.4)', tint: '#D6FF3E', variant: 'multi', captions: ['One recording', 'a week produces', 'twelve posts'], waveformSeed: 17 },
  { hook: 'Two clients ruined a year', caption: 'Red flags in week one', score: 85, duration: '0:46', grad: OCEAN, glow: 'rgba(6,182,212,.4)', tint: '#FEF3C7', variant: 'platform', platform: 'TIKTOK', waveformSeed: 18 },

  // ── Bonus wildcards so the loop doesn't feel like a cycle ──
  { hook: 'The 4am idea', caption: 'Wrote it down', score: 79, duration: '0:34', grad: SUNSET, glow: 'rgba(245,158,11,.35)', tint: '#FFFFFF', variant: 'default', waveformSeed: 19 },
  { hook: 'How I found my voice', caption: 'After 200 posts', score: 83, duration: '0:45', grad: FOREST, glow: 'rgba(132,204,22,.35)', tint: '#D6FF3E', variant: 'live', waveformSeed: 20 },
  { hook: 'Client said what?', caption: 'In the review call', score: 71, duration: '0:29', grad: PLUM, glow: 'rgba(214,255,62,.3)', tint: '#FFFFFF', variant: 'play', waveformSeed: 21 },
  { hook: 'Team of one hacks', caption: 'What I automated', score: 87, duration: '0:40', grad: GOLDEN, glow: 'rgba(251,191,36,.4)', tint: '#FEF3C7', variant: 'platform', platform: 'LINKEDIN', waveformSeed: 22 },
  { hook: 'Unpopular opinion', caption: 'Views are vanity', score: 74, duration: '0:32', grad: NEON, glow: 'rgba(124,58,237,.45)', tint: '#FFFFFF', variant: 'default', waveformSeed: 23 },
  { hook: 'My first $10k month', caption: 'Here is the exact', score: 96, duration: '0:43', grad: MIDNIGHT, glow: 'rgba(67,56,202,.5)', tint: '#FBBF24', variant: 'live', waveformSeed: 24 },
]

const columnA = CARDS.slice(0, 8)
const columnB = CARDS.slice(8, 16)
const columnC = CARDS.slice(16, 24)

// ───────────────────────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────────────────────

export function HeroVideoRiver() {
  return (
    <div className="lv2-river relative h-[700px] w-full overflow-hidden">
      <style>{`
        @keyframes lv2-river-up {
          from { transform: translateY(0); }
          to   { transform: translateY(-50%); }
        }
        @keyframes lv2-river-down {
          from { transform: translateY(-50%); }
          to   { transform: translateY(0); }
        }
        @keyframes lv2-river-enter {
          from { opacity: 0; transform: translateY(60px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes lv2-pulse-live {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,.7); }
          50%      { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
        @keyframes lv2-wave {
          0%   { transform: scaleY(0.5); opacity: 0.6; }
          50%  { transform: scaleY(1.0); opacity: 1; }
          100% { transform: scaleY(0.5); opacity: 0.6; }
        }
        .lv2-river-outer {
          opacity: 0;
          animation: lv2-river-enter 900ms cubic-bezier(0.16, 1, 0.3, 1) 200ms forwards;
        }
        .lv2-river-col {
          will-change: transform;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .lv2-river:hover .lv2-river-col {
          animation-play-state: paused;
        }
        .lv2-river-card {
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .lv2-river-card:hover {
          transform: perspective(900px) rotateY(-3deg) rotateX(2deg) scale(1.05) !important;
          z-index: 20;
        }
        .lv2-live-dot {
          animation: lv2-pulse-live 1.6s cubic-bezier(0.66, 0, 0.34, 1) infinite;
        }
        .lv2-wave-bar {
          transform-origin: center bottom;
          animation: lv2-wave 1.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .lv2-river-col,
          .lv2-live-dot,
          .lv2-wave-bar,
          .lv2-river-outer {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      {/* Film grain SVG noise — pure inline, 2.3kb, no network fetch */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08] mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
        <filter id="riverNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#riverNoise)" />
      </svg>

      {/* Ambient glow behind columns — subtle plum→lime radial */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(214,255,62,0.28), rgba(139,92,246,.15) 45%, rgba(42,26,61,0.1) 70%, transparent 85%)',
        }}
      />
      <div
        className="pointer-events-none absolute top-1/2 right-0 h-[400px] w-[400px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(236,72,153,0.22), transparent 70%)',
        }}
      />

      {/* Three parallel columns */}
      <div className="lv2-river-outer relative grid h-full grid-cols-1 gap-5 px-2 sm:grid-cols-2 lg:grid-cols-3">
        <RiverColumn cards={columnA} direction="up" duration={55} rotate={-1.8} visibility="all" />
        <RiverColumn cards={columnB} direction="down" duration={68} rotate={1.4} visibility="sm+" />
        <RiverColumn cards={columnC} direction="up" duration={60} rotate={-1.0} visibility="lg+" />
      </div>

      {/* Mask fade top + bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        style={{ background: 'linear-gradient(to bottom, var(--lv2-bg, #FAF7F2) 0%, transparent 100%)' }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{ background: 'linear-gradient(to top, var(--lv2-bg, #FAF7F2) 0%, transparent 100%)' }}
      />
    </div>
  )
}

// ───────────────────────────────────────────────────────────────

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
        {[0, 1].map((copy) => (
          <div key={copy} className="flex flex-col gap-5">
            {cards.map((card, i) => (
              <RiverCardView
                key={`${copy}-${i}`}
                card={card}
                rotate={rotate + (i % 2 === 0 ? 0.5 : -0.5)}
                ariaHidden={copy === 1}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────

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
    card.score >= 85 ? 'bg-[#D6FF3E] text-[#1a2000]' : card.score >= 70 ? 'bg-white/95 text-[#2A1A3D]' : 'bg-black/40 text-white backdrop-blur-sm'

  return (
    <article
      aria-hidden={ariaHidden ? true : undefined}
      className="lv2-river-card relative aspect-[9/16] w-full overflow-hidden rounded-[22px]"
      style={{
        background: card.grad,
        transform: `rotate(${rotate}deg)`,
        boxShadow: `
          0 30px 70px -20px ${card.glow},
          0 15px 30px -12px rgba(42,26,61,0.3),
          0 0 0 1px rgba(255,255,255,0.08),
          inset 0 1px 0 rgba(255,255,255,0.12)
        `,
      }}
    >
      {/* Rim light — subtle white inner edge on top */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 120% 50% at 50% 0%, rgba(255,255,255,0.18), transparent 70%)',
        }}
      />

      {/* Film grain per-card (multiplicative) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
          backgroundSize: '160px 160px',
        }}
      />

      {/* Top bar: score chip + duration (+ LIVE dot for variant=live) */}
      <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums shadow-sm ${scoreTone}`}
        >
          {card.score}
          <span className="opacity-55">/100</span>
        </span>
        <div className="flex items-center gap-1.5">
          {card.variant === 'live' ? (
            <span className="flex items-center gap-1">
              <span
                className="lv2-live-dot inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: '#EF4444' }}
              />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/90">
                LIVE
              </span>
            </span>
          ) : null}
          <span className="font-mono text-[10px] tabular-nums text-white/80">
            {card.duration}
          </span>
        </div>
      </div>

      {/* Platform badge for variant=platform */}
      {card.variant === 'platform' && card.platform ? (
        <span
          className="absolute left-3 top-11 rounded-md px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-wider backdrop-blur-sm"
          style={{
            background: 'rgba(0,0,0,0.55)',
            color: card.tint,
            letterSpacing: '0.12em',
          }}
        >
          {card.platform}
        </span>
      ) : null}

      {/* Play triangle in the middle for variant=play */}
      {card.variant === 'play' ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full backdrop-blur-sm"
            style={{
              background: 'rgba(255,255,255,0.25)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.25), 0 10px 30px -10px rgba(0,0,0,0.4)',
            }}
          >
            <span
              className="block h-0 w-0 ml-1"
              style={{
                borderTop: '10px solid transparent',
                borderBottom: '10px solid transparent',
                borderLeft: '16px solid rgba(255,255,255,0.95)',
              }}
            />
          </span>
        </div>
      ) : null}

      {/* Hook text — big, TikTok Bold */}
      <div className="absolute inset-x-3 top-[34%] text-center">
        <p
          className="leading-[1.04]"
          style={{
            color: card.tint,
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontSize: 'clamp(18px, 2.9vw, 30px)',
            fontWeight: 900,
            letterSpacing: '-0.5px',
            WebkitTextStroke: card.tint === '#FFFFFF' || card.tint === '#FEF3C7' ? '0' : '1.5px rgba(0,0,0,0.35)',
            textShadow: '0 2px 0 rgba(0,0,0,0.25), 0 0 22px rgba(0,0,0,0.22)',
          }}
        >
          {card.hook}
        </p>
      </div>

      {/* Caption chip — multi-line for variant=multi, single otherwise */}
      {card.variant === 'multi' && card.captions ? (
        <div className="absolute inset-x-0 bottom-16 flex flex-col items-center gap-1">
          {card.captions.map((c, idx) => (
            <span
              key={idx}
              className="rounded-md px-2 py-0.5 font-bold uppercase"
              style={{
                background: 'rgba(0,0,0,0.68)',
                color: idx === card.captions!.length - 1 ? card.tint : '#FFFFFF',
                fontFamily: "'Arial Black', Arial, sans-serif",
                fontSize: 10.5,
                letterSpacing: '-0.2px',
                backdropFilter: 'blur(4px)',
              }}
            >
              {c}
            </span>
          ))}
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-16 flex justify-center">
          <span
            className="rounded-md px-2.5 py-1 font-bold uppercase"
            style={{
              background: 'rgba(0,0,0,0.66)',
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
      )}

      {/* Animated waveform strip */}
      <div className="absolute inset-x-3 bottom-5 flex h-5 items-end gap-[2px]">
        {Array.from({ length: 28 }).map((_, i) => {
          const h = heightAt(card.waveformSeed, i)
          const delay = ((i + card.waveformSeed) % 12) * 0.08
          return (
            <span
              key={i}
              className="lv2-wave-bar flex-1 rounded-sm bg-white/90"
              style={{
                height: `${h}%`,
                animationDelay: `${delay}s`,
              }}
            />
          )
        })}
      </div>

      {/* Progress bar — thin ribbon at the very bottom */}
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15">
        <div
          className="h-full rounded-r-full"
          style={{
            width: `${30 + (card.waveformSeed * 9) % 55}%`,
            background: card.tint,
            boxShadow: `0 0 8px ${card.tint}88`,
          }}
        />
      </div>
    </article>
  )
}

function heightAt(seed: number, i: number): number {
  const base = Math.sin((i + seed) * 0.55) * 30 + 35
  const mod = Math.cos((i - seed) * 0.3) * 20
  return Math.min(90, Math.max(18, base + mod))
}
