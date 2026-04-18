import { redirect } from 'next/navigation'

import { Sparkles } from 'lucide-react'

import { BillingPlansClient } from './billing-plans-client'
import { ActiveDiscountBanner } from '@/components/billing/active-discount-banner'
import { getUser } from '@/lib/auth/get-user'
import { getSubscription } from '@/lib/billing/get-subscription'
import { getActiveStripeDiscount } from '@/lib/billing/get-active-discount'
import {
  FEATURE_MIN_PLAN,
  PLANS,
  type BillingPlan,
  type PlanFeatures,
} from '@/lib/billing/plans'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Billing · Clipflow' }

interface BillingPageProps {
  searchParams: { workspace_id?: string; plan?: string; feature?: string }
}

/**
 * Plain-English labels for the `feature` query param so the upsell
 * banner reads like marketing copy, not a flag name. Kept here instead
 * of on PlanFeatures to avoid polluting the type with UI strings.
 */
const FEATURE_LABELS: Partial<Record<keyof PlanFeatures, string>> = {
  scheduling: 'Scheduling + auto-publish',
  abHookTesting: 'A/B hook testing',
  creatorResearch: 'Creator research',
  brollAutomation: 'B-roll automation',
  avatarVideos: 'AI avatar videos',
  autoDub: 'Auto-dub voice cloning',
  customBranding: 'Custom branding',
  priorityRenders: 'Priority renders',
  multiWorkspace: 'Multiple client workspaces',
  teamSeats: 'Team seats',
  clientReviewLink: 'Client review links',
  whiteLabelReview: 'White-label review portal',
}

function isFeatureKey(key: string | undefined): key is keyof PlanFeatures {
  return !!key && key in FEATURE_LABELS
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

  // Arrived here via an UpgradeGate? Show a banner that names the exact
  // feature they were trying to reach, so the pricing page doesn't feel
  // like a context-free dead end.
  const gatedFeature = isFeatureKey(searchParams.feature) ? searchParams.feature : null
  const gatedFeatureLabel = gatedFeature ? FEATURE_LABELS[gatedFeature] : null
  const gatedRequiredPlan = gatedFeature ? FEATURE_MIN_PLAN[gatedFeature] : null

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your plan and usage.
        </p>
      </div>

      {gatedFeatureLabel && gatedRequiredPlan ? (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/[0.06] via-primary/[0.03] to-background p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Unlock {gatedFeatureLabel} with {PLANS[gatedRequiredPlan].name}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
              {PLANS[gatedRequiredPlan].description} Pick the {PLANS[gatedRequiredPlan].name} plan below to turn it on.
            </p>
          </div>
        </div>
      ) : null}

      {discount ? (
        <ActiveDiscountBanner discount={discount} baseMonthlyCents={baseMonthlyCents} />
      ) : null}

      <BillingPlansClient workspaceId={workspaceId} currentPlan={currentPlan} />
    </div>
  )
}
