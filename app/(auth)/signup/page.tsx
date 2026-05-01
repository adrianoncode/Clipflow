import Link from 'next/link'
import { UserPlus, Gift } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SignupForm } from '@/components/auth/signup-form'
import { normalizeReferralCode } from '@/lib/referrals/normalize-code'
import { lookupReferrerUserId } from '@/lib/referrals/lookup-referrer'
import { REFERRAL_DISCOUNT_PERCENT } from '@/lib/referrals/constants'

export const metadata = { title: 'Create account' }

interface SignupPageProps {
  searchParams: { ref?: string }
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const refCode = normalizeReferralCode(searchParams.ref)
  const hasValidRef = refCode ? Boolean(await lookupReferrerUserId(refCode)) : false

  return (
    <Card className="border-border/60 shadow-xl shadow-primary/5">
      <CardHeader className="space-y-3 pb-3 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
          <UserPlus className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Start repurposing content in under 2 minutes.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasValidRef ? (
          <div className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm">
            <Gift className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">
                {REFERRAL_DISCOUNT_PERCENT}% off unlocked
              </p>
              <p className="text-xs text-muted-foreground">
                You were invited by a Clipflow user. Your {REFERRAL_DISCOUNT_PERCENT}%
                discount is applied automatically on any paid plan.
              </p>
            </div>
          </div>
        ) : null}
        <SignupForm />
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
