'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useFormState } from 'react-dom'
import { ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  saveIntegrationAction,
  disconnectIntegrationAction,
  type ConnectState,
} from '@/app/(app)/settings/integrations/actions'

type ConnectionType = 'webhook' | 'api_key' | 'oauth' | 'coming_soon' | 'managed'

interface ConnectDialogProps {
  integrationId: string
  integrationName: string
  workspaceId: string
  isConnected: boolean
  connectionType: ConnectionType
}

// ── Field definitions per integration ──────────────────────────────────────

interface FieldDef {
  name: string
  label: string
  placeholder: string
  type?: string
  helpUrl?: string
  helpLabel?: string
}

const FIELDS: Record<string, FieldDef[]> = {
  // Webhook integrations
  slack: [
    {
      name: 'webhook_url',
      label: 'Webhook URL',
      placeholder: 'https://hooks.slack.com/services/…',
      helpUrl: 'https://api.slack.com/messaging/webhooks',
      helpLabel: 'How to create a Slack webhook',
    },
  ],
  discord: [
    {
      name: 'webhook_url',
      label: 'Webhook URL',
      placeholder: 'https://discord.com/api/webhooks/…',
      helpUrl: 'https://support.discord.com/hc/en-us/articles/228383668',
      helpLabel: 'How to create a Discord webhook',
    },
  ],

  // API key integrations
  beehiiv: [
    {
      name: 'api_key',
      label: 'API Key',
      placeholder: 'bh_…',
      type: 'password',
      helpUrl: 'https://app.beehiiv.com/settings/integrations',
      helpLabel: 'Get your Beehiiv API key',
    },
    {
      name: 'publication_id',
      label: 'Publication ID',
      placeholder: 'pub_…',
    },
  ],
  wordpress: [
    {
      name: 'site_url',
      label: 'WordPress Site URL',
      placeholder: 'https://yourblog.com',
    },
    {
      name: 'username',
      label: 'Username',
      placeholder: 'admin',
    },
    {
      name: 'app_password',
      label: 'Application Password',
      placeholder: 'xxxx xxxx xxxx xxxx',
      type: 'password',
      helpUrl:
        'https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/',
      helpLabel: 'How to create an Application Password',
    },
  ],
  medium: [
    {
      name: 'integration_token',
      label: 'Integration Token',
      placeholder: 'Paste your Medium token',
      type: 'password',
      helpUrl: 'https://medium.com/me/settings/security',
      helpLabel: 'Get your Medium integration token',
    },
  ],
  airtable: [
    {
      name: 'api_key',
      label: 'Personal Access Token',
      placeholder: 'pat…',
      type: 'password',
      helpUrl: 'https://airtable.com/create/tokens',
      helpLabel: 'Create an Airtable token',
    },
    {
      name: 'base_id',
      label: 'Base ID',
      placeholder: 'app…',
      helpUrl: 'https://support.airtable.com/docs/finding-airtable-ids',
      helpLabel: 'Find your Base ID',
    },
    {
      name: 'table_name',
      label: 'Table Name',
      placeholder: 'Content Calendar',
    },
  ],
}

// Composio OAuth app IDs — connect via /api/integrations/connect
const OAUTH_IDS = ['google-drive', 'google-sheets', 'notion', 'youtube', 'linkedin']

// Managed via webhooks (no user config needed — just a docs link)
const MANAGED_DOCS: Record<string, string> = {
  zapier: 'https://zapier.com/apps/webhooks/integrations',
  make: 'https://www.make.com/en/help/tools/webhooks',
}

// ── Inner form component (uses useFormState inside Dialog) ─────────────────

function ConnectForm({
  integrationId,
  integrationName,
  workspaceId,
  connectionType,
  onClose,
}: {
  integrationId: string
  integrationName: string
  workspaceId: string
  connectionType: ConnectionType
  onClose: () => void
}) {
  const [saveState, saveAction] = useFormState(
    saveIntegrationAction,
    {} as ConnectState,
  )

  const fields = FIELDS[integrationId] ?? []

  return (
    <div className="space-y-4">
      {/* Context */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
        {connectionType === 'webhook' ? (
          <>
            Create a webhook in{' '}
            <span className="font-semibold text-foreground">{integrationName}</span> and paste the
            URL below.
          </>
        ) : (
          <>
            Paste your <span className="font-semibold text-foreground">{integrationName}</span> API
            key below. You&apos;ll find it in their settings or developer portal.
          </>
        )}
      </div>

      <form action={saveAction} className="space-y-3">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="integration_id" value={integrationId} />

        {fields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${integrationId}-${field.name}`} className="text-xs">
                {field.label}
              </Label>
              {field.helpUrl && (
                <a
                  href={field.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                >
                  {field.helpLabel ?? 'How to get this?'}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
            <Input
              id={`${integrationId}-${field.name}`}
              name={`config_${field.name}`}
              type={field.type ?? 'text'}
              placeholder={field.placeholder}
              required
              className="h-8 text-xs"
              autoComplete="off"
            />
          </div>
        ))}

        {saveState.ok === false && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {saveState.error}
          </p>
        )}
        {saveState.ok === true && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            ✓ Connected successfully!
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="submit" size="sm" className="h-8 text-xs">
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function ConnectDialog({
  integrationId,
  integrationName,
  workspaceId,
  isConnected,
  connectionType,
}: ConnectDialogProps) {
  const [open, setOpen] = useState(false)
  const [, disconnectAction] = useFormState(
    disconnectIntegrationAction,
    {} as ConnectState,
  )

  // ── OAuth (Composio) ──────────────────────────────────────────
  if (connectionType === 'oauth' && OAUTH_IDS.includes(integrationId)) {
    if (isConnected) {
      return (
        <form action={disconnectAction}>
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="integration_id" value={integrationId} />
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
          >
            Disconnect
          </button>
        </form>
      )
    }
    return (
      <Link
        href={`/api/integrations/connect?app=${integrationId}&workspace_id=${workspaceId}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Connect
        <ExternalLink className="h-3 w-3" />
      </Link>
    )
  }

  // ── Managed (Zapier / Make — just docs link) ──────────────────
  if (connectionType === 'managed') {
    const docsUrl = MANAGED_DOCS[integrationId]
    return (
      <a
        href={docsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
      >
        View docs
        <ExternalLink className="h-3 w-3" />
      </a>
    )
  }

  // ── Webhook / API key — modal form ────────────────────────────
  return (
    <>
      {isConnected ? (
        <div className="flex gap-1.5">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
          >
            Edit
          </button>
          <form action={disconnectAction}>
            <input type="hidden" name="workspace_id" value={workspaceId} />
            <input type="hidden" name="integration_id" value={integrationId} />
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              Disconnect
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Connect
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect {integrationName}</DialogTitle>
            <DialogDescription>
              {connectionType === 'webhook'
                ? `Set up a webhook from ${integrationName} to receive notifications.`
                : `Enter your ${integrationName} credentials to enable the integration.`}
            </DialogDescription>
          </DialogHeader>
          <ConnectForm
            integrationId={integrationId}
            integrationName={integrationName}
            workspaceId={workspaceId}
            connectionType={connectionType}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
