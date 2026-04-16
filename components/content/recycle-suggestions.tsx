'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

import { recycleContentAction } from '@/app/(app)/workspace/[id]/content/[contentId]/recycle-actions'
import type { RecycleContentState } from '@/app/(app)/workspace/[id]/content/[contentId]/recycle-actions'
import type { RecyclableItem } from '@/lib/content/get-recyclable-content'

interface RecycleSuggestionsProps {
  items: RecyclableItem[]
  workspaceId: string
}

function RecycleButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
    >
      {pending ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Recycling...
        </>
      ) : (
        'Recycle \u2192'
      )}
    </button>
  )
}

function RecycleForm({
  item,
  workspaceId,
}: {
  item: RecyclableItem
  workspaceId: string
}) {
  const router = useRouter()
  const [state, formAction] = useFormState(
    async (prev: RecycleContentState, formData: FormData) => {
      const result = await recycleContentAction(prev, formData)
      if (result.ok === true) {
        router.push(result.redirectUrl)
      }
      return result
    },
    {},
  )

  return (
    <li className="flex items-center justify-between gap-4 px-6 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title ?? 'Untitled'}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.reason}</p>
        {state.ok === false && (
          <p className="mt-1 text-xs text-destructive">{state.error}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-xs text-muted-foreground">{item.days_old}d old</span>
        <form action={formAction}>
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="content_id" value={item.id} />
          <RecycleButton />
        </form>
      </div>
    </li>
  )
}

export function RecycleSuggestions({ items, workspaceId }: RecycleSuggestionsProps) {
  const [showAll, setShowAll] = useState(false)

  if (!items.length) return null

  const visible = showAll ? items : items.slice(0, 5)
  const hasMore = items.length > 5

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-sm font-semibold">Ready to repurpose</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Content you haven&apos;t touched in a while
        </p>
      </div>
      <ul className="divide-y">
        {visible.map((item) => (
          <RecycleForm key={item.id} item={item} workspaceId={workspaceId} />
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
