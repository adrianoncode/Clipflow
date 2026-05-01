import { ImageResponse } from 'next/og'

/**
 * Apple touch icon — served at /apple-icon.png by Next's metadata API.
 * Used by iOS / iPadOS for Add-to-Home-Screen and by macOS Safari for
 * pinned tabs. 180×180 is the canonical size; iOS scales down for
 * smaller breakpoints automatically.
 *
 * Why generated and not a static PNG: keeps the brand mark in one
 * place — the same charcoal-tile + yellow-chip lockup as the OG card
 * and the in-app sidebar. Ship a static asset only if we ever need
 * a non-default mask shape (rare).
 */
export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0F0F0F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 36,
        }}
      >
        <div
          style={{
            width: 78,
            height: 78,
            borderRadius: 16,
            background: '#F4D93D',
          }}
        />
      </div>
    ),
    { ...size },
  )
}
