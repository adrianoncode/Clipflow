import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Zap,
  Upload,
  Sparkles,
  Share2,
  Check,
  X,
  ChevronDown,
  ArrowRight,
  Play,
  Subtitles,
  Calendar,
  BarChart3,
  Globe,
  Mic,
  Video,
  Layers,
  Star,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Clipflow — Turn One Video into TikTok, Reels, Shorts & LinkedIn Posts',
  description:
    'AI-powered content repurposing platform. Upload a video, paste a script, or drop a YouTube link — get platform-native drafts for TikTok, Instagram Reels, YouTube Shorts, and LinkedIn in seconds. Auto-subtitles, B-Roll, virality scoring, social scheduling. Free to start.',
  alternates: {
    canonical: 'https://clipflow.to',
  },
}

const FEATURES = [
  {
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    title: 'Four platform drafts in seconds',
    description: 'TikTok, Reels, Shorts, LinkedIn — each with a tailored hook, script, caption, and hashtags. Generated in parallel.',
  },
  {
    icon: Mic,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    title: 'Brand voice consistency',
    description: 'Set your tone, keywords, and example hooks. Every AI draft sounds like you — not like a robot.',
  },
  {
    icon: Subtitles,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    title: 'Animated subtitles',
    description: 'Word-level captions with 3 animation styles. Export SRT/VTT or preview with live overlay.',
  },
  {
    icon: Video,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    title: 'AI B-Roll from Pexels',
    description: 'AI extracts visual keywords, finds matching stock footage. One click to discover perfect B-Roll.',
  },
  {
    icon: BarChart3,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    title: 'Virality score',
    description: 'AI scores every output on hook strength, scroll-stop power, and shareability — before you publish.',
  },
  {
    icon: Layers,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    title: 'Auto clip finder',
    description: 'AI finds the 3–5 most viral moments in your transcript. No need to watch the whole video.',
  },
  {
    icon: Calendar,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    title: 'Social scheduler',
    description: 'Schedule posts to TikTok, Instagram, and LinkedIn. Color-coded content calendar included.',
  },
  {
    icon: Globe,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    title: 'Auto-dubbing in 15+ languages',
    description: 'Translate and dub content into Spanish, French, German, Japanese, and 12 more via ElevenLabs.',
  },
  {
    icon: Star,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    title: 'A/B hook testing',
    description: 'Generate 3 hook variants using different psychological triggers. Track which performs best.',
  },
]

const COMPARISON = [
  { feature: 'Platform-native drafts (all 4)', clipflow: true, opus: 'TikTok only', klap: 'TikTok only' },
  { feature: 'Animated subtitles', clipflow: true, opus: true, klap: true },
  { feature: 'Brand voice settings', clipflow: true, opus: false, klap: false },
  { feature: 'A/B hook testing', clipflow: true, opus: false, klap: false },
  { feature: 'Virality scoring', clipflow: true, opus: true, klap: false },
  { feature: 'Social scheduler', clipflow: true, opus: false, klap: false },
  { feature: 'AI B-Roll (Pexels)', clipflow: true, opus: false, klap: false },
  { feature: 'AI Avatar video', clipflow: true, opus: false, klap: false },
  { feature: 'Auto-dubbing (15+ langs)', clipflow: true, opus: false, klap: false },
  { feature: 'Client review links', clipflow: true, opus: false, klap: false },
  { feature: 'BYOK — zero markup', clipflow: true, opus: false, klap: false },
  { feature: 'Zapier / Make webhooks', clipflow: true, opus: false, klap: false },
]

const FAQS = [
  {
    q: 'What does BYOK mean?',
    a: 'Bring Your Own Key. You connect your own OpenAI, Anthropic, or Google AI key. Clipflow routes your content through your key — we never charge an AI markup. You pay your provider directly at cost.',
  },
  {
    q: 'How long does generation take?',
    a: 'Typically 15–30 seconds for all four platform drafts. Transcription of a 10-minute video takes ~45 seconds via Whisper.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'TikTok, Instagram Reels, YouTube Shorts, and LinkedIn. The scheduler currently supports scheduling posts directly to all four.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes — 3 content items and 10 outputs per month, forever. No credit card required to sign up.',
  },
  {
    q: 'Can I use Clipflow for client work?',
    a: 'Absolutely. The Team and Agency plans include multi-client dashboards, shareable review links, and unlimited workspaces.',
  },
  {
    q: 'What video formats are supported?',
    a: 'MP4, MOV, WebM, and AVI. You can also paste a YouTube URL, a web article URL, or type / paste a script directly.',
  },
]

function CompCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-emerald-400" />
  if (value === false) return <X className="mx-auto h-4 w-4 text-muted-foreground/30" />
  return <span className="text-xs text-muted-foreground">{value}</span>
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080809] text-[#ededed]">

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#080809]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-base font-bold tracking-tight text-transparent">
            Clipflow
          </span>
          <nav className="hidden items-center gap-6 text-sm text-white/50 sm:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#compare" className="transition-colors hover:text-white">Compare</a>
            <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-1.5 text-sm text-white/50 transition-colors hover:text-white sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-8 items-center rounded-lg bg-violet-600 px-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-all hover:bg-violet-500"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
            <div className="mt-[-80px] h-[600px] w-[900px] rounded-full bg-violet-600/10 blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-24 text-center sm:px-6 sm:pt-32">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-white/60">
              <Zap className="h-3 w-3 text-violet-400" />
              BYOK — use your own AI key, zero markup
            </div>

            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              One video.{' '}
              <span className="bg-gradient-to-br from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                Every platform.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-white/50">
              Upload a clip, paste a YouTube link, or drop a script.
              Clipflow generates platform-native drafts for TikTok, Instagram Reels,
              YouTube Shorts, and LinkedIn — with AI subtitles, B-Roll, virality scoring,
              and social scheduling. All in under a minute.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-8 text-sm font-semibold text-white shadow-xl shadow-violet-900/40 transition-all hover:bg-violet-500 hover:shadow-2xl hover:shadow-violet-800/50 sm:w-auto"
              >
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-8 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/[0.07] hover:text-white sm:w-auto"
              >
                Sign in
              </Link>
            </div>

            <p className="mt-4 text-xs text-white/30">Free forever plan · No credit card required</p>

            {/* Platform badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {[
                { name: 'TikTok', cls: 'bg-pink-500/10 text-pink-300 border-pink-500/20' },
                { name: 'Instagram Reels', cls: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
                { name: 'YouTube Shorts', cls: 'bg-red-500/10 text-red-300 border-red-500/20' },
                { name: 'LinkedIn', cls: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
              ].map((p) => (
                <span
                  key={p.name}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${p.cls}`}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>

          {/* ── Product mockup ── */}
          <div className="relative mx-auto mb-0 max-w-5xl px-4 sm:px-6">
            <div className="relative rounded-2xl border border-white/[0.07] bg-[#0e0e10] p-1 shadow-2xl shadow-black/60">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 px-3 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <span className="ml-3 h-5 flex-1 rounded-md bg-white/[0.04] text-center text-[10px] leading-5 text-white/20">
                  clipflow.to/workspace/…/outputs
                </span>
              </div>

              {/* App content */}
              <div className="rounded-xl bg-[#0a0a0b] p-5">
                {/* Top bar */}
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">My Product Demo Script</div>
                    <div className="mt-0.5 text-xs text-white/30">Outputs generated · 4 drafts ready</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                      4 / 4 generated
                    </span>
                    <button className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60">
                      Regenerate all
                    </button>
                  </div>
                </div>

                {/* Output cards grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      platform: 'TikTok',
                      color: 'border-pink-500/20 bg-pink-500/5',
                      badge: 'bg-pink-500/15 text-pink-300',
                      hook: '"POV: You\'re spending 8 hours editing one video 😭"',
                      score: 92,
                      scoreColor: 'text-emerald-400',
                    },
                    {
                      platform: 'Instagram Reels',
                      color: 'border-purple-500/20 bg-purple-500/5',
                      badge: 'bg-purple-500/15 text-purple-300',
                      hook: '"The content creation workflow that saves creators 6+ hours a week"',
                      score: 87,
                      scoreColor: 'text-emerald-400',
                    },
                    {
                      platform: 'YouTube Shorts',
                      color: 'border-red-500/20 bg-red-500/5',
                      badge: 'bg-red-500/15 text-red-300',
                      hook: '"I automated my entire content workflow (here\'s how)"',
                      score: 84,
                      scoreColor: 'text-amber-400',
                    },
                    {
                      platform: 'LinkedIn',
                      color: 'border-blue-500/20 bg-blue-500/5',
                      badge: 'bg-blue-500/15 text-blue-300',
                      hook: '"Most content creators waste 80% of their time on distribution. Here\'s what I changed:"',
                      score: 79,
                      scoreColor: 'text-amber-400',
                    },
                  ].map((card) => (
                    <div key={card.platform} className={`rounded-xl border p-4 ${card.color}`}>
                      <div className="mb-3 flex items-center justify-between">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${card.badge}`}>
                          {card.platform}
                        </span>
                        <span className={`text-xs font-bold tabular-nums ${card.scoreColor}`}>
                          {card.score}
                          <span className="text-[9px] font-normal text-white/30"> /100</span>
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-white/70 line-clamp-3">
                        {card.hook}
                      </p>
                      <div className="mt-3 flex gap-1.5">
                        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-white/40">Draft</span>
                        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-white/40">Edit</span>
                        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-white/40">Schedule</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gradient fade at bottom */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080809] to-transparent" />
          </div>
        </section>

        {/* ── Social proof ─────────────────────────────────────────── */}
        <section className="border-y border-white/[0.06] bg-white/[0.02] py-10">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <p className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-white/25">
              Trusted by creators & agencies worldwide
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  quote: '"Clipflow cut my content production time from 6 hours to 20 minutes. It\'s insane."',
                  name: 'Sarah K.',
                  role: 'Creator · 280k followers',
                },
                {
                  quote: '"Finally a tool that actually writes LinkedIn posts that don\'t sound like AI slop."',
                  name: 'Marcus T.',
                  role: 'B2B Agency Owner',
                },
                {
                  quote: '"The BYOK model alone sold me. We\'re a team of 12 — the savings add up fast."',
                  name: 'Priya M.',
                  role: 'Head of Content · Series A startup',
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5"
                >
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-white/60">{t.quote}</p>
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-white/80">{t.name}</p>
                    <p className="text-xs text-white/30">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────── */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="mb-14 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
                How it works
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                From idea to 4 platforms in 3 steps
              </h2>
            </div>
            <ol className="relative space-y-0">
              {[
                {
                  step: '01',
                  icon: Upload,
                  color: 'bg-blue-500/10 text-blue-400',
                  title: 'Add your content',
                  body: 'Upload a video file, paste a YouTube URL, share a webpage link, or type a script directly. Clipflow handles transcription automatically via Whisper AI.',
                },
                {
                  step: '02',
                  icon: Sparkles,
                  color: 'bg-violet-500/10 text-violet-400',
                  title: 'Generate drafts',
                  body: 'Click "Generate outputs." Four platform-native drafts — each tailored to its platform\'s format, hooks, and character limits — are ready in under 30 seconds.',
                },
                {
                  step: '03',
                  icon: Share2,
                  color: 'bg-emerald-500/10 text-emerald-400',
                  title: 'Review, approve & publish',
                  body: 'Edit inline, share a client review link, approve, schedule, and export. Your entire content workflow — from raw video to scheduled post — in one place.',
                },
              ].map((item, i) => (
                <li key={item.step} className="flex gap-6 pb-12 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    {i < 2 && (
                      <div className="mt-2 w-px flex-1 bg-gradient-to-b from-white/10 to-transparent" />
                    )}
                  </div>
                  <div className="pt-2">
                    <span className="text-xs font-semibold tracking-widest text-white/25">{item.step}</span>
                    <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/50">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Features grid ────────────────────────────────────────── */}
        <section id="features" className="border-t border-white/[0.06] py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mb-14 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
                Features
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything short-form content needs
              </h2>
              <p className="mt-3 text-base text-white/40">
                16 AI-powered tools. One platform. Zero markup.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.05]"
                >
                  <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.bg}`}>
                    <f.icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-white/90">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/40">{f.description}</p>
                </div>
              ))}

              {/* BYOK highlight card */}
              <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 p-6">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
                  <Zap className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="text-sm font-semibold text-violet-200">BYOK — zero AI markup</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/40">
                  Connect your own OpenAI, Anthropic, or Google key. You pay your AI provider at cost — we never charge a markup.
                </p>
                <Link
                  href="/signup"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
                >
                  Get started <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Competitor comparison ────────────────────────────────── */}
        <section id="compare" className="border-t border-white/[0.06] py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="mb-14 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
                Compare
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How Clipflow stacks up
              </h2>
              <p className="mt-3 text-base text-white/40">
                More tools. More platforms. Zero markup.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.03]">
                    <th className="px-5 py-4 text-left text-xs font-medium text-white/40">Feature</th>
                    <th className="px-5 py-4 text-center">
                      <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-xs font-bold text-transparent">
                        Clipflow
                      </span>
                    </th>
                    <th className="px-5 py-4 text-center text-xs font-medium text-white/40">OpusClip</th>
                    <th className="px-5 py-4 text-center text-xs font-medium text-white/40">Klap</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                    >
                      <td className="px-5 py-3.5 text-sm text-white/60">{row.feature}</td>
                      <td className="px-5 py-3.5 text-center">
                        <CompCell value={row.clipflow} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <CompCell value={row.opus} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <CompCell value={row.klap} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────────── */}
        <section id="pricing" className="border-t border-white/[0.06] py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mb-14 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
                Pricing
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-3 text-base text-white/40">
                Bring your own AI key — you pay your provider at cost. Zero markup, ever.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  name: 'Free',
                  price: '$0',
                  period: 'forever',
                  description: 'Try it out.',
                  features: ['3 content items / mo', '10 outputs / mo', '1 workspace', 'All 4 platforms'],
                  cta: 'Get started',
                  highlight: false,
                },
                {
                  name: 'Solo',
                  price: '$19',
                  period: '/ month',
                  description: 'For individual creators.',
                  features: ['20 content items / mo', '100 outputs / mo', '1 workspace', 'Brand voice', 'Client review links', 'Analytics'],
                  cta: 'Start free trial',
                  highlight: true,
                },
                {
                  name: 'Team',
                  price: '$49',
                  period: '/ month',
                  description: 'For content teams.',
                  features: ['100 content items / mo', '500 outputs / mo', '5 workspaces', 'Team members', 'Everything in Solo'],
                  cta: 'Start free trial',
                  highlight: false,
                },
                {
                  name: 'Agency',
                  price: '$99',
                  period: '/ month',
                  description: 'Unlimited everything.',
                  features: ['Unlimited content', 'Unlimited outputs', 'Unlimited workspaces', 'Priority support', 'Everything in Team'],
                  cta: 'Start free trial',
                  highlight: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl p-6 ${
                    plan.highlight
                      ? 'border border-violet-500/40 bg-gradient-to-b from-violet-500/10 to-violet-500/5 shadow-xl shadow-violet-900/20'
                      : 'border border-white/[0.07] bg-white/[0.03]'
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-violet-900/40">
                      Most popular
                    </span>
                  )}
                  <p className="text-sm font-semibold">{plan.name}</p>
                  <p className="mt-0.5 text-xs text-white/30">{plan.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                    <span className="text-sm text-white/30">{plan.period}</span>
                  </div>
                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-xs text-white/50">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`mt-6 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all ${
                      plan.highlight
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500'
                        : 'border border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:bg-white/[0.07] hover:text-white'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section id="faq" className="border-t border-white/[0.06] py-24">
          <div className="mx-auto max-w-2xl px-4 sm:px-6">
            <div className="mb-14 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400">
                FAQ
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Common questions
              </h2>
            </div>
            <div className="space-y-2">
              {FAQS.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] transition-all open:border-white/[0.12] open:bg-white/[0.05]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
                    <span className="text-sm font-medium text-white/80">{faq.q}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-white/30 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5">
                    <p className="text-sm leading-relaxed text-white/40">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.06] py-28">
          <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-96 rounded-full bg-violet-600/10 blur-[80px]" />
            </div>
            <div className="relative">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Stop copy-pasting.{' '}
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                  Start publishing.
                </span>
              </h2>
              <p className="mt-4 text-base text-white/40">
                Free to start. Bring your own API key — pay your AI provider directly, zero markup.
              </p>
              <Link
                href="/signup"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-violet-600 px-8 text-sm font-semibold text-white shadow-xl shadow-violet-900/40 transition-all hover:bg-violet-500 hover:shadow-2xl hover:shadow-violet-800/50"
              >
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-xs text-white/20">No credit card required · 3 content items free forever</p>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div>
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-sm font-bold text-transparent">
                Clipflow
              </span>
              <p className="mt-1 text-xs text-white/25">
                AI-powered content repurposing for creators & agencies.
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-5 text-xs text-white/25">
              <a href="#features" className="transition-colors hover:text-white/60">Features</a>
              <a href="#compare" className="transition-colors hover:text-white/60">Compare</a>
              <a href="#pricing" className="transition-colors hover:text-white/60">Pricing</a>
              <a href="#faq" className="transition-colors hover:text-white/60">FAQ</a>
              <Link href="/login" className="transition-colors hover:text-white/60">Sign in</Link>
              <Link href="/signup" className="transition-colors hover:text-white/60">Sign up</Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-white/[0.05] pt-6 text-center text-xs text-white/20">
            © {new Date().getFullYear()} Clipflow. All rights reserved.
          </div>
        </div>
      </footer>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Clipflow',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            url: 'https://clipflow.to',
            description:
              'AI-powered content repurposing platform. Upload a video, get TikTok, Instagram Reels, YouTube Shorts & LinkedIn drafts in seconds.',
            offers: [
              { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' },
              { '@type': 'Offer', price: '19', priceCurrency: 'USD', name: 'Solo' },
              { '@type': 'Offer', price: '49', priceCurrency: 'USD', name: 'Team' },
              { '@type': 'Offer', price: '99', priceCurrency: 'USD', name: 'Agency' },
            ],
          }),
        }}
      />
    </div>
  )
}
