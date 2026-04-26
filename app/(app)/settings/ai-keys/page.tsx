import { cookies } from 'next/headers'

import { ServiceCard } from '@/components/ai-keys/service-card'
import { SERVICE_DIRECTORY } from '@/components/ai-keys/service-directory'
import {
  SettingsFootnote,
  SettingsSection,
} from '@/components/settings/section'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getWorkspaces } from '@/lib/auth/get-workspaces'

export const metadata = {
  title: 'AI Keys',
}

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

/**
 * AI Keys.
 *
 * Editorial pattern — section headers with hairline-divided cards
 * inside, no banners and no instructional preamble. Real provider
 * marks (BrandLogo) replace the monogram chips so the page reads as
 * an integrations console rather than a developer settings dump.
 *
 * Two sections only: AI Provider (required, one of), Media Stack
 * (optional). Publishing connectors live on /settings/channels.
 */
export default async function ApiKeysPage() {
  const workspaces = await getWorkspaces()
  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  if (!currentWorkspace) {
    return (
      <div className="space-y-2">
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

  const connectedProviderSet = new Set(keys.map((k) => k.provider))
  const llmConnectedCount = llmServices.filter((s) =>
    connectedProviderSet.has(s.provider),
  ).length
  const mediaConnectedCount = mediaServices.filter((s) =>
    connectedProviderSet.has(s.provider),
  ).length

  const llmHint =
    llmConnectedCount === 0
      ? 'Pick one — OpenAI, Anthropic or Google. All three power scripts, hooks, captions and transcription identically.'
      : `${llmConnectedCount} of ${llmServices.length} connected · drives every generation in this workspace`

  const mediaHint =
    mediaConnectedCount === 0
      ? 'Optional — unlocks MP4 rendering, AI avatars, voice cloning and auto-dub. Free tiers on every provider.'
      : `${mediaConnectedCount} of ${mediaServices.length} connected · adds renders, avatars, voice and dub`

  return (
    <div className="space-y-7">
      {/* ── 01 · AI Provider ──────────────────────────────────── */}
      <SettingsSection title="AI provider" hint={llmHint}>
        {llmServices.map((spec) => (
          <ServiceCard
            key={spec.provider}
            spec={spec}
            connectedKeys={keysByProvider[spec.provider] ?? []}
            workspaceId={currentWorkspace.id}
            isOwner={isOwner}
          />
        ))}
      </SettingsSection>

      {/* ── 02 · Media stack ──────────────────────────────────── */}
      <SettingsSection title="Media stack" hint={mediaHint}>
        {mediaServices.map((spec) => (
          <ServiceCard
            key={spec.provider}
            spec={spec}
            connectedKeys={keysByProvider[spec.provider] ?? []}
            workspaceId={currentWorkspace.id}
            isOwner={isOwner}
          />
        ))}
      </SettingsSection>

      <SettingsFootnote>
        Keys live encrypted at rest with AES-256-GCM · you pay each provider
        directly at cost · rotate or revoke any key without losing your
        workspace history.
      </SettingsFootnote>

      {!isOwner && (
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          You&rsquo;re viewing as a member — only the workspace owner can add or
          rotate keys.
        </p>
      )}
    </div>
  )
}
