import 'server-only'

import { transitionOutputState } from '@/lib/outputs/transition-output-state'
import type { OutputState } from '@/lib/supabase/types'
import { requireEditor } from '@/lib/agent/context'
import type { ToolDef, ToolHandler } from '@/lib/agent/tools/types'

/**
 * Hard rule: this tool NEVER moves an output to `approved`. The Approve
 * step is the human checkpoint — full stop. The model can move drafts
 * forward to `review` (signaling "ready for human review") and can move
 * approved/exported items backwards if the user explicitly asks, but
 * the draft → approved hop is locked at the tool boundary.
 *
 * If a future product change opens a "trusted-content auto-approve"
 * feature, it will land as a NEW tool (e.g. `mark_auto_approved`) with
 * its own audit trail — not by relaxing this gate.
 */
const handler: ToolHandler = async (ctx, input) => {
  const parsed = parseInput(input)
  if (!parsed.ok) {
    return { kind: 'error', message: parsed.error, retryable: false }
  }

  if (parsed.value.newState === 'approved') {
    return {
      kind: 'error',
      message:
        'Refused: moving an output to "approved" is human-only. Ask the user to click Approve in the review UI — there is no agent path to approval and there will not be one.',
      retryable: false,
    }
  }

  requireEditor(ctx)

  const result = await transitionOutputState({
    outputId: parsed.value.outputId,
    workspaceId: ctx.workspaceId,
    newState: parsed.value.newState,
    changedBy: ctx.userId,
    note: parsed.value.note,
  })

  if (!result.ok) {
    return { kind: 'error', message: result.error, retryable: false }
  }

  return {
    kind: 'ok',
    value: {
      output_id: parsed.value.outputId,
      new_state: parsed.value.newState,
    },
  }
}

const tool: ToolDef = {
  name: 'transition_state',
  description:
    'Moves an output to a different state in the draft → review → approved → exported pipeline. The agent CAN move draft → review (mark ready for human review) and can roll back approved → review or exported → approved. The agent CANNOT move review → approved — that is human-only and the call will be refused.',
  schema: {
    type: 'object',
    properties: {
      outputId: {
        type: 'string',
        description: 'UUID of the output to transition.',
      },
      newState: {
        type: 'string',
        description:
          'Target state. Allowed agent-driven transitions: draft→review, approved→review (rollback), exported→approved (rollback). The value "approved" is forbidden for the agent.',
        enum: ['review', 'draft', 'exported'],
      },
      note: {
        type: 'string',
        description: 'Optional reason captured in the audit trail (max 500 chars).',
      },
    },
    required: ['outputId', 'newState'],
    additionalProperties: false,
  },
  handler,
  requiredRole: 'editor',
  mutates: true,
}

export default tool

// ─── input parsing ───────────────────────────────────────────────────

interface ParsedInput {
  outputId: string
  newState: OutputState
  note: string | undefined
}

const ALLOWED_AGENT_STATES = new Set<OutputState>([
  'draft',
  'review',
  'exported',
])

function parseInput(
  raw: unknown,
): { ok: true; value: ParsedInput } | { ok: false; error: string } {
  if (raw == null || typeof raw !== 'object') {
    return { ok: false, error: 'input must be an object' }
  }
  const obj = raw as Record<string, unknown>
  if (typeof obj.outputId !== 'string' || obj.outputId.length < 10) {
    return { ok: false, error: 'outputId must be a UUID string' }
  }

  if (typeof obj.newState !== 'string') {
    return { ok: false, error: 'newState must be a string' }
  }
  // We allow `approved` past parse so the handler can produce a clearer
  // refusal message; everything else is parse-time rejected.
  const validShapes: OutputState[] = ['draft', 'review', 'approved', 'exported']
  if (!validShapes.includes(obj.newState as OutputState)) {
    return {
      ok: false,
      error: `newState must be one of: ${[...ALLOWED_AGENT_STATES].join(', ')}.`,
    }
  }

  let note: string | undefined
  if (obj.note !== undefined) {
    if (typeof obj.note !== 'string') {
      return { ok: false, error: 'note must be a string' }
    }
    if (obj.note.length > 500) {
      return { ok: false, error: 'note must be ≤ 500 characters' }
    }
    note = obj.note
  }

  return {
    ok: true,
    value: {
      outputId: obj.outputId,
      newState: obj.newState as OutputState,
      note,
    },
  }
}
