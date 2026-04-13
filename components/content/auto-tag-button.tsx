'use client'

import { useFormState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import { Tag } from 'lucide-react'

import { autoTagContentAction } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'
import { Button } from '@/components/ui/button'

interface AutoTagButtonProps {
  workspaceId: string
  contentId: string
  currentTags: string[]
}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending} className="gap-1.5">
      <Tag className="h-3.5 w-3.5" />
      {pending ? 'Tagging…' : 'Auto-tag'}
    </Button>
  )
}

export function AutoTagButton({ workspaceId, contentId, currentTags }: AutoTagButtonProps) {
  const [state, formAction] = useFormState(
    autoTagContentAction,
    {},
  )

  const displayTags = state.ok === true ? state.tags : currentTags

  return (
    <div className="space-y-2">
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={contentId} />
        <SubmitBtn />
        {state.ok === false && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}
        {state.ok === true && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Tags updated!</p>
        )}
      </form>
      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {displayTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
