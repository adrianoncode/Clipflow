import { redirect } from 'next/navigation'
import { Gift, Users, PartyPopper, Send } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReferralShare } from '@/components/settings/referral-share'
import { ReferralShareTemplates } from '@/components/settings/referral-share-templates'
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
    // Profile hasn't materialized yet — shouldn't happen in practice
    // because the DB trigger backfills a code on insert.
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-xl font-semibold">Refer friends</h1>
        <p className="text-sm text-muted-foreground">
          Your referral code is being prepared. Refresh in a moment.
        </p>
      </div>
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clipflow.io'
  const link = `${baseUrl}/signup?ref=${code}`

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Refer friends</h1>
        <p className="text-sm text-muted-foreground">
          Give {REFERRAL_DISCOUNT_PERCENT}%, get {REFERRAL_DISCOUNT_PERCENT}%. When someone
          signs up through your link and starts a paid plan, you both get{' '}
          {REFERRAL_DISCOUNT_PERCENT}% off — for as long as you stay subscribed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4 text-primary" />
            Your referral link
          </CardTitle>
          <CardDescription>
            Share anywhere — every paid signup unlocks {REFERRAL_DISCOUNT_PERCENT}% off on
            your subscription too.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReferralShare link={link} code={code} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4 text-primary" />
            Send it in one click
          </CardTitle>
          <CardDescription>
            Pre-written snippets ready for chat, Twitter, LinkedIn, or email. Each
            link is tagged so you can see which channel actually converts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReferralShareTemplates link={link} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={Users}
          label="Friends signed up"
          value={stats.pending + stats.confirmed}
          hint={
            stats.pending > 0
              ? `${stats.pending} still on free plan`
              : 'Invited people land here'
          }
        />
        <StatCard
          icon={PartyPopper}
          label="Paid conversions"
          value={stats.confirmed}
          hint={
            stats.confirmed > 0
              ? `You're saving ${REFERRAL_DISCOUNT_PERCENT}% every month`
              : 'None yet — share your link to start'
          }
          accent={stats.confirmed > 0}
        />
      </div>

      {sources.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Where your signups come from</CardTitle>
            <CardDescription>
              Attribution by channel — paid counts toward your discount.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sources.map((s) => {
              const total = s.pending + s.confirmed
              const paidPct = total > 0 ? Math.round((s.confirmed / total) * 100) : 0
              return (
                <div key={s.source} className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{s.source}</span>
                  <span className="text-muted-foreground">
                    {s.confirmed} paid · {s.pending} pending
                    {total > 0 ? ` · ${paidPct}% conversion` : ''}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : null}

      <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">How it works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Send your link to a creator or team who needs Clipflow.</li>
          <li>They sign up and choose any paid plan.</li>
          <li>
            They instantly get {REFERRAL_DISCOUNT_PERCENT}% off, and the same discount is
            applied to your active subscription.
          </li>
          <li>The discount stays as long as the subscriptions stay active.</li>
        </ol>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  hint: string
  accent?: boolean
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            accent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-xs font-medium text-foreground">{label}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
        </div>
      </CardContent>
    </Card>
  )
}
