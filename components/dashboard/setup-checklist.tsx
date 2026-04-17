'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  KeyRound,
  Upload,
  Wand2,
  CheckCircle2,
  PartyPopper,
  X,
} from 'lucide-react'

interface SetupChecklistProps {
  hasAiKey: boolean
  contentCount: number
  outputCount: number
  hasApprovedOutput: boolean
  workspaceId: string
  /** ID of the first ready content item (for direct "Generate" link) */
  firstReadyContentId?: string
}

const DISMISSED_COOKIE = 'clipflow.setup-checklist-dismissed'

export function SetupChecklist({
  hasAiKey,
  contentCount,
  outputCount,
  hasApprovedOutput,
  workspaceId,
  firstReadyContentId,
}: SetupChecklistProps) {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check both cookie and localStorage for backward compat
    const cookieDismissed = document.cookie.includes(`${DISMISSED_COOKIE}=true`)
    const localDismissed = localStorage.getItem(DISMISSED_COOKIE) === 'true'
    setDismissed(cookieDismissed || localDismissed)
  }, [])

  const steps = [
    {
      id: 'ai-key',
      label: 'Connect your AI (free)',
      description: 'Pick OpenAI, Anthropic, or Google — all have free credits',
      done: hasAiKey,
      href: '/settings/ai-keys',
      cta: 'Connect',
      icon: KeyRound,
    },
    {
      id: 'content',
      label: 'Import your first content',
      description: 'Paste a YouTube link, website URL, or type your script',
      done: contentCount > 0,
      href: `/workspace/${workspaceId}/content/new`,
      cta: 'Import',
      icon: Upload,
    },
    {
      id: 'outputs',
      label: 'Generate drafts',
      description: 'Clipflow creates TikTok, Reels, Shorts & LinkedIn posts for you',
      done: outputCount > 0,
      href: firstReadyContentId
        ? `/workspace/${workspaceId}/content/${firstReadyContentId}/outputs`
        : `/workspace/${workspaceId}`,
      cta: firstReadyContentId ? 'Generate' : 'Pick content',
      icon: Wand2,
    },
    {
      id: 'review',
      label: 'Review & publish',
      description: 'Approve your best drafts and schedule them to go live',
      done: hasApprovedOutput,
      href: `/workspace/${workspaceId}/pipeline`,
      cta: 'Review drafts',
      icon: CheckCircle2,
    },
  ]

  const doneCount = steps.filter((s) => s.done).length
  const allDone = doneCount === steps.length
  const currentStepIndex = steps.findIndex((s) => !s.done)

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) return null

  // All done + dismissed
  if (allDone && dismissed) return null

  // All done celebration
  if (allDone) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-background to-background p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <PartyPopper className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-foreground">You&apos;re all set!</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              You&apos;ve completed the setup. Start creating amazing content.
            </p>
          </div>
          <button
            onClick={() => {
              document.cookie = `${DISMISSED_COOKIE}=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
              localStorage.setItem(DISMISSED_COOKIE, 'true')
              setDismissed(true)
            }}
            className="shrink-0 rounded-lg p-2 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
      {/* Header */}
      <div className="border-b border-border/40 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">Get started with Clipflow</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {doneCount} of {steps.length} steps complete
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-2 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="rounded-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${(doneCount / steps.length) * 100}%` }}
              />
            </div>
            <span className="font-mono text-[11px] font-bold tabular-nums text-muted-foreground">
              {doneCount}/{steps.length}
            </span>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="p-4">
        <div className="relative space-y-1">
          {steps.map((step, i) => {
            const isCurrent = i === currentStepIndex
            const _isFuture = !step.done && !isCurrent
            const StepIcon = step.icon

            return (
              <div key={step.id} className="relative flex gap-4">
                {/* Vertical line */}
                {i < steps.length - 1 && (
                  <div
                    className={`absolute left-[17px] top-[36px] h-[calc(100%-16px)] w-[2px] ${
                      step.done ? 'bg-emerald-300' : 'bg-border/50'
                    }`}
                  />
                )}

                {/* Circle indicator */}
                <div className="relative z-10 flex shrink-0 pt-1">
                  {step.done ? (
                    <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-200">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </div>
                  ) : isCurrent ? (
                    <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20">
                      <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
                    </div>
                  ) : (
                    <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-border/50 bg-muted/30 text-muted-foreground/40">
                      <span className="text-xs font-bold">{i + 1}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div
                  className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    step.done
                      ? 'opacity-60'
                      : isCurrent
                        ? 'bg-primary/[0.04] ring-1 ring-primary/15'
                        : 'opacity-40'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      step.done
                        ? 'bg-emerald-50 text-emerald-500'
                        : isCurrent
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground/40'
                    }`}
                  >
                    <StepIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold ${
                        step.done
                          ? 'text-muted-foreground line-through'
                          : isCurrent
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  {step.done ? (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                      Done
                    </span>
                  ) : isCurrent ? (
                    <Link
                      href={step.href}
                      className="group inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/25"
                    >
                      {step.cta}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
