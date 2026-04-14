import { ShieldCheck, KeyRound, Lock, HeartHandshake } from 'lucide-react'

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
    <section className="border-y border-zinc-100 bg-zinc-50/40 px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {ITEMS.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-zinc-200">
                <item.icon className="h-4.5 w-4.5 text-zinc-700" />
              </span>
              <div>
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
