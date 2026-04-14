'use client'

import { useEffect, useRef, useState } from 'react'

interface OutputCard {
  platform: string
  score: number
  hook: string
  accent: string
  border: string
  text: string
}

const OUTPUTS: OutputCard[] = [
  {
    platform: 'TikTok',
    score: 94,
    hook: '"POV: You spend 8 hours editing one video 😭"',
    accent: 'from-pink-500/20 to-pink-500/5',
    border: 'border-pink-500/25',
    text: 'text-pink-300',
  },
  {
    platform: 'Reels',
    score: 89,
    hook: '"The workflow saving creators 6+ hours a week"',
    accent: 'from-fuchsia-500/20 to-fuchsia-500/5',
    border: 'border-fuchsia-500/25',
    text: 'text-fuchsia-300',
  },
  {
    platform: 'YouTube Shorts',
    score: 85,
    hook: '"I automated my entire content pipeline"',
    accent: 'from-red-500/20 to-red-500/5',
    border: 'border-red-500/25',
    text: 'text-red-300',
  },
  {
    platform: 'LinkedIn',
    score: 81,
    hook: '"80% of creators waste time on distribution"',
    accent: 'from-sky-500/20 to-sky-500/5',
    border: 'border-sky-500/25',
    text: 'text-sky-300',
  },
]

/**
 * Counts up from 0 to `target` with ease-out-cubic, triggered when the
 * element enters the viewport (so users on long pages see the animation
 * every time, not just on initial load).
 */
function AnimatedScore({ target, delay }: { target: number; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setValue(target)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        io.disconnect()
        const duration = 1200
        const start = performance.now() + delay
        let raf = 0
        const tick = (now: number) => {
          if (now < start) {
            raf = requestAnimationFrame(tick)
            return
          }
          const t = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - t, 3)
          setValue(Math.round(target * eased))
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
      },
      { threshold: 0.4 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [target, delay])

  return <span ref={ref}>{value}</span>
}

/**
 * Animated version of the static hero mockup. The window + sidebar
 * render immediately, the 4 output cards fade-up in sequence (staggered
 * 150 ms apart), and each score counter eases from 0 to its target as
 * soon as the mockup is in view. Status dot pulses softly the whole time.
 */
export function AnimatedHeroMockup() {
  return (
    <div className="relative">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute -inset-x-20 -inset-y-10 rounded-[48px] opacity-60 blur-3xl"
        style={{
          background:
            'linear-gradient(90deg, rgba(124, 58, 237, 0.3), rgba(236, 72, 153, 0.2))',
        }}
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        {/* Window chrome */}
        <div className="flex h-10 items-center border-b border-white/5 bg-zinc-900/80 px-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto flex h-6 w-60 items-center justify-center gap-1.5 rounded-md bg-white/5 text-xs text-white/30">
            clipflow.to / workspace
          </div>
        </div>

        <div className="flex min-h-[340px]">
          {/* Sidebar */}
          <div className="hidden w-40 shrink-0 border-r border-white/5 bg-[#0b0b10] p-3 sm:block">
            {[
              ['◉', 'Dashboard'],
              ['≡', 'Pipeline'],
              ['◷', 'Calendar'],
              ['✎', 'Ghostwriter'],
              ['✶', 'All Tools', true],
              ['▲', 'Trends'],
              ['◢', 'Creators'],
            ].map(([icon, label, active]) => (
              <div
                key={String(label)}
                className={`mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs ${
                  active
                    ? 'bg-violet-500/10 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <span className={active ? 'text-violet-400' : 'text-white/30'}>
                  {icon}
                </span>
                {label}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 bg-gradient-to-br from-[#0b0b10] to-[#07070a] p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Product-Demo.mp4</p>
                <p className="mt-1 text-xs text-white/40">
                  4 drafts · 24s · gpt-4o · generated in 28s
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-soft-pulse" />
                Live
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {OUTPUTS.map((o, i) => (
                <div
                  key={o.platform}
                  className={`animate-fade-up rounded-lg border ${o.border} bg-gradient-to-br ${o.accent} p-3`}
                  style={{ animationDelay: `${150 * i + 200}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full border ${o.border} bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${o.text}`}>
                      {o.platform}
                    </span>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        o.score > 88 ? 'text-emerald-300' : 'text-amber-300'
                      }`}
                    >
                      <AnimatedScore target={o.score} delay={150 * i + 400} />
                      <span className="text-[9px] font-medium text-white/30">/100</span>
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-snug text-white/70">{o.hook}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
