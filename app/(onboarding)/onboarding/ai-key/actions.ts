'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { insertAiKey } from '@/lib/ai/insert-ai-key'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import type { AiKeyFormState } from '@/components/ai-keys/ai-key-form'

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

const schema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google']),
  label: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  api_key: z.string().trim().min(10, 'Please paste a full API key.'),
})

export async function saveAiKeyOnboardingAction(
  _prev: AiKeyFormState,
  formData: FormData,
): Promise<AiKeyFormState> {
  const parsed = schema.safeParse({
    provider: formData.get('provider'),
    label: formData.get('label') ?? undefined,
    api_key: formData.get('api_key'),
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input.',
    }
  }

  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  // Resolve target workspace: prefer the cookie the workspace step set for
  // team/agency users, otherwise fall back to the personal workspace.
  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const workspaces = await getWorkspaces()
  const targetWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ??
    workspaces.find((w) => w.type === 'personal') ??
    workspaces[0]

  if (!targetWorkspace) {
    return { ok: false, error: 'No workspace found for your account.' }
  }

  const result = await insertAiKey({
    workspaceId: targetWorkspace.id,
    provider: parsed.data.provider,
    label: parsed.data.label,
    plaintextKey: parsed.data.api_key,
    userId: user.id,
  })

  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  redirect('/onboarding/complete')
}
