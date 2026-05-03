import 'server-only'

import { scheduleOutput } from '@/lib/outputs/schedule-output'
import { requireEditor } from '@/lib/agent/context'
import type { ToolDef, ToolHandler } from '@/lib/agent/tools/types'

const handler: ToolHandler = async (ctx, input) => {
  const parsed = parseInput(input)
  if (!parsed.ok) {
    return { kind: 'error', message: parsed.error, retryable: false }
  }

  requireEditor(ctx)

  // scheduleOutput re-queries the latest output_states row and refuses
  // to schedule unless it's `approved`. That's the binding gate, not
  // anything the model says it'll do.
  const result = await scheduleOutput({
    workspaceId: ctx.workspaceId,
    outputId: parsed.value.outputId,
    scheduledFor: parsed.value.scheduledFor,
  })

  if (!result.ok) {
    // not_approved is the most common refusal — surface it explicitly
    // so the model can route the user back to the Approve step.
    const retryable = result.code === 'db_error'
    return { kind: 'error', message: result.error, retryable }
  }

  return {
    kind: 'ok',
    value: {
      output_id: parsed.value.outputId,
      scheduled_for: result.scheduledFor,
      action: parsed.value.scheduledFor === null ? 'unscheduled' : 'scheduled',
    },
  }
}

const tool: ToolDef = {
  name: 'schedule_post',
  description:
    'Schedules an APPROVED output to publish at a specific time. The output must already be in the "approved" state (humans approve via the review UI — the agent cannot do this). Pass `scheduledFor` as an ISO 8601 timestamp, or `null` to clear an existing schedule.',
  schema: {
    type: 'object',
    properties: {
      outputId: {
        type: 'string',
        description: 'UUID of the output. Must be in `approved` state.',
      },
      scheduledFor: {
        type: 'string',
        description:
          'ISO 8601 timestamp (e.g. "2026-05-12T14:00:00Z"). Pass an empty string to unschedule.',
      },
    },
    required: ['outputId', 'scheduledFor'],
    additionalProperties: false,
  },
  handler,
  requiredRole: 'editor',
  mutates: true,
}

export default tool

// ─── input parsing ───────────────────────────────────────────────────

function parseInput(
  raw: unknown,
):
  | {
      ok: true
      value: { outputId: string; scheduledFor: string | null }
    }
  | { ok: false; error: string } {
  if (raw == null || typeof raw !== 'object') {
    return { ok: false, error: 'input must be an object' }
  }
  const obj = raw as Record<string, unknown>
  if (typeof obj.outputId !== 'string' || obj.outputId.length < 10) {
    return { ok: false, error: 'outputId must be a UUID string' }
  }
  if (typeof obj.scheduledFor !== 'string') {
    return { ok: false, error: 'scheduledFor must be a string' }
  }
  const scheduledFor =
    obj.scheduledFor.trim().length === 0 ? null : obj.scheduledFor.trim()
  return { ok: true, value: { outputId: obj.outputId, scheduledFor } }
}
