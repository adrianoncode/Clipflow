'use client'

import { useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FormMessage } from '@/components/ui/form-message'
import { EditOutputDialog } from '@/components/outputs/edit-output-dialog'
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

/**
 * Single-platform regenerate with confirm-before-destroy. Keeps the
 * form + useFormState wiring via a hidden ref + requestSubmit.
 */
function RegenerateOne({
  workspaceId,
  contentId,
  outputId,
  platform,
  formAction,
}: {
  workspaceId: string
  contentId: string
  outputId: string
  platform: string
  formAction: (fd: FormData) => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  return (
    <>
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={contentId} />
        <input type="hidden" name="output_id" value={outputId} />
        <input type="hidden" name="platform" value={platform} />
      </form>
      <ConfirmDialog
        tone="destructive"
        title="Regenerate this platform?"
        description="The current draft will be replaced. Any manual edits you haven't approved yet will be lost."
        confirmLabel="Regenerate"
        onConfirm={() => formRef.current?.requestSubmit()}
        trigger={(open) => (
          <Button type="button" variant="ghost" size="sm" onClick={open}>
            Regenerate
          </Button>
        )}
      />
    </>
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
          title="Publish to TikTok, Instagram, YouTube, LinkedIn, X, Facebook"
        >
          {publishOpen ? 'Hide publish' : '↑ Publish'}
        </Button>

        <RegenerateOne
          workspaceId={output.workspace_id}
          contentId={contentId}
          outputId={output.id}
          platform={output.platform}
          formAction={regenFormAction}
        />
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
    </div>
  )
}
