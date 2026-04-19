import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Flag behavior matters for real production rollouts — if this logic
 * silently regresses, we ship the wrong feature to users. Tests cover
 * the common shapes: off by default, simple enabled, percentage
 * rollouts, and user-level consistency.
 */

describe('lib/flags', () => {
  beforeEach(() => {
    // Each test resets the env + re-imports the module so the
    // module-level PARSED_FLAGS map picks up the new value.
    vi.resetModules()
    delete process.env.CLIPFLOW_FLAGS
  })

  it('is off by default when env var is unset', async () => {
    const { isFlagEnabled } = await import('@/lib/flags')
    expect(isFlagEnabled('new_onboarding')).toBe(false)
  })

  it('is on when the name is in the list (no percent = 100%)', async () => {
    process.env.CLIPFLOW_FLAGS = 'new_onboarding'
    const { isFlagEnabled } = await import('@/lib/flags')
    expect(isFlagEnabled('new_onboarding')).toBe(true)
  })

  it('respects percentage rollouts with a user ID', async () => {
    process.env.CLIPFLOW_FLAGS = 'new_onboarding:50'
    const { isFlagEnabled } = await import('@/lib/flags')
    let onCount = 0
    const total = 400
    for (let i = 0; i < total; i++) {
      if (isFlagEnabled('new_onboarding', `user-${i}`)) onCount++
    }
    // 50% rollout on a hashed distribution — allow ±15% tolerance
    // for the small sample size.
    expect(onCount).toBeGreaterThan(total * 0.35)
    expect(onCount).toBeLessThan(total * 0.65)
  })

  it('returns the same answer for the same user across calls', async () => {
    process.env.CLIPFLOW_FLAGS = 'new_onboarding:25'
    const { isFlagEnabled } = await import('@/lib/flags')
    const a = isFlagEnabled('new_onboarding', 'stable-user-id')
    const b = isFlagEnabled('new_onboarding', 'stable-user-id')
    expect(a).toBe(b)
  })

  it('is off when rollout is a percentage and no userId given', async () => {
    process.env.CLIPFLOW_FLAGS = 'new_onboarding:50'
    const { isFlagEnabled } = await import('@/lib/flags')
    expect(isFlagEnabled('new_onboarding')).toBe(false)
  })

  it('handles malformed percent tokens as fully on', async () => {
    process.env.CLIPFLOW_FLAGS = 'new_onboarding:notanumber'
    const { isFlagEnabled } = await import('@/lib/flags')
    expect(isFlagEnabled('new_onboarding')).toBe(true)
  })
})
