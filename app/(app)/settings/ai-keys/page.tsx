import { cookies } from 'next/headers'

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

  const keysByProvider = keys.reduce<Record<string, typeof keys>>((acc, k) => {
    ;(acc[k.provider] = acc[k.provider] ?? []).push(k)
    return acc
  }, {})

  const connectedCount = new Set(keys.map((k) => k.provider)).size
  const totalServices = SERVICE_DIRECTORY.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">API keys</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Clipflow runs on BYOK — you bring your own API keys and pay
          providers directly at cost. We never mark up tokens, rendering or
          voice. Keys are encrypted at rest with AES-256 and visible only to
          workspace owners.
        </p>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs">
          <span className="font-mono font-bold text-primary">
            {connectedCount}/{totalServices}
          </span>
          <span className="text-muted-foreground">services connected</span>
        </div>
      </div>

      {!isOwner ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Only owners of this workspace can manage API keys.
        </div>
      ) : null}

      {/* AI Providers */}
      <section className="space-y-3">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            AI Providers · Pick one
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            At least one is required — used for scripts, hooks, captions and
            transcription.
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

      {/* Media Stack */}
      <section className="space-y-3">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Media Stack · Optional but powerful
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect these to unlock rendering, avatars, and voice — each with
            its own generous free tier at the provider.
          </p>
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
    </div>
  )
}
