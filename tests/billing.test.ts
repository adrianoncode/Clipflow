import { describe, it, expect } from 'vitest'
import {
  PLANS,
  PUBLIC_PLAN_ORDER,
  checkPlanAccess,
  getPlanLimits,
  getPlanFeatures,
  isUnlimited,
  type BillingPlan,
} from '@/lib/billing/plans'

describe('lib/billing/plans', () => {
  it('has all 4 plan IDs defined (team stays for legacy subscribers)', () => {
    const plans: BillingPlan[] = ['free', 'solo', 'team', 'agency']
    for (const p of plans) {
      expect(PLANS[p]).toBeDefined()
      expect(PLANS[p].id).toBe(p)
    }
  })

  it('public pricing surface shows only 3 tiers', () => {
    expect(PUBLIC_PLAN_ORDER).toEqual(['free', 'solo', 'agency'])
    expect(PLANS.team.hidden).toBe(true)
  })

  it('solo → "Creator", agency → "Studio"', () => {
    expect(PLANS.solo.name).toBe('Creator')
    expect(PLANS.solo.audience).toBe('creator')
    expect(PLANS.agency.name).toBe('Studio')
    expect(PLANS.agency.audience).toBe('agency')
  })

  it('free plan has no paid features', () => {
    const f = getPlanFeatures('free')
    expect(f.scheduling).toBe(false)
    expect(f.creatorResearch).toBe(false)
    expect(f.customBranding).toBe(false)
    expect(f.multiWorkspace).toBe(false)
  })

  it('Creator plan unlocks the core creator loop', () => {
    const f = getPlanFeatures('solo')
    expect(f.scheduling).toBe(true)
    expect(f.abHookTesting).toBe(true)
    expect(f.creatorResearch).toBe(true)
    expect(f.customBranding).toBe(true)
    // Agency-only features stay locked
    expect(f.multiWorkspace).toBe(false)
    expect(f.teamSeats).toBe(false)
    expect(f.clientReviewLink).toBe(false)
  })

  it('Studio plan unlocks agency features', () => {
    const f = getPlanFeatures('agency')
    expect(f.multiWorkspace).toBe(true)
    expect(f.teamSeats).toBe(true)
    expect(f.clientReviewLink).toBe(true)
    expect(f.whiteLabelReview).toBe(true)
    expect(f.avatarVideos).toBe(true)
    expect(f.autoDub).toBe(true)
  })

  it('plan prices are monotonically increasing', () => {
    expect(PLANS.free.monthlyPrice).toBe(0)
    expect(PLANS.solo.monthlyPrice).toBeLessThan(PLANS.team.monthlyPrice)
    expect(PLANS.team.monthlyPrice).toBeLessThan(PLANS.agency.monthlyPrice)
  })

  it('annual prices are cheaper than monthly', () => {
    for (const plan of ['solo', 'team', 'agency'] as const) {
      expect(PLANS[plan].annualPrice).toBeLessThan(PLANS[plan].monthlyPrice)
    }
  })

  it('isUnlimited detects -1 sentinel', () => {
    expect(isUnlimited(-1)).toBe(true)
    expect(isUnlimited(0)).toBe(false)
    expect(isUnlimited(100)).toBe(false)
  })

  it('Studio has unlimited outputs/content', () => {
    const limits = getPlanLimits('agency')
    expect(isUnlimited(limits.contentItemsPerMonth)).toBe(true)
    expect(isUnlimited(limits.outputsPerMonth)).toBe(true)
  })

  it('free plan limits force upgrade after small usage', () => {
    const limits = getPlanLimits('free')
    expect(limits.contentItemsPerMonth).toBeLessThanOrEqual(5)
    expect(limits.outputsPerMonth).toBeLessThanOrEqual(20)
    expect(limits.videoRendersPerMonth).toBe(0)
  })

  describe('checkPlanAccess', () => {
    it('blocks free from paid features', () => {
      expect(checkPlanAccess('free', 'scheduling')).toBe(false)
      expect(checkPlanAccess('free', 'creatorResearch')).toBe(false)
    })

    it('Creator gets creator features but not agency ones', () => {
      expect(checkPlanAccess('solo', 'scheduling')).toBe(true)
      expect(checkPlanAccess('solo', 'abHookTesting')).toBe(true)
      expect(checkPlanAccess('solo', 'multiWorkspace')).toBe(false)
      expect(checkPlanAccess('solo', 'clientReviewLink')).toBe(false)
    })

    it('Studio gets everything', () => {
      expect(checkPlanAccess('agency', 'scheduling')).toBe(true)
      expect(checkPlanAccess('agency', 'multiWorkspace')).toBe(true)
      expect(checkPlanAccess('agency', 'whiteLabelReview')).toBe(true)
      expect(checkPlanAccess('agency', 'autoDub')).toBe(true)
    })
  })
})
