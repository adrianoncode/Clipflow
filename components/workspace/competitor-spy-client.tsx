'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { analyzeCompetitorAction } from '@/app/(app)/workspace/[id]/competitors/actions'

interface CompetitorSpyClientProps {
  workspaceId: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Analyzing competitor...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Analyze
        </>
      )}
    </button>
  )
}

type AnalysisResult = {
  url: string
  title: string | null
  tone: string
  contentPillars: string[]
  writingStyle: string
  strengths: string[]
  gaps: string[]
  targetAudience: string
  postingApproach: string
  differentiatorSuggestions: string[]
  analyzedAt: string
}

export function CompetitorSpyClient({ workspaceId }: CompetitorSpyClientProps) {
  const [state, formAction] = useFormState(analyzeCompetitorAction, null)
  const [showForm, setShowForm] = useState(true)

  const handleAnalyzeAnother = () => {
    setShowForm(true)
  }

  if (state && state.ok && state.analysis && !showForm) {
    return (
      <AnalysisCard
        analysis={state.analysis as AnalysisResult}
        workspaceId={workspaceId}
        onReset={handleAnalyzeAnother}
      />
    )
  }

  return (
    <div className="space-y-6">
      <form
        action={(fd) => {
          setShowForm(false)
          formAction(fd)
        }}
        className="space-y-4 rounded-lg border bg-card p-4"
      >
        <input type="hidden" name="workspaceId" value={workspaceId} />

        <div className="space-y-1.5">
          <label htmlFor="competitorUrl" className="text-sm font-medium">
            Competitor URL
          </label>
          <input
            id="competitorUrl"
            name="competitorUrl"
            type="url"
            placeholder="https://competitor.com/blog"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="yourNiche" className="text-sm font-medium">
            Your niche{' '}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="yourNiche"
            name="yourNiche"
            type="text"
            placeholder="productivity / fitness / etc. — helps AI give better suggestions"
            maxLength={200}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <SubmitButton />
      </form>

      {state && !state.ok && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {state && state.ok && state.analysis && !showForm && (
        <AnalysisCard
          analysis={state.analysis as AnalysisResult}
          workspaceId={workspaceId}
          onReset={handleAnalyzeAnother}
        />
      )}
    </div>
  )
}

function AnalysisCard({
  analysis,
  workspaceId,
  onReset,
}: {
  analysis: AnalysisResult
  workspaceId: string
  onReset: () => void
}) {
  const hostname = (() => {
    try {
      return new URL(analysis.url).hostname
    } catch {
      return analysis.url
    }
  })()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
        <div>
          <a
            href={analysis.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline"
          >
            {analysis.title || hostname} ↗
          </a>
          {analysis.title && (
            <p className="text-xs text-muted-foreground">{hostname}</p>
          )}
        </div>
        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
          Analyzed just now
        </span>
      </div>

      {/* Two-column grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          <InfoBlock label="Tone">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {analysis.tone}
            </span>
          </InfoBlock>

          <InfoBlock label="Target Audience">
            <p className="text-sm">{analysis.targetAudience}</p>
          </InfoBlock>

          <InfoBlock label="Writing Style">
            <p className="text-sm">{analysis.writingStyle}</p>
          </InfoBlock>

          <InfoBlock label="Content Pillars">
            <div className="flex flex-wrap gap-1.5">
              {analysis.contentPillars.map((pillar) => (
                <span
                  key={pillar}
                  className="rounded-full border px-2.5 py-0.5 text-xs"
                >
                  {pillar}
                </span>
              ))}
            </div>
          </InfoBlock>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <InfoBlock label="Strengths">
            <ul className="space-y-1.5">
              {analysis.strengths.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {s}
                </li>
              ))}
            </ul>
          </InfoBlock>

          <InfoBlock label="Gaps / Opportunities">
            <ul className="space-y-1.5">
              {analysis.gaps.map((g) => (
                <li key={g} className="flex items-start gap-2 text-sm">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                  </svg>
                  {g}
                </li>
              ))}
            </ul>
          </InfoBlock>

          <InfoBlock label="Posting Approach">
            <p className="text-sm">{analysis.postingApproach}</p>
          </InfoBlock>
        </div>
      </div>

      {/* How to stand out */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 font-semibold">How to stand out</h3>
        <ol className="space-y-2">
          {analysis.differentiatorSuggestions.map((suggestion, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 shrink-0 text-base">🎯</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          Analyze another competitor
        </button>
        <Link
          href={`/workspace/${workspaceId}/ghostwriter`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Use insights in Ghostwriter →
        </Link>
      </div>
    </div>
  )
}

function InfoBlock({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}
