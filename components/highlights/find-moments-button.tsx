'use client'

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'

import {
  findViralMomentsAction,
  type FindMomentsState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/highlights/actions'

interface FindMomentsButtonProps {
  workspaceId: string
  contentId: string
  hasExisting: boolean
}

/**
 * Kicks off AI detection. When `hasExisting` is true we label it
 * "Find more" so users understand they're appending, not replacing.
 * Drafts from the previous run stay in place so they don't disappear
 * during regeneration.
 */
export function FindMomentsButton({
  workspaceId,
  contentId,
  hasExisting,
}: FindMomentsButtonProps) {
  const router = useRouter()
  const [state, formAction] = useFormState<FindMomentsState, FormData>(
    findViralMomentsAction,
    {},
  )

  // On success, force a route refresh so the new drafts show up in the
  // list. revalidatePath on the server side covers this for most flows
  // but the local useFormState result needs a nudge to repaint the
  // suspense boundary.
  useEffect(() => {
    if (state?.ok === true) {
      router.refresh()
    }
  }, [state, router])

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="content_id" value={contentId} />
      <SubmitButton hasExisting={hasExisting} />
      {state?.ok === false && state.error ? (
        <p className="max-w-xs text-right text-[11px] text-destructive">{state.error}</p>
      ) : null}
      {state?.ok === true ? (
        <p className="text-[11px] text-emerald-600">Found {state.count} moments.</p>
      ) : null}
    </form>
  )
}

function SubmitButton({ hasExisting }: { hasExisting: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="cf-btn-3d cf-btn-3d-primary inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Scanning transcript…
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          {hasExisting ? 'Find more moments' : 'Find viral moments'}
        </>
      )}
    </button>
  )
}
