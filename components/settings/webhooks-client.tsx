'use client'

import { useFormState, useFormStatus } from 'react-dom'

import {
  saveWebhookAction,
  deleteWebhookAction,
  testWebhookAction,
} from '@/app/(app)/settings/webhooks/actions'
import type {
  SaveWebhookState,
  DeleteWebhookState,
  TestWebhookState,
} from '@/app/(app)/settings/webhooks/actions'

interface WebhookRow {
  id: string
  workspace_id: string
  name: string
  url: string
  events: string[]
  is_active: boolean
  last_triggered_at: string | null
  last_status: number | null
}

interface WebhooksClientProps {
  workspaceId: string
  webhooks: WebhookRow[]
}

const ALL_EVENTS = [
  { value: 'content.ready', label: 'Content ready', description: 'Transcript is ready' },
  { value: 'output.generated', label: 'Output generated', description: 'AI drafts created' },
  { value: 'output.approved', label: 'Output approved', description: 'Draft marked approved' },
  { value: 'post.published', label: 'Post published', description: 'Scheduled post goes live' },
] as const

function SaveSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? 'Adding…' : 'Add webhook'}
    </button>
  )
}

function DeleteButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-60"
    >
      {pending ? '…' : 'Delete'}
    </button>
  )
}

function TestButton({ status }: { status: number | null }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-60"
    >
      {pending ? 'Testing…' : status !== null ? `Tested (${status})` : 'Test'}
    </button>
  )
}

function WebhookItem({ webhook, workspaceId }: { webhook: WebhookRow; workspaceId: string }) {
  const [deleteState, deleteAction] = useFormState<DeleteWebhookState, FormData>(deleteWebhookAction, { ok: undefined })
  const [testState, testAction] = useFormState<TestWebhookState, FormData>(testWebhookAction, { ok: undefined })

  const displayStatus = testState.ok === true ? testState.status : webhook.last_status

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{webhook.name}</p>
            <span
              className={[
                'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                webhook.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-muted text-muted-foreground',
              ].join(' ')}
            >
              {webhook.is_active ? 'active' : 'inactive'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-mono truncate">{webhook.url}</p>
          <div className="flex flex-wrap gap-1">
            {webhook.events.map((event) => (
              <span
                key={event}
                className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {event}
              </span>
            ))}
          </div>
          {webhook.last_triggered_at && (
            <p className="text-xs text-muted-foreground">
              Last triggered: {new Date(webhook.last_triggered_at).toLocaleString()}
              {displayStatus != null && (
                <span
                  className={[
                    'ml-1 rounded px-1 py-0.5 text-[10px] font-medium',
                    displayStatus >= 200 && displayStatus < 300
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700',
                  ].join(' ')}
                >
                  {displayStatus}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          <form action={testAction}>
            <input type="hidden" name="workspace_id" value={workspaceId} />
            <input type="hidden" name="webhook_id" value={webhook.id} />
            <TestButton status={displayStatus ?? null} />
          </form>
          <form action={deleteAction}>
            <input type="hidden" name="workspace_id" value={workspaceId} />
            <input type="hidden" name="webhook_id" value={webhook.id} />
            <DeleteButton />
          </form>
        </div>
      </div>

      {testState.ok === false && (
        <p className="text-xs text-destructive">{testState.error}</p>
      )}
      {testState.ok === true && (
        <p className="text-xs text-green-600">
          Test sent — response: {testState.status}
        </p>
      )}
      {deleteState.ok === false && (
        <p className="text-xs text-destructive">{deleteState.error}</p>
      )}
    </div>
  )
}

const initialSaveState: SaveWebhookState = { ok: undefined }

export function WebhooksClient({ workspaceId, webhooks }: WebhooksClientProps) {
  const [saveState, saveAction] = useFormState(saveWebhookAction, initialSaveState)

  return (
    <div className="space-y-8">
      {/* Existing webhooks */}
      {webhooks.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Active webhooks</h3>
          {webhooks.map((webhook) => (
            <WebhookItem key={webhook.id} webhook={webhook} workspaceId={workspaceId} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No webhooks configured yet. Add one below.
        </div>
      )}

      {/* New webhook form */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold">Add new webhook</h3>
        <form action={saveAction} className="space-y-4">
          <input type="hidden" name="workspace_id" value={workspaceId} />

          <div className="space-y-2">
            <label htmlFor="webhook-name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="webhook-name"
              name="name"
              type="text"
              placeholder="e.g. Zapier — notify on new content"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="webhook-url" className="text-sm font-medium">
              Webhook URL
            </label>
            <input
              id="webhook-url"
              name="url"
              type="url"
              placeholder="https://hooks.zapier.com/hooks/catch/…"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Trigger on events</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_EVENTS.map((event) => (
                <label
                  key={event.value}
                  className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent/50"
                >
                  <input
                    type="checkbox"
                    name="events"
                    value={event.value}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium">{event.label}</p>
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <SaveSubmitButton />

          {saveState.ok === false && (
            <p className="text-sm text-destructive">{saveState.error}</p>
          )}
          {saveState.ok === true && (
            <p className="text-sm text-green-600">
              Webhook added successfully.
            </p>
          )}
        </form>
      </div>

      {/* Info card */}
      <div className="rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">How webhooks work</p>
        <p>Clipflow sends a POST request to your URL when the selected event occurs. The payload is JSON with event, workspace_id, timestamp, and data fields.</p>
        <p>Works with Zapier, Make.com, n8n, or any custom endpoint.</p>
      </div>
    </div>
  )
}
