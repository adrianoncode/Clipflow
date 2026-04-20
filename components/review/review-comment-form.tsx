'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useRef } from 'react'

import { submitReviewCommentAction, type SubmitCommentState } from '@/app/review/[token]/actions'

interface ReviewCommentFormProps {
  reviewLinkId: string
  outputId: string | null
  label?: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
      style={{
        background: '#2A1A3D',
        color: '#D6FF3E',
        boxShadow:
          'inset 0 0 0 1px rgba(214,255,62,.15), 0 4px 14px -4px rgba(42,26,61,.35)',
      }}
    >
      {pending ? 'Sending…' : 'Send feedback'}
    </button>
  )
}

const initial: SubmitCommentState = {}

const inputStyle: React.CSSProperties = {
  border: '1px solid #E5DDCE',
  background: '#FFFFFF',
  color: '#181511',
  borderRadius: 10,
}

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

      {label && (
        <p
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: '#7c7468' }}
        >
          {label}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            className="text-[11px] font-semibold"
            htmlFor={`name-${outputId ?? 'general'}`}
            style={{ color: '#3a342c' }}
          >
            Your name <span style={{ color: '#9B2018' }}>*</span>
          </label>
          <input
            id={`name-${outputId ?? 'general'}`}
            name="reviewer_name"
            type="text"
            required
            placeholder="Jane Doe"
            className="w-full px-3 py-1.5 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
        <div className="space-y-1">
          <label
            className="text-[11px] font-semibold"
            htmlFor={`email-${outputId ?? 'general'}`}
            style={{ color: '#3a342c' }}
          >
            Email <span style={{ color: '#7c7468' }}>(optional)</span>
          </label>
          <input
            id={`email-${outputId ?? 'general'}`}
            name="reviewer_email"
            type="email"
            placeholder="jane@example.com"
            className="w-full px-3 py-1.5 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label
          className="text-[11px] font-semibold"
          htmlFor={`body-${outputId ?? 'general'}`}
          style={{ color: '#3a342c' }}
        >
          Comment <span style={{ color: '#9B2018' }}>*</span>
        </label>
        <textarea
          id={`body-${outputId ?? 'general'}`}
          name="body"
          required
          rows={3}
          placeholder="Looks great! Maybe tweak the hook…"
          className="w-full px-3 py-2 text-sm focus:outline-none"
          style={inputStyle}
        />
      </div>

      {state.ok === false && state.error ? (
        <p
          className="rounded-lg border px-3 py-2 text-[12.5px]"
          style={{ borderColor: '#9B2018', background: '#FDECEB', color: '#9B2018' }}
        >
          {state.error}
        </p>
      ) : null}

      {state.ok === true ? (
        <p
          className="rounded-lg border px-3 py-2 text-[12.5px]"
          style={{ borderColor: '#0F6B4D', background: '#E6F4EE', color: '#0F6B4D' }}
        >
          Feedback sent! Thank you.
        </p>
      ) : null}

      <SubmitButton />
    </form>
  )
}
