import 'server-only'

import { callAnthropic } from '@/lib/agent/llm/anthropic'
import { callOpenAi } from '@/lib/agent/llm/openai'
import { callGemini } from '@/lib/agent/llm/gemini'
import type { AgentLlmRequest, AgentLlmResult } from '@/lib/agent/llm/types'

export type {
  AgentLlmRequest,
  AgentLlmResult,
  LlmProvider,
  NormalizedMessage,
  NormalizedBlock,
  NormalizedUsage,
  NormalizedStopReason,
} from '@/lib/agent/llm/types'

/**
 * Single entry point for all agent LLM calls. Routes to the right
 * provider adapter and returns a normalized result.
 *
 * The agent loop NEVER imports a specific adapter — only this router.
 * Adding a new provider = new adapter file + one new case here.
 */
export async function callAgentLlm(
  req: AgentLlmRequest,
): Promise<AgentLlmResult> {
  switch (req.provider) {
    case 'anthropic':
      return callAnthropic(req)
    case 'openai':
      return callOpenAi(req)
    case 'google':
      return callGemini(req)
  }
}
