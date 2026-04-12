'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import {
  upsertBrandVoiceAction,
  deleteBrandVoiceAction,
  type UpsertBrandVoiceState,
  type DeleteBrandVoiceState,
} from '@/app/(app)/settings/brand-voice/actions'
import type { BrandVoice } from '@/lib/brand-voice/get-active-brand-voice'

interface BrandVoiceFormProps {
  workspaceId: string
  existing: BrandVoice | null
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save brand voice'}
    </Button>
  )
}

function DeleteButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={pending}>
      {pending ? 'Deleting…' : 'Remove'}
    </Button>
  )
}

const initialSave: UpsertBrandVoiceState = {}
const initialDelete: DeleteBrandVoiceState = {}

export function BrandVoiceForm({ workspaceId, existing }: BrandVoiceFormProps) {
  const [saveState, saveAction] = useFormState(upsertBrandVoiceAction, initialSave)
  const [deleteState, deleteAction] = useFormState(deleteBrandVoiceAction, initialDelete)

  return (
    <div className="space-y-6">
      <form action={saveAction} className="space-y-5">
        <input type="hidden" name="workspace_id" value={workspaceId} />

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="bv-name">
            Voice name
          </label>
          <input
            id="bv-name"
            name="name"
            type="text"
            defaultValue={existing?.name ?? 'Default'}
            placeholder="Default"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">A label for internal reference.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="bv-tone">
            Tone &amp; style
          </label>
          <textarea
            id="bv-tone"
            name="tone"
            rows={3}
            defaultValue={existing?.tone ?? ''}
            placeholder="casual, witty, direct, educational, hype-free…"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            Describe the energy and style you want. Use commas to separate attributes.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="bv-avoid">
            Words / patterns to avoid
          </label>
          <textarea
            id="bv-avoid"
            name="avoid"
            rows={3}
            defaultValue={existing?.avoid ?? ''}
            placeholder="jargon, passive voice, emojis, overly salesy language…"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            The AI will actively avoid these in every generated draft.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="bv-hook">
            Example hook
          </label>
          <textarea
            id="bv-hook"
            name="example_hook"
            rows={3}
            defaultValue={existing?.example_hook ?? ''}
            placeholder="I spent 90 days doing X — here's what nobody tells you about Y…"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            Paste a hook you love. The AI uses it as a style reference for new hooks.
          </p>
        </div>

        {saveState.ok === false && saveState.error ? (
          <FormMessage variant="error">{saveState.error}</FormMessage>
        ) : null}

        {saveState.ok === true ? (
          <FormMessage variant="success">Brand voice saved.</FormMessage>
        ) : null}

        <SaveButton />
      </form>

      {existing ? (
        <div className="border-t pt-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Remove brand voice — future generations will use the default AI style.
          </p>
          <form action={deleteAction}>
            <input type="hidden" name="workspace_id" value={workspaceId} />
            <input type="hidden" name="voice_id" value={existing.id} />
            <DeleteButton />
          </form>
          {deleteState.ok === false && deleteState.error ? (
            <FormMessage variant="error" className="mt-2">
              {deleteState.error}
            </FormMessage>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
