'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FileText, Globe, Rss, Video, Youtube } from 'lucide-react'

import { ContentStatusBadge } from '@/components/content/content-status-badge'
import type { ContentItemListRow } from '@/lib/content/get-content-items'

interface ContentListWithSearchProps {
  items: ContentItemListRow[]
  workspaceId: string
}

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const minutes = Math.round(diff / 60_000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours} h ago`
    const days = Math.round(hours / 24)
    if (days < 7) return `${days} d ago`
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

const STATUS_OPTIONS = ['all', 'ready', 'processing', 'uploading', 'failed'] as const

export function ContentListWithSearch({ items, workspaceId }: ContentListWithSearchProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesQuery = !q || (item.title ?? 'untitled').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [items, query, statusFilter])

  if (items.length === 0) {
    return (
      <div className="rounded-md border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        No content yet. Upload a video or paste a script to get started.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search + filter bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title…"
          className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No results for &ldquo;{query}&rdquo;
          {statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {filtered.map((item) => {
            const Icon =
              item.kind === 'video' ? Video
              : item.kind === 'youtube' ? Youtube
              : item.kind === 'url' ? Globe
              : item.kind === 'rss' ? Rss
              : FileText
            return (
              <li key={item.id}>
                <Link
                  href={`/workspace/${workspaceId}/content/${item.id}`}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{item.title ?? 'Untitled'}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelative(item.created_at)}
                    </div>
                  </div>
                  <ContentStatusBadge status={item.status} />
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {items.length} item{items.length === 1 ? '' : 's'}
      </p>
    </div>
  )
}
