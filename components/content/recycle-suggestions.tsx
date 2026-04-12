'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { RecyclableItem } from '@/lib/content/get-recyclable-content'

interface RecycleSuggestionsProps {
  items: RecyclableItem[]
  workspaceId: string
}

export function RecycleSuggestions({ items, workspaceId }: RecycleSuggestionsProps) {
  const [showAll, setShowAll] = useState(false)

  if (!items.length) return null

  const visible = showAll ? items : items.slice(0, 5)
  const hasMore = items.length > 5

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-sm font-semibold">♻️ Ready to repurpose</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Content you haven&apos;t touched in a while
        </p>
      </div>
      <ul className="divide-y">
        {visible.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 px-6 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title ?? 'Untitled'}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.reason}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs text-muted-foreground">{item.days_old}d old</span>
              <Link
                href={`/workspace/${workspaceId}/content/${item.id}/outputs`}
                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Regenerate →
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="border-t px-6 py-3">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {showAll ? 'Show less' : `Show ${items.length - 5} more`}
          </button>
        </div>
      )}
    </div>
  )
}
