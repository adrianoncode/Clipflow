'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Clock, CornerDownLeft, Search, X } from 'lucide-react'

import type { Guide, GuideCategory, LearningPath } from '@/lib/landing/playbook-types'

/**
 * Cmd+K (or Ctrl+K) global search for the Playbook. Fuzzy-matches
 * across guides, paths, and section titles. Pure client + in-memory —
 * the GUIDES array is small enough that we don't need a real index.
 *
 * Trigger button is rendered next to the logo in the shell. Pressing
 * Cmd+K anywhere on a /playbook page opens the overlay.
 */

interface PlaybookSearchProps {
  guides: Guide[]
  categories: GuideCategory[]
  paths: LearningPath[]
}

interface ResultItem {
  kind: 'guide' | 'path' | 'section'
  href: string
  title: string
  meta: string
  emoji: string
  /** Lower = better match. */
  score: number
}

export function PlaybookSearch({ guides, categories, paths }: PlaybookSearchProps) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  )

  // Open with Cmd+K / Ctrl+K, close with Esc.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey
      if (isMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
        return
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Autofocus + reset state on open.
  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      const t = window.setTimeout(() => inputRef.current?.focus(), 30)
      return () => window.clearTimeout(t)
    }
  }, [open])

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const results = useMemo<ResultItem[]>(() => {
    const query = q.trim().toLowerCase()
    const items: ResultItem[] = []

    // Path entries
    for (const p of paths) {
      const score = matchScore(query, [p.name, p.pitch])
      if (score === null) continue
      items.push({
        kind: 'path',
        href: `/playbook?path=${p.id}`,
        title: p.name,
        meta: `${p.guideIds.length} guides`,
        emoji: p.emoji,
        score,
      })
    }

    // Guide entries
    for (const g of guides) {
      const cat = categoriesById[g.category]
      const score = matchScore(query, [g.title, g.subtitle, cat?.name ?? ''])
      if (score === null) continue
      items.push({
        kind: 'guide',
        href: `/playbook/${g.slug}`,
        title: g.title,
        meta: `${cat?.name ?? 'Guide'} · ${g.readTimeMinutes} min`,
        emoji: g.emoji,
        score,
      })

      // Sections within guides — only when there's a query
      if (query.length >= 2) {
        for (const s of g.sections) {
          const sScore = matchScore(query, [s.title])
          if (sScore === null) continue
          items.push({
            kind: 'section',
            href: `/playbook/${g.slug}#${s.id}`,
            title: s.title,
            meta: `In: ${g.title}`,
            emoji: '#',
            score: sScore + 0.5,
          })
        }
      }
    }

    return items.sort((a, b) => a.score - b.score).slice(0, 12)
  }, [q, guides, paths, categoriesById])

  // Clamp active index when results change.
  useEffect(() => {
    if (active >= results.length && results.length > 0) setActive(results.length - 1)
    if (results.length === 0) setActive(0)
  }, [active, results.length])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      const r = results[active]!
      window.location.href = r.href
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 rounded-xl border bg-[var(--lv2-card)] px-3 py-1.5 text-[12px] transition-all hover:-translate-y-px hover:shadow-sm"
        style={{ borderColor: 'var(--lv2-border)', color: 'var(--lv2-muted)' }}
        aria-label="Search the Playbook"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Search guides…</span>
        <span
          className="lv2-mono ml-2 hidden rounded-md border px-1.5 py-0.5 text-[10px] font-bold md:inline"
          style={{
            borderColor: 'var(--lv2-border)',
            background: 'var(--lv2-bg-2)',
            color: 'var(--lv2-muted)',
          }}
        >
          ⌘K
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] backdrop-blur-sm"
          style={{ background: 'rgba(24, 21, 17, 0.42)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-[min(640px,calc(100vw-32px))] overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              borderColor: 'var(--lv2-border)',
              background: 'var(--lv2-card)',
              boxShadow:
                '0 24px 64px -12px rgba(15,15,15,.35), 0 6px 24px -8px rgba(15,15,15,.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center gap-2 border-b px-4"
              style={{ borderColor: 'var(--lv2-border)' }}
            >
              <Search className="h-4 w-4" style={{ color: 'var(--lv2-muted)' }} />
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search guides, paths, sections…"
                className="flex-1 bg-transparent py-3.5 text-[14.5px] outline-none placeholder:text-[var(--lv2-muted)]"
                style={{ color: 'var(--lv2-fg)' }}
                aria-label="Search query"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 transition-colors hover:bg-black/[.04]"
                aria-label="Close search"
              >
                <X className="h-4 w-4" style={{ color: 'var(--lv2-muted)' }} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <div
                  className="px-3 py-10 text-center text-[13px]"
                  style={{ color: 'var(--lv2-muted)' }}
                >
                  {q.trim()
                    ? 'No matches. Try fewer words or a different angle.'
                    : 'Start typing to search guides + sections.'}
                </div>
              ) : (
                results.map((r, i) => (
                  <Link
                    key={`${r.kind}-${r.href}-${i}`}
                    href={r.href}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                      i === active ? 'bg-black/[.05]' : ''
                    }`}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[14px]"
                      style={{
                        background:
                          r.kind === 'path'
                            ? 'var(--lv2-primary)'
                            : 'var(--lv2-primary-soft)',
                        color:
                          r.kind === 'path'
                            ? 'var(--lv2-accent)'
                            : 'var(--lv2-primary)',
                      }}
                      aria-hidden
                    >
                      {r.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-[13.5px] font-semibold"
                        style={{ color: 'var(--lv2-fg)' }}
                      >
                        {r.title}
                      </p>
                      <p
                        className="truncate text-[11.5px]"
                        style={{ color: 'var(--lv2-muted)' }}
                      >
                        {r.meta}
                      </p>
                    </div>
                    {i === active ? (
                      <CornerDownLeft
                        className="h-3.5 w-3.5"
                        style={{ color: 'var(--lv2-muted)' }}
                      />
                    ) : (
                      <ArrowRight
                        className="h-3.5 w-3.5 opacity-0"
                        aria-hidden
                      />
                    )}
                  </Link>
                ))
              )}
            </div>

            <div
              className="flex items-center justify-between border-t px-4 py-2 text-[11px]"
              style={{ borderColor: 'var(--lv2-border)', color: 'var(--lv2-muted)' }}
            >
              <div className="flex items-center gap-3">
                <Hint icon="↑↓" label="navigate" />
                <Hint icon="↵" label="open" />
                <Hint icon="esc" label="close" />
              </div>
              <span className="hidden items-center gap-1 sm:inline-flex">
                <Clock className="h-3 w-3" />
                {guides.length} guides indexed
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Hint({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <kbd
        className="lv2-mono rounded border px-1 py-px text-[10px]"
        style={{
          borderColor: 'var(--lv2-border)',
          background: 'var(--lv2-bg-2)',
          color: 'var(--lv2-fg-soft)',
        }}
      >
        {icon}
      </kbd>
      <span>{label}</span>
    </span>
  )
}

/**
 * Cheap fuzzy scorer. Returns null if no match, otherwise a number
 * where lower = better. We match each query "term" (whitespace-split)
 * against the joined haystack. Each missed term disqualifies the row.
 *
 * Empty queries return 0 for every row so the overlay shows a useful
 * "browse all" view without the user typing anything.
 */
function matchScore(q: string, fields: string[]): number | null {
  if (!q) return 0
  const haystack = fields.join(' ').toLowerCase()
  const terms = q.split(/\s+/).filter(Boolean)
  let score = 0
  for (const term of terms) {
    const idx = haystack.indexOf(term)
    if (idx < 0) return null
    // Prefer matches near the start of the title (first field).
    const titleHit = fields[0]?.toLowerCase().indexOf(term) ?? -1
    score += idx + (titleHit >= 0 ? -10 + titleHit * 0.3 : 5)
  }
  return score
}
