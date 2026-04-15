export type BillingPlan = 'free' | 'solo' | 'team' | 'agency'

/**
 * Per-plan quotas. Everything that costs us money per-use is capped.
 * `-1` means unlimited. Numbers are calibrated from `docs/costs.md`
 * for ~40 % avg utilization at target margin. See that doc before
 * bumping anything.
 */
export interface PlanLimits {
  /* Counts — tracked per calendar month */
  contentItemsPerMonth: number
  outputsPerMonth: number

  // Video rendering (Shotstack / Replicate)
  videoRendersPerMonth: number
  avatarVideosPerMonth: number
  dubVideosPerMonth: number

  // Scraper-powered insight features (Apify)
  trendingSoundQueriesPerMonth: number
  hashtagQueriesPerMonth: number
  competitorAnalysesPerMonth: number
  viralDiscoveryQueriesPerMonth: number
  commentMiningQueriesPerMonth: number

  /* Static caps */
  workspaces: number
  voiceClonesMax: number
  teamMembersMax: number
}

/**
 * Boolean feature flags. `true` = included, `false` = upgrade nudge.
 */
export interface PlanFeatures {
  /** Pexels Audio + Mubert AI background music in the Video Studio. */
  backgroundMusic: boolean
  /** Live TikTok trending sounds via Apify Scraptik. */
  trendingSounds: boolean
  /** Scraper-backed competitor & hashtag research. */
  competitorAnalysis: boolean
  /** Team+ feature: viral content discovery across platforms. */
  viralDiscovery: boolean
  /** Team+ feature: comment mining for audience insights. */
  commentMining: boolean
  /** Custom branding on rendered videos (logo + accent + intro/outro). */
  customBranding: boolean
  /** White-label the client review portal. */
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
      hashtagQueriesPerMonth: 0,
      competitorAnalysesPerMonth: 0,
      viralDiscoveryQueriesPerMonth: 0,
      commentMiningQueriesPerMonth: 0,
      workspaces: 1,
      voiceClonesMax: 0,
      teamMembersMax: 1,
    },
    features: {
      backgroundMusic: false,
      trendingSounds: false,
      competitorAnalysis: false,
      viralDiscovery: false,
      commentMining: false,
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
    annualPrice: 1500, // $15/mo billed annually
    limits: {
      contentItemsPerMonth: 20,
      outputsPerMonth: 100,
      videoRendersPerMonth: 20,
      avatarVideosPerMonth: 3,
      dubVideosPerMonth: 0,
      trendingSoundQueriesPerMonth: 0,
      hashtagQueriesPerMonth: 20,
      competitorAnalysesPerMonth: 5,
      viralDiscoveryQueriesPerMonth: 0,
      commentMiningQueriesPerMonth: 0,
      workspaces: 1,
      voiceClonesMax: 1,
      teamMembersMax: 1,
    },
    features: {
      backgroundMusic: true,
      trendingSounds: false,
      competitorAnalysis: true,
      viralDiscovery: false,
      commentMining: false,
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
    description: 'For content teams and agencies.',
    monthlyPrice: 4900, // $49/mo — BYOK on Shotstack/Replicate/ElevenLabs keeps cost ~$4/user (90%+ margin)
    annualPrice: 3900, // $39/mo billed annually (20% off)
    limits: {
      contentItemsPerMonth: 100,
      outputsPerMonth: 500,
      videoRendersPerMonth: 60,
      avatarVideosPerMonth: 15,
      dubVideosPerMonth: 10,
      trendingSoundQueriesPerMonth: 100,
      hashtagQueriesPerMonth: 100,
      competitorAnalysesPerMonth: 20,
      viralDiscoveryQueriesPerMonth: 30,
      commentMiningQueriesPerMonth: 20,
      workspaces: 5,
      voiceClonesMax: 3,
      teamMembersMax: 5,
    },
    features: {
      backgroundMusic: true,
      trendingSounds: true,
      competitorAnalysis: true,
      viralDiscovery: true,
      commentMining: true,
      customBranding: true,
      whiteLabelReview: false,
      apiAccess: false,
      priorityRenders: true,
    },
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    description: 'For agencies running multiple clients.',
    monthlyPrice: 9900, // $99/mo
    annualPrice: 7900, // $79/mo billed annually
    limits: {
      // "Soft unlimited" — high ceilings to prevent abuse but cover
      // realistic heavy usage. See docs/costs.md.
      contentItemsPerMonth: -1,
      outputsPerMonth: -1,
      videoRendersPerMonth: 300,
      avatarVideosPerMonth: 50,
      dubVideosPerMonth: 50,
      trendingSoundQueriesPerMonth: 500,
      hashtagQueriesPerMonth: 500,
      competitorAnalysesPerMonth: 100,
      viralDiscoveryQueriesPerMonth: 150,
      commentMiningQueriesPerMonth: 100,
      workspaces: 25,
      voiceClonesMax: 10,
      teamMembersMax: -1,
    },
    features: {
      backgroundMusic: true,
      trendingSounds: true,
      competitorAnalysis: true,
      viralDiscovery: true,
      commentMining: true,
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
