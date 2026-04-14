'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

interface FaqItem {
  q: string
  a: string
}

const FAQ: FaqItem[] = [
  {
    q: 'What does BYOK mean and why does it matter?',
    a: 'Bring Your Own Key. You connect your own OpenAI, Anthropic or Google key. Every AI call runs through your account at the provider’s actual cost — we never add a markup. Teams typically save $200–$500/month vs. tools that bake AI into their subscription.',
  },
  {
    q: 'How is this different from OpusClip or Klap?',
    a: 'OpusClip and Klap focus on one thing: video clipping. Clipflow does that plus 30+ AI tools — content strategy, scripts, hooks, newsletters, carousels, thumbnails, creator research, brand voice training, and real MP4 rendering. One subscription, not five.',
  },
  {
    q: 'Can I render actual videos or only text?',
    a: 'Real MP4s. We render via Shotstack: burn captions, stitch B-Roll with voiceover, add brand intros/outros, auto-reframe vertical. All cloud-rendered, downloadable.',
  },
  {
    q: 'Is there a free plan, and what’s included?',
    a: '3 content items and 10 outputs per month, forever — no card required. Every AI tool, all 4 platforms, real video rendering: no features are gated by plan.',
  },
  {
    q: 'Can I use it for client work?',
    a: 'Yes. Team and Agency plans include multi-workspace dashboards, team members with roles, white-label client review portals, and an API for custom workflows.',
  },
  {
    q: 'What happens if I go over my monthly limit?',
    a: 'You’ll get a notification at 80% and 100%. Nothing breaks — existing content stays accessible. You can upgrade mid-cycle and the discount is prorated, or wait for the monthly reset.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from Billing in one click. You keep access until the end of the paid period, then your account reverts to Free — nothing is deleted.',
  },
  {
    q: 'How is my data handled?',
    a: 'Uploads are stored encrypted in your workspace. AI keys are encrypted with AES-256-GCM. We never use your content to train models — it flows directly from your account to your AI provider of choice. Full privacy policy linked below.',
  },
]

/**
 * Lightweight controlled accordion — one panel open at a time, smooth
 * height animation via the summary/details fallback-proof pattern isn't
 * used here because we want native React control for focus rings and
 * aria-expanded signaling.
 */
export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section id="faq" className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
            FAQ
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            Questions, answered.
          </h2>
        </div>

        <div className="mt-14 divide-y divide-zinc-200 border-y border-zinc-200">
          {FAQ.map((item, i) => {
            const open = openIdx === i
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left transition-colors hover:text-zinc-950"
                  aria-expanded={open}
                >
                  <span className="text-lg font-medium text-zinc-900 sm:text-xl">
                    {item.q}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white transition-all ${
                      open ? 'rotate-45 border-violet-300 bg-violet-50 text-violet-600' : 'text-zinc-400'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    open ? 'grid-rows-[1fr] pb-6' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-2xl text-base leading-relaxed text-zinc-600">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
