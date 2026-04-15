'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { EditOutputDialog } from '@/components/outputs/edit-output-dialog'
import { HookVariantsDialog } from '@/components/outputs/hook-variants-dialog'
import { PublishPanel } from '@/components/outputs/publish-panel'
import {
  regenerateOutputAction,
  starOutputAction,
  type RegenerateOutputState,
  type StarOutputState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import { scheduleOutputAction, type ScheduleOutputState } from '@/app/(app)/workspace/[id]/schedule/actions'
import type { OutputRow } from '@/lib/content/get-outputs'

interface OutputActionsProps {
  output: OutputRow
  contentId: string
  hasPublishKey?: boolean
}

const initialRegenerateState: RegenerateOutputState = {}
const initialStarState: StarOutputState = {}
const initialScheduleState: ScheduleOutputState = {}

function RegenerateSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
      {pending ? 'Regenerating…' : 'Regenerate'}
    </Button>
  )
}

export function OutputActions({ output, contentId, hasPublishKey = false }: OutputActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [starred, setStarred] = useState((output as OutputRow & { is_starred?: boolean }).is_starred ?? false)
  const [regenState, regenFormAction] = useFormState(regenerateOutputAction, initialRegenerateState)
  const [, starFormAction] = useFormState(starOutputAction, initialStarState)
  const [scheduleState, scheduleFormAction] = useFormState(scheduleOutputAction, initialScheduleState)

  function handleCopy() {
    if (!output.body) return
    navigator.clipboard.writeText(output.body).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleExport() {
    if (!output.body) return
    const blob = new Blob([output.body], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${output.platform}-output.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {/* Star button — optimistic toggle */}
        <form
          action={starFormAction}
          onSubmit={() => setStarred((s) => !s)}
        >
          <input type="hidden" name="output_id" value={output.id} />
          <input type="hidden" name="workspace_id" value={output.workspace_id} />
          <input type="hidden" name="starred" value={String(!starred)} />
          <Button type="submit" variant="ghost" size="sm" title={starred ? 'Unstar' : 'Mark as strong'}>
            {starred ? '⭐ Starred' : '☆ Star'}
          </Button>
        </form>

        <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
          Edit
        </Button>

        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </Button>

        <Button variant="ghost" size="sm" onClick={handleExport}>
          Export .md
        </Button>

        <Button variant="ghost" size="sm" onClick={() => setScheduleOpen((s) => !s)}>
          {scheduleOpen ? 'Hide schedule' : 'Schedule'}
        </Button>

        <Button
          variant={publishOpen ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPublishOpen((s) => !s)}
          title="Publish to TikTok, Instagram, YouTube, LinkedIn"
        >
          {publishOpen ? 'Hide publish' : '↑ Publish'}
        </Button>

        <form
          action={regenFormAction}
          onSubmit={(e) => {
            if (!window.confirm('Regenerate this platform? The current draft will be replaced.')) {
              e.preventDefault()
            }
          }}
        >
          <input type="hidden" name="workspace_id" value={output.workspace_id} />
          <input type="hidden" name="content_id" value={contentId} />
          <input type="hidden" name="output_id" value={output.id} />
          <input type="hidden" name="platform" value={output.platform} />
          <RegenerateSubmitButton />
        </form>
      </div>

      {scheduleOpen && (
        <form action={scheduleFormAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="workspace_id" value={output.workspace_id} />
          <input type="hidden" name="output_id" value={output.id} />
          <input
            type="datetime-local"
            name="scheduled_for"
            className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" size="sm" variant="outline">
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              // Clear schedule
              const form = document.createElement('form')
              const ws = document.createElement('input')
              ws.name = 'workspace_id'; ws.value = output.workspace_id
              const oid = document.createElement('input')
              oid.name = 'output_id'; oid.value = output.id
              form.appendChild(ws); form.appendChild(oid)
              document.body.appendChild(form)
              scheduleFormAction(new FormData(form))
              document.body.removeChild(form)
            }}
          >
            Clear
          </Button>
          {scheduleState.ok === true && <span className="text-xs text-emerald-600">Saved</span>}
          {scheduleState.ok === false && scheduleState.error && (
            <span className="text-xs text-destructive">{scheduleState.error}</span>
          )}
        </form>
      )}

      {publishOpen && (
        <PublishPanel
          workspaceId={output.workspace_id}
          outputId={output.id}
          defaultPlatform={output.platform}
          defaultCaption={
            ((output.metadata as Record<string, unknown> | null)?.caption as string | undefined) ??
            output.body?.slice(0, 500) ??
            ''
          }
          hasPublishKey={hasPublishKey}
        />
      )}

      {regenState.ok === false && (
        <FormMessage variant="error" className="text-xs">
          {regenState.error}
        </FormMessage>
      )}

      <EditOutputDialog output={output} open={editOpen} onOpenChange={setEditOpen} />

      <HookVariantsDialog
        outputId={output.id}
        workspaceId={output.workspace_id}
        contentId={contentId}
        platform={output.platform}
      />
    </div>
  )
}
