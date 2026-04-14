import { ShieldCheck, KeyRound, Lock, HeartHandshake } from 'lucide-react'

import { SectionBadge } from '@/components/landing/detail-primitives'

const ITEMS = [
  {
    icon: KeyRound,
    label: 'BYOK keys',
    desc: 'AI calls run through your own account, never ours.',
  },
  {
    icon: Lock,
    label: 'AES-256 encrypted',
    desc: 'Your keys are stored with per-row AES-256-GCM.',
  },
  {
    icon: ShieldCheck,
    label: 'Your data stays yours',
    desc: 'No training. No sharing. No token-scraping.',
  },
  {
    icon: HeartHandshake,
    label: 'Free forever plan',
    desc: 'No card required. Cancel paid plans any time.',
  },
]

/**
 * Quiet reassurance strip between Pricing and FAQ. Deliberately low-
 * contrast and monochrome — these are trust signals, not brag points,
 * so we don't splash violet on them.
 */
export function TrustBadges() {
  return (
    <section className="relative overflow-hidden border-y border-zinc-100 bg-zinc-50/40 px-6 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots-subtle opacity-60" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <SectionBadge number="08" label="Trust" />
            <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              Quiet signals, not promises.
            </h3>
          </div>
          <p className="max-w-sm text-sm text-zinc-500">
            We don&apos;t have SOC 2 yet — but here&apos;s how your data is actually
            handled today.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 bg-white p-5 transition-colors hover:bg-zinc-50/70"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 ring-1 ring-violet-100">
                <item.icon className="h-4 w-4 text-violet-700" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
                <p className="mt-0.5 text-xs leading-snug text-zinc-500">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
