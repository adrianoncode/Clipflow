'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, RefreshCcw } from 'lucide-react'

import { refreshWorkspaceStatsAction } from '@/app/(app)/analytics/actions'

interface RefreshStatsButtonProps {
  workspaceId: string
  lastFetchedAt: string | null
  /** Workspace role — only owners + editors can actually refresh. Kept
   *  as a loose string so callers can pass the wider WorkspaceRole union
   *  (owner / editor / reviewer / client) without a narrow cast. */
  role: string
}

/**
 * Sits next to the Analytics H1. Lets owners/editors force-pull fresh
 * engagement numbers without waiting for the every-3h cron. Respects
 * the server-side 5-minute cooldown — the button disables + shows the
 * remaining seconds when we bump into it.
 */
export function RefreshStatsButton({
  workspaceId,
  lastFetchedAt,
  role,
}: RefreshStatsButtonProps) {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)

  const canRefresh = role === 'owner' || role === 'editor'
  const inCooldown = cooldownUntil !== null && Date.now() < cooldownUntil
  const disabled = !canRefresh || pending || inCooldown

  function onClick() {
    setMessage(null)
    start(async () => {
      const r = await refreshWorkspaceStatsAction(workspaceId)
      if (r.ok) {
        setMessage(
          r.fetched === 0
            ? 'Nothing to refresh yet — no published posts on record.'
            : `Refreshed ${r.fetched} post${r.fetched === 1 ? '' : 's'}${
                r.failed ? `, ${r.failed} failed` : ''
              }.`,
        )
        setCooldownUntil(Date.now() + 5 * 60 * 1000)
      } else {
        setMessage(r.error ?? 'Refresh failed.')
        if (r.cooldownMs) setCooldownUntil(Date.now() + r.cooldownMs)
      }
    })
  }

  const lastLabel = lastFetchedAt
    ? `Last update · ${new Date(lastFetchedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })}`
    : 'Auto-refreshes every 3 hours.'

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={
          !canRefresh
            ? 'Owner or editor role required'
            : inCooldown
              ? 'Cooldown — try again soon'
              : 'Pull latest views, likes, and comments'
        }
        className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[12.5px] font-semibold transition-colors disabled:opacity-60"
        style={{
          borderColor: '#E5DDCE',
          background: '#FFFDF8',
          color: '#0F0F0F',
        }}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCcw className="h-3.5 w-3.5" />
        )}
        {pending
          ? 'Pulling…'
          : !canRefresh
            ? 'Refresh (owners only)'
            : inCooldown
              ? 'In cooldown'
              : 'Refresh now'}
      </button>
      <p className="font-mono text-[10px]" style={{ color: '#7c7468' }}>
        {lastLabel}
      </p>
      {message ? (
        <p
          className="flex items-center gap-1 text-[11px] font-medium"
          style={{ color: message.startsWith('Refreshed') ? '#0F6B4D' : '#9B2018' }}
        >
          {message.startsWith('Refreshed') ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : null}
          {message}
        </p>
      ) : null}
    </div>
  )
}
