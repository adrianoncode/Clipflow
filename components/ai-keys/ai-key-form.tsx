'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { AiProvider } from '@/lib/ai/providers/types'

export type AiKeyFormState =
  | { ok?: undefined; error?: string }
  | { ok: true }
  | { ok: false; error: string }

type AiKeyFormAction = (
  prev: AiKeyFormState,
  formData: FormData,
) => Promise<AiKeyFormState>

const initialState: AiKeyFormState = {}

interface AiKeyFormProps {
  action: AiKeyFormAction
  /**
   * Called whenever the action result transitions to `{ ok: true }`. Used by
   * the settings dialog to close itself after a successful save. Onboarding
   * flows ignore this because they redirect server-side.
   */
  onSuccess?: () => void
  submitLabel?: string
}

const PROVIDERS: { value: AiProvider; label: string; hint: string }[] = [
  { value: 'openai', label: 'OpenAI', hint: 'GPT models' },
  { value: 'anthropic', label: 'Anthropic', hint: 'Claude models' },
  { value: 'google', label: 'Google', hint: 'Gemini models' },
]

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Validating…' : label}
    </Button>
  )
}

export function AiKeyForm({
  action,
  onSuccess,
  submitLabel = 'Save key',
}: AiKeyFormProps) {
  const [state, formAction] = useFormState(action, initialState)
  const [provider, setProvider] = useState<AiProvider>('openai')

  useEffect(() => {
    if (state.ok === true) {
      onSuccess?.()
    }
  }, [state, onSuccess])

  const errorMessage =
    state && state.ok === false ? state.error : state && 'error' in state ? state.error : undefined

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label>Provider</Label>
        <div className="grid grid-cols-3 gap-2">
          {PROVIDERS.map((p) => {
            const isActive = provider === p.value
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setProvider(p.value)}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                  isActive
                    ? 'border-primary bg-primary/10'
                    : 'border-input bg-background hover:bg-accent',
                )}
              >
                <span className="font-medium">{p.label}</span>
                <span className="text-xs text-muted-foreground">{p.hint}</span>
              </button>
            )
          })}
        </div>
        <input type="hidden" name="provider" value={provider} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">Label (optional)</Label>
        <Input id="label" name="label" placeholder="Main account" maxLength={60} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="api_key">API key</Label>
        <Input
          id="api_key"
          name="api_key"
          type="password"
          required
          placeholder="sk-…"
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">
          We&apos;ll test the key once before saving. It&apos;s encrypted at rest.
        </p>
      </div>

      {errorMessage ? <FormMessage variant="error">{errorMessage}</FormMessage> : null}

      <SubmitButton label={submitLabel} />
    </form>
  )
}
