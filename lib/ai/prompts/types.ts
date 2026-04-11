import type { ContentKind } from '@/lib/supabase/types'

export interface PromptBuilderInput {
  transcript: string
  sourceKind: ContentKind
  sourceTitle: string
}

export interface BuiltPrompt {
  system: string
  user: string
}

export type PromptBuilder = (input: PromptBuilderInput) => BuiltPrompt
