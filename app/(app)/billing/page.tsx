import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { Sparkles } from 'lucide-react'

import { BillingPlansClient } from './billing-plans-client'
import { ActiveDiscountBanner } from '@/components/billing/active-discount-banner'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getSubscription } from '@/lib/billing/get-subscription'
import { getActiveStripeDiscount } from '@/lib/billing/get-active-discount'
import {
  FEATURE_MIN_PLAN,
  PLANS,
  type BillingPlan,
  type PlanFeatures,
} from '@/lib/billing/plans'

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

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

  // If the user arrived here from a sidebar lock click (or any CTA
  // that didn't thread the workspace_id), fall back to the cookie so
  // we never show a dead page with zero-op upgrade buttons.
  let workspaceId = searchParams.workspace_id ?? ''
  if (!workspaceId) {
    const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
    if (cookieWorkspaceId) {
      workspaceId = cookieWorkspaceId
    } else {
      const workspaces = await getWorkspaces()
      const personal = workspaces.find((w) => w.type === 'personal')
      workspaceId = personal?.id ?? workspaces[0]?.id ?? ''
    }
  }
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
    <div className="space-y-8">
      <div>
        <p
          className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: '#7c7468', fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          Workspace · Billing
        </p>
        <h1
          className="text-[44px] leading-[1.02]"
          style={{
            fontFamily: 'var(--font-instrument-serif), serif',
            letterSpacing: '-.015em',
            color: '#2A1A3D',
          }}
        >
          Plan &amp; usage
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#7c7468' }}>
          BYOK — pay your AI provider at cost. We take zero markup on tokens.
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
