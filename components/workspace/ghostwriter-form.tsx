'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { ghostwriteAction, type GhostwriteState } from '@/app/(app)/workspace/[id]/ghostwriter/actions'

const initialState: GhostwriteState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? 'Writing script…' : 'Write script'}
    </button>
  )
}

interface GhostwriterFormProps {
  workspaceId: string
}

export function GhostwriterForm({ workspaceId }: GhostwriterFormProps) {
  const [state, formAction] = useFormState(ghostwriteAction, initialState)

  if (state && state.ok === true) {
    return (
      <div className="space-y-6">
        {/* Result card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-5">
          {/* Title */}
          <h2 className="text-xl font-bold">{state.title}</h2>

          {/* Hook */}
          {state.hook && (
            <div className="rounded-md bg-primary/5 border border-primary/20 px-4 py-3">
              <p className="text-xs font-medium text-primary mb-1">Opening hook</p>
              <p className="text-sm italic text-foreground">{state.hook}</p>
            </div>
          )}

          {/* Key points */}
          {state.keyPoints && state.keyPoints.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Key points</p>
              <ul className="space-y-1.5">
                {state.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary/10 text-center text-[10px] font-bold text-primary leading-4">
                      {i + 1}
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full script */}
          {state.script && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Full script</p>
              <div className="max-h-64 overflow-y-auto rounded-md border bg-muted/30 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                {state.script}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/workspace/${workspaceId}/content/${state.contentId}/outputs`}
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Generate platform outputs →
            </Link>
            <Link
              href={`/workspace/${workspaceId}/content/${state.contentId}`}
              className="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
            >
              Edit transcript
            </Link>
          </div>
        </div>

        {/* Write another */}
        <form action={formAction}>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="topic" value="_reset_" />
          <input type="hidden" name="tone" value="casual" />
          <input type="hidden" name="targetLength" value="medium" />
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            ← Write another
          </button>
        </form>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="workspaceId" value={workspaceId} />

      {/* Topic */}
      <div className="space-y-1.5">
        <label htmlFor="topic" className="text-sm font-medium">
          Topic / idea
        </label>
        <textarea
          id="topic"
          name="topic"
          rows={3}
          required
          minLength={10}
          maxLength={500}
          placeholder="e.g. 5 morning habits that changed my life"
          className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Tone */}
      <div className="space-y-1.5">
        <label htmlFor="tone" className="text-sm font-medium">
          Tone
        </label>
        <select
          id="tone"
          name="tone"
          defaultValue="casual"
          className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-64"
        >
          <option value="casual">Casual</option>
          <option value="professional">Professional</option>
          <option value="educational">Educational</option>
          <option value="entertaining">Entertaining</option>
        </select>
      </div>

      {/* Target length */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium">Target length</span>
        <div className="flex flex-wrap gap-3">
          {(
            [
              { value: 'short', label: 'Short', sub: '30–60s' },
              { value: 'medium', label: 'Medium', sub: '60–120s' },
              { value: 'long', label: 'Long', sub: '2–3 min' },
            ] as const
          ).map(({ value, label, sub }) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="targetLength"
                value={value}
                defaultChecked={value === 'medium'}
                className="accent-primary"
              />
              <span>
                {label}{' '}
                <span className="text-xs text-muted-foreground">({sub})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Error state */}
      {state && state.ok === false && (
        <p className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
