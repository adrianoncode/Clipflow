'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

import { SpotlightCard } from '@/components/landing/spotlight-card'

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

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Try every tool, no card.',
    monthly: 0,
    annual: 0,
    features: [
      '3 content items / mo',
      '10 outputs / mo',
      '1 workspace',
      'All 30+ AI tools',
    ],
    ctaLabel: 'Get started',
  },
  {
    id: 'solo',
    name: 'Solo',
    description: 'For creators shipping weekly.',
    monthly: 19,
    annual: 15,
    features: [
      '20 content items / mo',
      '100 outputs / mo',
      'Brand voice + AI persona',
      'Full video rendering',
      'Review links',
    ],
    highlight: true,
    ctaLabel: 'Start trial',
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For agencies & content teams.',
    monthly: 49,
    annual: 39,
    features: [
      '100 content items / mo',
      '500 outputs / mo',
      '5 workspaces + members',
      'Everything in Solo',
    ],
    ctaLabel: 'Start trial',
  },
  {
    id: 'agency',
    name: 'Agency',
    description: 'Unlimited, white-label.',
    monthly: 99,
    annual: 79,
    features: [
      'Unlimited content',
      'Unlimited outputs',
      'White-label review',
      'API access',
      'Priority support',
    ],
    ctaLabel: 'Contact us',
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
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
            Pricing
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
            Start free. Scale when ready.
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
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                −20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const price = interval === 'annual' ? plan.annual : plan.monthly
            return (
              <SpotlightCard
                key={plan.id}
                className="h-full rounded-2xl"
                color={plan.highlight ? 'rgba(255,255,255,0.08)' : 'rgba(124, 58, 237, 0.12)'}
                size={400}
              >
              <div
                className={`relative flex h-full flex-col rounded-2xl p-8 transition-all ${
                  plan.highlight
                    ? 'bg-zinc-950 text-white shadow-2xl shadow-violet-500/20 ring-1 ring-zinc-900'
                    : 'border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md'
                }`}
              >
                {plan.highlight ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-violet-600/40">
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
                            plan.highlight ? 'text-emerald-400' : 'text-violet-600'
                          }`}
                        />
                        <span className={plan.highlight ? 'text-white/80' : 'text-zinc-600'}>
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
                      ? 'bg-white text-zinc-950 hover:bg-zinc-100'
                      : 'bg-zinc-950 text-white hover:bg-zinc-800'
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
          All plans include every AI tool. No feature gating.
        </p>
      </div>
    </section>
  )
}
