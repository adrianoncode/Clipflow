import 'server-only'

import { createClient } from '@/lib/supabase/server'

export interface AlgorithmUpdate {
  id: string
  source: string
  title: string
  summary: string | null
  url: string | null
  platforms: string[]
  ai_recommendations: string[]
  published_at: string | null
  fetched_at: string
}

/**
 * Fetches algorithm updates from the database, newest first.
 */
export async function getAlgorithmUpdates(limit: number = 20): Promise<AlgorithmUpdate[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('algorithm_updates')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as AlgorithmUpdate[]
}
