'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'

interface AutoGenerateTriggerProps {
  workspaceId: string
  contentId: string
  /** Only fire if content is ready and has no outputs yet. */
  isReady: boolean
  hasOutputs: boolean
}

/**
 * Auto-triggers output generation when content transitions to "ready"
 * and no outputs exist yet. Shows a progress bar inline on the content
 * detail page so the user doesn't need to navigate to the outputs page.
 *
 * This eliminates 3 clicks from the core workflow:
 *   1. Finding the "Generate outputs" link
 *   2. Navigating to outputs page
 *   3. Clicking "Generate 4 outputs"
 */
export function AutoGenerateTrigger({
  workspaceId,
  contentId,
  isReady,
  hasOutputs,
}: AutoGenerateTriggerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const didFire = useRef(false)

  const shouldAutoGenerate = isReady && !hasOutputs && !didFire.current

  useEffect(() => {
    if (!shouldAutoGenerate) return
    if (status !== 'idle') return
    didFire.current = true

    // Small delay so the user sees the "ready" state first
    const timer = setTimeout(() => {
      setStatus('generating')
      startTransition(async () => {
        try {
          const res = await fetch(`/api/auto-generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspaceId,
              contentId,
            }),
          })

          const data = await res.json()

          if (data.ok) {
            setStatus('done')
            // Refresh to show the new outputs on the page
            router.refresh()
          } else {
            setStatus('error')
            setErrorMessage(data.error ?? 'Generation failed')
          }
        } catch {
          setStatus('error')
          setErrorMessage('Something went wrong. You can generate manually.')
        }
      })
    }, 800)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoGenerate])

  // Don't render anything if we shouldn't auto-generate
  if (!shouldAutoGenerate && status === 'idle') return null

  return (
    <div className="overflow-hidden rounded-xl border border-border/50">
      {status === 'generating' && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-violet-50 to-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-violet-900">
              Generating 4 platform drafts...
            </p>
            <p className="mt-0.5 text-xs text-violet-700">
              TikTok, Reels, Shorts & LinkedIn — takes 15-60 seconds
            </p>
          </div>
          {/* Animated progress bar */}
          <div className="hidden w-24 sm:block">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet-100">
              <div className="h-full w-full animate-pulse rounded-full bg-violet-500" />
            </div>
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-900">
              4 drafts generated!
            </p>
            <p className="mt-0.5 text-xs text-emerald-700">
              Review your drafts, approve the best ones, and schedule them to go live.
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900">
              Auto-generation skipped
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              {errorMessage ?? 'You can generate drafts manually from the Drafts tab.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
