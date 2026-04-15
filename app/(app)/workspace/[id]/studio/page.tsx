import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Maximize2,
  MessageSquareText,
  Clapperboard,
  Bot,
  Languages,
  ArrowRight,
  Video,
  Info,
} from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'

export const metadata = { title: 'Video Studio' }
export const dynamic = 'force-dynamic'

const TOOLS = [
  {
    id: 'reframe',
    icon: Maximize2,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    name: 'Reframe',
    tagline: 'Resize for any platform',
    description:
      'Automatically crop and reframe your video for TikTok (9:16), Reels, Shorts, or landscape. AI keeps the subject centred.',
    requires: 'Your Replicate key (BYOK)',
    byok: true,
    minPlan: 'Free',
  },
  {
    id: 'subtitles',
    icon: MessageSquareText,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    name: 'Subtitles',
    tagline: 'Auto-captions in seconds',
    description:
      'Transcribe your video with Whisper and burn in styled captions. Edit every word before rendering. Works with any language.',
    requires: 'Your OpenAI key (BYOK)',
    byok: true,
    minPlan: 'Free',
  },
  {
    id: 'broll',
    icon: Clapperboard,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    name: 'B-Roll',
    tagline: 'Insert stock footage automatically',
    description:
      'AI picks relevant stock clips from Pexels and inserts them at natural cut points. Shotstack renders the final video.',
    requires: 'Your LLM key (BYOK)',
    byok: true,
    minPlan: 'Free',
  },
  {
    id: 'avatar',
    icon: Bot,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-100',
    name: 'AI Avatar',
    tagline: 'Talking-head video from text',
    description:
      'Turn any script into a photorealistic talking-head video. Choose an avatar or upload your own image — rendered with D-ID.',
    requires: 'Included — Clipflow provides',
    byok: false,
    minPlan: 'Solo ($19/mo)',
  },
  {
    id: 'dub',
    icon: Languages,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    name: 'Dub / Voiceover',
    tagline: 'Clone voice in any language',
    description:
      'Dub your video into another language with voice cloning. ElevenLabs handles translation and voice synthesis in one step.',
    requires: 'Your ElevenLabs key (BYOK)',
    byok: true,
    minPlan: 'Free',
  },
]

export default async function StudioPage({ params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-4 sm:p-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Video Studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-powered video processing tools. Open any video from your library, then apply a tool.
          </p>
        </div>
        <Link
          href={`/workspace/${params.id}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
        >
          <Video className="h-4 w-4" />
          My Videos
        </Link>
      </div>

      {/* How it works */}
      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">How to use:</span>{' '}
          Go to{' '}
          <Link
            href={`/workspace/${params.id}`}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            My Videos
          </Link>
          , open a video, and use the tool buttons on that page.{' '}
          Tools marked <span className="font-medium text-foreground">BYOK</span> need your own API
          key in{' '}
          <Link
            href="/settings/ai-keys"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Settings → AI Keys
          </Link>
          . Others run on Clipflow&apos;s infrastructure — no key needed.
        </p>
      </div>

      {/* Tools grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <div
              key={tool.id}
              className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-border hover:shadow-sm"
            >
              {/* Icon + plan badge */}
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${tool.bg} border ${tool.border}`}
                >
                  <Icon className={`h-5 w-5 ${tool.color}`} />
                </div>
                <div className="flex flex-col items-end gap-1">
                  {tool.byok ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      BYOK
                    </span>
                  ) : (
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                      Included
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">from {tool.minPlan}</span>
                </div>
              </div>

              {/* Text */}
              <div className="flex-1">
                <h3 className="text-sm font-semibold">{tool.name}</h3>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">{tool.tagline}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {tool.description}
                </p>
              </div>

              {/* Requires */}
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground/70">API:</span>{' '}
                {tool.requires}
              </div>

              {/* CTA */}
              <Link
                href={`/workspace/${params.id}`}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                Select a video
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )
        })}
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-5 py-4">
        <div>
          <p className="text-sm font-medium">Missing an API key?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Add keys once — they work across all video tools.</p>
        </div>
        <Link
          href="/settings/ai-keys"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold transition-colors hover:bg-accent"
        >
          Manage API Keys
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
