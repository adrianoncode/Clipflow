'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { searchPexelsVideos, searchPexelsPhotos } from '@/lib/broll/search-pexels'
import type { PexelsVideo, PexelsPhoto } from '@/lib/broll/search-pexels'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const searchSchema = z.object({
  query: z.string().trim().min(1, 'Search query is required.').max(200),
  type: z.enum(['video', 'photo']),
})

export type SearchBrollState =
  | { ok?: undefined }
  | { ok: true; results: PexelsVideo[] | PexelsPhoto[]; query: string; type: 'video' | 'photo' }
  | { ok: false; error: string }

export async function searchBrollAction(
  _prevState: SearchBrollState,
  formData: FormData,
): Promise<SearchBrollState> {
  const parsed = searchSchema.safeParse({
    query: formData.get('query'),
    type: formData.get('type') ?? 'video',
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  // B-Roll search hits Pexels — rate-limit per user since it's pre-content
  // (no workspace context yet). Uses mediaJob bucket.
  const rlResult = await checkRateLimit(
    `broll:user:${user.id}`,
    RATE_LIMITS.mediaJob.limit,
    RATE_LIMITS.mediaJob.windowMs,
  )
  if (!rlResult.ok) {
    return { ok: false, error: 'Rate limit reached. Please wait and try again.' }
  }

  const { query, type } = parsed.data

  if (type === 'photo') {
    const photos = await searchPexelsPhotos(query, 9)
    return { ok: true, results: photos, query, type }
  }

  const videos = await searchPexelsVideos(query, 9)
  return { ok: true, results: videos, query, type }
}
