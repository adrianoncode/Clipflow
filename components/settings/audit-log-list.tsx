'use client'

import { useMemo, useState } from 'react'
import { Filter } from 'lucide-react'

import { formatAuditAction } from '@/lib/audit/actions'

interface AuditRow {
  id: string
  action: string
  actor_id: string | null
  actor_email: string | null
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  ip: string | null
  created_at: string
}

/**
 * Owner-facing audit log table.
 *
 * Two bits of interactivity worth keeping on the client:
 *   1. Filter chips — collapse to a single category (members, content,
 *      billing) without re-fetching from the server. The full set of
 *      rows is small (200) so client-side filtering is fine.
 *   2. Inline metadata viewer — clicking a row expands to show the full
 *      metadata blob. Most rows have one or two keys; this saves a round
 *      trip when an owner is looking for "what did this change mean?".
 */
export function AuditLogList({ rows }: { rows: AuditRow[] }) {
  const [filter, setFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const buckets = useMemo(() => {
    const map: Record<string, number> = { all: rows.length }
    for (const r of rows) {
      const bucket = r.action.split('.')[0] ?? 'other'
      map[bucket] = (map[bucket] ?? 0) + 1
    }
    return map
  }, [rows])

  const filtered = filter === 'all'
    ? rows
    : rows.filter((r) => r.action.startsWith(`${filter}.`))

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
        No audit events yet. Actions taken in this workspace (invites, approvals,
        publishes, key rotations) will show up here.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Filter chips ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Filter className="h-3.5 w-3.5 text-muted-foreground/50" />
        {Object.entries(buckets).map(([bucket, count]) => (
          <button
            key={bucket}
            type="button"
            onClick={() => setFilter(bucket)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors ${
              filter === bucket
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            }`}
          >
            {bucket} · {count}
          </button>
        ))}
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <ul className="divide-y divide-border/50">
          {filtered.map((row) => {
            const isOpen = expanded === row.id
            const metaKeys = row.metadata ? Object.keys(row.metadata) : []
            const hasMeta = metaKeys.length > 0
            const when = new Date(row.created_at)
            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => (hasMeta ? setExpanded(isOpen ? null : row.id) : undefined)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                    hasMeta ? 'hover:bg-muted/30' : 'cursor-default'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {formatAuditAction(row.action)}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span>{row.actor_email ?? 'system'}</span>
                      {row.target_type ? (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span>
                            {row.target_type}
                            {row.target_id ? ` · ${row.target_id.slice(0, 8)}` : ''}
                          </span>
                        </>
                      ) : null}
                      {row.ip ? (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span>{row.ip}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground/80">
                    {when.toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </button>
                {isOpen && hasMeta ? (
                  <div className="border-t border-border/40 bg-muted/20 px-4 py-3">
                    <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-muted-foreground">
                      {JSON.stringify(row.metadata, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
