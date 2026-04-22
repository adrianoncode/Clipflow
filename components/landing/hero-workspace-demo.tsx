'use client'

/**
 * Hero Workspace Demo — the OpusClip-style product-flow mockup.
 *
 * Replaces the previous phone-frame and river approaches with what
 * OpusClip, Submagic, and Captions.ai actually ship on their landings:
 * a dark workspace container that shows the INPUT → OUTPUT flow
 * of the product, with live-cycling source video + stagger-in
 * highlight clips + a side phone playing real-looking karaoke captions.
 *
 * Structure (top → bottom inside the dark container):
 *  1. Source video thumbnail — 16:9, cycles every 3.5s between 4
 *     content types (Interview, Podcast, Livestream, Vlog). Each has
 *     its own gradient, duration chip, play-triangle overlay.
 *  2. Input bar — "Drop a long video and…" + lime "Find viral
 *     moments" CTA button. Decorative but sells the input surface.
 *  3. Highlight clips row — 6 portrait 9:16 cards with score badge
 *     (color-coded) and platform icon. On every source-swap they
 *     fade+scale in staggered so it feels like "just generated".
 *
 * Side: a smaller phone frame floats to the right showing a real-
 * looking clip with word-by-word karaoke caption cycling through.
 *
 * Below the container: 6 feature-chip tabs with lucide icons mapping
 * to the real Clipflow tools (Clip Finder, Subtitles, Reframe,
 * B-Roll, Brand Voice, Auto-Dub).
 *
 * Zero external assets. All gradients + SVG + CSS keyframes. Runs
 * smoothly on a $300 laptop.
 */

import {
  Captions,
  Clapperboard,
  Crop,
  Film,
  Languages,
  Mic2,
  Play,
  Scissors,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

// ───────────────────────────────────────────────────────────────
// Source videos — cycle through these at the top of the container.
// Each source implies a different content type the product handles.
// ───────────────────────────────────────────────────────────────

interface SourceVideo {
  label: string
  duration: string
  gradient: string
  subject: string
}

const SOURCES: SourceVideo[] = [
  {
    label: 'Interview · 2 speakers',
    duration: '1:40:35',
    gradient:
      'linear-gradient(135deg, #1F0A2E 0%, #5B3A8E 50%, #0E7490 100%)',
    subject: 'Podcast Studio',
  },
  {
    label: 'Solo podcast · weekly',
    duration: '49:50',
    gradient:
      'linear-gradient(145deg, #0A1F1A 0%, #065F46 55%, #84CC16 100%)',
    subject: 'Mic + green plant bg',
  },
  {
    label: 'Livestream · VOD',
    duration: '2:04:44',
    gradient:
      'linear-gradient(135deg, #3A1F1A 0%, #9F1239 55%, #F59E0B 100%)',
    subject: 'Arena · neon lights',
  },
  {
    label: 'Vlog · travel',
    duration: '23:12',
    gradient:
      'linear-gradient(145deg, #0C1F3A 0%, #0E7490 45%, #06B6D4 100%)',
    subject: 'Beach, golden hour',
  },
]

// ───────────────────────────────────────────────────────────────
// Highlight clips — 6 portraits that animate in when source changes.
// ───────────────────────────────────────────────────────────────

interface ClipOutput {
  score: number
  platform: 'YT' | 'TT' | 'IG' | 'LI' | 'X'
  hook: string
  gradient: string
}

const CLIPS: ClipOutput[] = [
  {
    score: 97,
    platform: 'YT',
    hook: 'I stopped editing',
    gradient: 'linear-gradient(145deg, #1F0A2E, #7C3AED)',
  },
  {
    score: 99,
    platform: 'TT',
    hook: 'Nobody tells you',
    gradient: 'linear-gradient(135deg, #3A1F1A, #F59E0B)',
  },
  {
    score: 95,
    platform: 'IG',
    hook: '6 min rule',
    gradient: 'linear-gradient(150deg, #0A1F1A, #84CC16)',
  },
  {
    score: 93,
    platform: 'TT',
    hook: 'POV: you quit',
    gradient: 'linear-gradient(135deg, #0C1F3A, #06B6D4)',
  },
  {
    score: 98,
    platform: 'LI',
    hook: 'Four words',
    gradient: 'linear-gradient(145deg, #1E1B4B, #7C3AED)',
  },
  {
    score: 97,
    platform: 'IG',
    hook: 'The Slack msg',
    gradient: 'linear-gradient(135deg, #3A0A1F, #FB7185)',
  },
]

const PLATFORM_COLORS: Record<ClipOutput['platform'], string> = {
  YT: '#FF0000',
  TT: '#FFFFFF',
  IG: '#E1306C',
  LI: '#0A66C2',
  X: '#FFFFFF',
}

// ───────────────────────────────────────────────────────────────
// Feature chips — matches real Clipflow tools with their real paths
// ───────────────────────────────────────────────────────────────

interface FeatureChip {
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
}

const FEATURE_CHIPS: FeatureChip[] = [
  { Icon: Scissors, label: 'Clip Finder' },
  { Icon: Captions, label: 'Auto-Subtitles' },
  { Icon: Crop, label: 'Auto-Reframe' },
  { Icon: Film, label: 'B-Roll' },
  { Icon: Mic2, label: 'Brand Voice' },
  { Icon: Languages, label: 'Auto-Dub' },
]

// Karaoke cycling caption words — 7 beats, 9s loop
const KARAOKE_WORDS = [
  'Most',
  'creators',
  'quit',
  'right',
  'before',
  'it',
  'clicks.',
]

// ───────────────────────────────────────────────────────────────
// Main component
// ───────────────────────────────────────────────────────────────

export function HeroWorkspaceDemo() {
  return (
    <div className="relative mx-auto w-full max-w-[680px]">
      <style>{`
        /* Source video cycle — swap every 3.5s. 4 sources × 3.5s = 14s loop. */
        @keyframes lv2-src-0 { 0%, 23% { opacity: 1; } 25%, 100% { opacity: 0; } }
        @keyframes lv2-src-1 { 0%, 23% { opacity: 0; } 25%, 48% { opacity: 1; } 50%, 100% { opacity: 0; } }
        @keyframes lv2-src-2 { 0%, 48% { opacity: 0; } 50%, 73% { opacity: 1; } 75%, 100% { opacity: 0; } }
        @keyframes lv2-src-3 { 0%, 73% { opacity: 0; } 75%, 98% { opacity: 1; } 100% { opacity: 0; } }

        /* Highlight clips stagger in — each card has its own delay */
        @keyframes lv2-clip-in {
          0%, 18%   { opacity: 0; transform: translateY(18px) scale(0.92); }
          30%, 100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Karaoke word cycle — single track slides up line-by-line */
        @keyframes lv2-kara {
          0%,   11% { transform: translateY(0);      }
          14%,  25% { transform: translateY(-1em);   }
          28%,  39% { transform: translateY(-2em);   }
          42%,  53% { transform: translateY(-3em);   }
          56%,  67% { transform: translateY(-4em);   }
          70%,  81% { transform: translateY(-5em);   }
          84%, 100% { transform: translateY(-6em);   }
        }

        /* Workspace entrance — fade up once */
        @keyframes lv2-ws-enter {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Gentle breathing on the side phone */
        @keyframes lv2-phone-breathe {
          0%, 100% { transform: translateY(0) rotate(2.5deg); }
          50%      { transform: translateY(-5px) rotate(2.5deg); }
        }

        .lv2-ws-root {
          opacity: 0;
          animation: lv2-ws-enter 1s cubic-bezier(0.16, 1, 0.3, 1) 150ms forwards;
        }
        .lv2-src {
          animation-duration: 14s;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          animation-iteration-count: infinite;
        }
        .lv2-clip {
          animation: lv2-clip-in 14s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .lv2-kara-track {
          animation: lv2-kara 9s cubic-bezier(0.77, 0, 0.175, 1) infinite;
        }
        .lv2-phone-float {
          animation: lv2-phone-breathe 5s ease-in-out 1s infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .lv2-ws-root,
          .lv2-src,
          .lv2-clip,
          .lv2-kara-track,
          .lv2-phone-float {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      {/* Ambient glow behind everything */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(214,255,62,0.22) 0%, rgba(139,92,246,0.16) 40%, transparent 78%)',
        }}
      />

      {/* ── Main workspace container ── */}
      <div
        className="lv2-ws-root relative overflow-hidden rounded-[28px] border"
        style={{
          background:
            'linear-gradient(180deg, rgba(20,14,32,0.95) 0%, rgba(10,8,18,0.98) 100%)',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow:
            '0 50px 100px -30px rgba(42,26,61,0.55), 0 20px 50px -15px rgba(42,26,61,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Tab bar / window chrome — fake browser dots */}
        <div
          className="flex items-center justify-between border-b px-5 py-3"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FF5F57' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#28C840' }} />
          </div>
          <span
            className="rounded-md px-3 py-0.5 font-mono text-[10px] text-white/55"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            clipflow.to/workspace
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-white/55">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#10B981' }} />
            LIVE
          </span>
        </div>

        {/* Content area */}
        <div className="relative p-5 pb-7">
          {/* ── Source video (cycling) ── */}
          <div className="relative mb-4 aspect-video overflow-hidden rounded-2xl">
            {SOURCES.map((src, i) => (
              <div
                key={i}
                className="lv2-src absolute inset-0"
                style={{
                  background: src.gradient,
                  animationName: `lv2-src-${i}`,
                }}
              >
                {/* Film grain */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.1] mix-blend-overlay"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
                    backgroundSize: '160px 160px',
                  }}
                />
                {/* Vignette */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.45) 100%)',
                  }}
                />

                {/* Abstract subject shape to imply content — a soft blob */}
                <div
                  className="absolute left-1/2 top-1/2 h-[55%] w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-[16%] blur-xl"
                  style={{
                    background: 'radial-gradient(ellipse, rgba(255,230,200,0.35), transparent 70%)',
                  }}
                />

                {/* Play button center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-full backdrop-blur-md"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      boxShadow:
                        '0 0 0 1px rgba(255,255,255,0.3), 0 15px 40px -10px rgba(0,0,0,0.55)',
                    }}
                  >
                    <Play className="ml-1 h-6 w-6 text-white" fill="white" />
                  </span>
                </div>

                {/* Label top-left */}
                <div
                  className="absolute left-4 top-4 rounded-md px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{
                    background: 'rgba(0,0,0,0.55)',
                    color: '#FFFFFF',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {src.label}
                </div>

                {/* Duration chip bottom-right */}
                <div
                  className="absolute bottom-3 right-3 rounded-md px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums"
                  style={{ background: 'rgba(0,0,0,0.72)', color: '#FFFFFF' }}
                >
                  {src.duration}
                </div>
              </div>
            ))}
          </div>

          {/* ── Input bar ── */}
          <div className="mb-4 flex items-stretch gap-2">
            <div
              className="flex flex-1 items-center gap-2 rounded-full px-4"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <UploadCloud className="h-4 w-4 text-white/50" aria-hidden />
              <span className="text-[13px] text-white/55">
                Drop a long video or paste a YouTube link…
              </span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full px-5 text-[13px] font-bold transition-transform hover:scale-[1.02]"
              style={{
                background: '#D6FF3E',
                color: '#1a2000',
                boxShadow: '0 10px 30px -8px rgba(214,255,62,0.4)',
              }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Find viral moments
            </button>
          </div>

          {/* ── Highlight clips row ── */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {CLIPS.map((clip, i) => (
              <HighlightThumb
                key={i}
                clip={clip}
                animationDelay={`${i * 0.08}s`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Feature chip tabs below ── */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {FEATURE_CHIPS.map(({ Icon, label }, i) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[10.5px] font-semibold"
            style={{
              background: i === 0 ? 'var(--lv2-primary, #2A1A3D)' : 'rgba(42,26,61,0.06)',
              color: i === 0 ? 'var(--lv2-accent, #D6FF3E)' : 'var(--lv2-muted, #5f5850)',
              border: `1px solid ${
                i === 0
                  ? 'var(--lv2-primary, #2A1A3D)'
                  : 'rgba(42,26,61,0.12)'
              }`,
            }}
          >
            <Icon className="h-3 w-3" aria-hidden />
            {label}
          </span>
        ))}
      </div>

      {/* ── Floating side phone with karaoke caption ── */}
      <div
        className="lv2-phone-float pointer-events-none absolute -right-6 top-[18%] hidden w-[160px] md:block lg:w-[180px]"
        aria-hidden
      >
        <div
          className="relative aspect-[9/19.5] overflow-hidden rounded-[24px] border border-black/10"
          style={{
            background: '#0a0a0b',
            boxShadow:
              '0 30px 60px -15px rgba(42,26,61,0.5), 0 0 0 1.5px rgba(0,0,0,0.15), inset 0 0 0 5px #0a0a0b',
          }}
        >
          {/* Screen */}
          <div
            className="relative h-full w-full overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, #1F0A2E 0%, #2A1A3D 40%, #7C3AED 100%)',
            }}
          >
            {/* Notch */}
            <div className="absolute left-1/2 top-1 h-[14px] w-[42%] -translate-x-1/2 rounded-full bg-black" />

            {/* Play circle center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md"
                style={{
                  background: 'rgba(255,255,255,0.22)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.28)',
                }}
              >
                <Play className="ml-0.5 h-3.5 w-3.5 text-white" fill="white" />
              </span>
            </div>

            {/* Hook text */}
            <div className="absolute inset-x-2 top-[24%] text-center">
              <p
                className="leading-tight"
                style={{
                  color: '#D6FF3E',
                  fontFamily: "'Arial Black', Arial, sans-serif",
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: '-0.3px',
                  textShadow: '0 1px 0 rgba(0,0,0,0.35)',
                  WebkitTextStroke: '1px rgba(0,0,0,0.35)',
                }}
              >
                Most creators quit
              </p>
            </div>

            {/* Karaoke caption strip at the bottom */}
            <div
              className="absolute inset-x-2 bottom-6 flex h-6 items-center justify-center overflow-hidden rounded-md px-2"
              style={{ background: 'rgba(0,0,0,0.68)', backdropFilter: 'blur(4px)' }}
            >
              <div
                className="lv2-kara-track flex flex-col"
                style={{
                  fontFamily: "'Arial Black', Arial, sans-serif",
                  fontSize: 11,
                  fontWeight: 900,
                  lineHeight: '1em',
                  letterSpacing: '-0.3px',
                }}
              >
                {KARAOKE_WORDS.map((w, i) => (
                  <span
                    key={i}
                    style={{
                      color: i === KARAOKE_WORDS.length - 1 ? '#D6FF3E' : '#FFFFFF',
                      textTransform: 'uppercase',
                      padding: '0 3px',
                    }}
                  >
                    {w}
                  </span>
                ))}
                <span
                  style={{
                    color: '#FFFFFF',
                    textTransform: 'uppercase',
                    padding: '0 3px',
                  }}
                >
                  {KARAOKE_WORDS[0]}
                </span>
              </div>
            </div>

            {/* Home indicator */}
            <div className="absolute inset-x-0 bottom-1 flex justify-center">
              <span className="block h-[2px] w-[60px] rounded-full bg-white/75" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────

function HighlightThumb({
  clip,
  animationDelay,
}: {
  clip: ClipOutput
  animationDelay: string
}) {
  return (
    <div
      className="lv2-clip relative aspect-[9/16] overflow-hidden rounded-lg"
      style={{
        background: clip.gradient,
        boxShadow:
          '0 10px 25px -8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
        animationDelay,
      }}
    >
      {/* Film grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Subject blob */}
      <div
        className="absolute left-1/2 top-[45%] h-[45%] w-[65%] -translate-x-1/2 -translate-y-1/2 rounded-[40%] blur-md"
        style={{
          background: 'radial-gradient(ellipse, rgba(255,230,200,0.3), transparent 65%)',
        }}
      />

      {/* Platform dot top-left */}
      <span
        className="absolute left-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold"
        style={{
          background: PLATFORM_COLORS[clip.platform],
          color: clip.platform === 'TT' || clip.platform === 'X' ? '#000' : '#FFF',
        }}
        aria-hidden
      >
        {clip.platform}
      </span>

      {/* Score bottom-left */}
      <span
        className="absolute bottom-1.5 left-1.5 rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold tabular-nums"
        style={{
          background:
            clip.score >= 95 ? '#D6FF3E' : clip.score >= 85 ? '#FFFFFF' : 'rgba(0,0,0,0.5)',
          color: clip.score >= 95 ? '#1a2000' : clip.score >= 85 ? '#2A1A3D' : '#FFFFFF',
        }}
      >
        {clip.score}
      </span>

      {/* Tiny hook text center-bottom */}
      <div className="absolute inset-x-1 bottom-7 text-center">
        <p
          className="truncate leading-tight"
          style={{
            color: '#FFFFFF',
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: '-0.2px',
            textShadow: '0 1px 0 rgba(0,0,0,0.4)',
            WebkitTextStroke: '0.5px rgba(0,0,0,0.3)',
          }}
        >
          {clip.hook}
        </p>
      </div>

      {/* Clapperboard corner — tiny "rendered by Clipflow" mark */}
      <Clapperboard
        className="absolute right-1 top-1 h-2.5 w-2.5 text-white/55"
        aria-hidden
      />
    </div>
  )
}
