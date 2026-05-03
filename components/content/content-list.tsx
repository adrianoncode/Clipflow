import Link from 'next/link'
import { FileText, Globe, Rss, Upload, Video, Youtube } from 'lucide-react'

import { EmptyState } from '@/components/ui/empty-state'
import { ContentStatusBadge } from '@/components/content/content-status-badge'
import type { ContentItemListRow } from '@/lib/content/get-content-items'

interface ContentListProps {
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

export function ContentList({ items, workspaceId }: ContentListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Upload}
        title="No content yet"
        description="Paste a YouTube link, upload a video, or drop in raw text. Clipflow transcribes it and generates platform-ready drafts in under a minute."
        actionLabel="Import a video"
        actionHref={`/workspace/${workspaceId}/content/new`}
      />
    )
  }

  return (
    <ul className="divide-y rounded-md border">
      {items.map((item) => {
        const Icon = item.kind === 'video' ? Video : item.kind === 'youtube' ? Youtube : item.kind === 'url' ? Globe : item.kind === 'rss' ? Rss : FileText
        const title = item.title ?? 'Untitled'
        return (
          <li key={item.id}>
            <Link
              href={`/workspace/${workspaceId}/content/${item.id}`}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">
                  {item.kind === 'video' ? 'Video / audio' : 'Text'} · {formatRelative(item.created_at)}
                </div>
              </div>
              <ContentStatusBadge status={item.status} />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
