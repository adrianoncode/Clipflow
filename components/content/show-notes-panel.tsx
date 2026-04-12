'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { ClipboardList, ChevronDown, ChevronUp, Copy, RefreshCw } from 'lucide-react'

import { generateShowNotesAction } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'
import type { GenerateShowNotesState, ShowNotesResult } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'
import { Button } from '@/components/ui/button'

interface ShowNotesPanelProps {
  workspaceId: string
  contentId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialShowNotes: any
}

function GenerateButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
      {pending ? 'Generating…' : label}
    </Button>
  )
}

function buildMarkdown(sn: ShowNotesResult): string {
  const lines: string[] = []
  lines.push(`## Summary\n\n${sn.summary}`)
  if (sn.keyPoints?.length) {
    lines.push('\n## Key Takeaways\n')
    sn.keyPoints.forEach((pt, i) => lines.push(`${i + 1}. ${pt}`))
  }
  if (sn.topics?.length) {
    lines.push('\n## Topics & Timestamps\n')
    sn.topics.forEach((t) => lines.push(`**${t.time}** — ${t.topic}`))
  }
  if (sn.resourcesMentioned?.length) {
    lines.push('\n## Resources Mentioned\n')
    sn.resourcesMentioned.forEach((r) => lines.push(`- ${r}`))
  }
  if (sn.quotableQuotes?.length) {
    lines.push('\n## Quotable Quotes\n')
    sn.quotableQuotes.forEach((q) => lines.push(`> ${q}`))
  }
  if (sn.callToAction) {
    lines.push(`\n## Call to Action\n\n${sn.callToAction}`)
  }
  return lines.join('\n')
}

export function ShowNotesPanel({ workspaceId, contentId, initialShowNotes }: ShowNotesPanelProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const [state, formAction] = useFormState<GenerateShowNotesState, FormData>(
    generateShowNotesAction,
    {},
  )

  const showNotes: ShowNotesResult | null =
    state.ok === true ? state.showNotes : (initialShowNotes as ShowNotesResult | null)

  async function handleCopy() {
    if (!showNotes) return
    await navigator.clipboard.writeText(buildMarkdown(showNotes))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!showNotes) {
    return (
      <div>
        <form action={formAction}>
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="content_id" value={contentId} />
          <GenerateButton label="Generate show notes" />
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
          <ClipboardList className="h-4 w-4" />
          Show Notes
          {open ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="h-3 w-3" />
            {copied ? 'Copied!' : 'Copy as markdown'}
          </button>
          <form action={formAction}>
            <input type="hidden" name="workspace_id" value={workspaceId} />
            <input type="hidden" name="content_id" value={contentId} />
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
          {/* Summary */}
          <div>
            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Summary</p>
            <p className="text-sm leading-relaxed">{showNotes.summary}</p>
          </div>

          {/* Key Takeaways */}
          {showNotes.keyPoints?.length > 0 && (
            <div>
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Key Takeaways</p>
              <ol className="list-decimal pl-4 space-y-0.5">
                {showNotes.keyPoints.map((pt, i) => (
                  <li key={i} className="text-sm">{pt}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Topics & Timestamps */}
          {showNotes.topics?.length > 0 && (
            <div>
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Topics & Timestamps</p>
              <table className="w-full text-sm">
                <tbody>
                  {showNotes.topics.map((t, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-0.5 pr-3 font-mono text-xs text-muted-foreground w-12">{t.time}</td>
                      <td className="py-0.5">{t.topic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Resources Mentioned */}
          {showNotes.resourcesMentioned?.length > 0 && (
            <div>
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Resources Mentioned</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {showNotes.resourcesMentioned.map((r, i) => (
                  <li key={i} className="text-sm">{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Quotable Quotes */}
          {showNotes.quotableQuotes?.length > 0 && (
            <div>
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Quotable Quotes</p>
              <div className="space-y-1">
                {showNotes.quotableQuotes.map((q, i) => (
                  <blockquote key={i} className="border-l-2 border-muted-foreground/30 pl-3 text-sm italic text-muted-foreground">
                    {q}
                  </blockquote>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          {showNotes.callToAction && (
            <div className="rounded-md bg-primary/10 px-3 py-2">
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-0.5">Call to Action</p>
              <p className="text-sm">{showNotes.callToAction}</p>
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
