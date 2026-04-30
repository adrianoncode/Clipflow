'use client'

/**
 * Mini calendar-strip preview shown inside the Schedule empty state.
 * Three days of the upcoming week with two faux scheduled posts —
 * one TikTok, one Reel — sitting in their time slots. Reads "this is
 * what your week will look like once you approve a draft" instead of
 * a generic empty paragraph.
 *
 * The first slot pulses lime so the eye lands on "this is alive".
 * Pure decoration: aria-hidden, no interactivity.
 */

const PLATFORM_DOTS: Record<string, string> = {
  TikTok: 'bg-[#FF2C55]',
  Reels: 'bg-gradient-to-br from-[#FEDA77] via-[#F58529] to-[#DD2A7B]',
  YouTube: 'bg-[#FF0000]',
  LinkedIn: 'bg-[#0A66C2]',
  X: 'bg-[#0F1419]',
}

const DAYS = [
  {
    day: 'Mon',
    date: '14',
    posts: [
      { time: '09:30', platform: 'TikTok', title: 'Hook variant — "The 3 metrics…"', pulse: true },
    ],
  },
  {
    day: 'Tue',
    date: '15',
    posts: [
      { time: '12:00', platform: 'Reels', title: 'Carousel — onboarding', pulse: false },
      { time: '17:45', platform: 'LinkedIn', title: 'Thread — pricing change', pulse: false },
    ],
  },
  {
    day: 'Wed',
    date: '16',
    posts: [],
  },
]

export function ScheduleEmptyPreview() {
  return (
    <div
      aria-hidden
      className="cf-schedule-preview relative overflow-hidden rounded-2xl border border-border/60 p-3"
      style={{
        background: 'linear-gradient(180deg, #FFFDF8 0%, #F3EDE3 100%)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,.7) inset, 0 1px 2px rgba(15,15,15,.04), 0 14px 32px -18px rgba(15,15,15,.18)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(15,15,15,.32), transparent)',
        }}
      />
      <p
        className="mb-3 inline-flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-[0.22em]"
        style={{
          color: '#5f5850',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
        }}
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{
            background: '#F4D93D',
            boxShadow: '0 0 8px rgba(214,255,62,.7)',
          }}
        />
        This week, automated
      </p>
      <div className="grid grid-cols-3 gap-2">
        {DAYS.map((d) => (
          <div
            key={d.day}
            className="rounded-xl border border-border/40 bg-card/70 p-2"
            style={{ minHeight: 132 }}
          >
            <div className="mb-2 flex items-baseline justify-between px-0.5">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ color: '#5f5850' }}
              >
                {d.day}
              </span>
              <span
                className="lv2-tabular text-[14px] font-bold"
                style={{ color: '#0F0F0F' }}
              >
                {d.date}
              </span>
            </div>
            <div className="space-y-1.5">
              {d.posts.length === 0 ? (
                <div
                  className="flex h-[88px] items-center justify-center rounded-lg"
                  style={{
                    background:
                      'repeating-linear-gradient(135deg, transparent 0 6px, rgba(15,15,15,.04) 6px 7px)',
                    border: '1px dashed rgba(15,15,15,.15)',
                  }}
                >
                  <span
                    className="text-[10px]"
                    style={{ color: 'rgba(95,88,80,.55)' }}
                  >
                    open
                  </span>
                </div>
              ) : (
                d.posts.map((p, i) => (
                  <div
                    key={i}
                    className={`relative rounded-lg border border-border/50 bg-card px-2 py-1.5 ${
                      p.pulse ? 'cf-schedule-preview-pulse' : ''
                    }`}
                    style={{
                      boxShadow:
                        '0 1px 0 rgba(255,255,255,.55) inset, 0 1px 2px rgba(24,21,17,.04)',
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          PLATFORM_DOTS[p.platform] ?? 'bg-zinc-400'
                        }`}
                      />
                      <span
                        className="lv2-tabular text-[10px] font-bold"
                        style={{
                          color: '#5f5850',
                          fontFamily:
                            'var(--font-jetbrains-mono), monospace',
                        }}
                      >
                        {p.time}
                      </span>
                    </div>
                    <p
                      className="mt-1 line-clamp-2 text-[10.5px] font-semibold leading-tight"
                      style={{ color: '#181511' }}
                    >
                      {p.title}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes cf-schedule-pulse {
          0%,
          100% {
            box-shadow:
              0 1px 0 rgba(255, 255, 255, 0.55) inset,
              0 1px 2px rgba(24, 21, 17, 0.04);
          }
          50% {
            box-shadow:
              0 1px 0 rgba(255, 255, 255, 0.55) inset,
              0 0 0 1px rgba(214, 255, 62, 0.45),
              0 0 14px -2px rgba(214, 255, 62, 0.4);
          }
        }
        .cf-schedule-preview-pulse {
          animation: cf-schedule-pulse 2.6s
            cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cf-schedule-preview-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
