'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Gift, Check, Copy, AlertCircle } from 'lucide-react'

import { copyToClipboard } from '@/lib/utils/copy-to-clipboard'

interface ReferralSidebarCardProps {
  link: string
  pending: number
  confirmed: number
  currentPlan: 'free' | 'solo' | 'team' | 'agency'
}

/**
 * Compact referral share widget rendered at the bottom of the sidebar.
 * Shows the current user's personal invite link with a one-click copy,
 * plus a light stat line to motivate further sharing ("social proof to
 * oneself"). Clicking the title still routes to the full
 * /settings/referrals page for the deep view.
 */
export function ReferralSidebarCard({ link, pending, confirmed, currentPlan }: ReferralSidebarCardProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function copy() {
    const ok = await copyToClipboard(link)
    setState(ok ? 'copied' : 'failed')
    setTimeout(() => setState('idle'), ok ? 1500 : 3000)
  }

  // Strip protocol + host so the pill stays readable at 13rem wide.
  const preview = link.replace(/^https?:\/\//, '')

  // Compose a single status line. Wording differs for free users — their
  // coupon is "waiting" until they themselves upgrade, so claiming
  // "saving 20%" would be misleading.
  const isFree = currentPlan === 'free'
  let statusLine: { text: string; accent: boolean; href?: string } | null = null
  if (confirmed > 0) {
    statusLine = isFree
      ? {
          text: `🎉 ${confirmed} paid · 20% waiting for you — upgrade to claim`,
          accent: true,
          href: '/billing',
        }
      : {
          text: `🎉 ${confirmed} paid · saving 20%`,
          accent: true,
        }
  } else if (pending > 0) {
    statusLine = {
      text: `${pending} ${pending === 1 ? 'friend' : 'friends'} joined — waiting on upgrade`,
      accent: false,
    }
  }

  return (
    <div className="mx-2 mb-2 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-3">
      <Link
        href="/settings/referrals"
        className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary"
      >
        <Gift className="h-3.5 w-3.5 text-emerald-500" />
        Give 20 %, get 20 %
      </Link>
      <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
        Share your link — both sides save.
      </p>
      <button
        type="button"
        onClick={copy}
        title={link}
        className="mt-2 flex w-full items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 text-left text-[11px] transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5"
      >
        <span className="min-w-0 flex-1 truncate font-mono text-muted-foreground">
          {preview}
        </span>
        {state === 'copied' ? (
          <Check className="h-3 w-3 shrink-0 text-emerald-500" />
        ) : state === 'failed' ? (
          <AlertCircle className="h-3 w-3 shrink-0 text-amber-500" />
        ) : (
          <Copy className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
      </button>
      {state === 'failed' ? (
        <p className="mt-1 text-[10px] text-amber-600">
          Couldn&apos;t copy — tap and hold the link above to select manually.
        </p>
      ) : null}
      {statusLine ? (
        statusLine.href ? (
          <Link
            href={statusLine.href}
            className={`mt-2 block text-[10px] font-medium leading-tight underline-offset-2 hover:underline ${
              statusLine.accent ? 'text-emerald-600' : 'text-muted-foreground'
            }`}
          >
            {statusLine.text}
          </Link>
        ) : (
          <p
            className={`mt-2 text-[10px] font-medium leading-tight ${
              statusLine.accent ? 'text-emerald-600' : 'text-muted-foreground'
            }`}
          >
            {statusLine.text}
          </p>
        )
      ) : null}
    </div>
  )
}
