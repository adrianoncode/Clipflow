'use client'

import { useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
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

const TONE_MAX = 500
const AVOID_MAX = 500
const HOOK_MAX = 1000
const NAME_MAX = 80

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save brand voice'}
    </Button>
  )
}

const initialSave: UpsertBrandVoiceState = {}
const initialDelete: DeleteBrandVoiceState = {}

/**
 * Live character counter that goes amber at 90% and red at 100% of cap.
 * Provides the same affordance the rest of the app uses on bounded
 * inputs — without it the user finds out they're over the limit only
 * after Save returns a server error.
 */
function CharCounter({ value, max }: { value: string; max: number }) {
  const len = value.length
  const tone =
    len > max ? 'text-destructive' : len > max * 0.9 ? 'text-amber-600' : 'text-muted-foreground'
  return (
    <span className={`tabular-nums text-xs ${tone}`} aria-live="polite">
      {len} / {max}
    </span>
  )
}

export function BrandVoiceForm({ workspaceId, existing }: BrandVoiceFormProps) {
  const [saveState, saveAction] = useFormState(upsertBrandVoiceAction, initialSave)
  const [deleteState, deleteAction] = useFormState(deleteBrandVoiceAction, initialDelete)

  // Controlled state on the bounded fields so we can render counters and
  // disable Save when the user busts a cap.
  const [name, setName] = useState(existing?.name ?? 'Default')
  const [tone, setTone] = useState(existing?.tone ?? '')
  const [avoid, setAvoid] = useState(existing?.avoid ?? '')
  const [hook, setHook] = useState(existing?.example_hook ?? '')

  const overLimit =
    name.length > NAME_MAX ||
    tone.length > TONE_MAX ||
    avoid.length > AVOID_MAX ||
    hook.length > HOOK_MAX

  const deleteFormRef = useRef<HTMLFormElement>(null)

  return (
    <div className="space-y-6">
      <form action={saveAction} className="space-y-5">
        <input type="hidden" name="workspace_id" value={workspaceId} />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="bv-name">
              Voice name
            </label>
            <CharCounter value={name} max={NAME_MAX} />
          </div>
          <input
            id="bv-name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX}
            placeholder="Default"
            className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">A label for internal reference.</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="bv-tone">
              Tone &amp; style
            </label>
            <CharCounter value={tone} max={TONE_MAX} />
          </div>
          <textarea
            id="bv-tone"
            name="tone"
            rows={3}
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            maxLength={TONE_MAX}
            placeholder="casual, witty, direct, educational, hype-free…"
            className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Describe the energy and style you want. Use commas to separate attributes.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="bv-avoid">
              Words / patterns to avoid
            </label>
            <CharCounter value={avoid} max={AVOID_MAX} />
          </div>
          <textarea
            id="bv-avoid"
            name="avoid"
            rows={3}
            value={avoid}
            onChange={(e) => setAvoid(e.target.value)}
            maxLength={AVOID_MAX}
            placeholder="jargon, passive voice, emojis, overly salesy language…"
            className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            The AI will actively avoid these in every generated draft.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="bv-hook">
              Example hook
            </label>
            <CharCounter value={hook} max={HOOK_MAX} />
          </div>
          <textarea
            id="bv-hook"
            name="example_hook"
            rows={3}
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            maxLength={HOOK_MAX}
            placeholder="I spent 90 days doing X — here's what nobody tells you about Y…"
            className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Paste a hook you love. The AI uses it as a style reference for new hooks.
          </p>
        </div>

        {saveState.ok === false && saveState.error ? (
          <FormMessage variant="error">{saveState.error}</FormMessage>
        ) : null}

        {saveState.ok === true ? (
          <FormMessage variant="success">Voice saved — your next generation will use it.</FormMessage>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={overLimit}>
            {overLimit ? 'Trim copy to save' : 'Save brand voice'}
          </Button>
        </div>
      </form>

      {existing ? (
        <div className="rounded-lg border border-destructive/30 p-4">
          <h4 className="text-sm font-semibold text-destructive">Remove brand voice</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Future generations will use the default AI style. You can re-add a
            brand voice anytime.
          </p>
          <form ref={deleteFormRef} action={deleteAction} className="mt-3">
            <input type="hidden" name="workspace_id" value={workspaceId} />
            <input type="hidden" name="voice_id" value={existing.id} />
          </form>
          <ConfirmDialog
            tone="destructive"
            title="Remove this brand voice?"
            description="The AI will fall back to its default style on every future generation. You can always create a new brand voice afterwards."
            confirmLabel="Remove voice"
            cancelLabel="Keep"
            onConfirm={() => deleteFormRef.current?.requestSubmit()}
            trigger={(open) => (
              <Button type="button" variant="destructive" size="sm" onClick={open} className="mt-2">
                Remove
              </Button>
            )}
          />
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
