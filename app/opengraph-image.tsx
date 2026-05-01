import { ImageResponse } from 'next/og'

// Default OG card served at /opengraph-image — used as fallback for
// every page that doesn't override `metadata.openGraph.images`.
//
// Brand: Crextio charcoal (#0F0F0F) + warm yellow (#F4D93D) on paper
// (#FAF7F2). The previous version still used the old violet/pink
// gradient and looked like a different product than the in-app UI.
export const runtime = 'edge'
export const alt =
  'Clipflow — One recording. A month of posts. AI repurposing for TikTok, Reels, Shorts & LinkedIn.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#FAF7F2',
          backgroundImage:
            'radial-gradient(circle at 14% 0%, rgba(244,217,61,0.55) 0%, rgba(244,217,61,0) 55%), radial-gradient(circle at 92% 100%, rgba(15,15,15,0.10) 0%, rgba(15,15,15,0) 55%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '72px 80px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Logo lockup — charcoal tile + yellow chip, mirrors in-app brand mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#0F0F0F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                background: '#F4D93D',
              }}
            />
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#0F0F0F',
              letterSpacing: '-0.02em',
            }}
          >
            Clipflow
          </div>
        </div>

        {/* Headline — display serif voice */}
        <div
          style={{
            fontSize: 84,
            fontWeight: 400,
            color: '#0F0F0F',
            lineHeight: 1.0,
            letterSpacing: '-0.02em',
            maxWidth: 1000,
            fontFamily: '"Times New Roman", serif',
          }}
        >
          One recording.
        </div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 400,
            color: '#0F0F0F',
            lineHeight: 1.0,
            letterSpacing: '-0.02em',
            maxWidth: 1000,
            fontStyle: 'italic',
            fontFamily: '"Times New Roman", serif',
          }}
        >
          A month of posts.
        </div>

        {/* Sub */}
        <div
          style={{
            fontSize: 22,
            color: '#3a342c',
            marginTop: 28,
            lineHeight: 1.45,
            maxWidth: 760,
          }}
        >
          AI captions, brand voice, scheduling — across TikTok, Reels, Shorts, and LinkedIn.
        </div>

        {/* Platform pills — single ink+yellow vocabulary */}
        <div style={{ display: 'flex', gap: 10, marginTop: 36 }}>
          {['TikTok', 'Reels', 'Shorts', 'LinkedIn'].map((p, i) => (
            <div
              key={p}
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                fontSize: 16,
                fontWeight: 700,
                color: i === 0 ? '#1a2000' : '#0F0F0F',
                border:
                  i === 0 ? '1px solid #DCB91F' : '1px solid rgba(15,15,15,0.16)',
                background: i === 0 ? '#F4D93D' : '#FFFDF8',
              }}
            >
              {p}
            </div>
          ))}
        </div>

        {/* URL chip */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            right: 80,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#7c7468',
            fontFamily: 'monospace',
          }}
        >
          clipflow.to
        </div>
      </div>
    ),
    { ...size },
  )
}
