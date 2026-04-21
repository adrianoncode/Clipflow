'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, AlertCircle, Download, ExternalLink, Zap } from 'lucide-react'

import { formatRenderKind } from '@/lib/video/renders/types'
import type { RenderRow } from '@/lib/video/renders/types'

interface RenderHistoryPanelProps {
  initialRenders: RenderRow[]
}

/**
 * Displays persisted render jobs with live status polling for any that
 * are still "rendering". Once a render resolves, the row swaps to show
 * a download link + external-open button. The DB is the source of
 * truth — the /api/video/render-status poll updates it server-side,
 * and we re-fetch the row locally so the user sees the change.
 *
 * Priority queue (Studio): when any in-flight render is priority='high'
 * we drop the poll cadence from 4s → 2s for the whole panel. Studio
 * users see their video flip to "Ready" roughly twice as fast — the
 * real end-to-end latency is dominated by Shotstack, but the time-to-
 * surface-the-result is ours to control.
 */
export function RenderHistoryPanel({ initialRenders }: RenderHistoryPanelProps) {
  const [renders, setRenders] = useState(initialRenders)

  useEffect(() => {
    const pending = renders.filter((r) => r.status === 'rendering')
    if (pending.length === 0) return
    const pollMs = pending.some((r) => r.priority === 'high') ? 2000 : 4000

    const interval = setInterval(async () => {
      const results = await Promise.all(
        pending.map(async (r) => {
          if (!r.provider_render_id) return null
          try {
            const res = await fetch(
              `/api/video/render-status?id=${encodeURIComponent(r.provider_render_id)}&workspace_id=${encodeURIComponent(r.workspace_id)}`,
            )
            if (!res.ok) return null
            const data = (await res.json()) as {
              status: 'rendering' | 'done' | 'failed'
              url?: string
              error?: string
            }
            return {
              id: r.id,
              status: data.status,
              url: data.url ?? null,
              error: data.error ?? null,
            }
          } catch {
            return null
          }
        }),
      )

      setRenders((prev) =>
        prev.map((row) => {
          const update = results.find((u) => u && u.id === row.id)
          if (!update || update.status === 'rendering') return row
          return {
            ...row,
            status: update.status,
            url: update.url ?? row.url,
            error: update.error ?? row.error,
          }
        }),
      )
    }, pollMs)

    return () => clearInterval(interval)
  }, [renders])

  if (renders.length === 0) return null

  return (
    <div className="rounded-2xl border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Rendered videos
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/60">
            · {renders.length}
          </span>
        </div>
      </div>
      <ul className="divide-y divide-border/50">
        {renders.map((r) => (
          <RenderRow key={r.id} render={r} />
        ))}
      </ul>
    </div>
  )
}

function RenderRow({ render: r }: { render: RenderRow }) {
  const meta = r.metadata as Record<string, unknown>
  const aspect = typeof meta.aspectRatio === 'string' ? meta.aspectRatio : null

  const isRendering = r.status === 'rendering'
  const isDone = r.status === 'done' && r.url
  const isFailed = r.status === 'failed'

  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <div
        className={
          isDone
            ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15'
            : isRendering
              ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary/60'
              : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive'
        }
      >
        {isRendering ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFailed ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{formatRenderKind(r.kind)}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{r.provider}</span>
          {aspect ? (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span>{aspect}</span>
            </>
          ) : null}
          <span className="text-muted-foreground/40">·</span>
          <span>
            {isRendering
              ? 'Rendering'
              : isDone
                ? 'Ready'
                : 'Failed'}
          </span>
          {r.priority === 'high' ? (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
                style={{ background: '#F3FFD6', color: '#495C0F' }}
                title="Studio priority queue — polled twice as fast"
              >
                <Zap className="h-2.5 w-2.5" />
                Priority
              </span>
            </>
          ) : null}
        </p>
      </div>
      {isDone && r.url ? (
        <div className="flex shrink-0 items-center gap-1">
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center justify-center rounded-md border border-border/60 bg-background px-3 text-xs font-medium text-foreground transition-all hover:border-primary/30 hover:bg-primary/[0.03]"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            Open
          </a>
          <a
            href={r.url}
            download
            className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            <Download className="mr-1 h-3 w-3" />
            MP4
          </a>
        </div>
      ) : isFailed ? (
        <span className="max-w-[180px] truncate text-[11px] text-destructive">
          {r.error ?? 'Render failed'}
        </span>
      ) : null}
    </li>
  )
}
