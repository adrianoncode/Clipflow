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

import { PremiumProgress } from '@/components/ui/premium-progress'

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
      description: 'Paste a YouTube link, upload a video, or drop in a script',
      done: contentCount > 0,
      href: `/workspace/${workspaceId}/content/new`,
      cta: 'Import',
      icon: Upload,
    },
    {
      id: 'outputs',
      label: 'Generate drafts',
      description: 'One script in, platform-ready drafts for TikTok, Reels, Shorts & LinkedIn out',
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
      <div className="relative overflow-hidden rounded-2xl border border-lime-soft-2/60 bg-gradient-to-br from-lime-soft via-card to-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-lime-soft-2 text-lime-ink">
            <PartyPopper className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-foreground">Setup complete</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Everything&apos;s wired up. Time to ship some posts.
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
    <div
      className="relative overflow-hidden rounded-2xl border bg-card"
      style={{
        borderColor: '#CFC4AF',
        background:
          'linear-gradient(180deg, rgba(214,255,62,.06) 0%, #FFFDF8 30%)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,.7) inset, 0 0 0 4px rgba(214,255,62,.06), 0 22px 44px -28px rgba(42,26,61,.22)',
      }}
    >
      {/* Soft lime glow tucked behind the header — same trick the
          hero uses, signals "this is the live action item". */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(214,255,62,.18) 0%, rgba(214,255,62,0) 60%)',
        }}
      />
      {/* Header */}
      <div
        className="relative px-6 py-4"
        style={{ borderBottom: '1px solid rgba(207,196,175,.55)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className="mb-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.22em]"
              style={{ color: '#5f5850' }}
            >
              Setup · {doneCount === 0 ? 'start here' : 'in progress'}
            </p>
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Get started with Clipflow
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {doneCount} of {steps.length} steps complete
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PremiumProgress
              value={doneCount}
              max={steps.length}
              height={8}
              label="Setup progress"
              className="w-32"
            />
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
                      step.done ? 'bg-lime-soft-2' : 'bg-border/50'
                    }`}
                  />
                )}

                {/* Circle indicator — three states, each with real depth.
                    Done: chartreuse-tinted plum chip with inner highlight + drop glow.
                    Current: plum-gradient with a chartreuse pulse halo around it.
                    Future: brushed-paper chip with concave inset, etched look. */}
                <div className="relative z-10 flex shrink-0 pt-1">
                  {step.done ? (
                    <div
                      className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#D6FF3E]"
                      style={{
                        background:
                          'linear-gradient(140deg, #2A1A3D 0%, #120920 100%)',
                        boxShadow:
                          'inset 0 1px 0 rgba(214, 255, 62, 0.20), inset 0 -1px 0 rgba(0, 0, 0, 0.40), 0 2px 0 rgba(255, 255, 255, 0.55), 0 4px 10px -2px rgba(214, 255, 62, 0.30), 0 8px 18px -6px rgba(42, 26, 61, 0.45)',
                      }}
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-1 rounded-full"
                        style={{
                          background:
                            'linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 50%)',
                        }}
                      />
                      <Check className="relative h-4 w-4" strokeWidth={3} />
                    </div>
                  ) : isCurrent ? (
                    <div className="relative">
                      {/* Pulsing chartreuse halo around the active step */}
                      <span
                        aria-hidden
                        className="cf-step-pulse pointer-events-none absolute inset-0 rounded-full"
                        style={{
                          boxShadow: '0 0 0 0 rgba(214, 255, 62, 0.60)',
                        }}
                      />
                      <div
                        className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#D6FF3E]"
                        style={{
                          background:
                            'linear-gradient(140deg, #2A1A3D 0%, #120920 100%)',
                          boxShadow:
                            'inset 0 1px 0 rgba(214, 255, 62, 0.18), inset 0 -1px 0 rgba(0, 0, 0, 0.40), 0 0 0 2px rgba(214, 255, 62, 0.30), 0 4px 12px -2px rgba(42, 26, 61, 0.45)',
                        }}
                      >
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-1 rounded-full"
                          style={{
                            background:
                              'linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 50%)',
                          }}
                        />
                        <span
                          aria-hidden
                          className="relative h-2.5 w-2.5 animate-pulse rounded-full"
                          style={{
                            background: '#D6FF3E',
                            boxShadow: '0 0 6px rgba(214, 255, 62, 0.85)',
                          }}
                        />
                      </div>
                      <style jsx>{`
                        @keyframes cf-step-pulse {
                          0% { box-shadow: 0 0 0 0 rgba(214, 255, 62, 0.55); }
                          70% { box-shadow: 0 0 0 10px rgba(214, 255, 62, 0); }
                          100% { box-shadow: 0 0 0 0 rgba(214, 255, 62, 0); }
                        }
                        .cf-step-pulse {
                          animation: cf-step-pulse 2.2s ease-out infinite;
                        }
                        @media (prefers-reduced-motion: reduce) {
                          .cf-step-pulse { animation: none; }
                        }
                      `}</style>
                    </div>
                  ) : (
                    <div
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-muted-foreground/55"
                      style={{
                        background: 'rgba(42, 26, 61, 0.04)',
                        boxShadow:
                          'inset 0 1px 2px rgba(42, 26, 61, 0.18), inset 0 -1px 0 rgba(255, 255, 255, 0.55), 0 1px 0 rgba(255, 255, 255, 0.45)',
                      }}
                    >
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{
                          fontFamily:
                            'var(--font-inter-tight), var(--font-inter), sans-serif',
                        }}
                      >
                        {i + 1}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div
                  className={`flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-3 rounded-xl px-4 py-3 transition-all ${
                    step.done
                      ? 'opacity-60'
                      : isCurrent
                        ? ''
                        : 'opacity-40'
                  }`}
                  style={
                    isCurrent
                      ? {
                          background:
                            'linear-gradient(180deg, rgba(255,255,255,.7) 0%, rgba(214,255,62,.08) 100%)',
                          boxShadow:
                            '0 0 0 1px rgba(42,26,61,.10), 0 1px 0 rgba(255,255,255,.9) inset, 0 8px 18px -10px rgba(42,26,61,.18)',
                        }
                      : undefined
                  }
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      step.done
                        ? 'bg-lime-soft text-lime-ink'
                        : isCurrent
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground/40'
                    }`}
                  >
                    <StepIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 basis-[160px]">
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
                    <span className="shrink-0 rounded-full bg-lime-soft px-2.5 py-1 text-[10px] font-bold text-lime-ink">
                      Done
                    </span>
                  ) : isCurrent ? (
                    <Link
                      href={step.href}
                      className="lv2d-btn-primary w-full shrink-0 justify-center sm:w-auto sm:justify-start"
                    >
                      {step.cta}
                      <ArrowRight className="h-3 w-3" />
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
