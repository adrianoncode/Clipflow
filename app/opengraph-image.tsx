import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Clipflow — AI Video Repurposing'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #030304 0%, #0f0520 50%, #030304 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 500,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(42,26,61,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: 16,
          }}
        >
          Clipflow
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: 800,
          }}
        >
          One video.{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #ec4899, #f97316)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Every platform.
          </span>
        </div>

        {/* Sub */}
        <div
          style={{
            fontSize: 22,
            color: 'rgba(255,255,255,0.5)',
            marginTop: 20,
            textAlign: 'center',
            maxWidth: 600,
          }}
        >
          AI video repurposing with real video rendering. 25+ AI tools. Zero markup.
        </div>

        {/* Platform pills */}
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          {[
            { name: 'TikTok', color: '#ec4899' },
            { name: 'Reels', color: '#a855f7' },
            { name: 'Shorts', color: '#ef4444' },
            { name: 'LinkedIn', color: '#3b82f6' },
          ].map((p) => (
            <div
              key={p.name}
              style={{
                padding: '8px 20px',
                borderRadius: 999,
                fontSize: 16,
                fontWeight: 600,
                color: p.color,
                border: `2px solid ${p.color}33`,
                background: `${p.color}15`,
              }}
            >
              {p.name}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 16,
            color: 'rgba(255,255,255,0.25)',
          }}
        >
          clipflow.to
        </div>
      </div>
    ),
    { ...size },
  )
}
