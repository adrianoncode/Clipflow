'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import { ChevronRight, Loader2, Mic2, Pencil, Quote, Sparkles } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { upsertBrandVoiceAction } from '@/app/(app)/settings/brand-voice/actions'
import type { BrandVoice } from '@/lib/brand-voice/get-active-brand-voice'

interface VoicePillProps {
  workspaceId: string
  voice: BrandVoice | null
}

const TONE_PRESETS = [
  'casual, witty, direct',
  'energetic, hype, action-driven',
  'educational, calm, expert',
  'punchy, sarcastic, internet-native',
  'warm, vulnerable, story-driven',
]

function SubmitVoiceButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-px hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5" />
          Save voice
        </>
      )}
    </button>
  )
}

export function VoicePill({ workspaceId, voice }: VoicePillProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, formAction] = useFormState(upsertBrandVoiceAction, {})

  // After a successful save: refresh the rail data + close the drawer.
  useEffect(() => {
    if (state.ok === true) {
      router.refresh()
      setOpen(false)
    }
  }, [state, router])

  const hasVoice = voice && (voice.tone || voice.example_hook || voice.avoid)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative flex flex-col gap-2.5 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm shadow-primary/[0.02] transition-all hover:-translate-y-px hover:border-border hover:shadow-md hover:shadow-primary/[0.04]"
        >
          {/* Brand-corner mark */}
          <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Mic2 className="h-3.5 w-3.5" />
          </span>

          <div className="pr-8">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
              Voice
            </p>
            <p className="mt-1 text-[14px] font-bold text-foreground">
              {voice?.name ?? 'Set up your voice'}
            </p>
          </div>

          {hasVoice ? (
            <div className="flex flex-col gap-1.5">
              {voice?.tone ? (
                <p className="line-clamp-1 text-[12px] leading-snug text-muted-foreground">
                  {voice.tone}
                </p>
              ) : null}
              {voice?.example_hook ? (
                <p className="flex items-start gap-1 line-clamp-1 font-mono text-[11px] italic text-muted-foreground/80">
                  <Quote className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                  {voice.example_hook}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-[12px] leading-snug text-muted-foreground">
              Add tone, words to avoid, and an example hook — applied to every draft.
            </p>
          )}

          <span className="mt-auto inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70 group-hover:text-primary">
            <Pencil className="h-2.5 w-2.5" />
            {hasVoice ? 'Edit inline' : 'Set up'}
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[18px]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mic2 className="h-4 w-4" />
            </span>
            Brand voice
          </DialogTitle>
          <DialogDescription className="text-[12.5px]">
            Applied on every generation — script, captions, hooks. Save to use immediately.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="workspace_id" value={workspaceId} />

          <Field label="Voice name" hint="Internal label.">
            <input
              name="name"
              defaultValue={voice?.name ?? 'Default'}
              maxLength={80}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field label="Tone & style" hint="Comma-separated attributes.">
            <input
              name="tone"
              defaultValue={voice?.tone ?? ''}
              maxLength={300}
              placeholder="casual, witty, direct, hype-free"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-1.5 flex flex-wrap gap-1">
              {TONE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={(e) => {
                    const form = (e.currentTarget as HTMLButtonElement).closest('form')
                    const input = form?.elements.namedItem('tone') as HTMLInputElement | null
                    if (input) input.value = preset
                  }}
                  className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
                >
                  {preset}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Words / patterns to avoid" hint="The AI will actively avoid these.">
            <input
              name="avoid"
              defaultValue={voice?.avoid ?? ''}
              maxLength={300}
              placeholder="jargon, passive voice, emojis, salesy language"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field
            label="Example hook"
            hint="A hook you love — the AI matches the energy."
          >
            <textarea
              name="example_hook"
              defaultValue={voice?.example_hook ?? ''}
              maxLength={500}
              rows={2}
              placeholder='I spent 90 days doing X — here&apos;s what nobody tells you about Y…'
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-[13px] focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          {state.ok === false && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {state.error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center rounded-lg border border-border/70 bg-background px-3 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted/40"
            >
              Cancel
            </button>
            <SubmitVoiceButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint ? (
        <span className="mt-1 block text-[11px] text-muted-foreground/80">{hint}</span>
      ) : null}
    </label>
  )
}
