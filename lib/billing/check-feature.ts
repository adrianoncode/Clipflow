import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import {
  getPlanFeatures,
  getPlanLimits,
  isUnlimited,
  type PlanFeatures,
} from '@/lib/billing/plans'

/**
 * Quota-gated features — counted against a per-month limit. Each value
 * names the `renders.kind` values that should count toward it.
 */
const RENDER_QUOTAS = {
  video_render: {
    limitField: 'videoRendersPerMonth',
    kinds: [
      'burn_captions',
      'assemble_broll',
      'branded_video',
      'clip',
      'batch_clip',
      'reframe',
      'subtitles',
      'faceless',
    ],
    label: 'video renders',
  },
  avatar_video: {
    limitField: 'avatarVideosPerMonth',
    kinds: ['avatar'],
    label: 'avatar videos',
  },
  dub_video: {
    limitField: 'dubVideosPerMonth',
    kinds: ['dub'],
    label: 'auto-dub jobs',
  },
} as const

export type QuotaKey = keyof typeof RENDER_QUOTAS

export interface FeatureCheckResult {
  ok: boolean
  plan: string
  /** Human-readable reason if ok === false. */
  message?: string
  /** For quota-based checks: how many used this month, and the cap. */
  used?: number
  limit?: number
  unlimited?: boolean
}

/**
 * Boolean feature gate — returns ok=false with an upgrade message if
 * the current plan doesn't include the feature.
 */
export async function checkFeatureFlag(
  workspaceId: string,
  feature: keyof PlanFeatures,
): Promise<FeatureCheckResult> {
  const plan = await getWorkspacePlan(workspaceId)
  const features = getPlanFeatures(plan)
  if (features[feature]) return { ok: true, plan }
  return {
    ok: false,
    plan,
    message: `This feature is not included on the ${plan} plan. Upgrade to unlock.`,
  }
}

/**
 * Counts a quota-gated kind of render against the current month's
 * ceiling. Used by the video action wrappers before submitting a new
 * Shotstack/Replicate job.
 */
export async function checkRenderQuota(
  workspaceId: string,
  quota: QuotaKey,
): Promise<FeatureCheckResult> {
  const plan = await getWorkspacePlan(workspaceId)
  const limits = getPlanLimits(plan)
  const config = RENDER_QUOTAS[quota]
  const limit = limits[config.limitField]

  if (isUnlimited(limit)) {
    return { ok: true, plan, unlimited: true, limit: -1, used: 0 }
  }
  if (limit === 0) {
    return {
      ok: false,
      plan,
      used: 0,
      limit: 0,
      unlimited: false,
      message: `${config.label} are not included on the ${plan} plan. Upgrade to unlock.`,
    }
  }

  // Count renders of the relevant kinds since the start of this month.
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const admin = createAdminClient()
  const { count } = await admin
    .from('renders')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('created_at', startOfMonth)
    .in('kind', [...config.kinds])

  const used = count ?? 0
  if (used >= limit) {
    return {
      ok: false,
      plan,
      used,
      limit,
      unlimited: false,
      message: `You've used all ${limit} ${config.label} this month on the ${plan} plan. Upgrade for more.`,
    }
  }
  return { ok: true, plan, used, limit, unlimited: false }
}

/**
 * Voice-clone count vs plan cap. Used when a user tries to add a new
 * cloned voice.
 */
export async function checkVoiceCloneCap(
  workspaceId: string,
): Promise<FeatureCheckResult> {
  const plan = await getWorkspacePlan(workspaceId)
  const limits = getPlanLimits(plan)
  const limit = limits.voiceClonesMax

  if (isUnlimited(limit)) {
    return { ok: true, plan, unlimited: true, limit: -1, used: 0 }
  }
  if (limit === 0) {
    return {
      ok: false,
      plan,
      used: 0,
      limit: 0,
      unlimited: false,
      message: `Voice cloning is not included on the ${plan} plan. Upgrade to unlock.`,
    }
  }

  const admin = createAdminClient()
  const { count } = await admin
    .from('voice_clones')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  const used = count ?? 0
  if (used >= limit) {
    return {
      ok: false,
      plan,
      used,
      limit,
      unlimited: false,
      message: `You've used all ${limit} voice clones on the ${plan} plan. Upgrade or delete an existing one.`,
    }
  }
  return { ok: true, plan, used, limit, unlimited: false }
}
