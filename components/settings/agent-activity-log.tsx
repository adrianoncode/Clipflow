'use client'

import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Clock,
  Bot,
  MessageCircle,
} from 'lucide-react'

interface AgentActivityLogProps {
  runs: Array<Record<string, unknown>>
}

const STATUS_CONFIG: Record<
  string,
  { Icon: typeof CheckCircle2; tone: string; label: string }
> = {
  complete: { Icon: CheckCircle2, tone: 'text-emerald-600', label: 'Complete' },
  failed: { Icon: XCircle, tone: 'text-red-500', label: 'Failed' },
  budget_exceeded: { Icon: AlertTriangle, tone: 'text-amber-500', label: 'Budget exceeded' },
  running: { Icon: Loader2, tone: 'text-blue-500', label: 'Running' },
  waiting_external: { Icon: Clock, tone: 'text-amber-500', label: 'Waiting' },
  queued: { Icon: Clock, tone: 'text-muted-foreground', label: 'Queued' },
  cancelled: { Icon: XCircle, tone: 'text-muted-foreground', label: 'Cancelled' },
}

function formatCost(microUsd: number): string {
  const dollars = microUsd / 1_000_000
  if (dollars >= 0.01) return `$${dollars.toFixed(2)}`
  return `$${dollars.toFixed(4)}`
}

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return '—'
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime()
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms / 60_000)}m`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  if (diffMs < 60_000) return 'just now'
  if (diffMs < 3600_000) return `${Math.round(diffMs / 60_000)}m ago`
  if (diffMs < 86400_000) return `${Math.round(diffMs / 3600_000)}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function triggerLabel(trigger: unknown): string {
  if (!trigger || typeof trigger !== 'object') return '—'
  const t = trigger as Record<string, unknown>
  if (t.source === 'user_message') return 'Chat'
  if (typeof t.trigger === 'string') {
    const names: Record<string, string> = {
      auto_process: 'Auto-Process',
      auto_highlights: 'Auto-Highlights',
      auto_drafts: 'Auto-Drafts',
      auto_schedule: 'Auto-Schedule',
    }
    return names[t.trigger] ?? t.trigger
  }
  return '—'
}

export function AgentActivityLog({ runs }: AgentActivityLogProps) {
  if (runs.length === 0) {
    return (
      <div className="px-5 py-8 text-center sm:px-6">
        <Bot className="mx-auto mb-2 h-5 w-5 text-muted-foreground/40" aria-hidden />
        <p className="text-sm text-muted-foreground">
          No agent runs yet. Start a chat or enable auto-pilot above.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border/60">
      {/* Header */}
      <div className="hidden items-center gap-3 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 sm:flex sm:px-6">
        <div className="w-6" />
        <div className="flex-1">Trigger</div>
        <div className="w-16 text-right">Tools</div>
        <div className="w-20 text-right">Cost</div>
        <div className="w-16 text-right">Duration</div>
        <div className="w-20 text-right">When</div>
      </div>

      {runs.map((run) => {
        const status = (run.status as string) ?? 'queued'
        const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.queued!
        const KindIcon = (run.kind as string) === 'autopilot' ? Bot : MessageCircle

        return (
          <div
            key={run.id as string}
            className="group relative flex items-center gap-3 px-5 py-3 transition-colors hover:bg-primary/[0.02] sm:px-6"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 top-1/2 h-8 w-[2px] -translate-y-1/2 bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />

            <div className="flex w-6 items-center justify-center">
              <config.Icon
                className={`h-4 w-4 ${config.tone} ${status === 'running' ? 'animate-spin' : ''}`}
                aria-hidden
              />
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-2">
              <KindIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
              <span className="truncate text-[13px] font-medium text-foreground">
                {triggerLabel(run.trigger)}
              </span>
              <span className={`text-[11px] ${config.tone}`}>{config.label}</span>
              {run.error ? (
                <span className="hidden truncate text-[11px] text-red-500/80 sm:inline" title={run.error as string}>
                  {(run.error as string).slice(0, 60)}
                </span>
              ) : null}
            </div>

            <div className="hidden w-16 text-right text-[12.5px] tabular-nums text-muted-foreground sm:block">
              {(run.total_tool_calls as number) ?? 0}
            </div>
            <div className="hidden w-20 text-right text-[12.5px] tabular-nums text-muted-foreground sm:block">
              {formatCost(Number(run.total_cost_micro_usd ?? 0))}
            </div>
            <div className="hidden w-16 text-right text-[12.5px] tabular-nums text-muted-foreground sm:block">
              {formatDuration(run.started_at as string, run.ended_at as string | null)}
            </div>
            <div className="w-20 text-right text-[12px] text-muted-foreground/70">
              {formatTime(run.started_at as string)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
