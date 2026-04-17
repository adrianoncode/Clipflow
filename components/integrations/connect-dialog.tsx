'use client'

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
  testWebhookAction,
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
  /** Short plain-language description shown below the label */
  hint?: string
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
      label: 'Slack Notification Link',
      hint: 'A special URL that lets Clipflow post messages to your Slack channel.',
      placeholder: 'https://hooks.slack.com/services/…',
      helpUrl: 'https://api.slack.com/messaging/webhooks',
      helpLabel: 'Step-by-step guide',
    },
  ],
  discord: [
    {
      name: 'webhook_url',
      label: 'Discord Notification Link',
      hint: 'A special URL that lets Clipflow post messages to your Discord channel.',
      placeholder: 'https://discord.com/api/webhooks/…',
      helpUrl: 'https://support.discord.com/hc/en-us/articles/228383668',
      helpLabel: 'Step-by-step guide',
    },
  ],

  // API key integrations
  beehiiv: [
    {
      name: 'api_key',
      label: 'API Key',
      hint: 'A secret code from Beehiiv that lets Clipflow send drafts to your newsletter.',
      placeholder: 'bh_…',
      type: 'password',
      helpUrl: 'https://app.beehiiv.com/settings/integrations',
      helpLabel: 'Where to find this',
    },
    {
      name: 'publication_id',
      label: 'Publication ID',
      hint: 'Identifies which Beehiiv newsletter to send drafts to.',
      placeholder: 'pub_…',
      helpUrl: 'https://app.beehiiv.com/settings/integrations',
      helpLabel: 'Where to find this',
    },
  ],
  wordpress: [
    {
      name: 'site_url',
      label: 'Your WordPress URL',
      hint: 'The homepage address of your WordPress site.',
      placeholder: 'https://yourblog.com',
    },
    {
      name: 'username',
      label: 'WordPress Username',
      hint: 'The username you log into WordPress with.',
      placeholder: 'admin',
    },
    {
      name: 'app_password',
      label: 'App Password',
      hint: 'A special password you create in WordPress — not your login password.',
      placeholder: 'xxxx xxxx xxxx xxxx',
      type: 'password',
      helpUrl:
        'https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/',
      helpLabel: 'Step-by-step guide',
    },
  ],
  medium: [
    {
      name: 'integration_token',
      label: 'Medium Token',
      hint: 'A secret code from Medium that lets Clipflow publish drafts to your account.',
      placeholder: 'Paste your token here',
      type: 'password',
      helpUrl: 'https://medium.com/me/settings/security',
      helpLabel: 'Where to find this',
    },
  ],
  airtable: [
    {
      name: 'api_key',
      label: 'Access Token',
      hint: 'A secret code from Airtable that gives Clipflow permission to add rows.',
      placeholder: 'pat…',
      type: 'password',
      helpUrl: 'https://airtable.com/create/tokens',
      helpLabel: 'Where to find this',
    },
    {
      name: 'base_id',
      label: 'Base ID',
      hint: 'The ID of your Airtable project — you can find it in the URL when you open your base.',
      placeholder: 'app…',
      helpUrl: 'https://support.airtable.com/docs/finding-airtable-ids',
      helpLabel: 'Where to find this',
    },
    {
      name: 'table_name',
      label: 'Table Name',
      hint: 'The exact name of the table where Clipflow should add content (must match exactly).',
      placeholder: 'e.g. Content Calendar',
    },
  ],
}

// Per-integration context copy shown at the top of the connect dialog
const CONTEXT_COPY: Record<string, string> = {
  slack:
    'Clipflow will post a message to your Slack channel whenever your content is ready. You just need to create a notification link in Slack (takes 2 minutes).',
  discord:
    'Clipflow will post updates to your Discord channel when content is ready. Create a notification link in your Discord server settings.',
  beehiiv:
    'Connect your Beehiiv newsletter so Clipflow can send article drafts straight to your publication.',
  wordpress:
    'Connect your WordPress blog so Clipflow can create draft posts directly on your site.',
  medium:
    'Connect your Medium account so Clipflow can publish article drafts for you to review.',
  airtable:
    'Connect your Airtable base so Clipflow automatically adds a row whenever content is approved or published.',
}

// Composio OAuth app IDs — connect via /api/integrations/connect
const OAUTH_IDS = ['google-drive', 'google-sheets', 'notion', 'linkedin']

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
        {CONTEXT_COPY[integrationId] ?? (
          connectionType === 'webhook' ? (
            <>
              You&apos;ll need a special link from{' '}
              <span className="font-semibold text-foreground">{integrationName}</span>.
              Click the help link below each field for step-by-step instructions.
            </>
          ) : (
            <>
              Fill in the details below to connect{' '}
              <span className="font-semibold text-foreground">{integrationName}</span>.
              Each field has a help link that shows you exactly where to find it.
            </>
          )
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
            {field.hint && (
              <p className="text-[10px] leading-snug text-muted-foreground">{field.hint}</p>
            )}
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
            Save & connect
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
  const [testState, testAction] = useFormState(testWebhookAction, {} as ConnectState)
  const isWebhook = connectionType === 'webhook'

  // ── OAuth (Composio) ──────────────────────────────────────────
  if (connectionType === 'oauth' && OAUTH_IDS.includes(integrationId)) {
    if (isConnected) {
      return (
        <form action={disconnectAction}>
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="integration_id" value={integrationId} />
          <button
            type="submit"
            className="w-full rounded-xl border border-destructive/20 py-2 text-xs font-semibold text-destructive transition-all hover:bg-destructive/5"
          >
            Disconnect
          </button>
        </form>
      )
    }
    return (
      <a
        href={`/api/integrations/connect?app=${integrationId}&workspace_id=${workspaceId}`}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-md"
      >
        Connect
        <ExternalLink className="h-3 w-3" />
      </a>
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
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
      >
        Set up in {integrationName}
        <ExternalLink className="h-3 w-3" />
      </a>
    )
  }

  // ── Webhook / API key — modal form ────────────────────────────
  return (
    <>
      {isConnected ? (
        <div className="space-y-2">
          {isWebhook && (
            <form action={testAction}>
              <input type="hidden" name="workspace_id" value={workspaceId} />
              <input type="hidden" name="integration_id" value={integrationId} />
              <button
                type="submit"
                className="w-full rounded-xl border border-primary/20 bg-primary/5 py-2 text-xs font-semibold text-primary transition-all hover:bg-primary/10"
              >
                Send test message
              </button>
              {testState.ok === true && (
                <p className="mt-1 text-center text-[10px] text-emerald-600">Test sent — check your channel!</p>
              )}
              {testState.ok === false && (
                <p className="mt-1 text-center text-[10px] text-destructive">{testState.error}</p>
              )}
            </form>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(true)}
              className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              Edit
            </button>
            <form action={disconnectAction} className="flex-1">
              <input type="hidden" name="workspace_id" value={workspaceId} />
              <input type="hidden" name="integration_id" value={integrationId} />
              <button
                type="submit"
                className="w-full rounded-xl border border-destructive/20 py-2 text-xs font-semibold text-destructive transition-all hover:bg-destructive/5"
              >
                Disconnect
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-md"
        >
          Connect
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {connectionType === 'webhook'
                ? `Get ${integrationName} notifications`
                : `Connect ${integrationName}`}
            </DialogTitle>
            <DialogDescription>
              {connectionType === 'webhook'
                ? `Clipflow will automatically send alerts to your ${integrationName} channel.`
                : `Link your ${integrationName} account so Clipflow can send content there.`}
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
