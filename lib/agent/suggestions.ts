import type { AgentSuggestion } from '@/components/agent/agent-suggestion-pills'

interface ContentState {
  contentId: string
  title: string
  hasTranscript: boolean
  highlightCount: number
  outputCount: number
  hasApprovedOutputs: boolean
}

export function getContentDetailSuggestions(s: ContentState): AgentSuggestion[] {
  const out: AgentSuggestion[] = []

  if (!s.hasTranscript) {
    out.push({
      label: 'Process this content',
      message: `Start transcription for "${s.title}" (ID: ${s.contentId}).`,
    })
    return out
  }

  if (s.highlightCount === 0) {
    out.push({
      label: 'Find viral moments',
      message: `Find the best viral moments in "${s.title}" (ID: ${s.contentId}).`,
    })
  }

  if (s.highlightCount > 0 && s.outputCount === 0) {
    out.push({
      label: 'Generate drafts',
      message: `Generate drafts for "${s.title}" (ID: ${s.contentId}) on all connected platforms.`,
    })
  }

  if (s.hasApprovedOutputs) {
    out.push({
      label: 'Schedule approved posts',
      message: `Schedule all approved outputs for "${s.title}" (ID: ${s.contentId}) at the best times.`,
    })
  }

  return out
}

export function getHighlightsSuggestions(
  contentId: string,
  title: string,
  highlightCount: number,
): AgentSuggestion[] {
  const out: AgentSuggestion[] = []

  if (highlightCount === 0) {
    out.push({
      label: 'Find highlights',
      message: `Find the best viral moments in "${title}" (ID: ${contentId}).`,
    })
  } else {
    out.push({
      label: 'Generate drafts from these',
      message: `Generate drafts from the highlights in "${title}" (ID: ${contentId}) on all connected platforms.`,
    })
  }

  return out
}

export function getOutputsSuggestions(
  contentId: string,
  title: string,
  outputCount: number,
): AgentSuggestion[] {
  if (outputCount === 0) return []

  return [
    {
      label: 'Schedule approved posts',
      message: `Schedule all approved outputs for "${title}" (ID: ${contentId}) at the best times.`,
    },
  ]
}
