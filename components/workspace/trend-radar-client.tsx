'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'

import { analyzeTrendsAction } from '@/app/(app)/workspace/[id]/trends/actions'

interface TrendRadarClientProps {
  workspaceId: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      {pending ? 'Scanning trends...' : 'Find trends'}
    </button>
  )
}

function LoadingSkeletons() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}

export function TrendRadarClient({ workspaceId }: TrendRadarClientProps) {
  const [state, formAction] = useFormState(analyzeTrendsAction, null)

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4 rounded-lg border bg-card p-4">
        <input type="hidden" name="workspaceId" value={workspaceId} />

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1.5">
            <label htmlFor="niche" className="text-sm font-medium">
              Your content niche
            </label>
            <input
              id="niche"
              name="niche"
              type="text"
              placeholder="e.g. productivity, fitness, personal finance, cooking"
              required
              minLength={3}
              maxLength={200}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="geo" className="text-sm font-medium">
              Region
            </label>
            <select
              id="geo"
              name="geo"
              defaultValue="US"
              className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="Global">Global</option>
            </select>
          </div>
        </div>

        <SubmitButton />
      </form>

      <PendingOverlay />

      {state && !state.ok && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {state && state.ok && (
        <TrendResults state={state as SuccessState} workspaceId={workspaceId} />
      )}
    </div>
  )
}

function PendingOverlay() {
  const { pending } = useFormStatus()
  if (!pending) return null
  return <LoadingSkeletons />
}

type SuccessState = {
  ok: true
  niche: string
  trends: Array<{
    trend: {
      title: string
      description: string | null
      url: string | null
      source: 'google_trends' | 'youtube'
    }
    relevanceScore: number
    contentAngle: string
    isRelevant: boolean
  }>
  contentIdeas: string[]
  trendSummary: string
  geo: string
  fetchedAt: string
}

function TrendResults({
  state,
  workspaceId,
}: {
  state: SuccessState
  workspaceId: string
}) {
  const relevantTrends = state.trends.filter((t) => t.isRelevant)
  const otherTrends = state.trends.filter((t) => !t.isRelevant)

  return (
    <div className="space-y-6">
      {state.trendSummary && (
        <div className="rounded-lg border bg-muted/50 px-4 py-3">
          <p className="text-sm italic text-muted-foreground">{state.trendSummary}</p>
        </div>
      )}

      {state.contentIdeas.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Content Ideas</h2>
          <ol className="space-y-2">
            {state.contentIdeas.map((idea, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-md border bg-card px-4 py-3"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm">{idea}</span>
                <Link
                  href={`/workspace/${workspaceId}/ghostwriter`}
                  className="shrink-0 text-xs text-muted-foreground hover:text-primary"
                >
                  Use in Ghostwriter →
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      {relevantTrends.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">
            Relevant Trends{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({relevantTrends.length} matched your niche)
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relevantTrends.map((item) => (
              <TrendCard key={item.trend.title} item={item} />
            ))}
          </div>
        </div>
      )}

      {otherTrends.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-muted-foreground">
            Other trending topics{' '}
            <span className="text-sm font-normal">({otherTrends.length} less relevant)</span>
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
            {otherTrends.map((item) => (
              <TrendCard key={item.trend.title} item={item} dimmed />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TrendCard({
  item,
  dimmed = false,
}: {
  item: {
    trend: {
      title: string
      description: string | null
      url: string | null
      source: 'google_trends' | 'youtube'
    }
    relevanceScore: number
    contentAngle: string
    isRelevant: boolean
  }
  dimmed?: boolean
}) {
  const score = item.relevanceScore
  const borderColor = dimmed
    ? 'border-border'
    : score >= 70
      ? 'border-green-500/60'
      : 'border-amber-500/60'

  return (
    <div className={`rounded-lg border-2 bg-card p-3 ${borderColor} space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight">{item.trend.title}</span>
        {!dimmed && (
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
              score >= 70
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}
          >
            {score}
          </span>
        )}
      </div>

      {item.contentAngle && !dimmed && (
        <p className="text-xs text-muted-foreground">{item.contentAngle}</p>
      )}

      {item.trend.description && (
        <p className="text-xs text-muted-foreground">{item.trend.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          Google Trends
        </span>
        {item.trend.url && (
          <a
            href={item.trend.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View ↗
          </a>
        )}
      </div>
    </div>
  )
}
