'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { Mail, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NewsletterData {
  subject: string
  preheader: string
  intro: string
  sections: Array<{ heading: string; body: string }>
  keyTakeaways: string[]
  cta: string
  signoff: string
}

// Server action will be wired via parent — this component receives props
interface Props {
  workspaceId: string
  contentId: string
  generateAction: (prev: unknown, formData: FormData) => Promise<{ ok?: boolean; newsletter?: NewsletterData; error?: string }>
}

export function NewsletterGenerator({ workspaceId, contentId, generateAction }: Props) {
  const [state, formAction] = useFormState(generateAction, {})
  const [copied, setCopied] = useState(false)

  const newsletter = state.ok ? (state as { newsletter: NewsletterData }).newsletter : null

  function copyAll() {
    if (!newsletter) return
    const text = [
      `Subject: ${newsletter.subject}`,
      `Preview: ${newsletter.preheader}`,
      '',
      newsletter.intro,
      '',
      ...newsletter.sections.flatMap((s) => [`## ${s.heading}`, '', s.body, '']),
      '### Key Takeaways',
      ...newsletter.keyTakeaways.map((t) => `• ${t}`),
      '',
      newsletter.cta,
      '',
      newsletter.signoff,
    ].join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-semibold">Newsletter Generator</h3>
        </div>
        <form action={formAction}>
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="content_id" value={contentId} />
          <Button type="submit" size="sm" variant="outline">
            Generate newsletter
          </Button>
        </form>
      </div>

      {state.ok === false && (
        <p className="text-xs text-destructive">{(state as { error: string }).error}</p>
      )}

      {newsletter && (
        <div className="space-y-4 rounded-lg border bg-card p-5">
          {/* Subject line */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Subject</p>
            <p className="text-sm font-semibold">{newsletter.subject}</p>
            <p className="text-xs text-muted-foreground">{newsletter.preheader}</p>
          </div>

          {/* Intro */}
          <p className="text-sm leading-relaxed">{newsletter.intro}</p>

          {/* Sections */}
          {newsletter.sections.map((s, i) => (
            <div key={i} className="space-y-1.5 border-t pt-3">
              <h4 className="text-sm font-semibold">{s.heading}</h4>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}

          {/* Key takeaways */}
          {newsletter.keyTakeaways.length > 0 && (
            <div className="border-t pt-3">
              <h4 className="mb-2 text-sm font-semibold">Key Takeaways</h4>
              <ul className="space-y-1">
                {newsletter.keyTakeaways.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA + signoff */}
          <div className="border-t pt-3">
            <p className="text-sm font-medium">{newsletter.cta}</p>
            <p className="mt-2 text-xs text-muted-foreground italic">{newsletter.signoff}</p>
          </div>

          {/* Copy */}
          <Button size="sm" variant="outline" onClick={copyAll} className="gap-1.5">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy newsletter'}
          </Button>
        </div>
      )}
    </div>
  )
}
