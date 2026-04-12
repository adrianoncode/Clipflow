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
