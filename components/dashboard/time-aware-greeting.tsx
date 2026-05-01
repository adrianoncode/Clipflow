'use client'

import { useEffect, useState } from 'react'

/**
 * Time-aware Hero greeting — replaces the static "Welcome back, X."
 * with a phrase that shifts through the day. Crextio voice: terse,
 * single-word, no exclamation marks. The shift feels like the app
 * "knows" you've returned, even though the underlying mechanic is
 * just `new Date().getHours()`.
 *
 * Hydration strategy: we render the SSR fallback "Welcome back"
 * synchronously (avoids a hydration mismatch warning), then swap to
 * the time-aware string in a useEffect. The flash is ~30-50ms and
 * imperceptible after the first dashboard load when the JS is
 * already cached.
 *
 * Why client-side and not server-side: the server can't know the
 * user's local hour without an explicit profile timezone. We could
 * fetch it from the profile, but that's two round-trips for a feel-
 * good detail. Client-side keeps it simple and accurate.
 */

const FALLBACK = 'Welcome back'

function pickGreeting(hour: number): string {
  // Buckets are roughly aligned with how creators describe their day
  // — "morning grind" (5–11), "afternoon block" (12–16), "evening
  // wrap" (17–21), "late session" (22–4). Single-word phrases match
  // the editorial Crextio voice: serif headline, no fluff.
  if (hour < 5) return 'Late one'
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  if (hour < 22) return 'Evening'
  return 'Late one'
}

export function TimeAwareGreeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState<string>(FALLBACK)

  useEffect(() => {
    setGreeting(pickGreeting(new Date().getHours()))
  }, [])

  return (
    <>
      {greeting}, {name}.
    </>
  )
}
