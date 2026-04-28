'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { MessageSquarePlus, X, Send, Bug, Lightbulb, ThumbsUp } from 'lucide-react'

type FeedbackType = 'bug' | 'feature' | 'feedback'

const TYPES: Array<{ value: FeedbackType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'bug', label: 'Bug', icon: Bug },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb },
  { value: 'feedback', label: 'Feedback', icon: ThumbsUp },
]

// Keep in sync with the zod schema on /api/feedback + the DB check
// constraint (char_length(message) between 1 and 4000).
const MAX_MESSAGE_LENGTH = 4000

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('feedback')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const panelId = useId()
  const messageInputId = useId()
  const typeGroupId = useId()

  // setTimeout tracked in a ref so unmount (or manual close during the
  // 2s "Thanks" window) doesn't fire setState on a remounted widget.
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    },
    [],
  )

  // Escape-to-close on the panel.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function handleSubmit() {
    const trimmed = message.trim()
    if (!trimmed) return
    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: trimmed,
          path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Could not send feedback. Please try again.')
      }

      setSent(true)
      setMessage('')
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      closeTimerRef.current = setTimeout(() => {
        setSent(false)
        setOpen(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send feedback.')
    } finally {
      setSending(false)
    }
  }

  const typePlaceholder =
    type === 'bug'
      ? 'Describe the bug…'
      : type === 'feature'
        ? 'What feature would you like?'
        : 'Tell us what you think…'

  return (
    <>
      {/* Launcher — real label for screen readers; visible tooltip via title. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="fixed bottom-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-lg transition-all hover:scale-105 hover:bg-accent sm:bottom-6 sm:right-6"
      >
        <MessageSquarePlus className="h-4 w-4 text-muted-foreground" aria-hidden />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${panelId}-title`}
          className="fixed bottom-16 right-4 z-50 w-80 rounded-2xl border border-border/50 bg-card p-5 shadow-2xl sm:bottom-20 sm:right-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 id={`${panelId}-title`} className="text-sm font-bold">
              Send feedback
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close feedback"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <ThumbsUp className="h-5 w-5 text-emerald-400" aria-hidden />
              </div>
              <p className="text-sm font-semibold">Thanks for your feedback!</p>
              <p className="text-xs text-muted-foreground">We read every message.</p>
            </div>
          ) : (
            <>
              <div
                id={typeGroupId}
                role="radiogroup"
                aria-label="Feedback type"
                className="mb-3 flex gap-1.5"
              >
                {TYPES.map((t) => {
                  const active = type === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setType(t.value)}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all ${
                        active
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'bg-muted text-muted-foreground border border-transparent hover:bg-accent'
                      }`}
                    >
                      <t.icon className="h-3 w-3" aria-hidden />
                      {t.label}
                    </button>
                  )
                })}
              </div>

              <label htmlFor={messageInputId} className="sr-only">
                Your feedback
              </label>
              <textarea
                id={messageInputId}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={typePlaceholder}
                rows={4}
                maxLength={MAX_MESSAGE_LENGTH}
                aria-describedby={`${messageInputId}-count`}
                className="mb-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div
                id={`${messageInputId}-count`}
                className={`mb-3 text-right text-[10px] tabular-nums ${
                  message.length > MAX_MESSAGE_LENGTH * 0.9
                    ? 'text-amber-600'
                    : 'text-muted-foreground/60'
                }`}
              >
                {message.length}/{MAX_MESSAGE_LENGTH}
              </div>

              {error ? (
                <p className="mb-2 rounded-md bg-destructive/10 px-3 py-1.5 text-[11px] text-destructive">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className="cf-btn-3d cf-btn-3d-primary flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" aria-hidden />
                {sending ? 'Sending…' : 'Send'}
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
