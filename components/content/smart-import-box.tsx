'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Film,
  Globe,
  Link2,
  Loader2,
  Sparkles,
  Upload,
  X,
  Youtube,
  type LucideIcon,
} from 'lucide-react'

import { OtherSourcesDrawer } from '@/components/content/other-sources-drawer'
import {
  ACCEPTED_VIDEO_EXTENSIONS,
  MAX_VIDEO_BYTES,
} from '@/lib/content/schemas'
import { parseExtension } from '@/lib/content/storage-paths'
import { createClient } from '@/lib/supabase/client'

type DetectedType = 'youtube' | 'url' | 'text' | 'file' | null

function detectInputType(value: string): Exclude<DetectedType, 'file' | null> | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (
    /^https?:\/\/(www\.)?(youtube\.com\/(watch|shorts|live)|youtu\.be\/)/i.test(trimmed)
  ) {
    return 'youtube'
  }
  if (/^https?:\/\//i.test(trimmed)) return 'url'
  if (/^(www\.)?[\w-]+\.(com|io|co|org|net|dev|app|me)\//i.test(trimmed)) return 'url'
  if (trimmed.length >= 10) return 'text'
  return null
}

const DETECT_META: Record<
  Exclude<DetectedType, null>,
  { label: string; Icon: LucideIcon; tone: string }
> = {
  youtube: { label: 'YouTube video detected', Icon: Youtube, tone: 'text-[#FF0000]' },
  url: { label: 'Website link detected', Icon: Globe, tone: 'text-blue-600' },
  text: { label: 'Script · paste more or hit ⌘↵', Icon: FileText, tone: 'text-primary' },
  file: { label: 'File ready to upload', Icon: Film, tone: 'text-emerald-600' },
}

const ACCEPT_ATTR = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/ogg',
].join(',')

interface SmartImportBoxProps {
  workspaceId: string
  hasOpenAiKey: boolean
  /**
   * 'redirect' (legacy /content/new flow): on success the server action
   *   redirects to /content/[id]. Used when the page expects to navigate.
   * 'inline' (Library flow): on success the box just clears so the user
   *   can paste the next item. Recent-Imports-Strip picks up the new row
   *   via Realtime — no navigation, true queue UX.
   */
  mode?: 'redirect' | 'inline'
}

export function SmartImportBox({
  workspaceId,
  hasOpenAiKey,
  mode = 'redirect',
}: SmartImportBoxProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [value, setValue] = useState('')
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const textDetected = detectInputType(value)
  const detected: DetectedType = stagedFile ? 'file' : textDetected
  const canSubmit = detected !== null && !isPending
  const meta = detected ? DETECT_META[detected] : null
  const isEmpty = !value.trim() && !stagedFile

  function clearAfterSubmit() {
    setValue('')
    setStagedFile(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    // Refocus the textarea so the user can immediately paste the next.
    textareaRef.current?.focus()
  }

  function stageFile(file: File) {
    setError(null)
    if (file.size > MAX_VIDEO_BYTES) {
      setError(
        `File is ${formatBytes(file.size)}. Whisper accepts up to ${formatBytes(MAX_VIDEO_BYTES)}.`,
      )
      return
    }
    if (!parseExtension(file.name)) {
      setError(
        `Unsupported format. Supported: ${ACCEPTED_VIDEO_EXTENSIONS.join(', ')}.`,
      )
      return
    }
    setStagedFile(file)
  }

  function handleSubmit() {
    if (!canSubmit) return
    setError(null)

    startTransition(async () => {
      try {
        if (detected === 'file' && stagedFile) {
          await submitFile(stagedFile)
        } else if (detected === 'youtube') {
          await submitYoutube(value.trim())
        } else if (detected === 'url') {
          let url = value.trim()
          if (!/^https?:\/\//i.test(url)) url = 'https://' + url
          await submitUrl(url)
        } else if (detected === 'text') {
          await submitText(value.trim())
        }
      } catch (err) {
        if (err instanceof Error && err.message?.includes('NEXT_REDIRECT')) {
          throw err
        }
        const detail = err instanceof Error ? err.message : 'Unknown error'
        setError(`Import failed: ${detail}. Try again.`)
      }
    })
  }

  async function submitYoutube(url: string) {
    const fd = new FormData()
    fd.set('workspace_id', workspaceId)
    fd.set('url', url)
    if (mode === 'inline') fd.set('inline', 'true')
    const { createYoutubeContentAction } = await import(
      '@/app/(app)/workspace/[id]/content/new/actions'
    )
    const result = await createYoutubeContentAction({}, fd)
    if (result?.error) {
      setError(result.error)
      return
    }
    if (mode === 'inline') {
      clearAfterSubmit()
      router.refresh()
    }
  }

  async function submitUrl(url: string) {
    const fd = new FormData()
    fd.set('workspace_id', workspaceId)
    fd.set('url', url)
    if (mode === 'inline') fd.set('inline', 'true')
    const { createUrlContentAction } = await import(
      '@/app/(app)/workspace/[id]/content/new/actions'
    )
    const result = await createUrlContentAction({}, fd)
    if (result?.error) {
      setError(result.error)
      return
    }
    if (mode === 'inline') {
      clearAfterSubmit()
      router.refresh()
    }
  }

  async function submitText(body: string) {
    const fd = new FormData()
    fd.set('workspace_id', workspaceId)
    fd.set('body', body)
    fd.set('title', body.slice(0, 60).replace(/\n/g, ' ').trim())
    if (mode === 'inline') fd.set('inline', 'true')
    const { createTextContentAction } = await import(
      '@/app/(app)/workspace/[id]/content/new/actions'
    )
    const result = await createTextContentAction({}, fd)
    if (result?.error) {
      setError(result.error)
      return
    }
    if (mode === 'inline') {
      clearAfterSubmit()
      router.refresh()
    }
  }

  async function submitFile(file: File) {
    const ext = parseExtension(file.name)
    if (!ext) {
      setError('Unsupported format.')
      return
    }
    const { createVideoContentAction, startTranscriptionAction } = await import(
      '@/app/(app)/workspace/[id]/content/new/actions'
    )
    const createForm = new FormData()
    createForm.set('workspace_id', workspaceId)
    createForm.set('filename', file.name)
    createForm.set('ext', ext)
    createForm.set('file_size', String(file.size))
    createForm.set('mime_type', file.type)

    const created = await createVideoContentAction({ ok: false, error: '' }, createForm)
    if (!created.ok) {
      setError(created.error)
      return
    }

    // Inline mode: clear the box NOW so the user can keep importing
    // while the upload continues in the background. The Recent-Imports-
    // Strip already shows the new row in `uploading` status.
    if (mode === 'inline') {
      clearAfterSubmit()
      router.refresh()
    }

    const supabase = createClient()
    const path = `${workspaceId}/${created.contentId}/source.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('content')
      .upload(path, file, { upsert: false, contentType: file.type || undefined })

    if (uploadError) {
      // In inline mode the box is already cleared. The strip will show
      // this item stuck in `uploading` until the user retries from the
      // detail page (existing escape hatch in RetryTranscriptionButton).
      if (mode !== 'inline') {
        setError(`Upload failed: ${uploadError.message}`)
      }
      return
    }

    const startForm = new FormData()
    startForm.set('workspace_id', workspaceId)
    startForm.set('content_id', created.contentId)
    startForm.set('ext', ext)

    const started = await startTranscriptionAction(
      { ok: false, code: 'unknown', error: '' },
      startForm,
    )

    if (!started.ok) {
      if (mode !== 'inline') {
        setError(started.error)
      }
      return
    }

    if (mode === 'redirect') {
      router.push(`/workspace/${workspaceId}/content/${created.contentId}`)
    } else {
      router.refresh()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (
      e.key === 'Enter' &&
      (e.metaKey || e.ctrlKey || detected === 'youtube' || detected === 'url')
    ) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) stageFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) stageFile(file)
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`group relative overflow-hidden rounded-2xl border bg-card transition-all focus-within:border-primary/40 focus-within:shadow-[0_0_0_4px_rgba(15,15,15,0.10)] ${
          dragActive
            ? 'border-primary/60 ring-4 ring-primary/15'
            : 'border-border/60'
        }`}
        style={{
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 2px rgba(15,15,15,0.04), 0 14px 36px -22px rgba(15,15,15,0.22)',
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(15,15,15,0.14) 0%, rgba(15,15,15,0) 65%)',
          }}
        />

        {dragActive ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 bg-primary/[0.04] text-[13px] font-bold text-primary"
            style={{
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            <Film className="h-4 w-4" />
            Drop to import
          </div>
        ) : null}

        <div className="relative flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
          <div
            className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white sm:h-12 sm:w-12"
            style={{
              background:
                'linear-gradient(140deg, #0F0F0F 0%, #1A1A1A 60%, #0F0F0F 100%)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 22px -10px rgba(15,15,15,0.55)',
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
              <Loader2 className="relative h-4 w-4 animate-spin sm:h-5 sm:w-5" />
            ) : detected === 'file' ? (
              <Film className="relative h-4 w-4 sm:h-5 sm:w-5" />
            ) : detected === 'youtube' || detected === 'url' ? (
              <Link2 className="relative h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Sparkles className="relative h-4 w-4 sm:h-5 sm:w-5" />
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
            {stagedFile ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200/60 bg-emerald-50/40 px-2.5 py-2">
                <Film className="h-3.5 w-3.5 text-emerald-700" />
                <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-emerald-900">
                  {stagedFile.name}
                </p>
                <span className="shrink-0 text-[11px] text-emerald-700/80 tabular-nums">
                  {formatBytes(stagedFile.size)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStagedFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="rounded-md p-1 text-emerald-700/80 transition-colors hover:bg-emerald-100 hover:text-emerald-900"
                  aria-label="Remove file"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setError(null)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Paste a YouTube link, website URL, drop a video file, or type your script…"
                rows={2}
                className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/55 focus:outline-none"
                disabled={isPending}
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`relative mt-0.5 inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[12.5px] font-bold tracking-tight transition-all sm:h-12 sm:px-4 ${
              canSubmit
                ? 'cf-btn-3d cf-btn-3d-primary'
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

        <div className="relative flex items-center justify-between gap-3 border-t border-border/55 px-4 py-2.5 sm:px-5">
          {meta ? (
            <p className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold tracking-tight text-foreground">
              <span className={`flex h-4 w-4 items-center justify-center ${meta.tone}`}>
                <meta.Icon className="h-3.5 w-3.5" />
              </span>
              {meta.label}
              {detected === 'youtube' || detected === 'url' || detected === 'file' ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              ) : null}
            </p>
          ) : (
            <p className="inline-flex items-center gap-2 text-[11.5px] text-muted-foreground/75">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary/60" />
              Auto-detects YouTube, links, files, or raw script — no per-source forms.
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/85 transition-colors hover:border-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }}
            >
              <Upload className="h-3 w-3" />
              Upload
            </button>
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
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_ATTR}
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>
      </div>

      {/* Other-Sources affordance — Record + RSS feed live behind here.
          Smart-paste is the canonical path; this is an escape hatch. */}
      <div className="flex items-center justify-between text-[11.5px] text-muted-foreground/75">
        <p>
          {mode === 'inline'
            ? 'Submitted items appear in Recent imports above — keep pasting.'
            : 'You’ll be taken to the recording once it’s in.'}
        </p>
        <OtherSourcesDrawer workspaceId={workspaceId}>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold text-primary transition-colors hover:bg-primary/[0.06]"
          >
            Other sources
            <ChevronDown className="h-3 w-3" />
          </button>
        </OtherSourcesDrawer>
      </div>

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

      <style jsx>{`
        @keyframes cf-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0; transform: scale(1.18); }
        }
      `}</style>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
