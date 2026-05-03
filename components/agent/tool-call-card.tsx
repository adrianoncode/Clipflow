'use client'

import { useState } from 'react'
import { ChevronDown, Wrench, AlertCircle, Loader2, CheckCircle2, Clock } from 'lucide-react'

/**
 * One row representing the lifecycle of a single tool invocation:
 *
 *   pending → running → done | error | parked
 *
 * The chat widget creates a card on `tool_use` (status='running') and
 * patches it on `tool_result` (status='done'/'error'/'parked').
 */
export type ToolCallStatus = 'running' | 'done' | 'error' | 'parked'

export interface ToolCall {
  id: string // tool_use id from the model
  name: string
  input: unknown
  status: ToolCallStatus
  output?: unknown
  isError?: boolean
  latencyMs?: number
}

const FRIENDLY_NAMES: Record<string, string> = {
  list_content: 'Listing content',
  get_content_status: 'Checking status',
  create_content: 'Importing content',
  start_transcription: 'Awaiting transcription',
  find_highlights: 'Finding highlights',
  generate_drafts: 'Generating drafts',
  transition_state: 'Updating state',
  schedule_post: 'Scheduling post',
}

export function ToolCallCard({ call }: { call: ToolCall }) {
  const [open, setOpen] = useState(false)
  const friendly = FRIENDLY_NAMES[call.name] ?? call.name

  const Icon =
    call.status === 'running'
      ? Loader2
      : call.status === 'parked'
        ? Clock
        : call.status === 'error' || call.isError
          ? AlertCircle
          : CheckCircle2

  const tone =
    call.status === 'running'
      ? 'border-[#0F0F0F]/15 bg-white text-[#0F0F0F]/80'
      : call.status === 'parked'
        ? 'border-amber-500/30 bg-amber-50 text-amber-900'
        : call.status === 'error' || call.isError
          ? 'border-red-500/30 bg-red-50 text-red-900'
          : 'border-emerald-500/25 bg-emerald-50 text-emerald-900'

  return (
    <div className={`rounded-xl border ${tone} text-xs`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2">
          <Icon
            className={`h-3.5 w-3.5 ${
              call.status === 'running' ? 'animate-spin' : ''
            }`}
            aria-hidden
          />
          <span className="flex items-center gap-1.5">
            <Wrench className="h-3 w-3 opacity-50" aria-hidden />
            <span className="font-medium">{friendly}</span>
            <span className="opacity-60">·</span>
            <span className="font-mono opacity-60">{call.name}</span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          {typeof call.latencyMs === 'number' && call.status !== 'running' ? (
            <span className="opacity-60">{formatLatency(call.latencyMs)}</span>
          ) : null}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </span>
      </button>

      {open ? (
        <div className="border-t border-current/10 px-3 py-2 font-mono text-[11px]">
          <div className="mb-1 opacity-60">input</div>
          <pre className="mb-2 max-h-32 overflow-auto whitespace-pre-wrap break-words">
            {safeStringify(call.input)}
          </pre>
          {call.output !== undefined ? (
            <>
              <div className="mb-1 opacity-60">
                output{call.isError ? ' (error)' : ''}
              </div>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words">
                {safeStringify(call.output)}
              </pre>
            </>
          ) : (
            <div className="opacity-60">running…</div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function safeStringify(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
