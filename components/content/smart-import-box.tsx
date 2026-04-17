'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Link2, Loader2, Sparkles, Upload } from 'lucide-react'

interface SmartImportBoxProps {
  workspaceId: string
  hasOpenAiKey: boolean
}

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

const DETECT_LABELS: Record<DetectedType & string, string> = {
  youtube: 'YouTube video detected',
  url: 'Website link detected',
  text: 'Paste more text or press Enter to import as script',
}

/**
 * Universal import box — paste anything and Clipflow figures it out.
 *
 * - YouTube URL → auto-fetches transcript
 * - Website URL → auto-scrapes content
 * - Text → imports as script (no transcription needed)
 * - File drop → triggers video upload
 *
 * Eliminates the need to choose between 4 tabs + 3 sub-tabs.
 */
export function SmartImportBox({ workspaceId, hasOpenAiKey }: SmartImportBoxProps) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const detected = detectInputType(value)
  const canSubmit = detected !== null && !isPending

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
        setError('Something went wrong. Try again.')
      }
    })
  }

  function handleFileDrop(files: FileList | null) {
    if (!files || files.length === 0) return
    // Redirect to the video tab with the file — we can't auto-upload
    // because the VideoUploadForm handles the full upload + transcription flow.
    // Instead, just switch to the video tab section below.
    const event = new CustomEvent('clipflow:switch-to-video-tab')
    window.dispatchEvent(event)
    setIsDragging(false)
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
        className={`relative rounded-2xl border-2 border-dashed transition-all ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border/60 hover:border-primary/30'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          handleFileDrop(e.dataTransfer.files)
        }}
      >
        <div className="flex items-start gap-3 p-4">
          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : detected === 'youtube' || detected === 'url' ? (
              <Link2 className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <textarea
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Paste a YouTube link, website URL, or type your script..."
              rows={2}
              className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              disabled={isPending}
            />
          </div>
          {canSubmit && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Detection hint */}
        {detected && !isPending && (
          <div className="border-t border-border/30 px-4 py-2">
            <p className="text-[11px] font-medium text-primary">
              {DETECT_LABELS[detected]}
              {detected === 'text' && (
                <span className="ml-1 text-muted-foreground">
                  — press <kbd className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono">Ctrl+Enter</kbd> to import
                </span>
              )}
            </p>
          </div>
        )}

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Upload className="h-5 w-5" />
              Drop your video file
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*"
        className="hidden"
        onChange={(e) => handleFileDrop(e.target.files)}
      />
    </div>
  )
}
