export type BillingPlan = 'free' | 'solo' | 'team' | 'agency'

/**
 * Per-plan quotas. Everything that costs us real money per-use is
 * capped here. `-1` means unlimited.
 */
export interface PlanLimits {
  /* Counts — tracked per calendar month */
  contentItemsPerMonth: number
  outputsPerMonth: number
  /** MP4 renders via Shotstack — the biggest variable cost. */
  videoRendersPerMonth: number
  /** AI avatar videos via Replicate/HeyGen — extremely expensive. */
  avatarVideosPerMonth: number
  /** Auto-dub jobs (translate + clone voice + render). */
  dubVideosPerMonth: number
  /** TikAPI trending-sound queries — third-party rate-limited. */
  trendingSoundQueriesPerMonth: number

  /* Static caps */
  workspaces: number
  voiceClonesMax: number
  teamMembersMax: number
}

/**
 * Boolean feature flags. `true` = included on this plan, `false` =
 * disabled / shows an upgrade nudge.
 */
export interface PlanFeatures {
  /** Pexels Audio + Mubert AI background music in the Video Studio. */
  backgroundMusic: boolean
  /** Fetch live TikTok trending sounds via TikAPI. */
  trendingSounds: boolean
  /** Burn-in custom brand (logo, accent color, intro/outro). */
  customBranding: boolean
  /** White-label the client review portal (remove Clipflow wordmark). */
  whiteLabelReview: boolean
  /** Programmatic access — API key + webhooks. */
  apiAccess: boolean
  /** Priority render queue (shorter Shotstack wait times). */
  priorityRenders: boolean
}

export interface PlanDefinition {
  id: BillingPlan
  name: string
  description: string
  monthlyPrice: number // USD cents
  annualPrice: number // USD cents / month (billed annually)
  limits: PlanLimits
  features: PlanFeatures
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
      videoRendersPerMonth: 0,
      avatarVideosPerMonth: 0,
      dubVideosPerMonth: 0,
      trendingSoundQueriesPerMonth: 0,
      workspaces: 1,
      voiceClonesMax: 0,
      teamMembersMax: 1,
    },
    features: {
      backgroundMusic: false,
      trendingSounds: false,
      customBranding: false,
      whiteLabelReview: false,
      apiAccess: false,
      priorityRenders: false,
    },
  },
  solo: {
    id: 'solo',
    name: 'Solo',
    description: 'For individual creators.',
    monthlyPrice: 1900, // $19/mo
    annualPrice: 1500, // $15/mo billed annually ($180/yr)
    limits: {
      contentItemsPerMonth: 20,
      outputsPerMonth: 100,
      videoRendersPerMonth: 20,
      avatarVideosPerMonth: 5,
      dubVideosPerMonth: 0,
      trendingSoundQueriesPerMonth: 0,
      workspaces: 1,
      voiceClonesMax: 1,
      teamMembersMax: 1,
    },
    features: {
      backgroundMusic: true,
      trendingSounds: false,
      customBranding: true,
      whiteLabelReview: false,
      apiAccess: false,
      priorityRenders: false,
    },
    highlight: true,
  },
  team: {
    id: 'team',
    name: 'Team',
    description: 'For agencies and content teams.',
    monthlyPrice: 4900, // $49/mo
    annualPrice: 3900, // $39/mo billed annually ($468/yr)
    limits: {
      contentItemsPerMonth: 100,
      outputsPerMonth: 500,
      videoRendersPerMonth: 100,
      avatarVideosPerMonth: 30,
      dubVideosPerMonth: 20,
      trendingSoundQueriesPerMonth: 200,
      workspaces: 5,
      voiceClonesMax: 3,
      teamMembersMax: 5,
    },
    features: {
      backgroundMusic: true,
      trendingSounds: true,
      customBranding: true,
      whiteLabelReview: false,
      apiAccess: false,
      priorityRenders: true,
    },
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    description: 'Unlimited everything.',
    monthlyPrice: 9900, // $99/mo
    annualPrice: 7900, // $79/mo billed annually ($948/yr)
    limits: {
      contentItemsPerMonth: -1,
      outputsPerMonth: -1,
      videoRendersPerMonth: -1,
      avatarVideosPerMonth: -1,
      dubVideosPerMonth: -1,
      trendingSoundQueriesPerMonth: -1,
      workspaces: -1,
      voiceClonesMax: -1,
      teamMembersMax: -1,
    },
    features: {
      backgroundMusic: true,
      trendingSounds: true,
      customBranding: true,
      whiteLabelReview: true,
      apiAccess: true,
      priorityRenders: true,
    },
  },
}

export function getPlanLimits(plan: BillingPlan): PlanLimits {
  return PLANS[plan].limits
}

export function getPlanFeatures(plan: BillingPlan): PlanFeatures {
  return PLANS[plan].features
}

export function isUnlimited(value: number): boolean {
  return value === -1
}
