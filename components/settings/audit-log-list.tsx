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
    return <AuditLogEmptyPreview />
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
                ? 'bg-[#0F0F0F] text-[#F4D93D]'
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
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">
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

/**
 * Empty-state preview for the audit log. Shows three faux events
 * (invite, approval, publish) so an owner reads the populated shape
 * — mono-spaced timestamps, action chips, actor avatars — instead
 * of just a "nothing here" paragraph. The first row pulses on a
 * muted lime halo to suggest "this is where new events land".
 */
function AuditLogEmptyPreview() {
  const ghosts = [
    {
      time: '14:32',
      bucket: 'members',
      bucketBg: 'bg-violet-50',
      bucketFg: 'text-violet-700',
      action: 'Member invited',
      actor: 'AB',
      actorBg: 'bg-violet-100 text-violet-700',
      detail: 'sarah@acme.co · editor role',
      pulse: true,
    },
    {
      time: '14:28',
      bucket: 'content',
      bucketBg: 'bg-emerald-50',
      bucketFg: 'text-emerald-700',
      action: 'Draft approved',
      actor: 'JL',
      actorBg: 'bg-emerald-100 text-emerald-700',
      detail: 'Hook — "The 3 metrics…" · TikTok',
      pulse: false,
    },
    {
      time: '14:11',
      bucket: 'billing',
      bucketBg: 'bg-amber-50',
      bucketFg: 'text-amber-700',
      action: 'Plan changed',
      actor: 'AB',
      actorBg: 'bg-amber-100 text-amber-700',
      detail: 'Free → Creator (monthly)',
      pulse: false,
    },
  ]
  return (
    <div
      className="cf-audit-empty relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5"
      style={{
        boxShadow:
          '0 1px 0 rgba(255,255,255,.7) inset, 0 1px 2px rgba(15,15,15,.04), 0 14px 32px -18px rgba(15,15,15,.18)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(15,15,15,.32), transparent)',
        }}
      />
      <div className="mb-4 flex items-baseline justify-between">
        <p
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: '#5f5850', fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background: '#F4D93D',
              boxShadow: '0 0 8px rgba(214,255,62,.7)',
            }}
          />
          What lands here
        </p>
        <p className="text-[11px]" style={{ color: 'rgba(95,88,80,.7)' }}>
          Invites · approvals · publishes · key rotations
        </p>
      </div>
      <ul className="space-y-2" aria-hidden>
        {ghosts.map((g, i) => (
          <li
            key={i}
            className={`relative flex items-center gap-3 rounded-xl border border-border/40 bg-card px-3.5 py-2.5 ${
              g.pulse ? 'cf-audit-empty-pulse' : ''
            }`}
            style={{ opacity: 1 - i * 0.18 }}
          >
            <span
              className="lv2-tabular w-12 shrink-0 text-[10.5px]"
              style={{
                color: '#5f5850',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              {g.time}
            </span>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${g.actorBg}`}
            >
              {g.actor}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p
                  className="truncate text-[12.5px] font-semibold"
                  style={{ color: '#181511' }}
                >
                  {g.action}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em] ${g.bucketBg} ${g.bucketFg}`}
                >
                  {g.bucket}
                </span>
              </div>
              <p
                className="truncate text-[11px]"
                style={{ color: 'rgba(95,88,80,.85)' }}
              >
                {g.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p
        className="mt-4 text-center text-[12px]"
        style={{ color: 'rgba(95,88,80,.85)' }}
      >
        No audit events yet — actions you take in this workspace will start filling this list.
      </p>
      <style jsx>{`
        @keyframes cf-audit-pulse {
          0%,
          100% {
            box-shadow:
              0 1px 0 rgba(255, 255, 255, 0.55) inset,
              0 1px 2px rgba(24, 21, 17, 0.04);
          }
          50% {
            box-shadow:
              0 1px 0 rgba(255, 255, 255, 0.55) inset,
              0 0 0 1px rgba(214, 255, 62, 0.4),
              0 0 14px -2px rgba(214, 255, 62, 0.4);
          }
        }
        .cf-audit-empty-pulse {
          animation: cf-audit-pulse 3.2s
            cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cf-audit-empty-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
