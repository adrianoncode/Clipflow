import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration — headless E2E tests against a live dev server.
 *
 * Usage:
 *   pnpm exec playwright install chromium  (one-time, downloads browser)
 *   pnpm test:e2e                           (runs all e2e tests)
 *   pnpm test:e2e --ui                      (interactive debugger)
 *
 * In CI: set CI=1 to get failures-only reporting and retries.
 */
export default defineConfig({
  testDir: './e2e',

  // Run tests serially by default — parallelism complicates login state
  // in cookie-based auth flows. Override with `--workers=4` locally.
  fullyParallel: false,
  workers: 1,

  // Fail fast on CI; locally allow flakes for dev iteration.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start the dev server before running tests (local only).
  // On CI, tests run against a built + started Vercel preview URL
  // passed in via E2E_BASE_URL, so we skip the dev server.
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
