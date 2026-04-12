import Link from 'next/link'

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
      cta: 'Add key →',
    },
    {
      label: 'Upload your first content',
      done: hasContent,
      href: `/workspace/${workspaceId}/content/new`,
      cta: 'Add content →',
    },
    {
      label: 'Generate platform drafts',
      done: hasOutputs,
      href: `/workspace/${workspaceId}`,
      cta: 'View content →',
    },
    {
      label: 'Set your brand voice',
      done: hasBrandVoice,
      href: '/settings/brand-voice',
      cta: 'Configure →',
    },
  ]

  const completedCount = steps.filter((s) => s.done).length
  if (completedCount === steps.length) return null

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Getting started</p>
        <span className="text-xs text-muted-foreground">{completedCount}/{steps.length} done</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-primary transition-all"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                step.done
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-muted-foreground/30 text-transparent'
              }`}>
                ✓
              </span>
              <span className={`text-sm ${step.done ? 'text-muted-foreground line-through' : ''}`}>
                {step.label}
              </span>
            </div>
            {!step.done && (
              <Link
                href={step.href}
                className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline"
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
