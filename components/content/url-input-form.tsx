'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createUrlContentAction,
  type UrlFormState,
} from '@/app/(app)/workspace/[id]/content/new/actions'

const initialState: UrlFormState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Scraping page…' : 'Import from URL'}
    </Button>
  )
}

export function UrlInputForm({ workspaceId }: { workspaceId: string }) {
  const [state, formAction] = useFormState(createUrlContentAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="workspace_id" value={workspaceId} />

      <div className="space-y-1">
        <Label htmlFor="page-url">Blog or website URL</Label>
        <Input
          id="page-url"
          name="url"
          type="url"
          placeholder="https://yoursite.com/your-post"
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          We scrape the page text and use it as your content transcript. Works best on
          server-rendered blogs and articles.
        </p>
      </div>

      {state.error ? <FormMessage variant="error">{state.error}</FormMessage> : null}

      <SubmitButton />
    </form>
  )
}
