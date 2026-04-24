'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  KeyRound,
  Loader2,
} from 'lucide-react'

import {
  connectXAction,
  disconnectXAction,
  type ConnectXState,
} from '@/app/(app)/settings/channels/x-actions'

const initialState: ConnectXState = {}

interface XConnectCardProps {
  workspaceId: string
  isOwner: boolean
  connected: { handle?: string; connectedAt?: string } | null
}

/**
 * X (Twitter) connect wizard. Self-contained card that swaps between
 * three states:
 *   - Collapsed        (default, not yet expanded by user)
 *   - Setup guide      (4-step accordion with credential form in step 4)
 *   - Connected        (shows @handle + disconnect)
 *
 * Keeps everything inline — no dialog, no separate page. Users never
 * lose context of the Channels grid.
 */
export function XConnectCard({ workspaceId, isOwner, connected }: XConnectCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [state, formAction] = useFormState(connectXAction, initialState)

  // Connected state — minimal card with handle + disconnect.
  if (connected?.handle) {
    return (
      <div className="relative flex items-start gap-3 rounded-xl border border-border/60 bg-background p-4">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-sm font-bold text-white"
          aria-hidden
        >
          𝕏
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">X (Twitter)</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
              <Check className="h-2.5 w-2.5" />
              Connected
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Posting as <span className="font-medium text-foreground">@{connected.handle}</span>
          </p>
        </div>
        {isOwner && (
          <form action={disconnectXAction} className="self-center">
            <input type="hidden" name="workspace_id" value={workspaceId} />
            <button
              type="submit"
              className="rounded-lg border border-border/70 bg-background px-3 py-1.5 text-[12px] font-semibold text-foreground transition-all hover:-translate-y-px hover:shadow-sm"
            >
              Disconnect
            </button>
          </form>
        )}
      </div>
    )
  }

  // Not connected — show the wizard (collapsed or expanded).
  return (
    <div className="relative rounded-xl border border-border/60 bg-background p-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-sm font-bold text-white"
          aria-hidden
        >
          𝕏
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">X (Twitter)</p>
            <span className="inline-flex items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-800">
              BYO Developer Keys
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Bring your own X Developer app. Free tier posts ~1.5k tweets/month — more than enough for one creator.
          </p>
        </div>
        {isOwner && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="shrink-0 self-center rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground transition-all hover:-translate-y-px hover:shadow-sm"
          >
            Set up
          </button>
        )}
      </div>

      {expanded && isOwner && (
        <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            4-step setup — takes ~5 minutes
          </p>

          <Step number={1} title="Create a free X Developer account" defaultOpen>
            <p>
              Go to <a
                href="https://developer.x.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2"
              >developer.x.com <ExternalLink className="h-3 w-3" /></a> and sign up. Use the same X account you want to post from.
            </p>
            <p className="mt-1 text-muted-foreground">
              You’ll answer a short questionnaire about intended use — select
              “Making a bot” or “Publishing content”. Approval is instant
              for the Free tier.
            </p>
          </Step>

          <Step number={2} title="Create a Project and App">
            <ol className="ml-4 list-decimal space-y-1">
              <li>In the developer portal, click <em>Create Project</em> — name it anything (e.g. &quot;Clipflow&quot;).</li>
              <li>Inside the project, create an <em>App</em> — also any name.</li>
              <li>
                When asked for <em>App permissions</em>, choose{' '}
                <strong>Read and Write</strong>. Posting tweets won’t work with Read-only.
              </li>
              <li>
                Under <em>User authentication settings</em> pick{' '}
                <strong>OAuth 1.0a</strong> with{' '}
                <strong>Read and Write</strong> permissions. You can leave callback URL blank.
              </li>
            </ol>
          </Step>

          <Step number={3} title="Grab your 4 API credentials">
            <p>In your app page, open the <em>Keys and tokens</em> tab.</p>
            <ul className="ml-4 mt-1 list-disc space-y-1">
              <li>
                Under <strong>Consumer Keys</strong> → copy{' '}
                <code className="rounded bg-muted px-1">API Key</code> (= consumer key) and{' '}
                <code className="rounded bg-muted px-1">API Key Secret</code> (= consumer secret).
              </li>
              <li>
                Under <strong>Authentication Tokens → Access Token and Secret</strong> →
                click <em>Generate</em>. Copy both{' '}
                <code className="rounded bg-muted px-1">Access Token</code> and{' '}
                <code className="rounded bg-muted px-1">Access Token Secret</code>.
              </li>
            </ul>
            <p className="mt-1 rounded-md bg-amber-50 px-2 py-1.5 text-amber-900">
              <AlertTriangle className="mb-px mr-1 inline h-3 w-3" />
              These are shown <strong>only once</strong>. Paste them below
              immediately — if you close the page you’ll have to regenerate.
            </p>
          </Step>

          <Step number={4} title="Paste all 4 credentials below">
            <form action={formAction} className="mt-2 space-y-2">
              <input type="hidden" name="workspace_id" value={workspaceId} />
              <CredInput
                name="consumer_key"
                label="API Key (Consumer Key)"
                placeholder="aB3c…"
              />
              <CredInput
                name="consumer_secret"
                label="API Key Secret (Consumer Secret)"
                placeholder="xYz7…"
              />
              <CredInput
                name="access_token"
                label="Access Token"
                placeholder="1234567890-…"
              />
              <CredInput
                name="access_token_secret"
                label="Access Token Secret"
                placeholder="aB3c…"
              />

              {state?.ok === false && (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-muted-foreground">
                  We encrypt with AES-256-GCM before storing. Never shown in logs.
                </p>
                <SubmitButton />
              </div>
            </form>
          </Step>
        </div>
      )}
    </div>
  )
}

function Step({
  number,
  title,
  children,
  defaultOpen,
}: {
  number: number
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details
      className="group rounded-lg border border-border/60 bg-muted/30 text-[12px] text-foreground open:bg-background"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 font-medium [&::-webkit-details-marker]:hidden">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
          {number}
        </span>
        <span className="flex-1">{title}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-1 border-t border-border/60 px-3 py-2.5 leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  )
}

function CredInput({
  name,
  label,
  placeholder,
}: {
  name: string
  label: string
  placeholder: string
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-foreground">{label}</span>
      <div className="mt-0.5 flex items-center rounded-md border border-border/70 bg-background focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
        <KeyRound className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          name={name}
          type="password"
          placeholder={placeholder}
          required
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-transparent px-2 py-1.5 text-[12px] font-mono outline-none placeholder:text-muted-foreground/50"
        />
      </div>
    </label>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground transition-all hover:-translate-y-px hover:shadow-sm disabled:opacity-60 disabled:translate-y-0"
    >
      {pending ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Verifying with X…
        </>
      ) : (
        <>
          Verify &amp; save
          <ArrowRight className="h-3 w-3" />
        </>
      )}
    </button>
  )
}
