'use client'

import { useEffect, useRef, useState } from 'react'

interface OutputCard {
  platform: string
  /** Character count — a real metric every post has. Replaces the old
   * fake 0-100 "virality score" that implied a feature we don't ship. */
  chars: number
  hook: string
  accent: string
  border: string
  text: string
}

// Single-color palette: one primary violet, platform differentiation
// happens via the pill label alone. No rainbow of accent hues.
const OUTPUTS: OutputCard[] = [
  {
    platform: 'TikTok',
    chars: 38,
    hook: '"POV: you spend 8 hours editing one video"',
    accent: 'from-violet-50 to-white',
    border: 'border-violet-100',
    text: 'text-violet-700',
  },
  {
    platform: 'Reels',
    chars: 47,
    hook: '"The workflow saving creators 6+ hours a week"',
    accent: 'from-violet-50 to-white',
    border: 'border-violet-100',
    text: 'text-violet-700',
  },
  {
    platform: 'YouTube Shorts',
    chars: 42,
    hook: '"I automated my entire content pipeline"',
    accent: 'from-violet-50 to-white',
    border: 'border-violet-100',
    text: 'text-violet-700',
  },
  {
    platform: 'LinkedIn',
    chars: 51,
    hook: '"80% of creators waste time on distribution"',
    accent: 'from-violet-50 to-white',
    border: 'border-violet-100',
    text: 'text-violet-700',
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
      {/* Ambient violet glow under the mockup — soft, single-color.
          Replaces the old pink+violet wash. */}
      <div
        aria-hidden
        className="absolute -inset-x-20 -inset-y-10 rounded-[48px] opacity-50 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.25), transparent 70%)',
        }}
      />

      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_30px_80px_-20px_rgba(17,17,23,0.18)]">
        {/* Window chrome — light */}
        <div className="flex h-10 items-center border-b border-zinc-100 bg-zinc-50/80 px-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto flex h-6 w-60 items-center justify-center gap-1.5 rounded-md bg-white text-xs text-zinc-400 ring-1 ring-zinc-100">
            clipflow.to / workspace
          </div>
        </div>

        <div className="flex min-h-[340px]">
          {/* Sidebar — light */}
          <div className="hidden w-40 shrink-0 border-r border-zinc-100 bg-zinc-50/60 p-3 sm:block">
            {[
              ['◉', 'Dashboard'],
              ['≡', 'Drafts'],
              ['◷', 'Schedule'],
              ['✎', 'Content'],
              ['✶', 'AI Tools', true],
              ['▲', 'Analytics'],
              ['◢', 'Creators'],
            ].map(([icon, label, active]) => (
              <div
                key={String(label)}
                className={`mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs ${
                  active
                    ? 'bg-violet-100 text-violet-900'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <span className={active ? 'text-violet-600' : 'text-zinc-400'}>
                  {icon}
                </span>
                {label}
              </div>
            ))}
          </div>

          {/* Main — light */}
          <div className="flex-1 bg-white p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  Product-Demo.mp4
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  4 drafts · 24s · gpt-4o · generated in 28s
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-soft-pulse" />
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
                    <span className={`rounded-full border ${o.border} bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${o.text}`}>
                      {o.platform}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-medium text-zinc-400 tabular-nums">
                      <AnimatedScore target={o.chars} delay={150 * i + 400} />
                      <span>chars</span>
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-snug text-zinc-700">{o.hook}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
