'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  createTextContentAction,
  type TextFormState,
} from '@/app/(app)/workspace/[id]/content/new/actions'

const initialState: TextFormState = {}

interface TextInputFormProps {
  workspaceId: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save content'}
    </Button>
  )
}

export function TextInputForm({ workspaceId }: TextInputFormProps) {
  const [state, formAction] = useFormState(createTextContentAction, initialState)
  const [body, setBody] = useState('')

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <div className="space-y-2">
        <Label htmlFor="content-title">Title (optional)</Label>
        <Input
          id="content-title"
          name="title"
          placeholder="Script notes"
          maxLength={120}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content-body">Text or script</Label>
        <Textarea
          id="content-body"
          name="body"
          required
          minLength={10}
          maxLength={50_000}
          rows={10}
          placeholder="Paste your script, notes, or outline…"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {body.length} / 50,000 characters
        </p>
      </div>
      {state.error ? <FormMessage variant="error">{state.error}</FormMessage> : null}
      <SubmitButton />
    </form>
  )
}
