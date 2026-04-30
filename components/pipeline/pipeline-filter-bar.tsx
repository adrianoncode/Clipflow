'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X } from 'lucide-react'

import { OUTPUT_PLATFORMS, PLATFORM_LABELS } from '@/lib/platforms'

/**
 * Pipeline filter bar — Slice 14.
 *
 * Currently supports a multi-select Platform filter via the `platform`
 * query param (comma-separated keys). The board filters its visible
 * cards against this set on the server. Empty/missing param → show all.
 *
 * URL-state pattern matches the rest of the app (review-drawer's
 * ?review=, schedule's ?view=). Reloads, deep-links and back-button all
 * preserve the filter without extra plumbing.
 */
export function PipelineFilterBar({
  platformCounts,
}: {
  /** Total cards per platform key, used for the "(N)" badges. */
  platformCounts: Record<string, number>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = parsePlatforms(searchParams.get('platform'))

  function set(next: Set<string>) {
    const params = new URLSearchParams(searchParams.toString())
    if (next.size === 0) {
      params.delete('platform')
    } else {
      params.set('platform', [...next].join(','))
    }
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : '?', { scroll: false })
  }

  function toggle(platform: string) {
    const next = new Set(active)
    if (next.has(platform)) next.delete(platform)
    else next.add(platform)
    set(next)
  }

  function clear() {
    set(new Set())
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/40 bg-card p-2">
      <span className="ml-1 inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        <Filter className="h-3 w-3" />
        Platform
      </span>
      {OUTPUT_PLATFORMS.map((p) => {
        const isActive = active.has(p)
        const count = platformCounts[p] ?? 0
        if (count === 0 && !isActive) return null
        const label = PLATFORM_LABELS[p] ?? p
        return (
          <button
            key={p}
            type="button"
            onClick={() => toggle(p)}
            aria-pressed={isActive}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
              isActive
                ? 'border-[#0F0F0F] bg-[#0F0F0F] text-[#D6FF3E]'
                : 'border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground'
            }`}
            style={{
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            {label}
            <span
              className={`tabular-nums ${
                isActive ? 'text-[#D6FF3E]/70' : 'text-muted-foreground/60'
              }`}
            >
              {count}
            </span>
          </button>
        )
      })}
      {active.size > 0 ? (
        <button
          type="button"
          onClick={clear}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      ) : null}
    </div>
  )
}

function parsePlatforms(raw: string | null): Set<string> {
  if (!raw) return new Set()
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  )
}
