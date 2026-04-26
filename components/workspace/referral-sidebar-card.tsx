'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Gift, Check, Copy, AlertCircle, ArrowUpRight } from 'lucide-react'

import { copyToClipboard } from '@/lib/utils/copy-to-clipboard'

interface ReferralSidebarCardProps {
  link: string
  pending: number
  confirmed: number
  currentPlan: 'free' | 'solo' | 'team' | 'agency'
}

/**
 * Sidebar referral widget. Compact card pinned above the bottom nav.
 *
 * Old surface ("Give 20%, get 20% / Share your link — both sides save")
 * read like a discount-voucher CTA — vague, faintly spammy, no visual
 * anchor. New version leads with a violet-gradient gift chip + a
 * concrete title ("Refer a creator"), spells out *who* both sides are
 * and what 20% applies to, and turns the link row into a real designed
 * pill with a clear copy-link affordance.
 *
 * Tapping the title still routes to /settings/referrals for the full
 * dashboard (history, leaderboard, share-template snippets).
 */
export function ReferralSidebarCard({
  link,
  pending,
  confirmed,
  currentPlan,
}: ReferralSidebarCardProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function copy() {
    const ok = await copyToClipboard(link)
    setState(ok ? 'copied' : 'failed')
    setTimeout(() => setState('idle'), ok ? 1500 : 3000)
  }

  // Strip protocol + host so the pill stays readable at the sidebar's
  // ~13rem width. Showing only the slug-portion makes the link feel
  // "yours" — full URL just looks like a tracking parameter wall.
  const preview = link.replace(/^https?:\/\//, '')

  const isFree = currentPlan === 'free'
  let statusLine: { text: string; accent: boolean; href?: string } | null = null
  if (confirmed > 0) {
    statusLine = isFree
      ? {
          text: `${confirmed} paid · 20% waiting — upgrade to claim`,
          accent: true,
          href: '/billing',
        }
      : {
          text: `${confirmed} paid · saving 20% lifetime`,
          accent: true,
        }
  } else if (pending > 0) {
    statusLine = {
      text: `${pending} ${pending === 1 ? 'friend' : 'friends'} joined — waiting on first paid month`,
      accent: false,
    }
  }

  return (
    <div
      className="relative mx-2 mb-2 overflow-hidden rounded-2xl border border-border/60 bg-card p-3.5"
      style={{
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(42,26,61,0.04), 0 10px 24px -16px rgba(42,26,61,0.18)',
      }}
    >
      {/* Soft brand glow + edge-light — the same designer-grade chassis
          used on the settings cards, scaled down for the sidebar. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(124,58,237,0.16) 0%, rgba(124,58,237,0) 60%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
      />

      <div className="relative">
        <div className="flex items-start gap-2.5">
          {/* Gradient gift chip — same chassis vocabulary as SettingsHero,
              scaled to 28×28 for the sidebar. Reads as a designed object,
              not a default lucide grey icon. */}
          <span
            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"
            style={{
              background:
                'linear-gradient(140deg, #7C3AED 0%, #4B0FB8 60%, #2A1A3D 100%)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.18) inset, 0 6px 14px -8px rgba(75,15,184,0.55)',
            }}
            aria-hidden
          >
            <span
              className="pointer-events-none absolute inset-1 rounded-[8px]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 50%)',
              }}
            />
            <Gift className="relative h-4 w-4" strokeWidth={1.8} />
          </span>

          <Link
            href="/settings/referrals"
            className="group/title min-w-0 flex-1"
          >
            <p
              className="flex items-center gap-1 text-[12.5px] font-bold tracking-tight text-foreground transition-colors group-hover/title:text-primary"
              style={{
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }}
            >
              Refer a creator
              <ArrowUpRight className="h-3 w-3 text-muted-foreground/50 transition-all group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5 group-hover/title:text-primary" />
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              You and your invitee each save{' '}
              <span className="font-semibold text-foreground">20%</span> on
              every plan, every month.
            </p>
          </Link>
        </div>

        {/* Link pill — designed copy affordance instead of a generic
            input-shaped row. Hover state hints at copy action. */}
        <button
          type="button"
          onClick={copy}
          title={link}
          className="group/copy mt-2.5 flex w-full items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-left text-[11px] transition-all hover:-translate-y-px hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-sm"
        >
          <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] tracking-tight text-foreground/85">
            {preview}
          </span>
          <span
            className={`inline-flex h-5 items-center gap-0.5 rounded-md px-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] transition-colors ${
              state === 'copied'
                ? 'bg-emerald-500/[0.12] text-emerald-700'
                : state === 'failed'
                  ? 'bg-amber-500/[0.12] text-amber-700'
                  : 'bg-foreground/[0.06] text-muted-foreground/85 group-hover/copy:bg-primary/[0.10] group-hover/copy:text-primary'
            }`}
            style={{
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            {state === 'copied' ? (
              <>
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
                Copied
              </>
            ) : state === 'failed' ? (
              <>
                <AlertCircle className="h-2.5 w-2.5" />
                Failed
              </>
            ) : (
              <>
                <Copy className="h-2.5 w-2.5" />
                Copy
              </>
            )}
          </span>
        </button>
        {state === 'failed' ? (
          <p className="mt-1 text-[10px] leading-snug text-amber-600">
            Couldn&apos;t copy automatically — tap and hold the link above to
            select.
          </p>
        ) : null}

        {statusLine ? (
          statusLine.href ? (
            <Link
              href={statusLine.href}
              className={`mt-2 flex items-center gap-1 text-[10.5px] font-semibold leading-snug transition-colors ${
                statusLine.accent
                  ? 'text-primary hover:text-primary/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span
                aria-hidden
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  statusLine.accent ? 'bg-primary' : 'bg-muted-foreground/50'
                }`}
              />
              {statusLine.text}
            </Link>
          ) : (
            <p
              className={`mt-2 flex items-center gap-1 text-[10.5px] font-semibold leading-snug ${
                statusLine.accent ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <span
                aria-hidden
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  statusLine.accent ? 'bg-primary' : 'bg-muted-foreground/50'
                }`}
              />
              {statusLine.text}
            </p>
          )
        ) : null}
      </div>
    </div>
  )
}
