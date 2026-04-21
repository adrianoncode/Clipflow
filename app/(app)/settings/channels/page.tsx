import { cookies } from 'next/headers'
import { AlertTriangle, Radio } from 'lucide-react'

import { ServiceCard } from '@/components/ai-keys/service-card'
import { SERVICE_DIRECTORY } from '@/components/ai-keys/service-directory'
import { PageHeading } from '@/components/workspace/page-heading'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getWorkspaces } from '@/lib/auth/get-workspaces'

export const metadata = {
  title: 'Channels',
}

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

/**
 * Channels — social publishing destinations.
 *
 * This used to live at /settings/ai-keys alongside OpenAI/Anthropic/etc.
 * but that mixed two mental models: "AI providers that generate content"
 * with "publishing destinations that send it out." Creators searching
 * for "where do I connect my TikTok?" found that confusing, so we split
 * the publishing services (currently Upload-Post) out into their own
 * page here.
 *
 * Anything under SERVICE_DIRECTORY with `category: 'publish'` shows up
 * here — AI Keys filters them out correspondingly.
 */
export default async function ChannelsPage() {
  const workspaces = await getWorkspaces()
  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  if (!currentWorkspace) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Channels</h1>
        <p className="text-sm text-muted-foreground">No workspace selected.</p>
      </div>
    )
  }

  const keys = await getAiKeys(currentWorkspace.id)
  const isOwner = currentWorkspace.role === 'owner'

  const publishServices = SERVICE_DIRECTORY.filter((s) => s.category === 'publish')

  const keysByProvider = keys.reduce<Record<string, typeof keys>>((acc, k) => {
    ;(acc[k.provider] = acc[k.provider] ?? []).push(k)
    return acc
  }, {})

  const connectedProviderSet = new Set(keys.map((k) => k.provider))
  const hasChannel = publishServices.some((s) => connectedProviderSet.has(s.provider))

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: '#EDE6F5' }}
        >
          <Radio className="h-4 w-4" style={{ color: '#2A1A3D' }} />
        </div>
        <PageHeading
          eyebrow="Settings · Channels"
          title="Publishing channels."
          body="Connect your TikTok, Instagram, YouTube and LinkedIn accounts through Upload-Post so Clipflow can schedule and auto-publish finished drafts. Without this you can still export drafts and post manually."
        />
      </div>

      {!hasChannel && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-amber-900">
              No channels connected yet.
            </p>
            <p className="mt-0.5 text-amber-700">
              Connect Upload-Post below to publish to TikTok, Instagram, YouTube
              and LinkedIn from inside Clipflow. Social-account login happens on
              Upload-Post — we never see your passwords.
            </p>
          </div>
        </div>
      )}

      {!isOwner && (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Only workspace owners can manage channels.
        </div>
      )}

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
    </div>
  )
}
