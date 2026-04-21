'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { AUDIT_ACTIONS } from '@/lib/audit/actions'
import { writeAuditLog } from '@/lib/audit/write'
import { createClient } from '@/lib/supabase/server'
import type { BrandKit } from '@/lib/brand-kit/types'
import { FONT_CHOICES, WATERMARK_POSITIONS } from '@/lib/brand-kit/types'

const SaveSchema = z.object({
  workspace_id: z.string().uuid(),
  // Everything below is optional so users can clear fields.
  logo_url: z.string().url().optional().or(z.literal('')),
  accent_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use a #RRGGBB hex value')
    .optional()
    .or(z.literal('')),
  font_family: z.enum(FONT_CHOICES as [string, ...string[]]).optional().or(z.literal('')),
  watermark_position: z
    .enum(WATERMARK_POSITIONS as [string, ...string[]])
    .optional()
    .or(z.literal('')),
  intro_text: z.string().max(80).optional().or(z.literal('')),
  outro_text: z.string().max(80).optional().or(z.literal('')),
})

export type SaveBrandKitState =
  | { ok?: undefined }
  | { ok: true; message: string }
  | { ok: false; error: string }

export async function saveBrandKitAction(
  _prev: SaveBrandKitState,
  formData: FormData,
): Promise<SaveBrandKitState> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Sign in first.' }

  const parsed = SaveSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    logo_url: formData.get('logo_url') ?? '',
    accent_color: formData.get('accent_color') ?? '',
    font_family: formData.get('font_family') ?? '',
    watermark_position: formData.get('watermark_position') ?? '',
    intro_text: formData.get('intro_text') ?? '',
    outro_text: formData.get('outro_text') ?? '',
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form.' }
  }

  // Only owners + editors touch shared branding — reviewers are read-only.
  const check = await requireWorkspaceMember(parsed.data.workspace_id)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner' && check.role !== 'editor') {
    return { ok: false, error: 'Only owners or editors can update the brand kit.' }
  }

  const branding: BrandKit = {
    ...(parsed.data.logo_url ? { logoUrl: parsed.data.logo_url } : {}),
    ...(parsed.data.accent_color ? { accentColor: parsed.data.accent_color } : {}),
    ...(parsed.data.font_family
      ? { fontFamily: parsed.data.font_family as BrandKit['fontFamily'] }
      : {}),
    ...(parsed.data.watermark_position
      ? { watermarkPosition: parsed.data.watermark_position as BrandKit['watermarkPosition'] }
      : {}),
    ...(parsed.data.intro_text ? { introText: parsed.data.intro_text } : {}),
    ...(parsed.data.outro_text ? { outroText: parsed.data.outro_text } : {}),
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('workspaces')
    .update({ branding: branding as never })
    .eq('id', parsed.data.workspace_id)
  if (error) return { ok: false, error: error.message }

  await writeAuditLog({
    workspaceId: parsed.data.workspace_id,
    action: AUDIT_ACTIONS.brand_kit_updated,
    targetType: 'workspace',
    targetId: parsed.data.workspace_id,
    metadata: { fields: Object.keys(branding) },
  })

  revalidatePath('/settings/brand-kit')
  return { ok: true, message: 'Brand kit saved. It will apply to every new render.' }
}

/**
 * Uploads a logo image to Supabase Storage under the workspace's folder
 * and returns the public URL. The bucket is `content` (already used by
 * the content-item source storage). Returns null on failure.
 */
export async function uploadBrandLogoAction(
  workspaceId: string,
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Sign in first.' }

  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner' && check.role !== 'editor') {
    return { ok: false, error: 'Only owners or editors can upload a logo.' }
  }

  const file = formData.get('logo') as File | null
  if (!file || file.size === 0) return { ok: false, error: 'Pick a file first.' }
  if (file.size > 2 * 1024 * 1024) return { ok: false, error: 'Logo must be under 2 MB.' }
  if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
    return { ok: false, error: 'Use PNG, JPEG, SVG, or WebP.' }
  }

  const supabase = createClient()
  const path = `brand-kit/${workspaceId}/logo-${Date.now()}.${file.name.split('.').pop() ?? 'png'}`
  const { error } = await supabase.storage
    .from('content')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) return { ok: false, error: error.message }

  const { data: pub } = supabase.storage.from('content').getPublicUrl(path)
  return { ok: true, url: pub.publicUrl }
}
