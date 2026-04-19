import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Accessibility tests — axe-core runs against every public page.
 *
 * We scan for WCAG 2.1 A/AA violations, which covers the most impactful
 * issues (missing labels, color contrast, ARIA misuse). Level AAA is
 * intentionally excluded — it's aspirational and often impractical
 * without sacrificing design.
 *
 * When a test fails, `result.violations` lists each issue with a
 * `help` URL pointing at a plain-English explanation + fix. Treat
 * those URLs like stack traces: open, read, repair.
 *
 * Only scans pre-login public pages here — post-login scanning
 * requires an auth fixture which we haven't built yet. Adding one
 * later is the obvious next step.
 */

const PUBLIC_PAGES = [
  { name: 'landing', path: '/' },
  { name: 'login', path: '/login' },
  { name: 'signup', path: '/signup' },
  { name: 'magic-link', path: '/magic-link' },
  { name: 'help', path: '/help' },
  { name: 'privacy', path: '/privacy' },
  { name: 'terms', path: '/terms' },
  { name: 'pricing (landing anchor)', path: '/#pricing' },
]

test.describe('accessibility (axe-core)', () => {
  for (const { name, path } of PUBLIC_PAGES) {
    test(`${name} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(path)
      // Wait for the page to settle — axe misses dynamically-injected
      // elements if we scan the instant DOM. 500ms covers the typical
      // hydration + client-side flicker window for our Next app.
      await page.waitForLoadState('networkidle')

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        // Landing-page hero uses gradient backgrounds for decorative
        // text accents; the contrast rule flags those even though the
        // underlying body text is readable. Keep the rule on globally
        // but allow per-test opt-outs if it becomes noisy.
        .analyze()

      // Soft assertion pattern: log each violation so CI output is
      // actionable, then fail on non-zero.
      if (results.violations.length > 0) {
        for (const v of results.violations) {
          console.error(
            `[a11y:${name}] ${v.id} (${v.impact}) — ${v.help}\n  ${v.helpUrl}\n  ${v.nodes.length} node(s)`,
          )
        }
      }

      expect(results.violations, 'WCAG violations found').toEqual([])
    })
  }
})
