'use client'

import { useEffect } from 'react'

import {
  identifyUser,
  initPostHog,
  usePostHogPageView,
} from '@/lib/analytics/posthog-client'

/**
 * Bootstraps PostHog exactly once per browser tab and wires up the
 * App Router pageview tracker. Also identifies the logged-in user
 * as soon as we know who they are.
 *
 * Dropped into the app layout so every page inside `(app)/*` is
 * instrumented without page-level changes.
 *
 * Missing `NEXT_PUBLIC_POSTHOG_KEY` makes this component a no-op —
 * local dev and preview deploys keep working without config.
 */
export function PostHogProvider({
  userId,
  email,
  children,
}: {
  userId: string
  email: string
  children: React.ReactNode
}) {
  useEffect(() => {
    initPostHog()
    if (userId) identifyUser(userId, email || undefined)
  }, [userId, email])

  // Hook has to run inside a client-boundary — pulling it here keeps
  // the provider as the sole place App-Router pageviews live.
  usePostHogPageView()

  return <>{children}</>
}
