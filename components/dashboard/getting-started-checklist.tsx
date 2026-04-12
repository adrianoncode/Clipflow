import Link from 'next/link'
import { Check } from 'lucide-react'

interface Step {
  label: string
  done: boolean
  href: string
  cta: string
}

interface GettingStartedChecklistProps {
  workspaceId: string
  hasAiKey: boolean
  hasContent: boolean
  hasOutputs: boolean
  hasBrandVoice: boolean
}

export function GettingStartedChecklist({
  workspaceId,
  hasAiKey,
  hasContent,
  hasOutputs,
  hasBrandVoice,
}: GettingStartedChecklistProps) {
  const steps: Step[] = [
    {
      label: 'Add an AI key',
      done: hasAiKey,
      href: '/settings/ai-keys',
      cta: 'Add key',
    },
    {
      label: 'Upload your first content',
      done: hasContent,
      href: `/workspace/${workspaceId}/content/new`,
      cta: 'Add content',
    },
    {
      label: 'Generate platform drafts',
      done: hasOutputs,
      href: `/workspace/${workspaceId}`,
      cta: 'View content',
    },
    {
      label: 'Set your brand voice',
      done: hasBrandVoice,
      href: '/settings/brand-voice',
      cta: 'Configure',
    },
  ]

  const completedCount = steps.filter((s) => s.done).length
  if (completedCount === steps.length) return null

  const pct = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Getting started</p>
        <span className="text-xs tabular-nums text-muted-foreground">{completedCount}/{steps.length}</span>
      </div>

      {/* Gradient progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                step.done
                  ? 'bg-emerald-500 text-white'
                  : 'border border-border bg-muted'
              }`}>
                {step.done && <Check className="h-3 w-3" />}
              </span>
              <span className={`text-sm ${step.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {step.label}
              </span>
            </div>
            {!step.done && (
              <Link
                href={step.href}
                className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                {step.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
