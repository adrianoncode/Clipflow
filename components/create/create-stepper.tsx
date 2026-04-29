'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Persistent Stepper-Header für die Create-Section.
 *
 * Sitzt auf jeder Create-Page (Library, Per-Video Detail Tabs,
 * Pipeline, Schedule) und gibt dem User immer die Antwort auf:
 * "Wo bin ich, was kommt als nächstes?"
 *
 * Visual: dünne Pill-Reihe ① ② ③ ④ ⑤ ⑥. Aktiver Step plum-gefüllt,
 * vergangene Steps outlined-clickable, künftige Steps dashed-faint.
 * Mobile: nur Nummern, Labels ab sm: sichtbar.
 *
 * Steps 2-4 sind per-Video — sie brauchen einen contentId um deep-linkable
 * zu sein. Auf einer Per-Video-Page = der aktuelle contentId. Auf
 * Library/Pipeline/Schedule = der zuletzt importierte contentId (vom
 * Server-Page mitgeliefert) damit der User direkt zu Step 2/3/4 springen
 * kann ohne den Flow von vorn zu durchlaufen. Wenn das Workspace noch
 * keine Recordings hat, bleiben Steps 2-4 als ghost-Pills (read-only).
 */

const STEPS = [
  { n: 1 as const, label: 'Import' },
  { n: 2 as const, label: 'Process' },
  { n: 3 as const, label: 'Highlights' },
  { n: 4 as const, label: 'Drafts' },
  { n: 5 as const, label: 'Approve' },
  { n: 6 as const, label: 'Schedule' },
]

export type CreateStep = (typeof STEPS)[number]['n']

export interface CreateStepperProps {
  workspaceId: string
  /**
   * Explicit override. If provided, that step is "active". Otherwise
   * we infer from pathname.
   */
  activeStep?: CreateStep
  /** Required for steps 2-4 to deep-link back to the per-video page. */
  contentId?: string
  /** Visual mode override — defaults inferred from sm: breakpoint. */
  className?: string
}

function deriveActiveStep(
  pathname: string,
  workspaceId: string,
): CreateStep {
  const ws = `/workspace/${workspaceId}`
  if (pathname === `${ws}/schedule` || pathname.startsWith(`${ws}/schedule/`)) return 6
  if (pathname === `${ws}/pipeline` || pathname.startsWith(`${ws}/pipeline/`)) return 5
  if (pathname.includes('/outputs')) return 4
  if (pathname.includes('/highlights')) return 3
  // Per-video detail base (`/content/[id]` without suffix) = Source view = Step 2
  if (/^\/workspace\/[^/]+\/content\/[^/]+$/.test(pathname)) return 2
  // /content/new (Import) = Step 1
  return 1
}

function hrefForStep(
  step: CreateStep,
  workspaceId: string,
  contentId?: string,
): string | null {
  const ws = `/workspace/${workspaceId}`
  switch (step) {
    case 1:
      return ws
    case 2:
      return contentId ? `${ws}/content/${contentId}` : null
    case 3:
      return contentId ? `${ws}/content/${contentId}/highlights` : null
    case 4:
      return contentId ? `${ws}/content/${contentId}/outputs` : null
    case 5:
      return `${ws}/pipeline`
    case 6:
      return `${ws}/schedule`
  }
}

export function CreateStepper({
  workspaceId,
  activeStep,
  contentId,
  className,
}: CreateStepperProps) {
  const pathname = usePathname()
  const active = activeStep ?? deriveActiveStep(pathname, workspaceId)

  return (
    <nav
      aria-label="Create workflow"
      className={`relative -mx-1 overflow-x-auto px-1 ${className ?? ''}`}
    >
      <ol className="flex items-center gap-1.5">
        {STEPS.map((step, i) => {
          const isActive = step.n === active
          const isPast = step.n < active
          const href = hrefForStep(step.n, workspaceId, contentId)
          const clickable = !isActive && href !== null

          return (
            <li
              key={step.n}
              className="flex shrink-0 items-center gap-1.5"
            >
              <StepPill
                n={step.n}
                label={step.label}
                isActive={isActive}
                isPast={isPast}
                href={clickable ? href : null}
              />
              {i < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className={`h-px w-3 transition-colors sm:w-5 ${
                    isPast ? 'bg-primary/40' : 'bg-border/70'
                  }`}
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function StepPill({
  n,
  label,
  isActive,
  isPast,
  href,
}: {
  n: CreateStep
  label: string
  isActive: boolean
  isPast: boolean
  href: string | null
}) {
  const numberCircleClass = isActive
    ? 'bg-[#2A1A3D] text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_4px_10px_-4px_rgba(42,26,61,0.55)]'
    : isPast
      ? 'border border-primary/40 bg-primary/[0.06] text-primary'
      : 'border border-dashed border-border bg-background text-muted-foreground/55'

  const labelClass = isActive
    ? 'font-bold text-foreground'
    : isPast
      ? 'font-medium text-foreground/80'
      : 'text-muted-foreground/55'

  const inner = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full pr-0 sm:pr-2.5 ${
        href !== null ? 'transition-opacity hover:opacity-80' : ''
      }`}
    >
      <span
        aria-hidden
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-colors ${numberCircleClass}`}
        style={{
          fontFamily:
            'var(--font-inter-tight), var(--font-inter), sans-serif',
        }}
      >
        {n}
      </span>
      <span
        className={`hidden whitespace-nowrap text-[12px] tracking-tight sm:inline ${labelClass}`}
        style={{
          fontFamily:
            'var(--font-inter-tight), var(--font-inter), sans-serif',
        }}
      >
        {label}
      </span>
    </span>
  )

  if (href !== null) {
    return (
      <Link
        href={href}
        aria-current={isActive ? 'step' : undefined}
        className="rounded-full"
      >
        {inner}
      </Link>
    )
  }

  return (
    <span
      aria-current={isActive ? 'step' : undefined}
      className="cursor-default"
    >
      {inner}
    </span>
  )
}
