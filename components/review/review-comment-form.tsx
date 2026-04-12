'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { submitReviewCommentAction, type SubmitCommentState } from '@/app/review/[token]/actions'

interface ReviewCommentFormProps {
  reviewLinkId: string
  outputId: string | null
  label?: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Sending…' : 'Send feedback'}
    </Button>
  )
}

const initial: SubmitCommentState = {}

export function ReviewCommentForm({ reviewLinkId, outputId, label }: ReviewCommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action] = useFormState(
    async (prev: SubmitCommentState, formData: FormData) => {
      const result = await submitReviewCommentAction(prev, formData)
      if (result.ok === true) formRef.current?.reset()
      return result
    },
    initial,
  )

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="review_link_id" value={reviewLinkId} />
      {outputId && <input type="hidden" name="output_id" value={outputId} />}

      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium" htmlFor={`name-${outputId ?? 'general'}`}>
            Your name <span className="text-destructive">*</span>
          </label>
          <input
            id={`name-${outputId ?? 'general'}`}
            name="reviewer_name"
            type="text"
            required
            placeholder="Jane Doe"
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium" htmlFor={`email-${outputId ?? 'general'}`}>
            Email <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id={`email-${outputId ?? 'general'}`}
            name="reviewer_email"
            type="email"
            placeholder="jane@example.com"
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor={`body-${outputId ?? 'general'}`}>
          Comment <span className="text-destructive">*</span>
        </label>
        <textarea
          id={`body-${outputId ?? 'general'}`}
          name="body"
          required
          rows={3}
          placeholder="Looks great! Maybe tweak the hook…"
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {state.ok === false && state.error ? (
        <FormMessage variant="error">{state.error}</FormMessage>
      ) : null}

      {state.ok === true ? (
        <FormMessage variant="success">Feedback sent! Thank you.</FormMessage>
      ) : null}

      <SubmitButton />
    </form>
  )
}
