'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check, ChevronDown, Circle, Compass } from 'lucide-react'

import type { Guide, LearningPath } from '@/lib/landing/playbook-types'
import { getReadGuides } from './progress-store'

/**
 * Path-aware sidebar. Two modes:
 *   - On a guide page where a `path` was passed, renders that path's
 *     guide list with checkmarks for what the user has read.
 *   - Otherwise (hub page or guide with no active path), renders a
 *     compact list of all paths the user can pick.
 *
 * Read-state is local-storage only — no account needed. See
 * progress-store.ts for the storage contract.
 */

interface PlaybookPathSidebarProps {
  paths: LearningPath[]
  guidesById: Record<string, Guide>
  /** Active path on a guide page, if any. */
  activePathId?: string | null
  /** Slug of the currently-open guide, for the active marker. */
  currentSlug?: string
}

export function PlaybookPathSidebar({
  paths,
  guidesById,
  activePathId,
  currentSlug,
}: PlaybookPathSidebarProps) {
  const activePath = paths.find((p) => p.id === activePathId) ?? null
  const [readSet, setReadSet] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setReadSet(getReadGuides())
    // Re-sync if another tab updates progress (or this tab marks a
    // guide read on scroll).
    function onStorage() { setReadSet(getReadGuides()) }
    window.addEventListener('storage', onStorage)
    window.addEventListener('clipflow:playbook-progress', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('clipflow:playbook-progress', onStorage)
    }
  }, [])

  return (
    <aside className="lv2pb-sidebar lg:sticky lg:top-[88px] lg:self-start">
      {activePath ? (
        <ActivePathView
          path={activePath}
          paths={paths}
          guidesById={guidesById}
          currentSlug={currentSlug}
          readSet={readSet}
        />
      ) : (
        <PathsListView paths={paths} guidesById={guidesById} />
      )}
    </aside>
  )
}

// ---------------------------------------------------------------------------

function ActivePathView({
  path,
  paths,
  guidesById,
  currentSlug,
  readSet,
}: {
  path: LearningPath
  paths: LearningPath[]
  guidesById: Record<string, Guide>
  currentSlug?: string
  readSet: Set<string>
}) {
  return (
    <div className="space-y-5">
      <PathPicker paths={paths} active={path} />

      <div className="rounded-2xl border bg-[var(--lv2-card)] p-4" style={{ borderColor: 'var(--lv2-border)' }}>
        <p className="lv2-mono mb-2 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--lv2-muted)' }}>
          Current path
        </p>
        <p className="lv2-display text-[20px] leading-tight" style={{ color: 'var(--lv2-primary)' }}>
          <span aria-hidden className="mr-1.5">{path.emoji}</span>
          {path.name}
        </p>
        <p className="mt-1 text-[12px]" style={{ color: 'var(--lv2-muted)' }}>{path.pitch}</p>

        <ol className="mt-4 space-y-1">
          {path.guideIds.map((gid, i) => {
            const g = guidesById[gid]
            if (!g) return null
            const isCurrent = g.slug === currentSlug
            const isRead = readSet.has(gid)
            return (
              <li key={gid}>
                <Link
                  href={`/playbook/${g.slug}?path=${path.id}`}
                  className={`group flex items-start gap-2.5 rounded-lg px-2 py-2 text-[12.5px] leading-snug transition-colors ${
                    isCurrent ? 'bg-[var(--lv2-primary-soft)]' : 'hover:bg-black/[.04]'
                  }`}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  <StepBullet
                    n={i + 1}
                    state={isCurrent ? 'current' : isRead ? 'read' : 'todo'}
                  />
                  <span
                    className={isCurrent ? 'font-semibold' : 'font-medium'}
                    style={{
                      color: isCurrent
                        ? 'var(--lv2-primary)'
                        : isRead
                          ? 'var(--lv2-muted)'
                          : 'var(--lv2-fg)',
                    }}
                  >
                    {g.title}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

function PathsListView({
  paths,
  guidesById,
}: {
  paths: LearningPath[]
  guidesById: Record<string, Guide>
}) {
  return (
    <div className="space-y-3">
      <p className="lv2-mono px-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--lv2-muted)' }}>
        Paths
      </p>
      {paths.map((p) => {
        const total = p.guideIds.reduce(
          (n, id) => n + (guidesById[id]?.readTimeMinutes ?? 0),
          0,
        )
        return (
          <Link
            key={p.id}
            href={`/playbook?path=${p.id}#paths`}
            className="block rounded-xl border bg-[var(--lv2-card)] p-3 transition-all hover:-translate-y-px hover:shadow-sm"
            style={{ borderColor: 'var(--lv2-border)' }}
          >
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-[16px]">{p.emoji}</span>
              <p className="text-[13px] font-bold" style={{ color: 'var(--lv2-fg)' }}>{p.name}</p>
            </div>
            <p className="mt-1 text-[11.5px]" style={{ color: 'var(--lv2-muted)' }}>
              {p.guideIds.length} guides · ~{total} min
            </p>
          </Link>
        )
      })}
    </div>
  )
}

function PathPicker({ paths, active }: { paths: LearningPath[]; active: LearningPath }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border bg-[var(--lv2-card)] px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-black/[.03]"
        style={{ borderColor: 'var(--lv2-border)', color: 'var(--lv2-fg)' }}
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-1.5">
          <Compass className="h-3.5 w-3.5" style={{ color: 'var(--lv2-muted)' }} />
          Switch path
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--lv2-muted)' }}
        />
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 overflow-hidden rounded-xl border bg-[var(--lv2-card)] shadow-lg"
          style={{ borderColor: 'var(--lv2-border)' }}
        >
          {paths.map((p) => (
            <Link
              key={p.id}
              href={`/playbook?path=${p.id}#paths`}
              className={`flex items-start gap-2 border-b px-3 py-2 text-[12px] last:border-b-0 transition-colors hover:bg-black/[.04] ${
                p.id === active.id ? 'bg-black/[.03]' : ''
              }`}
              style={{ borderColor: 'var(--lv2-border)' }}
              onClick={() => setOpen(false)}
            >
              <span aria-hidden className="text-[14px]">{p.emoji}</span>
              <div className="min-w-0">
                <p className="font-semibold" style={{ color: 'var(--lv2-fg)' }}>{p.name}</p>
                <p className="text-[11px]" style={{ color: 'var(--lv2-muted)' }}>{p.pitch}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StepBullet({ n, state }: { n: number; state: 'todo' | 'read' | 'current' }) {
  if (state === 'read') {
    return (
      <span
        className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{ background: 'var(--lv2-accent)', color: 'var(--lv2-accent-ink)' }}
        aria-label="Read"
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    )
  }
  if (state === 'current') {
    return (
      <span
        className="lv2-mono mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{ background: 'var(--lv2-primary)', color: 'var(--lv2-accent)' }}
        aria-label={`Current step ${n}`}
      >
        {n}
      </span>
    )
  }
  return (
    <span
      className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
      style={{ borderColor: 'var(--lv2-border)', color: 'var(--lv2-muted)' }}
      aria-label={`Step ${n}`}
    >
      <Circle className="h-2 w-2" />
    </span>
  )
}
