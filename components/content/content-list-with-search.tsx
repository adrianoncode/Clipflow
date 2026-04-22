'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  Globe,
  Rss,
  Video,
  Youtube,
  Search,
  ChevronRight,
  Copy,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Check,
  Upload,
} from 'lucide-react'

import { BulkActionBar } from '@/components/content/bulk-action-bar'
import { EmptyState } from '@/components/ui/empty-state'
import type { ContentItemListRow } from '@/lib/content/get-content-items'

interface ContentListWithSearchProps {
  items: ContentItemListRow[]
  workspaceId: string
  duplicateIds?: Set<string>
}

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const minutes = Math.round(diff / 60_000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.round(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

const KIND_CONFIG = {
  video: {
    Icon: Video,
    label: 'Video',
    bg: 'bg-violet-100',
    text: 'text-violet-600',
  },
  youtube: {
    Icon: Youtube,
    label: 'YouTube',
    bg: 'bg-red-100',
    text: 'text-red-600',
  },
  url: {
    Icon: Globe,
    label: 'URL',
    bg: 'bg-blue-100',
    text: 'text-blue-600',
  },
  rss: {
    Icon: Rss,
    label: 'RSS',
    bg: 'bg-orange-100',
    text: 'text-orange-600',
  },
  text: {
    Icon: FileText,
    label: 'Text',
    bg: 'bg-zinc-100',
    text: 'text-zinc-600',
  },
} as const

const STATUS_CONFIG = {
  ready: {
    icon: CheckCircle2,
    label: 'Ready',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  processing: {
    icon: Loader2,
    label: 'Processing',
    dot: 'bg-amber-400',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  uploading: {
    icon: Clock,
    label: 'Uploading',
    dot: 'bg-blue-400',
    text: 'text-blue-700',
    bg: 'bg-blue-50',
  },
  failed: {
    icon: AlertCircle,
    label: 'Failed',
    dot: 'bg-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50',
  },
} as const

const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'ready', label: 'Ready' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
] as const

const KIND_TABS = [
  { value: 'all', label: 'Any kind' },
  { value: 'video', label: 'Video' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'url', label: 'URL' },
  { value: 'rss', label: 'RSS' },
  { value: 'text', label: 'Text' },
] as const

export function ContentListWithSearch({
  items,
  workspaceId,
  duplicateIds,
}: ContentListWithSearchProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [kindFilter, setKindFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesQuery = !q || (item.title ?? 'untitled').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesKind = kindFilter === 'all' || item.kind === kindFilter
      return matchesQuery && matchesStatus && matchesKind
    })
  }, [items, query, statusFilter, kindFilter])

  const counts = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1
      return acc
    }, {})
  }, [items])

  const kindCounts = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      acc[item.kind] = (acc[item.kind] ?? 0) + 1
      return acc
    }, {})
  }, [items])

  // Keep the kind filter list tight: only show chips for kinds that
  // actually exist in this library (plus "Any kind"). Avoids showing
  // an empty "RSS · 0" chip on accounts that never used RSS.
  const visibleKindTabs = KIND_TABS.filter(
    (tab) => tab.value === 'all' || (kindCounts[tab.value] ?? 0) > 0,
  )
  const hasAnyActiveFilter =
    query.trim().length > 0 || statusFilter !== 'all' || kindFilter !== 'all'

  // Stable reference so the memoized rows below don't all rerender
  // whenever the parent rerenders for any other reason (filter typing).
  const toggleItem = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  function toggleAllFiltered() {
    const filteredIds = filtered.map((i) => i.id)
    const allSelected = filteredIds.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        for (const id of filteredIds) next.delete(id)
      } else {
        for (const id of filteredIds) next.add(id)
      }
      return next
    })
  }

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((i) => selected.has(i.id))

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Upload}
        title="Import your first content"
        description="Upload a video, paste a YouTube link, or add text. Clipflow transcribes it and drops platform-ready drafts into your pipeline."
        actionLabel="Import content"
        actionHref={`/workspace/${workspaceId}/content/new`}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Search + Filter bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title…"
            className="w-full rounded-xl border border-border/60 bg-background py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {FILTER_TABS.map((tab) => {
            const isActive = statusFilter === tab.value
            const count = tab.value === 'all' ? items.length : (counts[tab.value] ?? 0)
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'border border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-px font-mono text-[10px] tabular-nums ${
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Kind filter chips (second row) ── only shown when the
          library has more than one kind of import; a pure video user
          shouldn't get a cluttered "URL · RSS · Text" row. */}
      {visibleKindTabs.length > 2 ? (
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Kind
          </span>
          {visibleKindTabs.map((tab) => {
            const isActive = kindFilter === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setKindFilter(tab.value)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-foreground text-background'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
          {hasAnyActiveFilter ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setStatusFilter('all')
                setKindFilter('all')
              }}
              className="ml-auto shrink-0 rounded-full border border-dashed border-border/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      {/* ── Select-all row (only visible when list is populated) ── */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={toggleAllFiltered}
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                allFilteredSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/60 bg-background hover:border-primary/40'
              }`}
              aria-hidden
            >
              {allFilteredSelected && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            {allFilteredSelected ? 'Deselect all' : 'Select all'}
          </button>
          {selected.size > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground/60">
              {selected.size} selected
            </span>
          )}
        </div>
      )}

      {/* ── No results ── */}
      {filtered.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {query.trim()
              ? `No matches for "${query.trim()}"`
              : 'No items match the current filters.'}
          </p>
          <button
            onClick={() => {
              setQuery('')
              setStatusFilter('all')
              setKindFilter('all')
            }}
            className="mt-2 text-xs font-semibold text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── Content list ── */}
      {filtered.length > 0 && (
        <div className="space-y-1.5">
          {filtered.map((item) => (
            <ContentRow
              key={item.id}
              item={item}
              workspaceId={workspaceId}
              isSelected={selected.has(item.id)}
              isDuplicate={duplicateIds?.has(item.id) ?? false}
              onToggle={toggleItem}
            />
          ))}
        </div>
      )}

      {/* ── Count ── */}
      <p className="text-xs text-muted-foreground/60">
        {filtered.length === items.length
          ? `${items.length} item${items.length === 1 ? '' : 's'}`
          : `${filtered.length} of ${items.length} items`}
      </p>

      {/* ── Floating bulk action bar ── */}
      <BulkActionBar
        workspaceId={workspaceId}
        selected={selected}
        onClear={() => setSelected(new Set())}
      />
    </div>
  )
}

/**
 * Memoized row — only rerenders when the item, its selection, or its
 * duplicate flag change. Parent typing in the search box used to cause
 * every row in the library to rerender on every keystroke; with memo +
 * the stable toggleItem callback above, only the rows whose filter
 * status changed repaint.
 */
interface ContentRowProps {
  item: ContentItemListRow
  workspaceId: string
  isSelected: boolean
  isDuplicate: boolean
  onToggle: (id: string) => void
}

const ContentRow = memo(function ContentRow({
  item,
  workspaceId,
  isSelected,
  isDuplicate,
  onToggle,
}: ContentRowProps) {
  const kindCfg =
    KIND_CONFIG[item.kind as keyof typeof KIND_CONFIG] ?? KIND_CONFIG.text
  const statusCfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG]
  const Icon = kindCfg.Icon

  return (
    <div
      className={`group relative flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all duration-150 ${
        isSelected
          ? 'border-primary/40 bg-primary/[0.04] shadow-sm shadow-primary/[0.08]'
          : 'border-border/50 bg-card hover:-translate-y-px hover:border-primary/25 hover:shadow-md hover:shadow-primary/5'
      }`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggle(item.id)
        }}
        aria-label={isSelected ? 'Deselect' : 'Select'}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
          isSelected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border/70 bg-background opacity-60 hover:border-primary/40 hover:opacity-100 group-hover:opacity-100'
        }`}
      >
        {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>

      <Link
        href={`/workspace/${workspaceId}/content/${item.id}`}
        className="flex min-w-0 flex-1 items-center gap-4"
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${kindCfg.bg}`}
        >
          <Icon className={`h-4 w-4 ${kindCfg.text}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {item.title ?? 'Untitled'}
            </span>
            {isDuplicate && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <Copy className="h-2.5 w-2.5" />
                Duplicate
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {kindCfg.label}
            <span className="mx-1.5 text-muted-foreground/30">·</span>
            {/* Time drift between SSR and hydration is harmless
                cosmetic; suppressing the warning avoids a repaint. */}
            <span suppressHydrationWarning>
              {formatRelative(item.created_at)}
            </span>
          </p>
        </div>

        {statusCfg && (
          <div
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot} ${
                item.status === 'processing' ? 'animate-pulse' : ''
              }`}
            />
            {statusCfg.label}
          </div>
        )}

        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-primary/50" />
      </Link>
    </div>
  )
})
