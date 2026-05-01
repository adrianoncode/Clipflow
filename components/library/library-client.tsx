'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowDownAZ, ChevronDown, Grid3x3, List as ListIcon, Search } from 'lucide-react'

import { Hero, StatusBadge } from '@/components/ui/editorial'
import { CountUp, Reveal } from '@/components/ui/editorial-motion'
import type { LibraryItem, LibraryStats } from '@/lib/library/get-library-items'

type SortKey = 'newest' | 'oldest' | 'title' | 'platform'

const SORT_LABEL: Record<SortKey, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  title: 'Title (A→Z)',
  platform: 'Platform',
}

/** How many items to show before the user has to click "Load more".
 *  Picked so the initial paint stays under ~30 cards (plays nicely
 *  with the staggered Reveal animation) but a power-user with 200+
 *  outputs isn't forced to scroll-load forever. */
const PAGE_SIZE = 30

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: 'TikTok',
  instagram_reels: 'Instagram Reels',
  youtube_shorts: 'YouTube Shorts',
  linkedin: 'LinkedIn',
}

const PLATFORM_SHORT: Record<string, string> = {
  tiktok: 'TT',
  instagram_reels: 'IG',
  youtube_shorts: 'YT',
  linkedin: 'LI',
}

type Filter =
  | 'all'
  | 'tiktok'
  | 'instagram_reels'
  | 'youtube_shorts'
  | 'linkedin'

export function LibraryClient({
  workspaceName,
  workspaceId,
  items,
  stats,
}: {
  workspaceName: string
  workspaceId: string
  items: LibraryItem[]
  stats: LibraryStats
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [shown, setShown] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    const base = items.filter((i) => {
      if (filter !== 'all' && i.platform !== filter) return false
      if (q && !i.title.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
    // Sort defensively — server returns newest-first, but the user
    // can flip to oldest / alphabetical / by-platform from the toolbar.
    const sorted = [...base].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return a.createdAt.localeCompare(b.createdAt)
        case 'title':
          return a.title.localeCompare(b.title)
        case 'platform':
          return a.platform.localeCompare(b.platform)
        case 'newest':
        default:
          return b.createdAt.localeCompare(a.createdAt)
      }
    })
    return sorted
  }, [items, filter, q, sort])

  const visible = useMemo(() => filtered.slice(0, shown), [filtered, shown])
  const hasMore = filtered.length > visible.length

  const filters: Array<{ k: Filter; l: string; c: number }> = [
    { k: 'all', l: 'All', c: items.length },
    { k: 'tiktok', l: 'TikTok', c: items.filter((i) => i.platform === 'tiktok').length },
    {
      k: 'instagram_reels',
      l: 'Reels',
      c: items.filter((i) => i.platform === 'instagram_reels').length,
    },
    {
      k: 'youtube_shorts',
      l: 'Shorts',
      c: items.filter((i) => i.platform === 'youtube_shorts').length,
    },
    {
      k: 'linkedin',
      l: 'LinkedIn',
      c: items.filter((i) => i.platform === 'linkedin').length,
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <Hero
        kicker={`${workspaceName} · Library`}
        title={
          <>
            This workspace&rsquo;s{' '}
            <em
              style={{
                fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                fontStyle: 'italic',
              }}
            >
              library
            </em>
            .
          </>
        }
      />

      {/* ── Toolbar: sticky + glassmorphism so it floats above the
             items grid as a distinct layer rather than sitting flat
             alongside it. ────────────────────────────────────────── */}
      <div
        className="sticky top-[57px] z-[5] flex flex-wrap items-center gap-3.5 rounded-[24px] p-3.5"
        style={{
          background: 'rgba(249, 244, 220, 0.78)',
          backdropFilter: 'blur(14px) saturate(160%)',
          WebkitBackdropFilter: 'blur(14px) saturate(160%)',
          border: '1px solid rgba(15,15,15,0.08)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.85), 0 12px 28px -16px rgba(15,15,15,0.18)',
        }}
      >
        <div
          className="flex min-w-[240px] flex-1 items-center gap-2 rounded-full px-3.5 py-2"
          style={{
            border: '1px solid rgba(15,15,15,0.14)',
            background: '#FFFDF8',
          }}
        >
          <Search className="h-3.5 w-3.5" style={{ color: '#0F0F0F' }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, hook, source…"
            className="flex-1 border-0 bg-transparent text-[13px] outline-none"
            style={{ color: '#0F0F0F' }}
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="border-0 bg-transparent text-[11px]"
              style={{ color: '#7A7468', cursor: 'pointer' }}
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((t) => {
            const active = filter === t.k
            return (
              <button
                key={t.k}
                onClick={() => setFilter(t.k)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition-all duration-200"
                style={{
                  border: active ? '1px solid transparent' : '1px solid rgba(15,15,15,0.14)',
                  background: active ? '#0F0F0F' : 'transparent',
                  color: active ? '#FFFFFF' : '#0F0F0F',
                  cursor: 'pointer',
                }}
              >
                {t.l}{' '}
                <span
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    fontSize: 9,
                    opacity: 0.6,
                  }}
                >
                  {t.c}
                </span>
              </button>
            )
          })}
        </div>
        {/* Sort dropdown — native <select> for zero-cost a11y, styled
            to match the chip rail. Without this the user can't bring
            "oldest first" or alphabetical to the top without
            re-scrolling all 500 results. */}
        <label className="relative inline-flex items-center">
          <span className="sr-only">Sort library</span>
          <ArrowDownAZ
            aria-hidden
            className="pointer-events-none absolute left-3 h-3.5 w-3.5"
            style={{ color: '#0F0F0F' }}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-8 cursor-pointer appearance-none rounded-full border bg-transparent pl-8 pr-7 text-[11px] font-semibold transition-colors hover:bg-foreground/[0.04]"
            style={{
              borderColor: 'rgba(15,15,15,0.14)',
              color: '#0F0F0F',
              fontFamily: 'inherit',
            }}
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-2 h-3 w-3"
            style={{ color: '#0F0F0F' }}
          />
        </label>
        <div
          className="flex gap-0.5 rounded-full p-0.5"
          style={{ border: '1px solid rgba(15,15,15,0.14)', background: '#FFFDF8' }}
        >
          <button
            aria-label="Grid view"
            onClick={() => setView('grid')}
            className="grid h-[26px] w-[30px] place-items-center rounded-full border-0"
            style={{
              background: view === 'grid' ? '#0F0F0F' : 'transparent',
              color: view === 'grid' ? '#FFFFFF' : '#0F0F0F',
              cursor: 'pointer',
            }}
          >
            <Grid3x3 className="h-3 w-3" />
          </button>
          <button
            aria-label="List view"
            onClick={() => setView('list')}
            className="grid h-[26px] w-[30px] place-items-center rounded-full border-0"
            style={{
              background: view === 'list' ? '#0F0F0F' : 'transparent',
              color: view === 'list' ? '#FFFFFF' : '#0F0F0F',
              cursor: 'pointer',
            }}
          >
            <ListIcon className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ── Stats: weighted Bento — one dark anchor + 3 cream — so the
             row reads as a hierarchy, not four equal tiles. Numbers
             count up on mount for a visual cue that data is live. ── */}
      <div className="flex flex-wrap gap-3.5">
        <StatCard label="Total assets" value={stats.total} tone="dark" />
        <StatCard label="Published" value={stats.published} tone="cream" />
        <StatCard label="In flight" value={stats.inFlight} tone="cream" />
        <StatCard label="Drafts" value={stats.drafts} tone="cream" />
      </div>

      {/* ── Items: grid or list ─────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState hasItems={items.length > 0} />
      ) : view === 'grid' ? (
        <div
          // The key forces a remount when filter/search/view changes,
          // which re-runs the staggered Reveal animation on the new
          // result set — feels like the grid "re-poured" rather than
          // snapping to a new state. `sort` is included so changing
          // sort order also re-staggers; `shown` is NOT in the key —
          // a "Load more" click must NOT re-animate already-visible
          // cards, only reveal new ones below.
          key={`grid-${filter}-${q}-${sort}`}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {visible.map((o, i) => (
            <Reveal key={o.id} index={i}>
              <ItemCard workspaceId={workspaceId} item={o} />
            </Reveal>
          ))}
        </div>
      ) : (
        <Reveal key={`list-${filter}-${q}-${sort}`}>
          <ItemList workspaceId={workspaceId} items={visible} />
        </Reveal>
      )}

      {hasMore && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE_SIZE)}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-border/60 bg-card px-5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
          >
            Load {Math.min(PAGE_SIZE, filtered.length - visible.length)} more
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
          <p
            className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            Showing {visible.length} of {filtered.length}
          </p>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  tone = 'cream',
}: {
  label: string
  value: number
  tone?: 'cream' | 'dark'
}) {
  const isDark = tone === 'dark'
  return (
    <div
      className="min-w-[160px] flex-1 rounded-[24px] px-[18px] py-3.5 transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: isDark ? '#0F0F0F' : '#F9F4DC',
        border: isDark
          ? '1px solid rgba(255,255,255,0.04)'
          : '1px solid rgba(15,15,15,0.06)',
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(255,255,255,0.06)'
          : 'inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
    >
      <div
        className="text-[10px] font-semibold uppercase"
        style={{
          color: isDark ? 'rgba(255,255,255,0.55)' : '#7A7468',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          letterSpacing: '0.22em',
        }}
      >
        {label}
      </div>
      <CountUp
        value={value}
        className="mt-1 block tabular-nums"
        style={{
          fontFamily: isDark
            ? 'var(--font-instrument-serif), Georgia, serif'
            : 'var(--font-jetbrains-mono), monospace',
          fontSize: isDark ? 40 : 28,
          lineHeight: 1,
          fontWeight: isDark ? 400 : 600,
          letterSpacing: isDark ? '-0.025em' : '0',
          color: isDark ? '#F4D93D' : '#0F0F0F',
        }}
      />
    </div>
  )
}

function ItemCard({ workspaceId, item }: { workspaceId: string; item: LibraryItem }) {
  return (
    <Link
      href={`/workspace/${workspaceId}/content/${item.contentId}/outputs`}
      className="block overflow-hidden rounded-[24px] transition-all duration-200 hover:scale-[1.02] hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.7),0_18px_42px_-12px_rgba(15,15,15,0.18)]"
      style={{
        background: '#F9F4DC',
        border: '1px solid rgba(15,15,15,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
    >
      <div
        className="relative grid place-items-center"
        style={{
          aspectRatio: '9 / 12',
          background:
            item.platform === 'linkedin'
              ? '#0A66C2'
              : 'linear-gradient(135deg, #222, #0a0a0a)',
          color: '#fff',
        }}
      >
        <div className="absolute left-2.5 top-2.5 flex gap-1.5">
          <span
            className="grid h-[22px] w-[22px] place-items-center rounded-md text-[10px] font-bold"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            {PLATFORM_SHORT[item.platform] ?? '·'}
          </span>
        </div>
        {item.state && (
          <div className="absolute right-2.5 top-2.5">
            <StatusBadge status={item.state} />
          </div>
        )}
        <p
          className="m-0 px-3.5 text-center"
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: 16,
            lineHeight: 1.05,
          }}
        >
          &ldquo;{item.title}&rdquo;
        </p>
      </div>
      <div className="flex flex-col gap-1 px-3 py-2.5">
        <div className="flex items-baseline justify-between">
          <span
            className="text-[9.5px] font-semibold uppercase"
            style={{
              color: '#7A7468',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              letterSpacing: '0.16em',
            }}
          >
            {PLATFORM_LABEL[item.platform] ?? item.platform}
          </span>
          <span className="text-[11px]" style={{ color: '#2A2A2A' }}>
            {formatDate(item.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  )
}

function ItemList({
  workspaceId,
  items,
}: {
  workspaceId: string
  items: LibraryItem[]
}) {
  return (
    <div
      className="overflow-hidden rounded-[24px]"
      style={{
        background: '#F9F4DC',
        border: '1px solid rgba(15,15,15,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
    >
      <div
        className="flex px-[18px] py-2.5"
        style={{
          borderBottom: '1px solid rgba(15,15,15,0.06)',
          background: 'rgba(15,15,15,0.02)',
        }}
      >
        <span className="meta-cap flex-[2]">Title</span>
        <span className="meta-cap flex-1">Platform</span>
        <span className="meta-cap" style={{ width: 120 }}>
          State
        </span>
        <span className="meta-cap" style={{ width: 90, textAlign: 'right' }}>
          When
        </span>
      </div>
      {items.map((o, i) => (
        <Link
          key={o.id}
          href={`/workspace/${workspaceId}/content/${o.contentId}/outputs`}
          className="flex items-center px-[18px] py-3 transition-colors hover:bg-[rgba(15,15,15,0.03)]"
          style={{
            borderBottom: i < items.length - 1 ? '1px solid rgba(15,15,15,0.06)' : undefined,
          }}
        >
          <span
            className="flex-[2] truncate text-[13px] font-semibold"
            style={{ color: '#0F0F0F' }}
          >
            {o.title}
          </span>
          <span className="flex-1 text-[12px]" style={{ color: '#2A2A2A' }}>
            {PLATFORM_LABEL[o.platform] ?? o.platform}
          </span>
          <span style={{ width: 120 }}>
            {o.state ? <StatusBadge status={o.state} /> : null}
          </span>
          <span
            className="text-[11px]"
            style={{
              width: 90,
              color: '#7A7468',
              textAlign: 'right',
            }}
          >
            {formatDate(o.createdAt)}
          </span>
        </Link>
      ))}
      <style jsx>{`
        .meta-cap {
          color: #7a7468;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  )
}

function EmptyState({ hasItems }: { hasItems: boolean }) {
  return (
    <div
      className="grid place-items-center rounded-[24px] px-6 py-14 text-center"
      style={{
        background: '#F9F4DC',
        border: '1px solid rgba(15,15,15,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
    >
      <p
        className="m-0"
        style={{
          fontFamily: 'var(--font-instrument-serif), Georgia, serif',
          fontSize: 24,
          color: '#0F0F0F',
        }}
      >
        {hasItems ? 'No matches.' : 'Nothing here yet.'}
      </p>
      <p className="mt-2 text-[13px]" style={{ color: '#2A2A2A' }}>
        {hasItems
          ? 'Adjust the filter or search.'
          : 'Import a recording in Workflow to populate the library.'}
      </p>
    </div>
  )
}

function formatDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return '1d ago'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}
