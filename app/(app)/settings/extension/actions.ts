'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import {
  mintExtensionToken,
  revokeExtensionToken,
} from '@/lib/extension-tokens'

const MintSchema = z.object({
  name: z.string().min(1).max(80),
})

const RevokeSchema = z.object({
  tokenId: z.string().uuid(),
})

export type MintTokenState =
  | { ok?: undefined }
  | { ok: true; plaintext: string; id: string; name: string }
  | { ok: false; error: string }

export async function mintExtensionTokenAction(
  _prev: MintTokenState,
  formData: FormData,
): Promise<MintTokenState> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Sign in first.' }

  const parsed = MintSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid name.',
    }
  }

  const result = await mintExtensionToken({
    userId: user.id,
    name: parsed.data.name,
  })

  if (!result.ok) return result

  revalidatePath('/settings/extension')
  return {
    ok: true,
    plaintext: result.plaintext,
    id: result.id,
    name: result.name,
  }
}

export type RevokeTokenState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function revokeExtensionTokenAction(
  _prev: RevokeTokenState,
  formData: FormData,
): Promise<RevokeTokenState> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Sign in first.' }

  const parsed = RevokeSchema.safeParse({
    tokenId: String(formData.get('tokenId') ?? ''),
  })
  if (!parsed.success) {
    return { ok: false, error: 'Invalid token.' }
  }

  const result = await revokeExtensionToken({
    userId: user.id,
    tokenId: parsed.data.tokenId,
  })

  if (!result.ok) return result
  revalidatePath('/settings/extension')
  return { ok: true }
}
