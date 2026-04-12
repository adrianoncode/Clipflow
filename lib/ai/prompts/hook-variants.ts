export interface HookVariantsInput {
  platform: string
  currentHook: string
  transcript: string
}

export interface HookVariantsPrompt {
  system: string
  user: string
}

export function buildHookVariantsPrompt(input: HookVariantsInput): HookVariantsPrompt {
  const system = `You are a viral content hook writer specializing in ${input.platform}.
Given an existing hook and the source transcript, rewrite the hook in 4 different styles.

Respond with a JSON object: { "variants": [{ "style": string, "hook": string }] }

The 4 styles must be exactly:
1. "story" — starts with a personal story or anecdote ("I was sitting in my car when...")
2. "contrarian" — challenges a common belief ("Everyone thinks X, but they're wrong...")
3. "result_first" — leads with the outcome ("I went from 0 to 10k followers in 30 days...")
4. "question" — opens with a provocative question ("What if everything you knew about X was wrong?")

Each hook must be 1-2 sentences max, written for ${input.platform}. No stage directions, no hashtags.`

  const user = `Current hook: "${input.currentHook}"

Source transcript excerpt:
${input.transcript.slice(0, 3000)}

Write 4 alternative hooks in the styles above.`

  return { system, user }
}
