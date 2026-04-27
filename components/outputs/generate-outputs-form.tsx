'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import {
  Briefcase,
  Camera,
  Clock,
  Film,
  Loader2,
  Music,
  Plus,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { OUTPUT_LANGUAGES } from '@/lib/ai/prompts/languages'
import {
  generateOutputsAction,
  type GenerateOutputsState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import type { OutputTemplate } from '@/lib/templates/get-templates'

const initialState: GenerateOutputsState = {}

const PLATFORM_CARDS = [
  {
    key: 'tiktok',
    name: 'TikTok',
    icon: Music,
    color: 'bg-fuchsia-50 text-fuchsia-600',
    generates: 'Hook + Script',
  },
  {
    key: 'instagram_reels',
    name: 'Reels',
    icon: Camera,
    color: 'bg-rose-50 text-rose-600',
    generates: 'Caption + Hashtags',
  },
  {
    key: 'youtube_shorts',
    name: 'Shorts',
    icon: Film,
    color: 'bg-red-50 text-red-600',
    generates: 'Title + SEO desc',
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: Briefcase,
    color: 'bg-blue-50 text-blue-600',
    generates: 'Thought Leader',
  },
] as const

interface GenerateOutputsFormProps {
  workspaceId: string
  contentId: string
  submitLabel?: string
  /** Workspace's custom output templates. Renders a per-platform Format
   *  picker only for platforms that have at least one custom template. */
  customTemplates?: OutputTemplate[]
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      size="lg"
      className="w-full gap-2 bg-violet-600 text-base font-semibold shadow-md transition-all hover:bg-violet-700 hover:shadow-lg sm:w-auto sm:px-8"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  )
}

function PlatformCard({
  card,
  pending,
  generated,
}: {
  card: (typeof PLATFORM_CARDS)[number]
  pending: boolean
  generated: boolean
}) {
  const Icon = card.icon
  return (
    <div
      className={`relative flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-center transition-all ${
        generated
          ? 'border-emerald-200 bg-emerald-50/60'
          : pending
            ? 'border-violet-200 bg-violet-50/40'
            : 'border-border/50 bg-card hover:border-violet-200 hover:bg-violet-50/30'
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color} transition-transform ${pending ? 'animate-pulse' : ''}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold tracking-tight">{card.name}</p>
      <p className="text-[11px] leading-tight text-muted-foreground">
        {card.generates}
      </p>
      {pending && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white">
          <Loader2 className="h-3 w-3 animate-spin" />
        </div>
      )}
      {generated && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">
          ✓
        </div>
      )}
    </div>
  )
}

function PlatformCardsRow({
  isPending,
  generatedPlatforms,
}: {
  isPending: boolean
  generatedPlatforms: string[]
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {PLATFORM_CARDS.map((card) => (
        <PlatformCard
          key={card.key}
          card={card}
          pending={isPending}
          generated={generatedPlatforms.includes(card.key)}
        />
      ))}
    </div>
  )
}

/**
 * "Format per platform" picker — surfaces only when the workspace has
 * at least one custom template. Hidden entirely otherwise so the
 * default form stays as terse as it was.
 */
function FormatOverridesPanel({
  customTemplates,
  values,
  onChange,
}: {
  customTemplates: OutputTemplate[]
  values: Record<string, string>
  onChange: (platform: string, value: string) => void
}) {
  const byPlatform = PLATFORM_CARDS.map((card) => ({
    card,
    options: customTemplates.filter((t) => t.platform === card.key),
  })).filter((row) => row.options.length > 0)

  if (byPlatform.length === 0) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/75">
            Format
          </p>
          <p className="text-[12px] text-muted-foreground">
            Built-in template per platform — no custom formats yet.
          </p>
        </div>
        <Link
          href="/settings/templates"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-background px-2.5 text-[12px] font-semibold text-foreground transition-all hover:-translate-y-px hover:border-border hover:shadow-sm"
        >
          <Plus className="h-3 w-3" />
          New format
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2.5 rounded-xl border border-border/60 bg-muted/20 p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/75">
          Format per platform
        </p>
        <Link
          href="/settings/templates"
          className="font-bold text-[10px] font-bold uppercase tracking-[0.16em] text-primary/85 transition-colors hover:text-primary"
        >
          + New format
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {byPlatform.map(({ card, options }) => (
          <label
            key={card.key}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2.5 py-1.5"
          >
            <span className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85">
              {card.name}
            </span>
            <select
              name={`template_${card.key}`}
              value={values[card.key] ?? 'default'}
              onChange={(e) => onChange(card.key, e.target.value)}
              className="ml-auto rounded-md border border-border/60 bg-background px-2 py-1 text-[12px] font-medium focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="default">Built-in</option>
              {options.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  )
}

export function GenerateOutputsForm({
  workspaceId,
  contentId,
  submitLabel = 'Generate 4 drafts',
  customTemplates = [],
}: GenerateOutputsFormProps) {
  const [state, formAction] = useFormState(generateOutputsAction, initialState)

  // Per-platform format selection. Default = 'default' (built-in). Sent
  // as form fields so the action sees the override per platform.
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({})
  const handleTemplateChange = (platform: string, value: string) => {
    setTemplateValues((prev) => ({ ...prev, [platform]: value }))
  }

  const hardError =
    state && state.ok === false
      ? { code: state.code, message: state.error }
      : state && 'error' in state && state.error
        ? { code: 'unknown' as const, message: state.error }
        : null

  const partialFailures =
    state && state.ok === true && state.failed.length > 0 ? state.failed : null

  const generatedPlatforms =
    state && state.ok === true ? state.generated : []

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="content_id" value={contentId} />

      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight">
          Generate platform-specific content
        </h3>
        <p className="text-sm text-muted-foreground">
          Clipflow will create optimized versions of your content for each
          platform in parallel.
        </p>
      </div>

      {/* Platform preview cards */}
      <PlatformCardsRow isPending={false} generatedPlatforms={generatedPlatforms} />

      {/* Per-platform format picker */}
      <FormatOverridesPanel
        customTemplates={customTemplates}
        values={templateValues}
        onChange={handleTemplateChange}
      />

      {/* Language selector */}
      <div className="space-y-1.5">
        <label htmlFor="target_language" className="text-sm font-medium">
          Output language
        </label>
        <select
          id="target_language"
          name="target_language"
          defaultValue="en"
          className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-56"
        >
          {OUTPUT_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label} ({lang.nativeName})
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Select the language for generated content. Input can be in any
          language.
        </p>
      </div>

      {/* Errors */}
      {hardError ? (
        <FormMessage variant="error">
          {hardError.message}
          {hardError.code === 'no_key' ? (
            <>
              {' '}
              <Link href="/settings/ai-keys" className="underline">
                Connect your AI
              </Link>
              .
            </>
          ) : null}
        </FormMessage>
      ) : null}

      {partialFailures ? (
        <FormMessage variant="error">
          Some platforms failed:{' '}
          {partialFailures.map((f) => f.platform).join(', ')}. See each card
          below for details.
        </FormMessage>
      ) : null}

      {/* CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton label={submitLabel} />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Takes 15-60 seconds. You&apos;ll get 4 ready-to-post drafts.</span>
        </div>
      </div>
    </form>
  )
}
