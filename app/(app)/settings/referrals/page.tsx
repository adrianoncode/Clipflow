import { redirect } from 'next/navigation'

import { ReferralShare } from '@/components/settings/referral-share'
import { ReferralShareTemplates } from '@/components/settings/referral-share-templates'
import {
  SettingsRow,
  SettingsSection,
} from '@/components/settings/section'
import { getUser } from '@/lib/auth/get-user'
import { getOwnReferralCode } from '@/lib/referrals/get-referral-code'
import { getReferralStats } from '@/lib/referrals/get-stats'
import { getReferralSourceBreakdown } from '@/lib/referrals/get-source-breakdown'
import { REFERRAL_DISCOUNT_PERCENT } from '@/lib/referrals/constants'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Refer friends · Clipflow' }

export default async function ReferralsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const [code, stats, sources] = await Promise.all([
    getOwnReferralCode(),
    getReferralStats(user.id),
    getReferralSourceBreakdown(user.id),
  ])
  if (!code) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Your referral code is being prepared. Refresh in a moment.
        </p>
      </div>
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clipflow.to'
  const link = `${baseUrl}/signup?ref=${code}`
  const totalSignups = stats.pending + stats.confirmed

  return (
    <div className="space-y-7">
      {/* ── 01 · Your link ──────────────────────────────────────── */}
      <SettingsSection
        num="01"
        title="Your link"
        hint={`Give ${REFERRAL_DISCOUNT_PERCENT}%, get ${REFERRAL_DISCOUNT_PERCENT}% — for as long as both stay subscribed`}
      >
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <ReferralShare link={link} code={code} />
        </div>
      </SettingsSection>

      {/* ── 02 · One-click share ────────────────────────────────── */}
      <SettingsSection
        num="02"
        title="Send it in one click"
        hint="pre-written snippets, attribution baked in"
      >
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <ReferralShareTemplates link={link} />
        </div>
      </SettingsSection>

      {/* ── 03 · Performance ────────────────────────────────────── */}
      <SettingsSection
        num="03"
        title="Performance"
        hint={`${totalSignups} signup${totalSignups === 1 ? '' : 's'} · ${stats.confirmed} paid conversion${stats.confirmed === 1 ? '' : 's'}`}
      >
        <SettingsRow
          label="Friends signed up"
          description={
            stats.pending > 0
              ? `${stats.pending} still on the free plan — paid wins are pending.`
              : 'Invited people land here once they create an account.'
          }
          control={
            <span className="font-mono text-[24px] font-bold tabular-nums text-foreground">
              {totalSignups}
            </span>
          }
        />
        <SettingsRow
          label="Paid conversions"
          description={
            stats.confirmed > 0
              ? `You're saving ${REFERRAL_DISCOUNT_PERCENT}% on every monthly invoice.`
              : 'None yet — share your link to start.'
          }
          control={
            <span
              className={`font-mono text-[24px] font-bold tabular-nums ${
                stats.confirmed > 0 ? 'text-primary' : 'text-foreground'
              }`}
            >
              {stats.confirmed}
            </span>
          }
        />
        {sources.length > 0
          ? sources.map((s) => {
              const total = s.pending + s.confirmed
              const paidPct = total > 0 ? Math.round((s.confirmed / total) * 100) : 0
              return (
                <SettingsRow
                  key={s.source}
                  label={s.source}
                  description={`${s.confirmed} paid · ${s.pending} pending`}
                  control={
                    total > 0 ? (
                      <span className="font-mono text-[12.5px] font-bold tabular-nums text-muted-foreground">
                        {paidPct}%
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
                        No conversions
                      </span>
                    )
                  }
                />
              )
            })
          : null}
      </SettingsSection>

      {/* ── How it works (footnote-style box) ───────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-[12px] text-muted-foreground">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
          How it works
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 leading-relaxed">
          <li>Send your link to a creator or team who needs Clipflow.</li>
          <li>They sign up and choose any paid plan.</li>
          <li>
            They instantly get {REFERRAL_DISCOUNT_PERCENT}% off, and the same discount
            applies to your active subscription.
          </li>
          <li>The discount stays as long as both subscriptions stay active.</li>
        </ol>
      </div>
    </div>
  )
}
