import { NextResponse } from 'next/server'
import { z } from 'zod'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { generateRaw } from '@/lib/ai/generate/generate-raw'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { getUser } from '@/lib/auth/get-user'
import { buildScriptCoachPrompt } from '@/lib/ai/prompts/script-coach'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const schema = z.object({
  workspaceId: z.string().uuid(),
  script: z.string().min(10).max(10000),
  platform: z.string().optional(),
})

/**
 * API route for the real-time script coach.
 * Uses a route handler instead of a server action because it's called
 * via debounced fetch (500ms) from the client — server actions have
 * too much serialization overhead for rapid calls.
 */
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 10 coach requests per minute per user
  const rl = checkRateLimit(`coach:${user.id}`, RATE_LIMITS.scriptCoach.limit, RATE_LIMITS.scriptCoach.windowMs)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  const provider = await pickGenerationProvider(parsed.data.workspaceId)
  if (!provider.ok) {
    return NextResponse.json({ error: provider.message }, { status: 400 })
  }

  const prompt = buildScriptCoachPrompt({
    script: parsed.data.script,
    platform: parsed.data.platform,
  })

  const gen = await generateRaw({
    provider: provider.provider,
    apiKey: provider.apiKey,
    model: DEFAULT_MODELS[provider.provider],
    system: prompt.system,
    user: prompt.user,
  })

  if (!gen.ok) {
    return NextResponse.json({ error: gen.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, feedback: gen.json })
}
