'use client'

import {
  Captions,
  Crop,
  Film,
  Languages,
  UserRound,
} from 'lucide-react'

/**
 * Lightweight visual placeholders for the five video-production
 * feature pages (Auto-Subtitles, Auto-Reframe, B-Roll, AI Avatar,
 * Auto-Dub). Each one renders a small mock that echoes what the
 * feature does \u2014 a fake caption stack, a crop-guide overlay, a
 * B-Roll grid, etc. \u2014 without depending on external assets.
 *
 * All five use the same outer card treatment for a consistent
 * rhythm across the /features/* detail pages.
 */

// ---------------------------------------------------------------------------
// Auto-Subtitles — four caption style mocks
// ---------------------------------------------------------------------------
export function AutoSubtitlesVisual() {
  const STYLES = [
    {
      id: 'tiktok',
      label: 'TikTok Bold',
      sample: 'STOP',
      bg: '#0a0a0b',
      fg: '#FFFFFF',
      stroke: '4px #000000',
      font: "'Arial Black', Arial",
      size: '32px',
    },
    {
      id: 'minimal',
      label: 'Minimal',
      sample: 'clean \u00b7 simple',
      bg: '#181511',
      fg: '#FFFFFF',
      stroke: 'none',
      font: 'Arial',
      size: '18px',
    },
    {
      id: 'neon',
      label: 'Neon Yellow',
      sample: 'GLOW',
      bg: '#0a0a0b',
      fg: '#FFE600',
      stroke: 'none',
      font: "'Arial Black', Arial",
      size: '30px',
    },
    {
      id: 'whitebar',
      label: 'White Bar',
      sample: 'clear',
      bg: '#181511',
      fg: '#FFFFFF',
      stroke: 'none',
      font: 'Arial',
      size: '20px',
      chip: true,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: 'var(--lv2-primary, #2A1A3D)' }}
        >
          <Captions className="h-3.5 w-3.5" style={{ color: 'var(--lv2-accent, #D6FF3E)' }} />
        </span>
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--lv2-muted, #5f5850)' }}
        >
          Four caption styles \u00b7 word-level sync
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {STYLES.map((s) => (
          <div
            key={s.id}
            className="flex aspect-video items-center justify-center overflow-hidden rounded-lg"
            style={{ background: s.bg }}
          >
            <div className="relative flex h-full w-full flex-col items-center justify-end pb-3">
              {s.chip ? (
                <span
                  className="rounded-md px-2 py-1"
                  style={{
                    background: 'rgba(0,0,0,.7)',
                    color: s.fg,
                    fontFamily: s.font,
                    fontSize: s.size,
                    fontWeight: 700,
                  }}
                >
                  {s.sample}
                </span>
              ) : (
                <span
                  style={{
                    color: s.fg,
                    fontFamily: s.font,
                    fontSize: s.size,
                    fontWeight: s.id === 'minimal' ? 500 : 900,
                    WebkitTextStroke: s.stroke === 'none' ? undefined : s.stroke,
                    letterSpacing: '-0.5px',
                  }}
                >
                  {s.sample}
                </span>
              )}
              <span
                className="absolute left-2 top-2 font-mono text-[8px] uppercase"
                style={{ color: 'rgba(255,255,255,.45)', letterSpacing: '0.1em' }}
              >
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Auto-Reframe — 16:9 source with 9:16 crop guide
// ---------------------------------------------------------------------------
export function AutoReframeVisual() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: 'var(--lv2-primary, #2A1A3D)' }}
        >
          <Crop className="h-3.5 w-3.5" style={{ color: 'var(--lv2-accent, #D6FF3E)' }} />
        </span>
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--lv2-muted, #5f5850)' }}
        >
          Face-tracked 9:16 crop
        </p>
      </div>
      <div
        className="relative aspect-video overflow-hidden rounded-xl"
        style={{
          background:
            'linear-gradient(135deg, rgba(42,26,61,.88), rgba(42,26,61,.55)), radial-gradient(circle at 30% 50%, rgba(214,255,62,.15), transparent 60%)',
        }}
      >
        {/* Faux face marker */}
        <div
          className="absolute h-14 w-14 rounded-full"
          style={{
            left: '22%',
            top: '38%',
            background: 'radial-gradient(circle, rgba(255,221,180,.4), transparent 70%)',
            boxShadow: '0 0 0 2px rgba(255,255,255,.15)',
          }}
        />
        {/* 9:16 crop window — offset left to match face */}
        <div
          className="pointer-events-none absolute inset-y-0 border-2"
          style={{
            left: '9%',
            width: '31.64%',
            borderColor: 'var(--lv2-accent, #D6FF3E)',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.25)',
          }}
        />
        {/* Darkened zones outside crop */}
        <div
          className="absolute inset-y-0 left-0 bg-black/55"
          style={{ width: '9%' }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-black/55"
          style={{ width: `${100 - 9 - 31.64}%` }}
        />
        {/* Chip label */}
        <span
          className="absolute right-3 top-3 rounded-md px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em]"
          style={{
            background: 'rgba(0,0,0,.7)',
            color: 'var(--lv2-accent, #D6FF3E)',
          }}
        >
          9:16 \u00b7 drag to override
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// B-Roll — 6-cell grid of placeholder thumbnails
// ---------------------------------------------------------------------------
export function BRollVisual() {
  const TILES = [
    { hue: '#2A1A3D', topic: 'laptop' },
    { hue: '#5B3A8E', topic: 'coffee shop' },
    { hue: '#1A4D3A', topic: 'walking' },
    { hue: '#8E3A5B', topic: 'whiteboard' },
    { hue: '#3A5B8E', topic: 'headphones' },
    { hue: '#8E5B3A', topic: 'handwriting' },
  ]
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: 'var(--lv2-primary, #2A1A3D)' }}
        >
          <Film className="h-3.5 w-3.5" style={{ color: 'var(--lv2-accent, #D6FF3E)' }} />
        </span>
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--lv2-muted, #5f5850)' }}
        >
          Transcript-matched Pexels stock
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {TILES.map((t, i) => (
          <div
            key={t.topic}
            className="relative flex aspect-[9/16] items-end overflow-hidden rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${t.hue}, ${t.hue}88), radial-gradient(circle at 50% 30%, rgba(255,255,255,.08), transparent 60%)`,
            }}
          >
            <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[8px] font-bold text-white">
              0:{10 + i * 3}s
            </span>
            <span
              className="mx-1.5 mb-1.5 truncate rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-medium text-white/90 backdrop-blur-sm"
            >
              {t.topic}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AI Avatar — presenter picker mock
// ---------------------------------------------------------------------------
export function AIAvatarVisual() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: 'var(--lv2-primary, #2A1A3D)' }}
        >
          <UserRound className="h-3.5 w-3.5" style={{ color: 'var(--lv2-accent, #D6FF3E)' }} />
        </span>
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--lv2-muted, #5f5850)' }}
        >
          D-ID talking-head \u00b7 script \u2192 MP4
        </p>
      </div>
      <div
        className="relative overflow-hidden rounded-xl p-4"
        style={{
          background: 'var(--lv2-bg-2, #F3EDE3)',
          border: '1px solid var(--lv2-border, rgba(0,0,0,.08))',
        }}
      >
        {/* Script preview */}
        <p
          className="mb-3 text-[12px] italic leading-relaxed"
          style={{ color: 'var(--lv2-muted, #5f5850)' }}
        >
          &ldquo;This week we shipped Viral Moments \u2014 drop a 60-minute recording
          and get the 5 clips worth posting, scored and captioned\u2026&rdquo;
        </p>
        {/* Presenter thumbs */}
        <div className="grid grid-cols-4 gap-2">
          {[
            'linear-gradient(135deg,#2A1A3D,#5B3A8E)',
            'linear-gradient(135deg,#8E3A5B,#2A1A3D)',
            'linear-gradient(135deg,#1A4D3A,#5B3A8E)',
            'linear-gradient(135deg,#3A5B8E,#2A1A3D)',
          ].map((g, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-lg"
              style={{ background: g }}
            >
              {i === 0 ? (
                <span
                  className="absolute inset-x-0 bottom-0 bg-[var(--lv2-accent,#D6FF3E)] py-0.5 text-center font-mono text-[8px] font-bold uppercase"
                  style={{ color: 'var(--lv2-accent-ink, #1a2000)' }}
                >
                  Selected
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Auto-Dub — language picker + waveform
// ---------------------------------------------------------------------------
export function AutoDubVisual() {
  const LANGS = [
    { flag: '\ud83c\uddea\ud83c\uddf8', code: 'ES', active: true },
    { flag: '\ud83c\udde9\ud83c\uddea', code: 'DE', active: false },
    { flag: '\ud83c\uddeb\ud83c\uddf7', code: 'FR', active: false },
    { flag: '\ud83c\uddf5\ud83c\uddf9', code: 'PT', active: false },
    { flag: '\ud83c\uddef\ud83c\uddf5', code: 'JA', active: false },
    { flag: '\ud83c\uddf0\ud83c\uddf7', code: 'KO', active: false },
    { flag: '\ud83c\udde8\ud83c\uddf3', code: 'ZH', active: false },
  ]
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: 'var(--lv2-primary, #2A1A3D)' }}
        >
          <Languages className="h-3.5 w-3.5" style={{ color: 'var(--lv2-accent, #D6FF3E)' }} />
        </span>
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--lv2-muted, #5f5850)' }}
        >
          ElevenLabs voice-matched dub
        </p>
      </div>
      <div
        className="rounded-xl p-4"
        style={{
          background: 'var(--lv2-bg-2, #F3EDE3)',
          border: '1px solid var(--lv2-border, rgba(0,0,0,.08))',
        }}
      >
        {/* Language chips */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {LANGS.map((l) => (
            <span
              key={l.code}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10.5px] font-bold"
              style={{
                background: l.active ? 'var(--lv2-primary, #2A1A3D)' : 'var(--lv2-card, #FFFDF8)',
                color: l.active ? 'var(--lv2-accent, #D6FF3E)' : 'var(--lv2-muted, #5f5850)',
                border: '1px solid var(--lv2-border, rgba(0,0,0,.08))',
              }}
            >
              <span aria-hidden>{l.flag}</span>
              {l.code}
            </span>
          ))}
        </div>
        {/* Waveform mock */}
        <div className="flex h-10 items-end gap-0.5 px-1">
          {Array.from({ length: 48 }).map((_, i) => (
            <span
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${20 + Math.sin(i * 0.6) * 20 + Math.cos(i * 0.3) * 15 + 25}%`,
                background:
                  i < 20
                    ? 'var(--lv2-primary, #2A1A3D)'
                    : 'var(--lv2-muted, #5f5850)',
                opacity: i < 20 ? 1 : 0.3,
              }}
            />
          ))}
        </div>
        <p
          className="mt-2 font-mono text-[9.5px]"
          style={{ color: 'var(--lv2-muted, #5f5850)' }}
        >
          ORIGINAL \u2192 DUBBED \u00b7 TIMBRE PRESERVED
        </p>
      </div>
    </div>
  )
}
