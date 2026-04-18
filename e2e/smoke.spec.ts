import { expect, test } from '@playwright/test'

/**
 * Smoke tests — minimum viable "the app boots and renders" checks.
 * These run against every PR and every deploy. If any of these fail,
 * the deploy is broken at a fundamental level (bad build, DB down,
 * env vars missing).
 *
 * Deliberately does NOT log in or touch the DB — smoke tests must
 * be runnable in any environment including CI with no secrets.
 */
test.describe('smoke', () => {
  test('landing page renders', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.ok()).toBe(true)

    // Should have a real page, not a white screen
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('login page renders + form is present', async ({ page }) => {
    await page.goto('/login')
    // Email field must exist — if this is missing, auth is broken
    await expect(page.getByLabel(/email/i).first()).toBeVisible()
    await expect(page.getByLabel(/password/i).first()).toBeVisible()
  })

  test('signup page renders', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByLabel(/email/i).first()).toBeVisible()
  })

  test('magic-link page renders', async ({ page }) => {
    await page.goto('/magic-link')
    await expect(page.getByLabel(/email/i).first()).toBeVisible()
  })

  test('protected route redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard')
    // Middleware should have redirected us to /login with ?next=/dashboard
    await expect(page).toHaveURL(/\/login/)
  })

  test('legal pages are reachable', async ({ page }) => {
    for (const path of ['/privacy', '/terms', '/cookies', '/dmca', '/imprint']) {
      const response = await page.goto(path)
      expect(response?.ok(), `${path} should return 2xx`).toBe(true)
    }
  })

  test('admin route 404s for unauthenticated visitors', async ({ page }) => {
    const response = await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    // Non-admin visitors get redirected OR 404'd — anything except 2xx OK
    expect([404, 401, 302, 307].includes(response?.status() ?? 200)).toBeTruthy()
  })
})
