'use client'

import { Clock } from 'lucide-react'

/**
 * Mono kicker that surfaces "all times in <workspace TZ>" — solves the
 * cross-team confusion where a user in Berlin viewing a US client's
 * workspace sees post times in their browser TZ without knowing the
 * post actually publishes in the workspace's TZ.
 *
 * Compares the workspace TZ to the browser's resolved TZ. If they
 * match, the label is hidden (no value-add). If they differ, the
 * label spells out the workspace TZ in IANA form + the browser's
 * offset so the user can do the math.
 */
export function TimezoneLabel({ workspaceTimezone }: { workspaceTimezone: string }) {
  // Server-render-safe: Intl can throw on bad IANA strings, fall
  // back to UTC silently.
  let workspaceTz = workspaceTimezone
  try {
    workspaceTz = Intl.DateTimeFormat(undefined, { timeZone: workspaceTimezone })
      .resolvedOptions()
      .timeZone
  } catch {
    workspaceTz = 'UTC'
  }

  let browserTz = 'UTC'
  try {
    browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    /* no-op — keep UTC default */
  }

  // No need to surface when they match — the user's local time IS the
  // workspace's published time.
  if (browserTz === workspaceTz) return null

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground"
      style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
      title={`Workspace timezone: ${workspaceTz}. Your browser: ${browserTz}.`}
    >
      <Clock className="h-3 w-3" aria-hidden />
      Times in {workspaceTz}
    </span>
  )
}
