'use client'

import { useState, useTransition } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Globe,
  Link2,
  Loader2,
  Sparkles,
  Youtube,
  type LucideIcon,
} from 'lucide-react'

type DetectedType = 'youtube' | 'url' | 'text' | null

function detectInputType(value: string): DetectedType {
  const trimmed = value.trim()
  if (!trimmed) return null

  // YouTube URL patterns
  if (
    /^https?:\/\/(www\.)?(youtube\.com\/(watch|shorts|live)|youtu\.be\/)/i.test(trimmed)
  ) {
    return 'youtube'
  }

  // General URL pattern
  if (/^https?:\/\//i.test(trimmed)) {
    return 'url'
  }

  // If it looks like a URL without protocol
  if (/^(www\.)?[\w-]+\.(com|io|co|org|net|dev|app|me)\//i.test(trimmed)) {
    return 'url'
  }

  // Everything else is text (script/transcript)
  if (trimmed.length >= 10) {
    return 'text'
  }

  return null
}

const DETECT_META: Record<
  Exclude<DetectedType, null>,
  { label: string; Icon: LucideIcon; tone: string }
> = {
  youtube: {
    label: 'YouTube video detected',
    Icon: Youtube,
    tone: 'text-[#FF0000]',
  },
  url: { label: 'Website link detected', Icon: Globe, tone: 'text-blue-600' },
  text: { label: 'Script · paste more or hit ⌘↵', Icon: FileText, tone: 'text-primary' },
}

interface SmartImportBoxProps {
  workspaceId: string
  /** When false we show an inline "no key" hint — text imports need an
   *  OpenAI key downstream to generate drafts, and we'd rather warn
   *  up-front than let the user find out after submitting. */
  hasOpenAiKey: boolean
}

/**
 * Universal import box — paste anything and Clipflow figures it out.
 *
 * - YouTube URL → auto-fetches transcript
 * - Website URL → auto-scrapes content
 * - Text → imports as script (no transcription needed)
 *
 * Designed-grade chassis: layered shadow + a violet edge-light, focus-
 * within ring tinted to primary, a permanent primary CTA on the right
 * (disabled until something usable is detected) and a live detection
 * row on the bottom that announces *what* will happen when the user
 * hits Import.
 */
export function SmartImportBox({ workspaceId, hasOpenAiKey }: SmartImportBoxProps) {
  const [value, setValue] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const detected = detectInputType(value)
  const canSubmit = detected !== null && !isPending
  const meta = detected ? DETECT_META[detected] : null
  const isEmpty = value.trim().length === 0

  function handleSubmit() {
    if (!canSubmit) return
    setError(null)

    startTransition(async () => {
      try {
        const trimmed = value.trim()

        if (detected === 'youtube') {
          const fd = new FormData()
          fd.set('workspace_id', workspaceId)
          fd.set('url', trimmed)
          const { createYoutubeContentAction } = await import(
            '@/app/(app)/workspace/[id]/content/new/actions'
          )
          const result = await createYoutubeContentAction({}, fd)
          // On success the server action calls redirect() which throws
          // NEXT_REDIRECT — so if we reach here, it returned an error.
          if (result?.error) {
            setError(result.error)
          }
        } else if (detected === 'url') {
          let url = trimmed
          if (!/^https?:\/\//i.test(url)) url = 'https://' + url
          const fd = new FormData()
          fd.set('workspace_id', workspaceId)
          fd.set('url', url)
          const { createUrlContentAction } = await import(
            '@/app/(app)/workspace/[id]/content/new/actions'
          )
          const result = await createUrlContentAction({}, fd)
          if (result?.error) {
            setError(result.error)
          }
        } else if (detected === 'text') {
          const fd = new FormData()
          fd.set('workspace_id', workspaceId)
          fd.set('body', trimmed)
          fd.set('title', trimmed.slice(0, 60).replace(/\n/g, ' ').trim())
          const { createTextContentAction } = await import(
            '@/app/(app)/workspace/[id]/content/new/actions'
          )
          const result = await createTextContentAction({}, fd)
          if (result?.error) {
            setError(result.error)
          }
        }
      } catch (err) {
        // Next.js redirect() throws a NEXT_REDIRECT error — let it propagate
        if (err instanceof Error && err.message?.includes('NEXT_REDIRECT')) {
          throw err
        }
        const detail = err instanceof Error ? err.message : 'Unknown error'
        setError(`Import failed: ${detail}. Try again.`)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Cmd/Ctrl+Enter or Enter (for URLs) to submit
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || detected === 'youtube' || detected === 'url')) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-3">
      <div
        className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card transition-all focus-within:border-primary/40 focus-within:shadow-[0_0_0_4px_rgba(42,26,61,0.10)]"
        style={{
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 2px rgba(42,26,61,0.04), 0 14px 36px -22px rgba(42,26,61,0.22)',
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
        />
        {/* Soft brand glow tucked behind the leading icon — gives the
            box real depth without printing a billboard. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(42,26,61,0.14) 0%, rgba(42,26,61,0) 65%)',
          }}
        />

        <div className="relative flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
          {/* Leading icon — pulses subtly when input is empty, shifts to
              the detected format icon once the user types. */}
          <div
            className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white sm:h-12 sm:w-12"
            style={{
              background:
                'linear-gradient(140deg, #2A1A3D 0%, #120920 60%, #2A1A3D 100%)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 22px -10px rgba(42,26,61,0.55)',
            }}
            aria-hidden
          >
            <span
              className="pointer-events-none absolute inset-1 rounded-[10px]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)',
              }}
            />
            {isPending ? (
              <Loader2 className="relative h-4.5 w-4.5 animate-spin" />
            ) : detected === 'youtube' || detected === 'url' ? (
              <Link2 className="relative h-4.5 w-4.5" />
            ) : (
              <Sparkles className="relative h-4.5 w-4.5" />
            )}
            {isEmpty && !isPending ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-primary/30"
                style={{ animation: 'cf-pulse 2.4s ease-in-out infinite' }}
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <textarea
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Paste a YouTube link, website URL, or type your script…"
              rows={2}
              className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/55 focus:outline-none"
              disabled={isPending}
            />
          </div>

          {/* Always-visible primary CTA — disabled state telegraphs
              "we're waiting for input" instead of just hiding the button. */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`relative mt-0.5 inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[12.5px] font-bold tracking-tight transition-all sm:h-12 sm:px-4 ${
              canSubmit
                ? 'bg-foreground text-background shadow-sm shadow-foreground/[0.18] hover:-translate-y-px hover:shadow-md hover:shadow-foreground/[0.28]'
                : 'cursor-not-allowed border border-border/60 bg-background text-muted-foreground/70'
            }`}
            style={{
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Importing
              </>
            ) : (
              <>
                Import
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Live detection / shortcut footer — always present so the box
            has a stable height and the bottom rail reads as part of the
            chassis rather than a popup that flickers in. */}
        <div className="relative flex items-center justify-between gap-3 border-t border-border/55 px-4 py-2.5 sm:px-5">
          {meta ? (
            <p className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold tracking-tight text-foreground">
              <span className={`flex h-4 w-4 items-center justify-center ${meta.tone}`}>
                <meta.Icon className="h-3.5 w-3.5" />
              </span>
              {meta.label}
              {detected === 'youtube' || detected === 'url' ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              ) : null}
            </p>
          ) : (
            <p className="inline-flex items-center gap-2 text-[11.5px] text-muted-foreground/75">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary/60" />
              Auto-detects YouTube, links, or raw script — no per-source forms.
            </p>
          )}
          <span
            className="hidden items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground/65 sm:inline-flex"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
          >
            <kbd className="rounded border border-border/70 bg-background px-1 py-0.5 font-mono text-[10px] text-muted-foreground/85">
              ⌘
            </kbd>
            <kbd className="rounded border border-border/70 bg-background px-1 py-0.5 font-mono text-[10px] text-muted-foreground/85">
              ↵
            </kbd>
            to import
          </span>
        </div>
      </div>

      {/* OpenAI-key warning — text imports silently skip draft
          generation when there's no key, so surface it up front. */}
      {!hasOpenAiKey && detected === 'text' ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-[12px] leading-relaxed text-amber-900">
          Heads up — no OpenAI key on file. You can still import the script,
          but draft generation won&rsquo;t run until you connect one in
          Settings → AI Keys.
        </p>
      ) : null}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3 py-2 text-[12px] text-destructive">
          {error}
        </p>
      )}

      {/* Local keyframes — scoped via the unique class name so the
          animation doesn't leak globally. */}
      <style jsx>{`
        @keyframes cf-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0; transform: scale(1.18); }
        }
      `}</style>
    </div>
  )
}
