'use client'

import { useState } from 'react'
import { MessageSquarePlus, X, Send, Bug, Lightbulb, ThumbsUp } from 'lucide-react'

type FeedbackType = 'bug' | 'feature' | 'feedback'

const TYPES: Array<{ value: FeedbackType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'bug', label: 'Bug', icon: Bug },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb },
  { value: 'feedback', label: 'Feedback', icon: ThumbsUp },
]

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('feedback')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleSubmit() {
    if (!message.trim()) return
    setSending(true)

    try {
      // For MVP: store in console / send to webhook
      // In production: POST to /api/feedback → store in DB or send to Slack
      console.log('[feedback]', { type, message })

      // Try to send to a Slack webhook if configured
      const webhookUrl = process.env.NEXT_PUBLIC_FEEDBACK_WEBHOOK
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `*${type.toUpperCase()}*: ${message}`,
          }),
        }).catch(() => {})
      }

      setSent(true)
      setMessage('')
      setTimeout(() => {
        setSent(false)
        setOpen(false)
      }, 2000)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-lg transition-all hover:scale-105 hover:bg-accent sm:bottom-6 sm:right-6"
        title="Send feedback"
      >
        <MessageSquarePlus className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-16 right-4 z-50 w-80 rounded-2xl border border-border/50 bg-card p-5 shadow-2xl sm:bottom-20 sm:right-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold">Send Feedback</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <ThumbsUp className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold">Thanks for your feedback!</p>
              <p className="text-xs text-muted-foreground">We read every message.</p>
            </div>
          ) : (
            <>
              {/* Type selector */}
              <div className="mb-3 flex gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all ${
                      type === t.value
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-muted text-muted-foreground border border-transparent hover:bg-accent'
                    }`}
                  >
                    <t.icon className="h-3 w-3" />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  type === 'bug'
                    ? 'Describe the bug...'
                    : type === 'feature'
                      ? 'What feature would you like?'
                      : 'Tell us what you think...'
                }
                rows={4}
                className="mb-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />

              <button
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {sending ? 'Sending...' : 'Send'}
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
