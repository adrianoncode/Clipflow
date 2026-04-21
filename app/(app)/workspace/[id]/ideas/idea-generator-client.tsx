'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import {
  ArrowRight,
  Clock,
  Copy,
  Loader2,
  Lightbulb,
  Check,
} from 'lucide-react'
import Link from 'next/link'

import { generateIdeasAction } from './actions'
import type { ContentIdea } from './actions'
import { copyToClipboard } from '@/lib/utils/copy-to-clipboard'

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram_reels: 'Instagram',
  youtube_shorts: 'Shorts',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <Lightbulb className="h-4 w-4" />
          Generate ideas
        </>
      )}
    </button>
  )
}

export function IdeaGeneratorClient({ workspaceId }: { workspaceId: string }) {
  const [state, formAction] = useFormState(generateIdeasAction, {})

  const ideas: ContentIdea[] | null = state.ok === true ? state.ideas : null

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
        <input type="hidden" name="workspace_id" value={workspaceId} />

        <div>
          <label
            htmlFor="idea-topic"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Topic
          </label>
          <textarea
            id="idea-topic"
            name="topic"
            rows={2}
            required
            placeholder="e.g. How indie SaaS founders beat burnout while shipping weekly"
            className="w-full resize-none rounded-xl border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label
            htmlFor="idea-constraints"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Constraints <span className="font-normal">(optional)</span>
          </label>
          <input
            id="idea-constraints"
            name="constraints"
            type="text"
            placeholder="e.g. under 60s · coach audience · avoid technical jargon"
            className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Uses your brand voice · 8-10 ideas per run
          </p>
          <SubmitBtn />
        </div>

        {state.ok === false ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
            {state.error}
          </p>
        ) : null}
      </form>

      {ideas && ideas.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-bold">
              {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Click to copy · pick one to record
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {ideas.map((idea, i) => (
              <IdeaCard key={i} idea={idea} workspaceId={workspaceId} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function IdeaCard({ idea, workspaceId }: { idea: ContentIdea; workspaceId: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const text = `${idea.title}\n\nHook: ${idea.hook}\n\nOutline:\n${idea.outline
      .map((o) => `• ${o}`)
      .join('\n')}\n\nSuggested platforms: ${idea.bestPlatforms
      .map((p) => PLATFORM_LABELS[p] ?? p)
      .join(', ')} · ${idea.estimatedLengthMinutes}m`

    const ok = await copyToClipboard(text)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <article className="group relative flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-bold leading-tight text-foreground">
          {idea.title}
        </h3>
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
          aria-label={copied ? 'Copied' : 'Copy idea'}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      <p className="rounded-lg bg-primary/[0.05] px-3 py-2 text-[13px] italic leading-snug text-primary">
        &ldquo;{idea.hook}&rdquo;
      </p>

      {idea.outline.length > 0 ? (
        <ul className="space-y-1 text-[12.5px] leading-relaxed text-muted-foreground">
          {idea.outline.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-[3px] block h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex items-center justify-between border-t pt-3">
        <div className="flex flex-wrap gap-1">
          {idea.bestPlatforms.map((p) => (
            <span
              key={p}
              className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
            >
              {PLATFORM_LABELS[p] ?? p}
            </span>
          ))}
        </div>
        <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/70">
          <Clock className="h-3 w-3" />
          {idea.estimatedLengthMinutes}m
        </span>
      </div>

      <Link
        href={`/workspace/${workspaceId}/content/new?idea_title=${encodeURIComponent(idea.title)}&idea_hook=${encodeURIComponent(idea.hook)}`}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/[0.04] py-2 text-[12px] font-bold text-primary transition-all hover:border-primary/30 hover:bg-primary/10"
      >
        Record this
        <ArrowRight className="h-3 w-3" />
      </Link>
    </article>
  )
}
