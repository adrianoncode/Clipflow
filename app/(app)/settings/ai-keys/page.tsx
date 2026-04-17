import { cookies } from 'next/headers'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Key,
  Lock,
  Sparkles,
  Zap,
} from 'lucide-react'

import { ServiceCard } from '@/components/ai-keys/service-card'
import { SERVICE_DIRECTORY } from '@/components/ai-keys/service-directory'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import type { AiProvider } from '@/lib/ai/providers/types'
import { getWorkspaces } from '@/lib/auth/get-workspaces'

export const metadata = {
  title: 'AI Connections',
}

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

/**
 * Feature unlock map — shows what each key category enables.
 * Displayed at the top so users immediately understand the "why".
 */
const UNLOCK_MAP = [
  {
    category: 'llm' as const,
    label: 'AI Provider',
    required: true,
    features: [
      'Generate scripts & hooks',
      'Captions & hashtags',
      'SEO descriptions',
      'Transcription',
      'AI Coach tips',
      'Ghostwriter',
    ],
  },
  {
    category: 'media' as const,
    label: 'Media Stack',
    required: false,
    features: [
      'Export as MP4 video',
      'AI talking-head avatars',
      'Voice cloning & TTS',
      'Auto-dubbing',
      'Smart reframing',
    ],
  },
  {
    category: 'publish' as const,
    label: 'Publishing',
    required: false,
    features: [
      'One-click post to TikTok',
      'Auto-publish to Instagram',
      'YouTube Shorts upload',
      'LinkedIn auto-post',
      'Scheduled publishing',
    ],
  },
]

export default async function ApiKeysPage() {
  const workspaces = await getWorkspaces()
  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  if (!currentWorkspace) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">API keys</h1>
        <p className="text-sm text-muted-foreground">No workspace selected.</p>
      </div>
    )
  }

  const keys = await getAiKeys(currentWorkspace.id)
  const isOwner = currentWorkspace.role === 'owner'

  const llmServices = SERVICE_DIRECTORY.filter((s) => s.category === 'llm')
  const mediaServices = SERVICE_DIRECTORY.filter((s) => s.category === 'media')
  const publishServices = SERVICE_DIRECTORY.filter((s) => s.category === 'publish')

  const keysByProvider = keys.reduce<Record<string, typeof keys>>((acc, k) => {
    ;(acc[k.provider] = acc[k.provider] ?? []).push(k)
    return acc
  }, {})

  const connectedProviderSet = new Set(keys.map((k) => k.provider))
  const hasLlm = llmServices.some((s) => connectedProviderSet.has(s.provider))
  const hasMedia = mediaServices.some((s) => connectedProviderSet.has(s.provider))
  const hasPublish = publishServices.some((s) => connectedProviderSet.has(s.provider))

  const categoryStatus = {
    llm: hasLlm,
    media: hasMedia,
    publish: hasPublish,
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="space-y-3">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Key className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">AI Connections</h1>
            <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
              Connect the AI services you want to use — you pay them directly
              at cost, no markup from Clipflow. All credentials are encrypted.
            </p>
          </div>
        </div>
      </div>

      {/* ── Feature Unlock Map — the "what do I need" overview ── */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="border-b border-border/40 px-5 py-3">
          <p className="text-sm font-semibold">What each key unlocks</p>
          <p className="text-xs text-muted-foreground">
            See exactly which features you get with each connection
          </p>
        </div>
        <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0 divide-border/40">
          {UNLOCK_MAP.map((group) => {
            const isActive = categoryStatus[group.category]
            return (
              <div
                key={group.category}
                className={`relative p-5 transition-colors ${
                  isActive ? 'bg-emerald-50/40' : ''
                }`}
              >
                {/* Status badge */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold ${
                        group.required && !isActive
                          ? 'text-amber-600'
                          : isActive
                            ? 'text-emerald-600'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {group.label}
                    </span>
                    {group.required && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                        Required
                      </span>
                    )}
                  </div>
                  {isActive ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60">
                      <Lock className="h-3 w-3" />
                      Locked
                    </span>
                  )}
                </div>

                {/* Feature list */}
                <ul className="space-y-1.5">
                  {group.features.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-center gap-2 text-xs ${
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground/60'
                      }`}
                    >
                      {isActive ? (
                        <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                      ) : (
                        <Lock className="h-3 w-3 shrink-0 text-muted-foreground/30" />
                      )}
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Blocker banner if no LLM key ── */}
      {!hasLlm && (
        <div className="flex items-start gap-3 rounded-xl border-2 border-amber-200 bg-amber-50/80 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">
              Connect an AI provider to start generating
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Without at least one connection (OpenAI, Anthropic, or Google),
              Clipflow can&apos;t generate anything. Pick whichever you already
              have — all three work the same. Most have free credits at signup.
            </p>
          </div>
        </div>
      )}

      {!isOwner ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          Only owners of this workspace can manage API keys.
        </div>
      ) : null}

      {/* ── AI Providers (Required) ── */}
      <section className="space-y-3">
        <div className={`rounded-2xl border-2 p-5 ${
          hasLlm
            ? 'border-emerald-200 bg-emerald-50/30'
            : 'border-amber-200 bg-amber-50/20'
        }`}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                hasLlm
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-amber-100 text-amber-600'
              }`}>
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold">AI Provider</h2>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    hasLlm
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {hasLlm ? 'Connected' : 'Required — pick one'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Powers all AI features: scripts, hooks, captions, SEO, transcription.
                  Pick any one — all three work identically.
                </p>
              </div>
            </div>
            {hasLlm && (
              <Check className="h-5 w-5 text-emerald-500" />
            )}
          </div>
          <div className="space-y-2">
            {llmServices.map((spec) => (
              <ServiceCard
                key={spec.provider}
                spec={spec}
                connectedKeys={keysByProvider[spec.provider] ?? []}
                workspaceId={currentWorkspace.id}
                isOwner={isOwner}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Media Stack (Optional) ── */}
      <section className="space-y-3">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              hasMedia
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-muted text-muted-foreground'
            }`}>
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">Media Stack</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Optional
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Unlock video rendering (MP4), AI avatars, and voice cloning.
                Each has a free tier — you only pay when you actually use it.
              </p>
            </div>
          </div>
          {/* Quick what-unlocks-what */}
          <div className="mb-3 flex flex-wrap gap-2">
            {[
              { provider: 'shotstack', label: 'Shotstack', what: 'MP4 export' },
              { provider: 'replicate', label: 'Replicate', what: 'AI avatars' },
              { provider: 'elevenlabs', label: 'ElevenLabs', what: 'Voice & TTS' },
            ].map((item) => {
              const active = connectedProviderSet.has(item.provider as AiProvider)
              return (
                <div
                  key={item.provider}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] ${
                    active
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-border/60 bg-muted/30 text-muted-foreground'
                  }`}
                >
                  {active ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Lock className="h-3 w-3 text-muted-foreground/40" />
                  )}
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-muted-foreground/70">{item.what}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="space-y-2">
          {mediaServices.map((spec) => (
            <ServiceCard
              key={spec.provider}
              spec={spec}
              connectedKeys={keysByProvider[spec.provider] ?? []}
              workspaceId={currentWorkspace.id}
              isOwner={isOwner}
            />
          ))}
        </div>
      </section>

      {/* ── Publishing (Optional) ── */}
      <section className="space-y-3">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              hasPublish
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-muted text-muted-foreground'
            }`}>
              <ArrowRight className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">Publishing</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Optional
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Without this you export and post manually. With Upload-Post,
                one click publishes to all platforms simultaneously.
              </p>
            </div>
          </div>
          {/* How it works mini */}
          <div className="mb-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">How it works: </span>
                  Sign up at upload-post.com (free: 10 posts/mo) → connect your
                  TikTok, Instagram, YouTube, LinkedIn there → paste the API key here.
                  Clipflow posts on your behalf, never stores your social passwords.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {publishServices.map((spec) => (
            <ServiceCard
              key={spec.provider}
              spec={spec}
              connectedKeys={keysByProvider[spec.provider] ?? []}
              workspaceId={currentWorkspace.id}
              isOwner={isOwner}
            />
          ))}
        </div>
      </section>

      {/* ── Bottom: quick how-to for confused users ── */}
      <details className="group rounded-xl border border-border/50 bg-card">
        <summary className="flex cursor-pointer items-center gap-2 px-5 py-3.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
          <span className="transition-transform group-open:rotate-90">▶</span>
          New here? How to connect in 2 minutes
        </summary>
        <div className="border-t border-border/40 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Pick a provider above',
                body: 'OpenAI, Anthropic, or Google — all work the same. Most have free credits at signup.',
              },
              {
                step: '2',
                title: 'Copy your key',
                body: 'Click "Sign up" → create account → find "API Keys" in their dashboard → copy it.',
              },
              {
                step: '3',
                title: 'Paste it here',
                body: 'Click "Connect" next to the provider → paste your key → done. Clipflow encrypts it automatically.',
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary">
                  {s.step}
                </span>
                <div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  )
}
