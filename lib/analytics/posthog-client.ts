'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

import type { AnalyticsEvent } from '@/lib/analytics/events'

/**
 * Client-side PostHog bootstrap.
 *
 * Initialized once on mount in the app layout. Opt-in via
 * `NEXT_PUBLIC_POSTHOG_KEY` — missing key means the whole tracking
 * stack no-ops (useful for local dev and preview deploys).
 *
 * Identification happens separately via `identifyUser()` once auth
 * resolves — this file only sets up the singleton.
 */
export function initPostHog() {
  if (typeof window === 'undefined') return
  if (isLoaded()) return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return

  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    capture_pageview: false, // we handle it manually for App Router
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true,
    },
    persistence: 'localStorage+cookie',
  })
}

/** PostHog sets a `__loaded` property after init completes. It's not on
 * the public types so we cast once here and keep the casts out of
 * every call-site. */
function isLoaded(): boolean {
  return (posthog as unknown as { __loaded?: boolean }).__loaded === true
}

/**
 * Standalone pageview tracker for the App Router. Next 14 doesn't fire
 * a navigation event PostHog's auto-capture knows about, so we listen
 * on pathname + searchParams and capture `$pageview` ourselves.
 */
export function usePostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isLoaded()) return
    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams])
}

/**
 * Tie the anonymous PostHog session to the logged-in user so downstream
 * events attribute correctly. Pass `email` as a person property so the
 * dashboard funnels can segment by domain without hitting Supabase.
 */
export function identifyUser(userId: string, email?: string) {
  if (typeof window === 'undefined') return
  if (!isLoaded()) return
  posthog.identify(userId, email ? { email } : undefined)
}

/** Fire a named business event — always via this wrapper so call-sites
 * don't reach for the global posthog and we get compile-time safety on
 * the event names. */
export function track(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
) {
  if (typeof window === 'undefined') return
  if (!isLoaded()) return
  posthog.capture(event, properties)
}
