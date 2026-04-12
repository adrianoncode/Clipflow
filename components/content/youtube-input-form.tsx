'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createYoutubeContentAction,
  type YoutubeFormState,
} from '@/app/(app)/workspace/[id]/content/new/actions'

const initialState: YoutubeFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Fetching transcript…' : 'Import from YouTube'}
    </Button>
  )
}

export function YoutubeInputForm({ workspaceId }: { workspaceId: string }) {
  const [state, formAction] = useFormState(createYoutubeContentAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="workspace_id" value={workspaceId} />

      <div className="space-y-1">
        <Label htmlFor="youtube-url">YouTube URL</Label>
        <Input
          id="youtube-url"
          name="url"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Works with videos that have captions (auto-generated or manual).
        </p>
      </div>

      {state.error ? <FormMessage variant="error">{state.error}</FormMessage> : null}

      <SubmitButton />
    </form>
  )
}
