export type BillingPlan = 'free' | 'solo' | 'team' | 'agency'

/**
 * Two ICPs, two paid plans:
 *
 *   solo   → "Creator"  — indie creators, one brand, one voice.
 *   agency → "Studio"   — agencies + social-media managers running
 *                         multiple client brands with a review flow.
 *
 * `free` is the try-before-you-buy tier, `team` is a legacy SKU kept
 * around so existing subscribers don't break on rename. Don't show it
 * in new sign-up flows — the pricing section offers only 3 tiers.
 */

/**
 * Per-plan quotas. Everything that costs us money per-use is capped.
 * `-1` means unlimited. Numbers are calibrated from `docs/costs.md`
 * for ~40 % avg utilization at target margin.
 */
export interface PlanLimits {
  /* Counts — tracked per calendar month */
  contentItemsPerMonth: number
  outputsPerMonth: number

  // Video rendering (Shotstack / Replicate)
  videoRendersPerMonth: number
  avatarVideosPerMonth: number
  dubVideosPerMonth: number

  /* Static caps */
  workspaces: number
  voiceClonesMax: number
  teamMembersMax: number
}

/**
 * Feature flags. Flip one from `false` → `true` in a plan tier to
 * include it. Used by `checkFeatureFlag(workspaceId, feature)` server
 * side and `<UpgradeGate>` client side.
 *
 * Keep the list tight — every flag here is a decision point somewhere
 * in the product. Dead flags rot and mislead.
 */
export interface PlanFeatures {
  /* ── Core workflow ─────────────────────────────────────────── */
  /** Schedule + Calendar + Auto-publish to TikTok/Reels/Shorts/LinkedIn. */
  scheduling: boolean
  /** A/B test 3 hook variants and pick the winner. */
  abHookTesting: boolean
  /** Creator Research across YouTube / TikTok / Instagram. */
  creatorResearch: boolean

  /* ── Video tools (Shotstack/Replicate — cost us per call) ──── */
  /** B-Roll suggestions + auto-assembly from stock footage. */
  brollAutomation: boolean
  /** AI avatar videos (Replicate). Expensive per-call. */
  avatarVideos: boolean
  /** Voice-clone + auto-dub to other languages (ElevenLabs). */
  autoDub: boolean
  /** Custom branding on rendered videos (logo, accent, intro/outro). */
  customBranding: boolean
  /** Priority render queue — shorter Shotstack wait times. */
  priorityRenders: boolean

  /* ── Agency / multi-brand ──────────────────────────────────── */
  /** Multiple workspaces per account (= multi-client). */
  multiWorkspace: boolean
  /** Invite team members with roles. */
  teamSeats: boolean
  /** Share a review link with clients for approval. */
  clientReviewLink: boolean
  /** Remove Clipflow branding from the review portal. */
  whiteLabelReview: boolean

  /* ── Legacy flags kept for back-compat with existing code ──── */
  /** @deprecated renamed to `scheduling` — leave wired for now. */
  backgroundMusic: boolean
  /** @deprecated not shipping — always false. */
  trendingSounds: boolean
  /** @deprecated rolled into creatorResearch. */
  competitorAnalysis: boolean
  /** @deprecated not shipping. */
  viralDiscovery: boolean
  /** @deprecated not shipping. */
  commentMining: boolean
  /** @deprecated not shipping. */
  apiAccess: boolean
}

export interface PlanDefinition {
  id: BillingPlan
  /** Display name in UI — never reference the ID directly on-screen. */
  name: string
  /** One-sentence pitch shown on pricing / billing pages. */
  description: string
  /** Which ICP this plan targets. Drives landing-page tabs. */
  audience: 'creator' | 'agency' | 'trial'
  monthlyPrice: number // USD cents
  annualPrice: number // USD cents / month (billed annually)
  limits: PlanLimits
  features: PlanFeatures
  highlight?: boolean
  /** Hide from public pricing surface (legacy SKU). */
  hidden?: boolean
}

const DISABLED_LEGACY_FLAGS = {
  backgroundMusic: false,
  trendingSounds: false,
  competitorAnalysis: false,
  viralDiscovery: false,
  commentMining: false,
  apiAccess: false,
} as const

export const PLANS: Record<BillingPlan, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Try Clipflow with no credit card.',
    audience: 'trial',
    monthlyPrice: 0,
    annualPrice: 0,
    limits: {
      contentItemsPerMonth: 3,
      outputsPerMonth: 10,
      videoRendersPerMonth: 0,
      avatarVideosPerMonth: 0,
      dubVideosPerMonth: 0,
      workspaces: 1,
      voiceClonesMax: 0,
      teamMembersMax: 1,
    },
    features: {
      scheduling: false,
      abHookTesting: false,
      creatorResearch: false,
      brollAutomation: false,
      avatarVideos: false,
      autoDub: false,
      customBranding: false,
      priorityRenders: false,
      multiWorkspace: false,
      teamSeats: false,
      clientReviewLink: false,
      whiteLabelReview: false,
      ...DISABLED_LEGACY_FLAGS,
    },
  },

  // ── Solo ICP: indie creator ───────────────────────────────────
  solo: {
    id: 'solo',
    name: 'Creator',
    description: 'For indie creators turning one video into four posts a week.',
    audience: 'creator',
    monthlyPrice: 2900, // $29/mo
    annualPrice: 1900, // $19/mo billed annually
    limits: {
      contentItemsPerMonth: 30,
      outputsPerMonth: 150,
      videoRendersPerMonth: 30,
      avatarVideosPerMonth: 0,
      dubVideosPerMonth: 0,
      workspaces: 1,
      voiceClonesMax: 0,
      teamMembersMax: 1,
    },
    features: {
      scheduling: true,
      abHookTesting: true,
      creatorResearch: true,
      brollAutomation: true,
      avatarVideos: false,
      autoDub: false,
      customBranding: true,
      priorityRenders: false,
      multiWorkspace: false,
      teamSeats: false,
      clientReviewLink: false,
      whiteLabelReview: false,
      ...DISABLED_LEGACY_FLAGS,
    },
    highlight: true,
  },

  // ── Legacy tier: grandfathered, hidden from new sign-ups ──────
  team: {
    id: 'team',
    name: 'Creator Pro',
    description: 'Legacy plan — contact support to change.',
    audience: 'creator',
    monthlyPrice: 4900,
    annualPrice: 3900,
    limits: {
      contentItemsPerMonth: 100,
      outputsPerMonth: 500,
      videoRendersPerMonth: 60,
      avatarVideosPerMonth: 15,
      dubVideosPerMonth: 10,
      workspaces: 3,
      voiceClonesMax: 3,
      teamMembersMax: 3,
    },
    features: {
      scheduling: true,
      abHookTesting: true,
      creatorResearch: true,
      brollAutomation: true,
      avatarVideos: true,
      autoDub: true,
      customBranding: true,
      priorityRenders: true,
      multiWorkspace: true,
      teamSeats: true,
      clientReviewLink: false,
      whiteLabelReview: false,
      ...DISABLED_LEGACY_FLAGS,
    },
    hidden: true,
  },

  // ── Agency ICP: multi-brand, review flow, team seats ──────────
  agency: {
    id: 'agency',
    name: 'Studio',
    description: 'For social-media managers and agencies running multiple clients.',
    audience: 'agency',
    monthlyPrice: 9900, // $99/mo
    annualPrice: 7900, // $79/mo billed annually
    limits: {
      contentItemsPerMonth: -1,
      outputsPerMonth: -1,
      videoRendersPerMonth: 300,
      avatarVideosPerMonth: 50,
      dubVideosPerMonth: 50,
      workspaces: -1, // unlimited client brands — "Studio" tier's whole pitch
      voiceClonesMax: 10,
      teamMembersMax: -1,
    },
    features: {
      scheduling: true,
      abHookTesting: true,
      creatorResearch: true,
      brollAutomation: true,
      avatarVideos: true,
      autoDub: true,
      customBranding: true,
      priorityRenders: true,
      multiWorkspace: true,
      teamSeats: true,
      clientReviewLink: true,
      whiteLabelReview: true,
      ...DISABLED_LEGACY_FLAGS,
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

/* ────────────────────────────────────────────────────────────────
 * Feature access — single source of truth
 * ──────────────────────────────────────────────────────────────── */

/**
 * Which plan is the minimum needed for a given feature. Used by
 * `<UpgradeGate>` on the client (so we don't leak Stripe prices from
 * the server) and by `checkPlanAccess()` for server-side guards.
 *
 * Adding a new feature? Add it here — don't hardcode plan names at
 * call sites.
 */
export const FEATURE_MIN_PLAN: Record<keyof PlanFeatures, BillingPlan> = {
  scheduling: 'solo',
  abHookTesting: 'solo',
  creatorResearch: 'solo',
  brollAutomation: 'solo',
  customBranding: 'solo',
  avatarVideos: 'agency',
  autoDub: 'agency',
  priorityRenders: 'agency',
  multiWorkspace: 'agency',
  teamSeats: 'agency',
  clientReviewLink: 'agency',
  whiteLabelReview: 'agency',
  // Legacy — kept so the type stays total.
  backgroundMusic: 'solo',
  trendingSounds: 'agency',
  competitorAnalysis: 'solo',
  viralDiscovery: 'agency',
  commentMining: 'agency',
  apiAccess: 'agency',
}

const PLAN_RANK: Record<BillingPlan, number> = {
  free: 0,
  solo: 1,
  team: 2,
  agency: 3,
}

/**
 * Does `currentPlan` include `feature`? Pure, sync — safe to call
 * anywhere. For server-side checks that also want the plan name for
 * error messages, see `lib/billing/check-feature.ts`.
 */
export function checkPlanAccess(
  currentPlan: BillingPlan,
  feature: keyof PlanFeatures,
): boolean {
  const required = FEATURE_MIN_PLAN[feature]
  return PLAN_RANK[currentPlan] >= PLAN_RANK[required]
}

/** Plans that should appear on the public pricing surface, in order. */
export const PUBLIC_PLAN_ORDER: BillingPlan[] = ['free', 'solo', 'agency']
