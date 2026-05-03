import 'server-only'

import listContent from '@/lib/agent/tools/list-content'
import getContentStatus from '@/lib/agent/tools/get-content-status'
import createContent from '@/lib/agent/tools/create-content'
import startTranscription from '@/lib/agent/tools/start-transcription'
import findHighlights from '@/lib/agent/tools/find-highlights'
import generateDrafts from '@/lib/agent/tools/generate-drafts'
import transitionState from '@/lib/agent/tools/transition-state'
import schedulePost from '@/lib/agent/tools/schedule-post'
import type { ToolDef } from '@/lib/agent/tools/types'

/**
 * Static registry of all agent tools. Order doesn't matter — Anthropic
 * sees the array as-is and ranks tool selection on description quality.
 *
 * Adding a tool: create `lib/agent/tools/<name>.ts` exporting a default
 * `ToolDef`, then import + add to ALL_TOOLS below. The runtime
 * validation in `tools()` will catch duplicate names at module load.
 */
const ALL_TOOLS: ToolDef[] = [
  // Read-only context tools (Phase 1)
  listContent,
  getContentStatus,
  // Pipeline mutation tools (Phase 2)
  createContent,
  startTranscription,
  findHighlights,
  generateDrafts,
  transitionState,
  schedulePost,
]

/** Cached map view, validated once. */
let _byName: Map<string, ToolDef> | null = null

function getRegistry(): Map<string, ToolDef> {
  if (_byName) return _byName
  const map = new Map<string, ToolDef>()
  for (const t of ALL_TOOLS) {
    if (map.has(t.name)) {
      throw new Error(`Duplicate agent tool name: "${t.name}"`)
    }
    map.set(t.name, t)
  }
  _byName = map
  return map
}

/**
 * Subset filter for autopilot runs scoped to a single trigger. Only
 * tools listed in `allow` are returned. Read-only tools (mutates =
 * false) are ALWAYS included regardless of the allow-list — autopilot
 * needs context-gathering tools to make decisions.
 *
 * Pass `null` from chat (where the model gets the full toolbox).
 */
export function getTools(opts?: { allow?: string[] | null }): ToolDef[] {
  const registry = getRegistry()
  if (!opts?.allow) return [...registry.values()]
  const allowSet = new Set(opts.allow)
  return [...registry.values()].filter(
    (t) => !t.mutates || allowSet.has(t.name),
  )
}

export function getToolByName(name: string): ToolDef | null {
  return getRegistry().get(name) ?? null
}

// Provider-specific tool-format converters live in
// `lib/agent/llm/tool-format.ts` (toAnthropicTools, toOpenAiTools,
// toGeminiTools). The agent loop never imports those directly — the
// router in `lib/agent/llm/index.ts` calls them inside the
// per-provider adapters.
