'use client'

/**
 * Hero phone-frame mockup — single premium iPhone-style device with
 * a realistic TikTok/Reels-style UI inside, plus two satellite
 * phones faded behind it for depth. The karaoke caption at the
 * bottom cycles word-by-word to sell the "captions burned in for
 * you" promise.
 *
 * Rewrote after the river approach — scrolling gradient tiles looked
 * cheap, even with polish. This is the OpusClip / Submagic pattern:
 * one real-looking phone, real-looking app UI, motion only where it
 * serves the story (captions animating, hook text typing). No pulsing
 * LIVE dots, no 24 variants, no film grain — restraint wins.
 *
 * All pure CSS + SVG. Zero external assets, zero JS for animation.
 */

import { Heart, MessageCircle, Share2, Music2, Play } from 'lucide-react'

// Caption words that cycle one-at-a-time in karaoke-style sync.
// Each is a single speech beat, ordered as a natural sentence.
const KARAOKE_WORDS = [
  'Most',
  'creators',
  'quit',
  'right',
  'before',
  'it',
  'clicks.',
]

// Secondary phone captions — different snippet, different hook.
const KARAOKE_WORDS_2 = ['So', 'I', 'stopped', 'editing', 'by', 'hand.']

export function HeroPhoneMockup() {
  return (
    <div className="relative mx-auto h-[640px] w-full max-w-[560px]">
      <style>{`
        /* ── Karaoke caption cycling — highlights one word at a time. */
        @keyframes lv2-karaoke-1 {
          0%,   11% { transform: translateY(0);   }
          14%,  25% { transform: translateY(-1em); }
          28%,  39% { transform: translateY(-2em); }
          42%,  53% { transform: translateY(-3em); }
          56%,  67% { transform: translateY(-4em); }
          70%,  81% { transform: translateY(-5em); }
          84%, 100% { transform: translateY(-6em); }
        }

        /* Hook text fades/slides in at ~2.5s after load then holds. */
        @keyframes lv2-hook-enter {
          0%, 10%   { opacity: 0; transform: translateY(6px) scale(0.97); }
          30%, 100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Subtle breathing on the entire hero stack — sells "alive". */
        @keyframes lv2-phone-breathe {
          0%, 100% { transform: translateY(0) rotate(var(--tilt, 0deg)); }
          50%      { transform: translateY(-4px) rotate(var(--tilt, 0deg)); }
        }

        /* Entrance — fade up with slight rotation settle. */
        @keyframes lv2-phone-enter {
          from { opacity: 0; transform: translateY(32px) rotate(calc(var(--tilt, 0deg) - 3deg)); }
          to   { opacity: 1; transform: translateY(0) rotate(var(--tilt, 0deg)); }
        }

        .lv2-phone-stack { perspective: 1400px; }

        .lv2-phone {
          animation:
            lv2-phone-enter 1s cubic-bezier(0.16, 1, 0.3, 1) both,
            lv2-phone-breathe 6s ease-in-out 1.2s infinite;
        }

        .lv2-karaoke-track {
          animation: lv2-karaoke-1 8s cubic-bezier(0.77, 0, 0.175, 1) infinite;
        }

        .lv2-hook {
          animation: lv2-hook-enter 4s cubic-bezier(0.16, 1, 0.3, 1) 1.5s both;
        }

        /* Gently shifting conic gradient — mimics live video motion. */
        @keyframes lv2-video-drift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .lv2-phone,
          .lv2-karaoke-track,
          .lv2-hook {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      {/* Ambient glow — lime to plum, sits behind all phones. */}
      <div
        className="pointer-events-none absolute left-1/2 top-[45%] h-[480px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(214,255,62,0.28) 0%, rgba(139,92,246,0.18) 40%, rgba(42,26,61,0.08) 70%, transparent 88%)',
        }}
      />

      <div className="lv2-phone-stack relative h-full w-full">
        {/* ── Satellite phone — left, smaller, tilted back, faded ── */}
        <div
          className="lv2-phone absolute"
          style={{
            ['--tilt' as string]: '-9deg',
            left: '-2%',
            top: '14%',
            width: '52%',
            filter: 'saturate(0.85) brightness(0.92)',
            opacity: 0.82,
            animationDelay: '0s, 1.6s',
            zIndex: 1,
          }}
        >
          <PhoneFrame
            gradient="linear-gradient(165deg,#0C1F3A 0%,#0E7490 55%,#06B6D4 100%)"
            hook="6 min from upload to post"
            captionWords={KARAOKE_WORDS_2}
            platform="REELS"
            username="clipflow.user"
            muted
          />
        </div>

        {/* ── Satellite phone — right, smaller, tilted forward, faded ── */}
        <div
          className="lv2-phone absolute"
          style={{
            ['--tilt' as string]: '8deg',
            right: '-4%',
            top: '20%',
            width: '48%',
            filter: 'saturate(0.85) brightness(0.9)',
            opacity: 0.72,
            animationDelay: '0.15s, 1.8s',
            zIndex: 1,
          }}
        >
          <PhoneFrame
            gradient="linear-gradient(150deg,#3A1F1A 0%,#C2410C 45%,#F59E0B 100%)"
            hook="Nobody tells you this"
            captionWords={['Then', 'I', 'tried', 'it']}
            platform="SHORTS"
            username="clipflow.user"
            muted
          />
        </div>

        {/* ── Hero phone — center, front, sharpest ── */}
        <div
          className="lv2-phone absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            ['--tilt' as string]: '-1.5deg',
            width: '58%',
            zIndex: 2,
            animationDelay: '0.3s, 2s',
          }}
        >
          <PhoneFrame
            gradient="linear-gradient(135deg,#1F0A2E 0%,#2A1A3D 35%,#5B3A8E 75%,#8E3A5B 100%)"
            hook="Most creators quit"
            captionWords={KARAOKE_WORDS}
            platform="TIKTOK"
            username="clipflow.app"
            primary
          />
        </div>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────
// PhoneFrame — iOS-style bezel + screen + in-app UI
// ───────────────────────────────────────────────────────────────

function PhoneFrame({
  gradient,
  hook,
  captionWords,
  platform,
  username,
  primary = false,
  muted = false,
}: {
  gradient: string
  hook: string
  captionWords: string[]
  platform: 'TIKTOK' | 'REELS' | 'SHORTS'
  username: string
  primary?: boolean
  muted?: boolean
}) {
  return (
    <div
      className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[38px]"
      style={{
        background: '#0a0a0b',
        // iPhone-esque bezel feel: inner shadow for depth, outer for lift.
        boxShadow: primary
          ? `
            0 40px 80px -20px rgba(42,26,61,0.55),
            0 20px 40px -15px rgba(42,26,61,0.4),
            0 0 0 1.5px rgba(0,0,0,0.15),
            inset 0 0 0 8px #0a0a0b,
            inset 0 0 0 9px rgba(255,255,255,0.06)
          `
          : `
            0 25px 55px -15px rgba(42,26,61,0.35),
            0 0 0 1px rgba(0,0,0,0.12),
            inset 0 0 0 6px #0a0a0b
          `,
      }}
    >
      {/* ── Screen area ── */}
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          background: gradient,
          animation: 'lv2-video-drift 20s ease-in-out infinite',
          backgroundSize: '140% 140%',
        }}
      >
        {/* Subtle vignette so the bezel edges feel optically darker */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)',
          }}
        />

        {/* iPhone notch — pill-shaped, center-top */}
        <div
          className="absolute left-1/2 top-2 z-30 h-[22px] w-[32%] -translate-x-1/2 rounded-full bg-black"
        />

        {/* Status bar row — time left, signal/wifi/battery right */}
        <div className="absolute inset-x-0 top-0 z-20 flex h-8 items-center justify-between px-5 pt-1 text-[10px] font-semibold text-white">
          <span className="tracking-tight">9:41</span>
          <div className="flex items-center gap-1">
            {/* Signal bars */}
            <span className="flex items-end gap-[1.5px]">
              <span className="block h-[3px] w-[2px] rounded-sm bg-white" />
              <span className="block h-[5px] w-[2px] rounded-sm bg-white" />
              <span className="block h-[7px] w-[2px] rounded-sm bg-white" />
              <span className="block h-[9px] w-[2px] rounded-sm bg-white" />
            </span>
            {/* Wifi */}
            <span className="text-[9px]">􀙇</span>
            {/* Battery */}
            <span className="ml-0.5 inline-flex h-[10px] w-[20px] items-center rounded-[3px] border border-white/90 px-[2px]">
              <span className="block h-full w-[70%] rounded-[1px] bg-white" />
            </span>
          </div>
        </div>

        {/* Platform badge (small, upper-left, top-of-video style) */}
        <div
          className="absolute left-4 top-12 z-20 rounded-md px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.15em] backdrop-blur-sm"
          style={{
            background: 'rgba(0,0,0,0.55)',
            color: platform === 'TIKTOK' ? '#FFFFFF' : platform === 'REELS' ? '#FFE600' : '#D6FF3E',
          }}
        >
          {platform === 'TIKTOK' ? 'FOR YOU' : platform === 'REELS' ? 'REELS' : 'SHORTS'}
        </div>

        {/* ── Center play button (secondary phones only) ── */}
        {!primary ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md"
              style={{
                background: 'rgba(255,255,255,0.22)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.25)',
              }}
            >
              <Play className="h-5 w-5 text-white" fill="white" />
            </span>
          </div>
        ) : null}

        {/* ── Hook overlay (only on primary phone) ── */}
        {primary ? (
          <div className="lv2-hook absolute inset-x-6 top-[24%] z-10 text-center">
            <p
              className="leading-[1.05]"
              style={{
                color: '#D6FF3E',
                fontFamily: "'Arial Black', Arial, sans-serif",
                fontSize: 'clamp(22px, 3.8vw, 34px)',
                fontWeight: 900,
                letterSpacing: '-0.4px',
                textShadow:
                  '0 2px 0 rgba(0,0,0,0.3), 0 0 24px rgba(214,255,62,0.35)',
                WebkitTextStroke: '1.5px rgba(0,0,0,0.38)',
              }}
            >
              {hook}
            </p>
          </div>
        ) : (
          <div className="absolute inset-x-5 top-[30%] z-10 text-center">
            <p
              className="leading-[1.05]"
              style={{
                color: '#FFFFFF',
                fontFamily: "'Arial Black', Arial, sans-serif",
                fontSize: 'clamp(14px, 2.4vw, 20px)',
                fontWeight: 900,
                letterSpacing: '-0.2px',
                textShadow: '0 2px 0 rgba(0,0,0,0.3)',
                WebkitTextStroke: '1px rgba(0,0,0,0.35)',
                opacity: 0.92,
              }}
            >
              {hook}
            </p>
          </div>
        )}

        {/* ── Right-rail interaction UI (TikTok-style) ── */}
        <div className="absolute bottom-24 right-3 z-20 flex flex-col items-center gap-4">
          {/* Profile avatar — tiny circle with subscribe plus */}
          <div className="relative">
            <div
              className="h-9 w-9 rounded-full"
              style={{
                background:
                  'linear-gradient(135deg, #D6FF3E 0%, #F59E0B 100%)',
                boxShadow: '0 0 0 2px #FFFFFF',
              }}
            />
            <span
              className="absolute -bottom-1.5 left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full"
              style={{ background: '#FF2D55', color: 'white', fontSize: 10, fontWeight: 700 }}
            >
              +
            </span>
          </div>

          {/* Like */}
          <div className="flex flex-col items-center">
            <Heart className="h-7 w-7 text-white drop-shadow" fill="white" />
            <span className="font-mono text-[10px] font-semibold text-white/95">
              {primary ? '12.4K' : '3.2K'}
            </span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center">
            <MessageCircle className="h-7 w-7 text-white drop-shadow" />
            <span className="font-mono text-[10px] font-semibold text-white/95">
              {primary ? '487' : '92'}
            </span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center">
            <Share2 className="h-7 w-7 text-white drop-shadow" />
            <span className="font-mono text-[10px] font-semibold text-white/95">
              Share
            </span>
          </div>

          {/* Music disc */}
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{
              background: 'linear-gradient(135deg, #111, #333)',
              boxShadow: '0 0 0 2px rgba(255,255,255,0.2)',
            }}
          >
            <Music2 className="h-4 w-4 text-white/80" />
          </div>
        </div>

        {/* ── Bottom caption + creator info (TikTok-style) ── */}
        <div className="absolute inset-x-4 bottom-8 z-10">
          <p className="text-[13px] font-bold text-white drop-shadow">@{username}</p>
          <p className="mt-1 text-[11px] leading-snug text-white/90 drop-shadow">
            {primary
              ? 'Made with Clipflow in 6 min 🎬'
              : 'From a 40-min podcast → 8 posts'}
          </p>

          {/* Karaoke caption — single word highlighted, mask-based cycling */}
          {primary ? (
            <div
              className="mt-3 flex h-8 items-center justify-center overflow-hidden rounded-md px-3"
              style={{
                background: 'rgba(0,0,0,0.62)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <div
                className="lv2-karaoke-track flex flex-col"
                style={{
                  fontFamily: "'Arial Black', Arial, sans-serif",
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: '-0.3px',
                  lineHeight: '1em',
                }}
              >
                {captionWords.map((word, i) => (
                  <span
                    key={i}
                    style={{
                      color: i === captionWords.length - 1 ? '#D6FF3E' : '#FFFFFF',
                      textTransform: 'uppercase',
                      padding: '0 4px',
                    }}
                  >
                    {word}
                  </span>
                ))}
                {/* Dupe first for clean loop */}
                <span
                  style={{
                    color: '#FFFFFF',
                    textTransform: 'uppercase',
                    padding: '0 4px',
                  }}
                >
                  {captionWords[0]}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Home indicator pill ── */}
        <div className="absolute inset-x-0 bottom-1.5 z-30 flex justify-center">
          <span className="block h-[3px] w-[120px] rounded-full bg-white/85" />
        </div>

        {/* Mute badge for secondary phones */}
        {muted ? (
          <div
            className="absolute bottom-12 left-3 z-20 flex h-6 w-6 items-center justify-center rounded-full"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          </div>
        ) : null}
      </div>
    </div>
  )
}
