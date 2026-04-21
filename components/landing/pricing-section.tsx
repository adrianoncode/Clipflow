'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

import { SpotlightCard } from '@/components/landing/spotlight-card'
import { SectionBadge } from '@/components/landing/detail-primitives'

interface Plan {
  id: string
  name: string
  description: string
  monthly: number
  annual: number
  features: string[]
  highlight?: boolean
  ctaLabel?: string
}

// Three public tiers, two ICPs. Keep feature bullets creator-friendly —
// this is a marketing surface, not a spec sheet.
const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Kick the tires, no card.',
    monthly: 0,
    annual: 0,
    features: [
      '3 videos / month',
      '10 posts / month',
      '1 workspace',
      'All AI writing tools',
      'No scheduling',
    ],
    ctaLabel: 'Get started',
  },
  {
    id: 'solo',
    name: 'Creator',
    description: 'For indie creators shipping weekly.',
    monthly: 29,
    annual: 19,
    features: [
      '30 videos / month',
      '150 posts / month',
      'Schedule + auto-publish to 4 platforms',
      'A/B hook testing',
      'Creator research',
      'B-roll automation',
      'Custom branding',
    ],
    highlight: true,
    ctaLabel: 'Start free trial',
  },
  {
    id: 'agency',
    name: 'Studio',
    description: 'For social-media managers with clients.',
    monthly: 99,
    annual: 79,
    features: [
      'Unlimited videos + posts',
      'One workspace per client',
      'Team seats with roles',
      'Client review links (white-label)',
      'AI avatars + auto-dub',
      'Voice cloning',
      'Priority renders',
    ],
    ctaLabel: 'Start free trial',
  },
]

interface PricingSectionProps {
  signupHref: string
}

/**
 * Pricing grid with a monthly ↔ annual toggle. Annual pricing is the
 * effective monthly rate when billed yearly (reflects the 20 % annual
 * discount baked into the real Stripe prices).
 */
export function PricingSection({ signupHref }: PricingSectionProps) {
  const [interval, setInterval] = useState<'monthly' | 'annual'>('annual')

  return (
    <section id="pricing" className="relative bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Eyebrow + headline */}
        <div className="mx-auto max-w-2xl text-center">
          <SectionBadge number="07" label="Pricing" className="justify-center" />
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
            Start free.{' '}
            <span className="italic text-zinc-400">Scale when ready.</span>
          </h2>
          <p className="mt-4 text-lg text-zinc-500 sm:text-xl">
            BYOK — pay your AI provider at cost. We take zero markup on tokens.
          </p>
        </div>

        {/* Toggle */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50/60 p-1 text-sm font-medium shadow-sm">
            <button
              type="button"
              onClick={() => setInterval('monthly')}
              className={`rounded-full px-5 py-2 transition-all ${
                interval === 'monthly'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval('annual')}
              className={`rounded-full px-5 py-2 transition-all ${
                interval === 'annual'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Annual
              <span className="ml-2 rounded-full bg-[#E3F59D] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#495C0F]">
                −20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const price = interval === 'annual' ? plan.annual : plan.monthly
            return (
              <SpotlightCard
                key={plan.id}
                className="h-full rounded-2xl"
                color={plan.highlight ? 'rgba(214,255,62,0.18)' : 'rgba(42, 26, 61, 0.10)'}
                size={400}
              >
              <div
                className={`relative flex h-full flex-col rounded-2xl p-8 transition-all ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-[#2A1A3D] to-[#120920] text-white shadow-2xl shadow-[#2A1A3D]/25'
                    : 'border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md'
                }`}
              >
                {plan.highlight ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#D6FF3E] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1a2000] shadow-lg shadow-[#2A1A3D]/30">
                    Most popular
                  </div>
                ) : null}

                <div className="flex-1">
                  <h3 className={`text-base font-semibold ${plan.highlight ? 'text-white' : 'text-zinc-950'}`}>
                    {plan.name}
                  </h3>
                  <p className={`mt-1 text-sm ${plan.highlight ? 'text-white/60' : 'text-zinc-500'}`}>
                    {plan.description}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className={`text-5xl font-semibold tracking-tighter ${plan.highlight ? 'text-white' : 'text-zinc-950'}`}>
                      ${price}
                    </span>
                    <span className={`text-sm ${plan.highlight ? 'text-white/50' : 'text-zinc-400'}`}>
                      /{interval === 'annual' ? 'mo · billed yearly' : 'mo'}
                    </span>
                  </div>

                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            plan.highlight ? 'text-[#D6FF3E]' : 'text-[#2A1A3D]'
                          }`}
                        />
                        <span className={plan.highlight ? 'text-white/90' : 'text-zinc-600'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={signupHref}
                  className={`mt-10 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-[#D6FF3E] text-[#1a2000] hover:bg-[#E3F59D]'
                      : 'bg-[#2A1A3D] text-white hover:bg-[#120920]'
                  }`}
                >
                  {plan.ctaLabel}
                </Link>
              </div>
              </SpotlightCard>
            )
          })}
        </div>

        <p className="mt-8 text-center text-sm text-zinc-400">
          BYOK — bring your own OpenAI / Anthropic keys and pay them at cost.
        </p>
      </div>
    </section>
  )
}
