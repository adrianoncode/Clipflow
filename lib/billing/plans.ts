export type BillingPlan = 'free' | 'solo' | 'team' | 'agency'

export interface PlanLimits {
  contentItemsPerMonth: number   // -1 = unlimited
  outputsPerMonth: number        // -1 = unlimited
  workspaces: number             // -1 = unlimited
}

export interface PlanDefinition {
  id: BillingPlan
  name: string
  description: string
  monthlyPrice: number   // USD cents
  annualPrice: number    // USD cents / month (billed annually)
  limits: PlanLimits
  highlight?: boolean
}

export const PLANS: Record<BillingPlan, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Try Clipflow with no credit card.',
    monthlyPrice: 0,
    annualPrice: 0,
    limits: {
      contentItemsPerMonth: 3,
      outputsPerMonth: 10,
      workspaces: 1,
    },
  },
  solo: {
    id: 'solo',
    name: 'Solo',
    description: 'For individual creators.',
    monthlyPrice: 1900,   // $19/mo
    annualPrice: 1500,    // $15/mo billed annually ($180/yr)
    limits: {
      contentItemsPerMonth: 20,
      outputsPerMonth: 100,
      workspaces: 1,
    },
    highlight: true,
  },
  team: {
    id: 'team',
    name: 'Team',
    description: 'For agencies and content teams.',
    monthlyPrice: 4900,   // $49/mo
    annualPrice: 3900,    // $39/mo billed annually ($468/yr)
    limits: {
      contentItemsPerMonth: 100,
      outputsPerMonth: 500,
      workspaces: 5,
    },
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    description: 'Unlimited everything.',
    monthlyPrice: 9900,   // $99/mo
    annualPrice: 7900,    // $79/mo billed annually ($948/yr)
    limits: {
      contentItemsPerMonth: -1,
      outputsPerMonth: -1,
      workspaces: -1,
    },
  },
}

export function getPlanLimits(plan: BillingPlan): PlanLimits {
  return PLANS[plan].limits
}

export function isUnlimited(value: number): boolean {
  return value === -1
}
