'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import {
  saveIntegrationAction,
  disconnectIntegrationAction,
  type ConnectState,
} from '@/app/(app)/settings/integrations/actions'

/**
 * Config field definitions per integration.
 * Each integration knows what fields it needs from the user.
 */
const INTEGRATION_FIELDS: Record<string, Array<{
  name: string
  label: string
  placeholder: string
  type?: string
  helpUrl?: string
}>> = {
  slack: [
    { name: 'webhook_url', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...', helpUrl: 'https://api.slack.com/messaging/webhooks' },
  ],
  discord: [
    { name: 'webhook_url', label: 'Webhook URL', placeholder: 'https://discord.com/api/webhooks/...', helpUrl: 'https://support.discord.com/hc/en-us/articles/228383668' },
  ],
  wordpress: [
    { name: 'site_url', label: 'WordPress Site URL', placeholder: 'https://yourblog.com' },
    { name: 'username', label: 'Username', placeholder: 'admin' },
    { name: 'app_password', label: 'Application Password', placeholder: 'xxxx xxxx xxxx xxxx', type: 'password', helpUrl: 'https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/' },
  ],
  beehiiv: [
    { name: 'api_key', label: 'API Key', placeholder: 'bh_...', type: 'password', helpUrl: 'https://developers.beehiiv.com' },
    { name: 'publication_id', label: 'Publication ID', placeholder: 'pub_...' },
  ],
  medium: [
    { name: 'integration_token', label: 'Integration Token', placeholder: 'Paste your Medium token', type: 'password', helpUrl: 'https://medium.com/me/settings' },
  ],
  notion: [
    { name: 'api_key', label: 'Internal Integration Token', placeholder: 'secret_...', type: 'password', helpUrl: 'https://www.notion.so/my-integrations' },
    { name: 'database_id', label: 'Database ID', placeholder: 'abc123...' },
  ],
  airtable: [
    { name: 'api_key', label: 'Personal Access Token', placeholder: 'pat...', type: 'password', helpUrl: 'https://airtable.com/create/tokens' },
    { name: 'base_id', label: 'Base ID', placeholder: 'app...' },
    { name: 'table_name', label: 'Table Name', placeholder: 'Content Calendar' },
  ],
  'google-sheets': [
    { name: 'spreadsheet_id', label: 'Spreadsheet ID', placeholder: 'From the Google Sheets URL' },
  ],
  'google-drive': [],
  // OAuth-based integrations redirect instead of showing a form
  tiktok: [],
  instagram: [],
  linkedin: [],
  youtube: [],
  // Platform-level keys (configured in env, not per-workspace)
  openai: [],
  anthropic: [],
  'google-ai': [],
  shotstack: [],
  elevenlabs: [],
  pexels: [],
  'd-id': [],
  resend: [],
  zapier: [],
  make: [],
  n8n: [],
}

// Integrations that use OAuth redirect instead of credentials form
const OAUTH_INTEGRATIONS = ['tiktok', 'instagram', 'linkedin', 'youtube', 'google-drive']

// Integrations configured via BYOK AI Keys page
const BYOK_INTEGRATIONS = ['openai', 'anthropic', 'google-ai']

// Integrations configured via env vars (server-side)
const ENV_INTEGRATIONS = ['shotstack', 'elevenlabs', 'pexels', 'd-id', 'resend', 'zapier', 'make', 'n8n']

interface ConnectDialogProps {
  integrationId: string
  integrationName: string
  workspaceId: string
  isConnected: boolean
}

export function ConnectDialog({ integrationId, integrationName: _integrationName, workspaceId, isConnected }: ConnectDialogProps) {
  const [open, setOpen] = useState(false)
  const [connectState, connectAction] = useFormState(saveIntegrationAction, {} as ConnectState)
  const [, disconnectAction] = useFormState(disconnectIntegrationAction, {} as ConnectState)

  const fields = INTEGRATION_FIELDS[integrationId] ?? []
  const isOAuth = OAUTH_INTEGRATIONS.includes(integrationId)
  const isByok = BYOK_INTEGRATIONS.includes(integrationId)
  const isEnv = ENV_INTEGRATIONS.includes(integrationId)

  // BYOK integrations → redirect to AI Keys settings
  if (isByok) {
    return (
      <a href="/settings/ai-keys" className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
        Manage Keys
      </a>
    )
  }

  // Env-based integrations → show as "configured" or link to docs
  if (isEnv) {
    return (
      <span className="shrink-0 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
        Server config
      </span>
    )
  }

  // OAuth integrations → redirect to OAuth connect
  if (isOAuth) {
    return (
      <a
        href={`/api/oauth/connect?platform=${integrationId}&workspace_id=${workspaceId}`}
        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {isConnected ? 'Reconnect' : 'Connect'}
      </a>
    )
  }

  // No fields defined → coming soon
  if (fields.length === 0) {
    return (
      <span className="shrink-0 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
        Coming soon
      </span>
    )
  }

  // Connected → show disconnect option
  if (isConnected && !open) {
    return (
      <div className="flex gap-1.5">
        <button onClick={() => setOpen(true)} className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent">
          Edit
        </button>
        <form action={disconnectAction}>
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="integration_id" value={integrationId} />
          <button type="submit" className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10">
            Disconnect
          </button>
        </form>
      </div>
    )
  }

  // Show connect form
  if (!open && !isConnected) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Connect
      </button>
    )
  }

  return (
    <div className="mt-3 w-full border-t border-border/50 pt-3">
      <form action={connectAction} className="space-y-3">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="integration_id" value={integrationId} />

        {fields.map((field) => (
          <div key={field.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.name} className="text-xs">{field.label}</Label>
              {field.helpUrl && (
                <a href={field.helpUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">
                  How to get this?
                </a>
              )}
            </div>
            <Input
              id={field.name}
              name={`config_${field.name}`}
              type={field.type ?? 'text'}
              placeholder={field.placeholder}
              required
              className="h-8 text-xs"
              autoComplete="off"
            />
          </div>
        ))}

        {connectState.ok === false && <FormMessage variant="error">{connectState.error}</FormMessage>}
        {connectState.ok === true && <FormMessage variant="success">Connected!</FormMessage>}

        <div className="flex gap-2">
          <Button type="submit" size="sm" className="h-8 text-xs">
            Save & Connect
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
