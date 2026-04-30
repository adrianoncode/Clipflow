import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'edge'

/**
 * Thumbnail generator — renders a YouTube/LinkedIn-ready thumbnail
 * on the edge from query params. No persistence layer; the URL IS
 * the thumbnail, so a client can `<img src=/api/thumbnail?title=X />`
 * to preview, or save the response as a file.
 *
 * Params:
 *   title          (required) — headline text, first 70 chars used
 *   sub            (optional) — small eyebrow above the title
 *   accent         (optional) — hex color, defaults to Clipflow lime
 *   bg             (optional) — hex color, defaults to plum
 *   logoText       (optional) — short brand name to stamp bottom-left
 *   layout         (optional) — 'yt' (16:9, 1280x720) | 'square'
 *                              (1:1, 1200x1200) | 'link' (1200x627)
 *                              defaults to 'yt'
 *   variant        (optional) — 'bold' | 'soft' | 'split' — A/B/C
 *                              layout styles
 *
 * The edge runtime has no access to our Supabase keys or user session,
 * so we don't gate this. Worst case a random person generates a
 * Clipflow-branded thumbnail on our CPU — the cost is negligible and
 * the upside (social share potential) is real.
 */
export async function GET(req: NextRequest) {
  // Public route, no auth → IP-keyed rate limit keeps Vercel edge
  // CPU costs bounded. `og/ImageResponse` is CPU-heavy so even a
  // modest burst from one client is worth capping. 60/min is enough
  // for a reasonable thumbnail-studio preview loop (user tweaks
  // headline, instant repaint) but well below a DoS curve.
  const forwardedFor = req.headers.get('x-forwarded-for') ?? ''
  const ip = forwardedFor.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(`thumb:ip:${ip}`, 60, 60_000)
  if (!rl.ok) {
    return new Response('Too many thumbnail requests', { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const title = (searchParams.get('title') ?? 'Your headline goes here').slice(0, 110)
  const sub = (searchParams.get('sub') ?? '').slice(0, 60)
  const accent = normalizeHex(searchParams.get('accent') ?? '#D6FF3E')
  const bg = normalizeHex(searchParams.get('bg') ?? '#0F0F0F')
  const logoText = (searchParams.get('logoText') ?? 'Clipflow').slice(0, 30)
  const layout = searchParams.get('layout') ?? 'yt'
  const variant = searchParams.get('variant') ?? 'bold'

  const size =
    layout === 'square'
      ? { width: 1200, height: 1200 }
      : layout === 'link'
        ? { width: 1200, height: 627 }
        : { width: 1280, height: 720 } // YouTube default

  const titleSize = variant === 'bold' ? (size.width > size.height ? 96 : 110) : 72
  const fgText = pickForeground(bg)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: bg,
          color: fgText,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: variant === 'split' ? 'flex-end' : 'center',
          padding: 72,
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Soft glow blob for depth */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            background: `${accent}22`,
            filter: 'blur(80px)',
          }}
        />

        {/* Optional eyebrow */}
        {sub ? (
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: 28,
              display: 'flex',
            }}
          >
            {sub}
          </div>
        ) : null}

        {/* Title — the star of the show */}
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: '-0.035em',
            color: fgText,
            maxWidth: '86%',
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          {variant === 'bold' ? (
            <HighlightedTitle text={title} accent={accent} accentInk={pickForeground(accent)} />
          ) : (
            title
          )}
        </div>

        {/* Brand footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 72,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: bg,
              }}
            />
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: fgText,
              display: 'flex',
            }}
          >
            {logoText}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}

/** Highlights one of the last 1-2 words with the accent color so the
 *  thumbnail always has a visual anchor. Picks the longest short word
 *  (≤ 10 chars) from the tail of the title — if none is short enough,
 *  falls back to no highlight. */
function HighlightedTitle({
  text,
  accent,
  accentInk,
}: {
  text: string
  accent: string
  accentInk: string
}) {
  const words = text.split(' ')
  // Scan backwards for a short-enough word
  let highlightIdx = -1
  for (let i = words.length - 1; i >= Math.max(0, words.length - 4); i--) {
    const w = words[i]
    if (w && w.length >= 3 && w.length <= 10) {
      highlightIdx = i
      break
    }
  }
  return (
    <>
      {words.map((w, i) => {
        const isHighlight = i === highlightIdx
        if (isHighlight) {
          return (
            <span
              key={i}
              style={{
                background: accent,
                color: accentInk,
                padding: '2px 12px',
                marginRight: 12,
                borderRadius: 10,
                display: 'flex',
              }}
            >
              {w}
            </span>
          )
        }
        return (
          <span key={i} style={{ marginRight: 18, display: 'flex' }}>
            {w}
          </span>
        )
      })}
    </>
  )
}

/** Validates + normalizes a hex input. Accepts "#xxx", "#xxxxxx", or
 *  bare "xxxxxx". Returns a safe 7-char hex string. */
function normalizeHex(input: string): string {
  const s = input.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    return `#${s
      .split('')
      .map((c) => c + c)
      .join('')}`
  }
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`
  return '#0F0F0F'
}

/** Relative-luminance based contrast pick — returns black or white
 *  whichever reads more legibly on the given background hex. */
function pickForeground(bg: string): string {
  const hex = bg.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  // Standard WCAG relative luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.55 ? '#0f0f0f' : '#ffffff'
}
