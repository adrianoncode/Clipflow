'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { updateAgentSettings, type UpdateAgentSettingsInput } from '@/lib/agent/settings'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

export async function saveAgentSettingsAction(
  input: {
    autoProcess: boolean
    autoHighlights: boolean
    autoDrafts: boolean
    autoSchedule: boolean
    defaultPublishPlatforms: string[]
    chatMaxCostDollars: number
    autopilotMaxCostDollars: number
  },
) {
  const cookieStore = cookies()
  const workspaceId = cookieStore.get(CURRENT_WORKSPACE_COOKIE)?.value
  if (!workspaceId) throw new Error('No workspace selected.')

  const member = await requireWorkspaceMember(workspaceId)
  if (!member.ok) throw new Error(member.message)
  if (member.role !== 'owner') throw new Error('Only workspace owners can change agent settings.')

  const patch: UpdateAgentSettingsInput = {
    autoProcess: input.autoProcess,
    autoHighlights: input.autoHighlights,
    autoDrafts: input.autoDrafts,
    autoSchedule: input.autoSchedule,
    defaultPublishPlatforms: input.defaultPublishPlatforms,
    chatMaxCostPerConversationMicroUsd: BigInt(
      Math.round(input.chatMaxCostDollars * 1_000_000),
    ),
    autopilotMaxCostPerRunMicroUsd: BigInt(
      Math.round(input.autopilotMaxCostDollars * 1_000_000),
    ),
  }

  await updateAgentSettings(workspaceId, patch)
  revalidatePath('/settings/agent')
}
