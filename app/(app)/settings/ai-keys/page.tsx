import { cookies } from 'next/headers'
import { AlertTriangle, ChevronRight, Key } from 'lucide-react'

import { ServiceCard } from '@/components/ai-keys/service-card'
import { SERVICE_DIRECTORY } from '@/components/ai-keys/service-directory'
import { PageHeading } from '@/components/workspace/page-heading'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getWorkspaces } from '@/lib/auth/get-workspaces'

export const metadata = {
  title: 'AI Keys',
}

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

/**
 * AI Keys.
 *
 * Only AI-provider + media-stack keys live here (OpenAI, Anthropic,
 * Google, Shotstack, ElevenLabs, etc.). Social publishing (Upload-Post)
 * used to share this page but was split out to /settings/channels —
 * creators searching for "connect my TikTok" found it confusing to see
 * their social accounts alongside OpenAI tokens.
 *
 * Two sections: AI Provider (required, one of), Media Stack (optional,
 * unlocks renders/avatars/dub). Help disclosure at the bottom covers
 * the 3-step onboarding for new users.
 */
export default async function ApiKeysPage() {
  const workspaces = await getWorkspaces()
  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  if (!currentWorkspace) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">AI Keys</h1>
        <p className="text-sm text-muted-foreground">No workspace selected.</p>
      </div>
    )
  }

  const keys = await getAiKeys(currentWorkspace.id)
  const isOwner = currentWorkspace.role === 'owner'

  // Publishing services (Upload-Post) live on /settings/channels now,
  // so we filter them out of this page's directory.
  const llmServices = SERVICE_DIRECTORY.filter((s) => s.category === 'llm')
  const mediaServices = SERVICE_DIRECTORY.filter((s) => s.category === 'media')

  const keysByProvider = keys.reduce<Record<string, typeof keys>>((acc, k) => {
    ;(acc[k.provider] = acc[k.provider] ?? []).push(k)
    return acc
  }, {})

  const connectedProviderSet = new Set(keys.map((k) => k.provider))
  const hasLlm = llmServices.some((s) => connectedProviderSet.has(s.provider))
  const hasMedia = mediaServices.some((s) => connectedProviderSet.has(s.provider))

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: '#EDE6F5' }}>
          <Key className="h-4 w-4" style={{ color: '#2A1A3D' }} />
        </div>
        <PageHeading
          eyebrow="Settings · AI"
          title="AI keys."
          body="Bring your own AI keys — one connects scripts, captions, hooks, and transcription. You pay your provider directly at cost, no markup. Keys are encrypted at rest."
        />
      </div>

      {/* ── Blocker banner: only when truly blocked ── */}
      {!hasLlm && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-amber-900">
              Connect an AI provider to start generating.
            </p>
            <p className="mt-0.5 text-amber-700">
              Pick OpenAI, Anthropic, or Google below — whichever you already
              have. All three work identically. Most give free credits at
              signup.
            </p>
          </div>
        </div>
      )}

      {!isOwner && (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Only workspace owners can manage AI keys.
        </div>
      )}

      {/* ── 1. AI Provider (Required) ── */}
      <Section
        title="AI Provider"
        description="Powers scripts, hooks, captions, SEO, and transcription. Pick one — all three work identically."
        status={hasLlm ? 'connected' : 'required'}
      >
        {llmServices.map((spec) => (
          <ServiceCard
            key={spec.provider}
            spec={spec}
            connectedKeys={keysByProvider[spec.provider] ?? []}
            workspaceId={currentWorkspace.id}
            isOwner={isOwner}
          />
        ))}
      </Section>

      {/* ── 2. Media Stack (Optional) ── */}
      <Section
        title="Media Stack"
        description="Unlocks video rendering (MP4), AI avatars, voice cloning, and auto-dub. Free tiers available — you only pay when you render."
        status={hasMedia ? 'connected' : 'optional'}
      >
        {mediaServices.map((spec) => (
          <ServiceCard
            key={spec.provider}
            spec={spec}
            connectedKeys={keysByProvider[spec.provider] ?? []}
            workspaceId={currentWorkspace.id}
            isOwner={isOwner}
          />
        ))}
      </Section>

      {/* ── Help disclosure — hidden by default so the main surface
           stays clean; one click reveals the 3-step onboarding for
           new users who need it. ── */}
      <details className="group rounded-xl border border-border/50 bg-card">
        <summary className="flex cursor-pointer items-center gap-1.5 px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
          First time? Walk through it in 2 minutes
        </summary>
        <div className="border-t border-border/40 p-5">
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Pick a provider',
                body: 'OpenAI, Anthropic, or Google — pick whichever you already have. Most give free credits at signup.',
              },
              {
                step: '2',
                title: 'Copy your key',
                body: 'Open the provider, find "API keys" in their dashboard, and copy the token.',
              },
              {
                step: '3',
                title: 'Paste it here',
                body: 'Hit "Connect" next to the provider and paste your key. We encrypt it at rest.',
              },
            ].map((s) => (
              <li key={s.step} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary">
                  {s.step}
                </span>
                <div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </details>
    </div>
  )
}

type SectionStatus = 'required' | 'optional' | 'connected'

/** Section shell. Status pill tells the user in one token whether they
 * need to act, can skip, or are already done — replaces the earlier
 * traffic-light icons + chip row + duplicate headers pileup. */
function Section({
  title,
  description,
  status,
  children,
}: {
  title: string
  description: string
  status: SectionStatus
  children: React.ReactNode
}) {
  const badge =
    status === 'connected'
      ? { text: 'Connected', className: 'bg-emerald-100 text-emerald-700' }
      : status === 'required'
        ? { text: 'Required', className: 'bg-amber-100 text-amber-700' }
        : { text: 'Optional', className: 'bg-muted text-muted-foreground' }

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">{title}</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.className}`}
            >
              {badge.text}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
