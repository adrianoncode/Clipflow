import 'server-only'
import { createClient } from '@/lib/supabase/server'

export async function getSignedUrl(storagePath: string, bucket = 'content'): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 3600) // 1 hour expiry
    return data?.signedUrl ?? null
  } catch {
    return null
  }
}

/**
 * Long-lived signed URL (30 days) — used for exported project files like
 * FCPXML where the editor may open the file days after downloading. Short
 * 1-hour URLs would 403 the editor on next session.
 *
 * Accepts either a raw storage path or a full http(s) URL; external URLs
 * are returned as-is since they manage their own lifetime.
 */
export async function getLongLivedSourceUrl(
  sourceUrl: string | null,
  bucket = 'content',
): Promise<string | null> {
  if (!sourceUrl) return null
  if (sourceUrl.startsWith('http')) return sourceUrl
  try {
    const supabase = createClient()
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(sourceUrl, 60 * 60 * 24 * 30) // 30 days
    return data?.signedUrl ?? null
  } catch {
    return null
  }
}
