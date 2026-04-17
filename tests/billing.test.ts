import { describe, it, expect } from 'vitest'
import {
  PLANS,
  getPlanLimits,
  getPlanFeatures,
  isUnlimited,
  type BillingPlan,
} from '@/lib/billing/plans'

describe('lib/billing/plans', () => {
  it('has all 4 plans defined', () => {
    const plans: BillingPlan[] = ['free', 'solo', 'team', 'agency']
    for (const p of plans) {
      expect(PLANS[p]).toBeDefined()
      expect(PLANS[p].id).toBe(p)
    }
  })

  it('free plan has zero-paid features', () => {
    const f = getPlanFeatures('free')
    expect(f.trendingSounds).toBe(false)
    expect(f.competitorAnalysis).toBe(false)
    expect(f.customBranding).toBe(false)
    expect(f.apiAccess).toBe(false)
  })

  it('agency plan has every feature', () => {
    const f = getPlanFeatures('agency')
    expect(f.backgroundMusic).toBe(true)
    expect(f.trendingSounds).toBe(true)
    expect(f.viralDiscovery).toBe(true)
    expect(f.whiteLabelReview).toBe(true)
    expect(f.apiAccess).toBe(true)
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

  it('agency has unlimited outputs/content', () => {
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
})
