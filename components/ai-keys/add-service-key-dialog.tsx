'use client'

import { useCallback } from 'react'
import { ExternalLink, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormState, useFormStatus } from 'react-dom'
import { saveAiKeySettingsAction } from '@/app/(app)/settings/ai-keys/actions'
import type { AiKeyFormState } from '@/components/ai-keys/ai-key-form'
import type { ServiceSpec } from '@/components/ai-keys/service-directory'

interface AddServiceKeyDialogProps {
  spec: ServiceSpec
  workspaceId: string
  onClose: () => void
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Validating…' : 'Connect key'}
    </Button>
  )
}

/**
 * Pre-filled Add-Key modal bound to a single service. Unlike the
 * generic AiKeyForm, this version already knows the provider —
 * users see only the fields they need to fill, with contextual
 * signup + dashboard links right next to the input.
 */
export function AddServiceKeyDialog({
  spec,
  workspaceId,
  onClose,
}: AddServiceKeyDialogProps) {
  const action = useCallback(
    async (prev: AiKeyFormState, formData: FormData): Promise<AiKeyFormState> => {
      formData.set('workspace_id', workspaceId)
      formData.set('provider', spec.provider)
      const result = await saveAiKeySettingsAction(prev, formData)
      if (result.ok === true) onClose()
      return result
    },
    [workspaceId, spec.provider, onClose],
  )

  const [state, formAction] = useFormState(action, {} as AiKeyFormState)

  const errorMessage =
    state && state.ok === false
      ? state.error
      : state && 'error' in state
        ? state.error
        : undefined

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold shadow-sm bg-primary text-primary-foreground">
              {spec.monogram}
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Connect API key
              </p>
              <h3 className="text-base font-semibold">{spec.name}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Self-serve links */}
        <div className="border-b border-border/60 bg-muted/20 px-5 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <a
              href={spec.signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground transition-all hover:border-primary/30 hover:bg-primary/[0.04]"
            >
              1 · Sign up
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
            <a
              href={spec.keyDashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-2.5 py-1.5 text-[11px] font-medium text-foreground transition-all hover:border-primary/30 hover:bg-primary/[0.04]"
            >
              {spec.setupNote ? '3 · Get your key' : '2 · Get your key'}
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          </div>
          {spec.setupNote ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3">
              <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.15em] text-primary/70">
                2 · Important step
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {spec.setupNote}
              </p>
            </div>
          ) : null}
        </div>

        <form action={formAction} className="space-y-4 px-5 py-5">
          <div className="space-y-2">
            <Label htmlFor="label">Label (optional)</Label>
            <Input
              id="label"
              name="label"
              placeholder="Main account"
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key">API key</Label>
            <Input
              id="api_key"
              name="api_key"
              type="password"
              required
              placeholder={spec.keyFormatHint}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              We test the key once before saving. Encrypted at rest with
              AES-256.
            </p>
          </div>

          {errorMessage ? (
            <FormMessage variant="error">{errorMessage}</FormMessage>
          ) : null}

          <SubmitButton />
        </form>
      </div>
    </div>
  )
}
