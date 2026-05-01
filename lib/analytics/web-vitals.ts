'use client'

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'
import posthog from 'posthog-js'

/**
 * Real-User Monitoring of Core Web Vitals — fires on every page-view
 * and pipes the LCP / INP / CLS / TTFB / FCP samples into PostHog so
 * we can correlate slow surfaces with funnel drop-off.
 *
 * Why PostHog and not Vercel Speed Insights / GA4: we already pay for
 * PostHog session replays, so attaching a vitals sample to a session
 * means a slow LCP report can be opened directly into the recording
 * that triggered it.
 *
 * Naming: events use the `web_vital_*` namespace and a flat property
 * shape (`name`, `value`, `rating`, `id`, `path`) so a single PostHog
 * insight can group across all five metrics. CLS is multiplied by
 * 1000 so the value column is integer-comparable across metrics.
 */

interface VitalProps {
  name: Metric['name']
  value: number
  rating: Metric['rating']
  id: string
  navigation_type: string
  path: string
}

function send(metric: Metric) {
  if (typeof window === 'undefined') return
  // PostHog __loaded check — avoid throwing before init().
  const ph = posthog as unknown as { __loaded?: boolean }
  if (!ph.__loaded) return

  const payload: VitalProps = {
    name: metric.name,
    // CLS is reported as a unit-less ratio (typically 0.001 – 0.5);
    // multiply by 1000 so PostHog dashboards can show it on the same
    // axis as the millisecond metrics.
    value: metric.name === 'CLS' ? Math.round(metric.value * 1000) : Math.round(metric.value),
    rating: metric.rating,
    id: metric.id,
    navigation_type: metric.navigationType ?? 'navigate',
    path: window.location.pathname,
  }

  posthog.capture('web_vital', payload)

  // Also fire a per-metric event so dashboards can pivot without
  // filtering. Cheap on PostHog quota and saves analyst friction.
  posthog.capture(`web_vital_${metric.name.toLowerCase()}`, payload)
}

let registered = false

/**
 * Idempotent — calling more than once per page-load is a no-op so the
 * PostHogProvider can re-mount safely (e.g. on workspace switch).
 */
export function registerWebVitals() {
  if (typeof window === 'undefined') return
  if (registered) return
  registered = true

  onCLS(send)
  onINP(send)
  onLCP(send)
  onFCP(send)
  onTTFB(send)
}
