import Link from 'next/link'
import { ArrowLeft, FileText, Film, Link2, Rss, Youtube } from 'lucide-react'

import { ContentStatusBadge } from '@/components/content/content-status-badge'
import { RenameContentForm } from '@/components/content/rename-content-form'
import type { ContentKind } from '@/lib/supabase/types'
import type { ContentItemRow } from '@/lib/content/get-content-item'

/**
 * Header that sits above the Per-Video tab nav. Single source of truth
 * for the title + kind + status across Source / Highlights / Drafts —
 * before this each tab rendered its own breadcrumb + heading and they
 * drifted apart in size, copy and visual rhythm.
 */
const KIND_META: Record<ContentKind, { label: string; Icon: typeof Film }> = {
  video: { label: 'Video', Icon: Film },
  text: { label: 'Text', Icon: FileText },
  youtube: { label: 'YouTube', Icon: Youtube },
  url: { label: 'Website', Icon: Link2 },
  rss: { label: 'RSS', Icon: Rss },
}

export function PerVideoHeader({
  item,
  workspaceId,
}: {
  item: ContentItemRow
  workspaceId: string
}) {
  const meta = KIND_META[item.kind] ?? KIND_META.video
  const KindIcon = meta.Icon
  const title = item.title ?? 'Untitled'

  return (
    <header className="space-y-3">
      <Link
        href={`/workspace/${workspaceId}`}
        className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to library
      </Link>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
              style={{
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }}
            >
              <KindIcon className="h-3 w-3" />
              {meta.label}
            </span>
          </div>
          <RenameContentForm
            workspaceId={workspaceId}
            contentId={item.id}
            currentTitle={title}
          />
        </div>
        <ContentStatusBadge status={item.status} />
      </div>
    </header>
  )
}
