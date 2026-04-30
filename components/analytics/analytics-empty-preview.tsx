'use client'

/**
 * Mini analytics preview shown inside the Analytics empty state.
 * Three KPI tiles + a sparkline strip + a platform bar — all built
 * from faux data with muted "—" values, so the user reads the shape
 * of the populated dashboard without being shown false numbers.
 *
 * Pure decoration: aria-hidden, no interactivity.
 */

const SPARK = [3, 5, 4, 7, 6, 9, 8, 11, 10, 13]

const PLATFORMS = [
  { name: 'TikTok', dot: 'bg-[#FF2C55]', width: 78 },
  { name: 'Reels', dot: 'bg-gradient-to-br from-[#FEDA77] via-[#F58529] to-[#DD2A7B]', width: 62 },
  { name: 'Shorts', dot: 'bg-[#FF0000]', width: 44 },
  { name: 'LinkedIn', dot: 'bg-[#0A66C2]', width: 28 },
]

export function AnalyticsEmptyPreview() {
  return (
    <div
      aria-hidden
      className="cf-analytics-preview relative space-y-3"
    >
      {/* KPI strip — three tiles with muted "—" placeholders. */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Posts', sub: 'this week' },
          { label: 'Views', sub: 'last 7d' },
          { label: 'Approval', sub: 'rate' },
        ].map((k, i) => (
          <div
            key={k.label}
            className="relative rounded-xl border border-border/50 bg-card px-3 py-2.5"
            style={{
              boxShadow:
                '0 1px 0 rgba(255,255,255,.7) inset, 0 1px 2px rgba(15,15,15,.04)',
              opacity: 1 - i * 0.08,
            }}
          >
            <p
              className="text-[9.5px] font-bold uppercase tracking-[0.2em]"
              style={{ color: '#5f5850' }}
            >
              {k.label}
            </p>
            <p
              className="lv2-tabular mt-1 text-[24px] font-bold leading-none"
              style={{ color: 'rgba(15,15,15,.45)' }}
            >
              —
            </p>
            <p
              className="mt-1 text-[10px]"
              style={{ color: 'rgba(95,88,80,.7)' }}
            >
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Sparkline strip — a faint line that "draws" left to right. */}
      <div
        className="relative rounded-xl border border-border/50 bg-card px-3 py-3"
        style={{
          boxShadow:
            '0 1px 0 rgba(255,255,255,.7) inset, 0 1px 2px rgba(15,15,15,.04)',
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: '#5f5850' }}
          >
            Velocity · 7d
          </p>
          <p
            className="lv2-tabular text-[10px]"
            style={{ color: 'rgba(95,88,80,.7)' }}
          >
            — / —
          </p>
        </div>
        <svg
          width="100%"
          height="44"
          viewBox="0 0 200 44"
          preserveAspectRatio="none"
          className="cf-analytics-spark"
        >
          <defs>
            <linearGradient id="cf-spark-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#F4D93D" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F4D93D" stopOpacity="0" />
            </linearGradient>
          </defs>
          {(() => {
            const max = Math.max(...SPARK)
            const points = SPARK.map((v, i) => {
              const x = (i / (SPARK.length - 1)) * 200
              const y = 40 - (v / max) * 36
              return `${x},${y}`
            }).join(' ')
            return (
              <>
                <polyline
                  points={`0,44 ${points} 200,44`}
                  fill="url(#cf-spark-fill)"
                />
                <polyline
                  points={points}
                  fill="none"
                  stroke="#0F0F0F"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.55"
                />
              </>
            )
          })()}
        </svg>
      </div>

      {/* Platform bars — same shape as the real Analytics page. */}
      <div
        className="relative space-y-1.5 rounded-xl border border-border/50 bg-card px-3 py-3"
        style={{
          boxShadow:
            '0 1px 0 rgba(255,255,255,.7) inset, 0 1px 2px rgba(15,15,15,.04)',
        }}
      >
        <p
          className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: '#5f5850' }}
        >
          By platform
        </p>
        {PLATFORMS.map((p, i) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${p.dot}`} />
            <span
              className="w-16 shrink-0 text-[10.5px] font-semibold"
              style={{ color: '#181511' }}
            >
              {p.name}
            </span>
            <div
              className="flex-1 overflow-hidden rounded-full"
              style={{ background: 'rgba(15,15,15,.06)', height: 6 }}
            >
              <div
                className="cf-analytics-bar h-full rounded-full"
                style={{
                  width: `${p.width}%`,
                  background:
                    'linear-gradient(90deg, rgba(15,15,15,.2), rgba(15,15,15,.45))',
                  opacity: 1 - i * 0.15,
                }}
              />
            </div>
            <span
              className="lv2-tabular w-8 shrink-0 text-right text-[10px]"
              style={{ color: 'rgba(95,88,80,.7)' }}
            >
              —
            </span>
          </div>
        ))}
      </div>
      <style jsx>{`
        /* The sparkline draws once on mount, then stays. The platform
           bars sweep in left-to-right with a tiny stagger via the
           inline opacity falloff. */
        @keyframes cf-spark-draw {
          from { stroke-dashoffset: 240; }
          to { stroke-dashoffset: 0; }
        }
        .cf-analytics-spark polyline:last-child {
          stroke-dasharray: 240;
          animation: cf-spark-draw 1.6s
            cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes cf-bar-sweep {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .cf-analytics-bar {
          transform-origin: left;
          animation: cf-bar-sweep 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)
            both;
        }
        @media (prefers-reduced-motion: reduce) {
          .cf-analytics-spark polyline:last-child,
          .cf-analytics-bar {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
