'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TranscriptView } from '@/components/content/transcript-view'

/** Tab keys used across the content-detail sub-views. */
export type ContentDetailTab = 'overview' | 'generate' | 'tools'

const TABS: { key: ContentDetailTab; label: string; badge?: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'generate', label: 'Generate' },
  { key: 'tools', label: 'AI Tools', badge: '8' },
]

export function TabNav({
  active,
  onChange,
}: {
  active: ContentDetailTab
  onChange: (t: ContentDetailTab) => void
}) {
  return (
    <nav className="flex items-center gap-1" aria-label="Content sections">
      {TABS.map((t) => {
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            aria-pressed={isActive}
            className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
            }`}
          >
            {isActive && (
              <span
                aria-hidden
                className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary"
              />
            )}
            {t.label}
            {t.badge && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground/60'
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

export interface ToolCardProps {
  icon: React.ReactNode
  label: string
  description: string
  href: string
  /** When set, the card shows a lock + upsell pill and routes to
   * /billing with the feature name preserved instead of the tool's
   * real page. Keeps us from leading users into server actions that
   * will 403 on their plan. */
  locked?: { requiredPlan: string; feature: string }
}

export function ToolCard({ icon, label, description, href, locked }: ToolCardProps) {
  const effectiveHref = locked
    ? `/billing?plan=${locked.requiredPlan}&feature=${locked.feature}`
    : href
  return (
    <Link
      href={effectiveHref}
      className={`relative flex flex-col gap-2 rounded-xl border border-border/50 bg-card p-4 transition-all card-hover hover:text-foreground ${
        locked ? 'text-muted-foreground opacity-80' : 'text-muted-foreground'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          {icon}
        </span>
        <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
        {locked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            {locked.requiredPlan === 'agency' ? 'Studio' : 'Creator'}
          </span>
        )}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
    </Link>
  )
}

/**
 * Transcript with show-more collapse when longer than 500 chars.
 */
export function CollapsibleTranscript({
  text,
  workspaceId,
  contentId,
}: {
  text: string
  workspaceId: string
  contentId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const needsCollapse = text.length > 500

  if (!needsCollapse || expanded) {
    return (
      <div className="space-y-2">
        <TranscriptView text={text} workspaceId={workspaceId} contentId={contentId} />
        {needsCollapse && expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Collapse transcript
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Transcript
      </h2>
      <div className="relative rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">
        <p className="whitespace-pre-wrap break-words">{text.slice(0, 500)}...</p>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-muted/30 to-transparent rounded-b-md" />
      </div>
      <button
        onClick={() => setExpanded(true)}
        className="text-xs font-medium text-primary hover:underline"
      >
        Show full transcript
      </button>
    </div>
  )
}

/** Formats ISO string as locale-aware date+time. */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

/** Safely reads metadata.error.message from a content_items row. */
export function readErrorMessage(metadata: unknown): string {
  const m = metadata
  if (
    m &&
    typeof m === 'object' &&
    'error' in m &&
    m.error &&
    typeof m.error === 'object' &&
    'message' in m.error &&
    typeof m.error.message === 'string'
  ) {
    return m.error.message
  }
  return 'Transcription failed for an unknown reason.'
}
