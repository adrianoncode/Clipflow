'use client'

import { Bot } from 'lucide-react'
import { useParams } from 'next/navigation'

export interface AgentSuggestion {
  label: string
  message: string
}

interface AgentSuggestionPillsProps {
  suggestions: AgentSuggestion[]
}

export function AgentSuggestionPills({ suggestions }: AgentSuggestionPillsProps) {
  const params = useParams<{ id: string }>()

  if (suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
        <Bot className="h-3 w-3" aria-hidden />
        Agent
      </span>
      {suggestions.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent('clipflow:agent-prefill', {
                detail: { message: s.message },
              }),
            )
          }}
          className="rounded-full border border-[#0F0F0F]/10 bg-[#0F0F0F]/[0.03] px-3 py-1 text-xs font-medium text-[#0F0F0F]/80 transition hover:border-[#0F0F0F]/25 hover:bg-[#0F0F0F]/[0.06] hover:text-[#0F0F0F]"
        >
          {s.label}
        </button>
      ))}
      {params.id && (
        <a
          href={`/workspace/${params.id}/agent?prefill=${encodeURIComponent(suggestions[0]?.message ?? '')}`}
          className="text-[11px] font-medium text-[#0F0F0F]/40 transition hover:text-[#0F0F0F]/70"
        >
          Open in Agent
        </a>
      )}
    </div>
  )
}
