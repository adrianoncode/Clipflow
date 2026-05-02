'use client'

import { useEffect } from 'react'

import {
  initPostHog,
  usePostHogPageView,
} from '@/lib/analytics/posthog-client'
import { registerWebVitals } from '@/lib/analytics/web-vitals'

/**
 * Marketing-side analytics shell. Mirrors the (app)/PostHogProvider
 * but without identification — visitors on the landing pages, compare
 * pages, playbook, etc. are anonymous until they sign up.
 *
 * Why a separate provider: the in-app PostHogProvider only mounts
 * inside `(app)/*`, so without this the highest-traffic surfaces
 * (homepage, /compare/*, /features/*) wouldn't be instrumented at
 * all — and that's exactly where Core Web Vitals matter most for
 * SEO ranking signals.
 *
 * Missing `NEXT_PUBLIC_POSTHOG_KEY` → no-op (init returns early).
 * Mounted inside `app/layout.tsx` via Suspense so it never blocks
 * paint and stays out of the LCP critical path.
 */
export function MarketingAnalytics() {
  useEffect(() => {
    initPostHog()
    registerWebVitals()
  }, [])

  // App-Router pageviews — needs to run inside a client boundary.
  usePostHogPageView()

  return null
}
