import type { AiProvider } from '@/lib/ai/providers/types'

export interface ServiceSpec {
  provider: AiProvider
  name: string
  /** Category determines which group the card lives in on the page. */
  category: 'llm' | 'media' | 'publish'
  /** Short one-line value prop. */
  description: string
  /**
   * Extra setup context shown in the connect dialog — used when the
   * service requires steps beyond "sign up → get key" (e.g. Upload-Post
   * needs users to also connect their social accounts on that platform
   * before the key is useful).
   */
  setupNote?: string
  /** Where the user signs up for this service. */
  signupUrl: string
  /** Where the user fetches/creates their API key after signup. */
  keyDashboardUrl: string
  /** Realistic cost hint for the copy. */
  costHint: string
  /** Whether this service has a meaningful free tier we can advertise. */
  freeTierNote?: string
  /** Single-letter monogram for the icon chip. */
  monogram: string
  /** Hint about what the key format looks like, for the input placeholder. */
  keyFormatHint: string
  /**
   * Which social platforms this publishing service supports, shown as
   * platform pills in the settings card. Only set for category=publish.
   */
  publishPlatforms?: string[]
}

/**
 * The single source of truth for every BYOK provider. Order in the
 * array drives render order in the Settings + Onboarding UIs.
 */
export const SERVICE_DIRECTORY: ServiceSpec[] = [
  // ── LLM providers ──────────────────────────────────────────────
  {
    provider: 'openai',
    name: 'OpenAI',
    category: 'llm',
    description: 'GPT-4o / GPT-5 for scripts, hooks, captions, transcription.',
    signupUrl: 'https://platform.openai.com/signup',
    keyDashboardUrl: 'https://platform.openai.com/api-keys',
    costHint: '$0.10–0.50 per 100 drafts',
    freeTierNote: '$5 free credits at signup',
    monogram: 'O',
    keyFormatHint: 'sk-proj-…',
  },
  {
    provider: 'anthropic',
    name: 'Anthropic',
    category: 'llm',
    description: 'Claude models — strong on tone and brand voice.',
    signupUrl: 'https://console.anthropic.com/',
    keyDashboardUrl: 'https://console.anthropic.com/settings/keys',
    costHint: '$0.15–0.80 per 100 drafts',
    freeTierNote: '$5 free credits at signup',
    monogram: 'A',
    keyFormatHint: 'sk-ant-api03-…',
  },
  {
    provider: 'google',
    name: 'Google',
    category: 'llm',
    description: 'Gemini — cheapest per token, good for bulk generation.',
    signupUrl: 'https://aistudio.google.com/',
    keyDashboardUrl: 'https://aistudio.google.com/apikey',
    costHint: '$0.05–0.30 per 100 drafts',
    freeTierNote: 'Generous free tier (60 RPM)',
    monogram: 'G',
    keyFormatHint: 'AIzaSy…',
  },

  // ── Media stack ────────────────────────────────────────────────
  {
    provider: 'shotstack',
    name: 'Shotstack',
    category: 'media',
    description: 'Video rendering — MP4 compose, captions, B-Roll, branding.',
    signupUrl: 'https://dashboard.shotstack.io/register',
    keyDashboardUrl: 'https://dashboard.shotstack.io/account/keys',
    costHint: '$10–40/mo depending on render volume',
    freeTierNote: '20 minutes free rendering/mo',
    monogram: 'S',
    keyFormatHint: 'xXxXxXxX…',
  },
  {
    provider: 'replicate',
    name: 'Replicate',
    category: 'media',
    description: 'AI avatars + smart video reframing.',
    signupUrl: 'https://replicate.com/signin',
    keyDashboardUrl: 'https://replicate.com/account/api-tokens',
    costHint: '$5–30/mo depending on avatar usage',
    freeTierNote: '$5 free credits at signup',
    monogram: 'R',
    keyFormatHint: 'r8_…',
  },
  {
    provider: 'elevenlabs',
    name: 'ElevenLabs',
    category: 'media',
    description: 'Text-to-speech, voice cloning, and auto-dubbing.',
    signupUrl: 'https://elevenlabs.io/app/sign-up',
    keyDashboardUrl: 'https://elevenlabs.io/app/settings/api-keys',
    costHint: '$0–99/mo depending on voiceover length',
    freeTierNote: '10 000 chars/mo on the free tier',
    monogram: 'E',
    keyFormatHint: 'sk_…',
  },

  // ── Publishing ─────────────────────────────────────────────────
  {
    provider: 'upload-post',
    name: 'Upload-Post',
    category: 'publish',
    description:
      'One API → publish finished videos to TikTok, Instagram Reels, YouTube Shorts and LinkedIn simultaneously.',
    setupNote:
      'After signing up, go to your Upload-Post dashboard and connect each social account you want to post to (TikTok, Instagram, YouTube, LinkedIn). Then copy your API key and paste it below. Clipflow uses that key to post on your behalf — we never store your social passwords.',
    signupUrl: 'https://upload-post.com/register',
    keyDashboardUrl: 'https://upload-post.com/dashboard/api',
    costHint: 'From $16/mo at upload-post.com — you pay them directly',
    freeTierNote: 'Free tier: 10 posts/mo, 2 profiles',
    monogram: 'U',
    keyFormatHint: 'up_live_…',
    publishPlatforms: ['TikTok', 'Instagram', 'YouTube', 'LinkedIn'],
  },
]

export function getServiceSpec(provider: AiProvider): ServiceSpec {
  const spec = SERVICE_DIRECTORY.find((s) => s.provider === provider)
  if (!spec) throw new Error(`Unknown service provider: ${provider}`)
  return spec
}
