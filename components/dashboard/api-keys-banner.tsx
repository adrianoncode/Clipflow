import Link from 'next/link'
import { ArrowRight, KeyRound } from 'lucide-react'

interface ApiKeysBannerProps {
  connectedCount: number
  totalCount: number
  hasLlm: boolean
}

/**
 * Quiet nudge at the top of the dashboard to get users to connect
 * their remaining API keys. Only renders when at least one service
 * is missing — a fully-connected workspace sees nothing (no nagging).
 *
 * Two copy states:
 *   · no LLM yet      — critical, needs stronger framing
 *   · missing media   — optional, upsell tone
 */
export function ApiKeysBanner({
  connectedCount,
  totalCount,
  hasLlm,
}: ApiKeysBannerProps) {
  if (connectedCount >= totalCount) return null

  const missing = totalCount - connectedCount
  const severity = hasLlm ? 'optional' : 'critical'

  return (
    <Link
      href="/settings/ai-keys"
      className={
        severity === 'critical'
          ? 'group flex items-center gap-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-background to-background p-4 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md'
          : 'group flex items-center gap-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background p-4 transition-all hover:-translate-y-0.5 hover:border-primary/35'
      }
    >
      <div
        className={
          severity === 'critical'
            ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 ring-1 ring-amber-200'
            : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15'
        }
      >
        <KeyRound className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          API keys · {connectedCount}/{totalCount} connected
        </p>
        <p className="mt-0.5 text-sm font-semibold">
          {severity === 'critical'
            ? 'Connect an AI provider to start generating content'
            : `Connect ${missing === 1 ? '1 more service' : `${missing} more services`} to unlock rendering + voice`}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {severity === 'critical'
            ? 'OpenAI, Anthropic, or Google — pick one, each has free credits at signup.'
            : 'Each provider has a free tier. You only pay when you use them — at cost, no markup from us.'}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  )
}
