import { redirect } from 'next/navigation'

import { BillingPlansClient } from './billing-plans-client'
import { ActiveDiscountBanner } from '@/components/billing/active-discount-banner'
import { getUser } from '@/lib/auth/get-user'
import { getSubscription } from '@/lib/billing/get-subscription'
import { getActiveStripeDiscount } from '@/lib/billing/get-active-discount'
import { PLANS, type BillingPlan } from '@/lib/billing/plans'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Billing · Clipflow' }

interface BillingPageProps {
  searchParams: { workspace_id?: string; plan?: string }
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = searchParams.workspace_id ?? ''
  const sub = workspaceId ? await getSubscription(workspaceId) : null

  const currentPlan: BillingPlan =
    (searchParams.plan as BillingPlan | undefined) ?? sub?.plan ?? 'free'

  const discount = sub?.stripe_subscription_id
    ? await getActiveStripeDiscount(sub.stripe_subscription_id)
    : null

  const baseMonthlyCents = PLANS[currentPlan].monthlyPrice

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your plan and usage.
        </p>
      </div>

      {discount ? (
        <ActiveDiscountBanner discount={discount} baseMonthlyCents={baseMonthlyCents} />
      ) : null}

      <BillingPlansClient workspaceId={workspaceId} currentPlan={currentPlan} />
    </div>
  )
}
