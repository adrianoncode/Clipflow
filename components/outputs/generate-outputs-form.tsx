'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import {
  Briefcase,
  Camera,
  Clock,
  Film,
  Loader2,
  Music,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { OUTPUT_LANGUAGES } from '@/lib/ai/prompts/languages'
import {
  generateOutputsAction,
  type GenerateOutputsState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'

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

export function GenerateOutputsForm({
  workspaceId,
  contentId,
  submitLabel = 'Generate 4 outputs',
}: GenerateOutputsFormProps) {
  const [state, formAction] = useFormState(generateOutputsAction, initialState)

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
