import { cookies } from 'next/headers'
import { Key } from 'lucide-react'

import { ServiceCard } from '@/components/ai-keys/service-card'
import { SERVICE_DIRECTORY } from '@/components/ai-keys/service-directory'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getWorkspaces } from '@/lib/auth/get-workspaces'

export const metadata = {
  title: 'API keys',
}

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

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

  const connectedCount = new Set(keys.map((k) => k.provider)).size
  const totalServices = SERVICE_DIRECTORY.length

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <Key className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">API Keys</h1>
            <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
              Clipflow runs on BYOK — you bring your own API keys and pay
              providers directly at cost. We never mark up tokens, rendering or
              voice. Keys are encrypted at rest with AES-256.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs">
          <span className="font-mono font-bold text-primary">
            {connectedCount}/{totalServices}
          </span>
          <span className="text-muted-foreground">services connected</span>
        </div>
      </div>

      {/* How it works — one-time explainer */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          How BYOK works
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {[
            {
              step: '1',
              title: 'Sign up at the provider',
              body: 'Each service has its own free account. Use the "Sign up" link next to each card — most have a free tier.',
            },
            {
              step: '2',
              title: 'Copy your API key',
              body: 'Find the key in the provider\'s dashboard. Use the "Get key" link to go directly there.',
            },
            {
              step: '3',
              title: 'Paste it here',
              body: 'We encrypt it with AES-256 and store it in your workspace. You pay the provider directly — we never see your bill.',
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

      {!isOwner ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          Only owners of this workspace can manage API keys.
        </div>
      ) : null}

      {/* ── AI Providers ───────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              AI Providers
            </h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-700">
              Required · Pick one
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            At least one is required — used for every content generation task:
            scripts, hooks, captions, SEO descriptions, and transcription.
            All three work identically inside Clipflow. Pick whichever you
            already have credits for.
          </p>
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
      </section>

      {/* ── Media Stack ────────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Media Stack
            </h2>
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
              Optional · Unlock rendering &amp; voice
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect these to unlock MP4 rendering, AI avatars, and voice
            cloning. Each has a generous free tier. You only pay the provider
            when you actually use the feature — no Clipflow markup.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-muted-foreground sm:max-w-sm">
            {[
              { label: 'Shotstack', what: 'MP4 render' },
              { label: 'Replicate', what: 'Avatars' },
              { label: 'ElevenLabs', what: 'Voice / TTS' },
            ].map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5">
                <span className="font-semibold text-foreground">{row.label}</span>
                <span>{row.what}</span>
              </div>
            ))}
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

      {/* ── Publishing ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Publishing
            </h2>
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
              Optional · Auto-post to social
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Without this, you export your videos and post them yourself.
            With Upload-Post connected, a{' '}
            <strong className="text-foreground">Publish</strong> button appears
            on every finished output — one click posts to TikTok, Instagram
            Reels, YouTube Shorts, and LinkedIn simultaneously.
          </p>
          <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              How Upload-Post works
            </p>
            <ol className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <span className="shrink-0 font-mono font-bold text-foreground">1.</span>
                Create a free account at upload-post.com (10 posts/mo free, $16/mo for unlimited).
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-mono font-bold text-foreground">2.</span>
                Inside their dashboard, connect your TikTok, Instagram, YouTube, and LinkedIn accounts.
                They handle the OAuth — you log in to each platform once.
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-mono font-bold text-foreground">3.</span>
                Copy your Upload-Post API key and paste it below. Clipflow uses that key to
                trigger posts on your behalf. We never store your social passwords.
              </li>
            </ol>
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
    </div>
  )
}
