'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Mail, Copy, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

import { generateNewsletterAction } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'
import type { GenerateNewsletterState, NewsletterResult } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'
import { Button } from '@/components/ui/button'

interface NewsletterPanelProps {
  workspaceId: string
  contentId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialNewsletter: any
}

const TONE_OPTIONS = [
  { value: 'conversational', label: 'Conversational' },
  { value: 'professional', label: 'Professional' },
  { value: 'storytelling', label: 'Storytelling' },
] as const

function GenerateButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      <Mail className="mr-1.5 h-3.5 w-3.5" />
      {pending ? 'Generating…' : label}
    </Button>
  )
}

function buildFullEmail(nl: NewsletterResult): string {
  return [
    `Subject: ${nl.subject}`,
    `Preview: ${nl.preheader}`,
    '',
    nl.greeting,
    '',
    nl.body,
    '',
    `👉 ${nl.cta}`,
    nl.ctaNote ? `(${nl.ctaNote})` : '',
  ]
    .filter((l) => l !== undefined)
    .join('\n')
}

export function NewsletterPanel({ workspaceId, contentId, initialNewsletter }: NewsletterPanelProps) {
  const [open, setOpen] = useState(false)
  const [tone, setTone] = useState<'conversational' | 'professional' | 'storytelling'>('conversational')
  const [copied, setCopied] = useState(false)
  const [subjectCopied, setSubjectCopied] = useState(false)

  const [state, formAction] = useFormState<GenerateNewsletterState, FormData>(
    generateNewsletterAction,
    {},
  )

  const newsletter: NewsletterResult | null =
    state.ok === true ? state.newsletter : (initialNewsletter as NewsletterResult | null)

  async function handleCopyFull() {
    if (!newsletter) return
    await navigator.clipboard.writeText(buildFullEmail(newsletter))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleCopySubject() {
    if (!newsletter) return
    await navigator.clipboard.writeText(newsletter.subject)
    setSubjectCopied(true)
    setTimeout(() => setSubjectCopied(false), 2000)
  }

  if (!newsletter) {
    return (
      <div className="space-y-2">
        <form action={formAction}>
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="content_id" value={contentId} />
          <input type="hidden" name="tone" value={tone} />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-md border text-xs overflow-hidden">
              {TONE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTone(opt.value)}
                  className={`px-2.5 py-1.5 transition-colors ${
                    tone === opt.value
                      ? 'bg-[#2A1A3D] text-[#D6FF3E] font-medium'
                      : 'hover:bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <GenerateButton label="Generate newsletter" />
          </div>
          {state.ok === false && (
            <p className="mt-1 text-xs text-destructive">{state.error}</p>
          )}
        </form>
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-muted/20 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium hover:text-foreground transition-colors"
        >
          <Mail className="h-4 w-4" />
          Newsletter Draft
          {open ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyFull}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="h-3 w-3" />
            {copied ? 'Copied!' : 'Copy full email'}
          </button>
          <form action={formAction}>
            <input type="hidden" name="workspace_id" value={workspaceId} />
            <input type="hidden" name="content_id" value={contentId} />
            <input type="hidden" name="tone" value={tone} />
            <button
              type="submit"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </button>
          </form>
        </div>
      </div>

      {open && (
        <div className="space-y-3 text-sm">
          {/* Subject line */}
          <div>
            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Subject Line</p>
            <div className="flex items-start gap-2">
              <p className="text-base font-semibold leading-tight flex-1">{newsletter.subject}</p>
              <button
                type="button"
                onClick={handleCopySubject}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy subject"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            {subjectCopied && <p className="text-xs text-emerald-600">Copied!</p>}
            {newsletter.preheader && (
              <p className="mt-0.5 text-xs text-muted-foreground">{newsletter.preheader}</p>
            )}
          </div>

          {/* Greeting */}
          {newsletter.greeting && (
            <div>
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Opening</p>
              <p className="text-sm italic">{newsletter.greeting}</p>
            </div>
          )}

          {/* Body */}
          <div>
            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Body</p>
            <div className="whitespace-pre-wrap rounded-md border bg-background px-3 py-2 text-sm leading-relaxed">
              {newsletter.body}
            </div>
          </div>

          {/* CTA */}
          {newsletter.cta && (
            <div className="rounded-md bg-primary/10 px-3 py-2">
              <p className="font-semibold text-sm">{newsletter.cta}</p>
              {newsletter.ctaNote && (
                <p className="mt-0.5 text-xs text-muted-foreground">{newsletter.ctaNote}</p>
              )}
            </div>
          )}
        </div>
      )}

      {state.ok === false && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
    </div>
  )
}
