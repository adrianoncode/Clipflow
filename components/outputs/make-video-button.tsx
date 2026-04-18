'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Loader2, Play, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  makeVideoAction,
  type MakeVideoState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/make-video-action'

interface MakeVideoButtonProps {
  workspaceId: string
  contentId: string
}

interface TrendingSound {
  id: string
  title: string
  author: string
  audioUrl: string | null
  videoCount: number
  coverUrl: string | null
}

const ASPECTS = [
  { value: '9:16', label: 'Vertical (TikTok, Reels, Shorts)' },
  { value: '1:1', label: 'Square (Instagram Feed)' },
  { value: '16:9', label: 'Horizontal (YouTube, LinkedIn)' },
] as const

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full gap-2"
      disabled={disabled || pending}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Submitting render…
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Make video now
        </>
      )}
    </Button>
  )
}

/**
 * One-click Make-Video. Opens as a modal with:
 *   - Aspect-ratio picker
 *   - Optional trending-sound picker (Team+ gated)
 *   - Primary render CTA
 *
 * After the action returns ok=true the modal closes and the render
 * history panel below picks up the new row + starts polling.
 */
export function MakeVideoButton({
  workspaceId,
  contentId,
}: MakeVideoButtonProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useFormState(
    makeVideoAction,
    {} as MakeVideoState,
  )
  const [aspect, setAspect] = useState<'9:16' | '16:9' | '1:1'>('9:16')

  // Close the modal on a successful submit so the render row below can
  // take focus.
  useEffect(() => {
    if (state.ok === true) {
      const t = setTimeout(() => {
        setOpen(false)
      }, 600)
      return () => clearTimeout(t)
    }
    return undefined
  }, [state])

  return (
    <>
      <Button
        type="button"
        size="lg"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Play className="h-4 w-4" />
        Make video
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Make video
                </p>
                <h3 className="mt-0.5 text-base font-semibold">
                  One-click render
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={formAction} className="space-y-5 px-5 py-5">
              <input type="hidden" name="workspace_id" value={workspaceId} />
              <input type="hidden" name="content_id" value={contentId} />
              <input type="hidden" name="aspect_ratio" value={aspect} />

              {/* Aspect ratio */}
              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Aspect ratio
                </p>
                <div className="space-y-1.5">
                  {ASPECTS.map((a) => {
                    const active = aspect === a.value
                    return (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => setAspect(a.value)}
                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                          active
                            ? 'border-primary/40 bg-primary/5 text-foreground'
                            : 'border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground'
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                            active
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground/30'
                          }`}
                        >
                          {active ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                          ) : null}
                        </span>
                        <span className="flex-1">{a.label}</span>
                        <span className="font-mono text-[10px] text-muted-foreground/70">
                          {a.value}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {state.ok === false ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {state.error}
                </div>
              ) : null}
              {state.ok === true ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
                  Render submitted — watch the history below for the final MP4.
                </div>
              ) : null}

              <SubmitButton disabled={state.ok === true} />
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}

