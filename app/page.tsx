import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Gift,
  KeyRound,
  Layers,
  Mic2,
  Sparkles,
  TrendingUp,
  Video,
  Wand2,
  X,
} from 'lucide-react'

import { PricingSection } from '@/components/landing/pricing-section'
import { FaqSection } from '@/components/landing/faq-section'
import { normalizeReferralCode } from '@/lib/referrals/normalize-code'
import { lookupReferrerUserId } from '@/lib/referrals/lookup-referrer'
import { REFERRAL_DISCOUNT_PERCENT } from '@/lib/referrals/constants'

export const metadata: Metadata = {
  title: 'Clipflow — One video. Every platform. In 30 seconds.',
  description:
    'The AI content studio that turns one video into TikTok, Reels, Shorts and LinkedIn posts. Real MP4 rendering, auto-subtitles, B-Roll, virality scoring. BYOK — zero AI markup.',
  alternates: { canonical: 'https://clipflow.to' },
}

interface HomePageProps {
  searchParams: { ref?: string; source?: string }
}

// ============================================================================
// PAGE
// ============================================================================
export default async function HomePage({ searchParams }: HomePageProps) {
  const refCode = normalizeReferralCode(searchParams.ref)
  const hasValidRef = refCode ? Boolean(await lookupReferrerUserId(refCode)) : false
  const signupHref = hasValidRef
    ? `/signup?ref=${refCode}${searchParams.source ? `&source=${encodeURIComponent(searchParams.source)}` : ''}`
    : '/signup'

  return (
    <div className="bg-white font-sans antialiased">
      {hasValidRef ? <ReferralRibbon /> : null}
      <Nav signupHref={signupHref} />
      <main>
        <Hero signupHref={signupHref} />
        <PoweredBy />
        <Workflow />
        <FeaturesBento />
        <PlatformShowcase />
        <ByokHighlight signupHref={signupHref} />
        <PricingSection signupHref={signupHref} />
        <ReferralCta signupHref={signupHref} />
        <Compare />
        <FaqSection />
        <FinalCta signupHref={signupHref} />
      </main>
      <Footer />
      <StructuredData />
    </div>
  )
}

// ============================================================================
// REFERRAL RIBBON
// ============================================================================
function ReferralRibbon() {
  return (
    <div className="flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white">
      <Gift className="h-4 w-4 shrink-0" />
      <span>
        You were invited — your {REFERRAL_DISCOUNT_PERCENT}% discount applies automatically at checkout.
      </span>
    </div>
  )
}

// ============================================================================
// NAV
// ============================================================================
function Nav({ signupHref }: { signupHref: string }) {
  const links = [
    ['#features', 'Features'],
    ['#pricing', 'Pricing'],
    ['#referrals', 'Refer'],
    ['#compare', 'Compare'],
    ['#faq', 'FAQ'],
  ] as const

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-zinc-950"
          >
            Clip<span className="text-violet-600">flow</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {links.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 sm:inline-flex sm:px-4 sm:py-2"
          >
            Log in
          </Link>
          <Link
            href={signupHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20"
          >
            Start free
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  )
}

// ============================================================================
// HERO
// ============================================================================
function Hero({ signupHref }: { signupHref: string }) {
  return (
    <section className="relative overflow-hidden bg-[#07070a] px-4 pb-24 pt-20 sm:px-6 sm:pt-28 lg:pt-32">
      {/* Gradient mesh background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(60% 50% at 50% 0%, rgba(124, 58, 237, 0.35), transparent 70%),
            radial-gradient(30% 40% at 15% 40%, rgba(56, 189, 248, 0.18), transparent 70%),
            radial-gradient(30% 40% at 85% 60%, rgba(236, 72, 153, 0.16), transparent 70%)
          `,
        }}
      />
      {/* Grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(ellipse 80% 50% at 50% 0%, #000 40%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 50% at 50% 0%, #000 40%, transparent 100%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Announcement pill */}
        <div className="flex justify-center">
          <Link
            href="#features"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            Now with real MP4 rendering via Shotstack
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Headline */}
        <h1 className="mx-auto mt-8 max-w-5xl text-center text-[44px] font-semibold leading-[1.04] tracking-[-0.035em] text-white sm:text-6xl md:text-7xl lg:text-[88px]">
          One video.
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-500 bg-clip-text text-transparent">
            Every platform.
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-xl text-center text-lg leading-relaxed text-white/60 sm:text-xl">
          Paste a YouTube link. Get TikTok, Reels, Shorts and LinkedIn drafts — with AI
          subtitles, B-Roll and virality scoring — in under 30 seconds.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={signupHref}
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-zinc-950 shadow-[0_10px_40px_-10px_rgba(255,255,255,0.3)] transition-all hover:shadow-[0_10px_40px_-5px_rgba(255,255,255,0.5)]"
          >
            Start free — no card
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#workflow"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-6 text-sm font-medium text-white/90 transition-all hover:border-white/30 hover:bg-white/5"
          >
            See how it works
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Free forever · 3 content items/mo · all AI tools included
        </p>

        {/* Product mockup */}
        <div className="mx-auto mt-16 max-w-5xl sm:mt-20">
          <HeroMockup />
        </div>
      </div>
    </section>
  )
}

function HeroMockup() {
  const outputs = [
    {
      platform: 'TikTok',
      score: 94,
      hook: '"POV: You spend 8 hours editing one video 😭"',
      accent: 'from-pink-500/20 to-pink-500/5',
      border: 'border-pink-500/20',
      text: 'text-pink-300',
    },
    {
      platform: 'Reels',
      score: 89,
      hook: '"The workflow saving creators 6+ hours a week"',
      accent: 'from-fuchsia-500/20 to-fuchsia-500/5',
      border: 'border-fuchsia-500/20',
      text: 'text-fuchsia-300',
    },
    {
      platform: 'YouTube Shorts',
      score: 85,
      hook: '"I automated my entire content pipeline"',
      accent: 'from-red-500/20 to-red-500/5',
      border: 'border-red-500/20',
      text: 'text-red-300',
    },
    {
      platform: 'LinkedIn',
      score: 81,
      hook: '"80% of creators waste time on distribution"',
      accent: 'from-sky-500/20 to-sky-500/5',
      border: 'border-sky-500/20',
      text: 'text-sky-300',
    },
  ]

  return (
    <div className="relative">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute -inset-x-20 -inset-y-10 rounded-[48px] opacity-60 blur-3xl"
        style={{
          background:
            'linear-gradient(90deg, rgba(124, 58, 237, 0.3), rgba(236, 72, 153, 0.2))',
        }}
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        {/* Window chrome */}
        <div className="flex h-10 items-center border-b border-white/5 bg-zinc-900/80 px-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto flex h-6 w-60 items-center justify-center gap-1.5 rounded-md bg-white/5 text-xs text-white/30">
            clipflow.to / workspace
          </div>
        </div>

        <div className="flex min-h-[340px]">
          {/* Sidebar */}
          <div className="hidden w-40 shrink-0 border-r border-white/5 bg-[#0b0b10] p-3 sm:block">
            {[
              ['◉', 'Dashboard'],
              ['≡', 'Pipeline'],
              ['◷', 'Calendar'],
              ['✎', 'Ghostwriter'],
              ['✶', 'All Tools', true],
              ['▲', 'Trends'],
              ['◢', 'Creators'],
            ].map(([icon, label, active]) => (
              <div
                key={String(label)}
                className={`mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs ${
                  active
                    ? 'bg-violet-500/10 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <span className={active ? 'text-violet-400' : 'text-white/30'}>
                  {icon}
                </span>
                {label}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 bg-gradient-to-br from-[#0b0b10] to-[#07070a] p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Product-Demo.mp4</p>
                <p className="mt-1 text-xs text-white/40">
                  4 drafts · 24s · gpt-4o · generated in 28s
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Ready
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {outputs.map((o) => (
                <div
                  key={o.platform}
                  className={`rounded-lg border ${o.border} bg-gradient-to-br ${o.accent} p-3`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full border ${o.border} bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${o.text}`}>
                      {o.platform}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        o.score > 88 ? 'text-emerald-300' : 'text-amber-300'
                      }`}
                    >
                      {o.score}
                      <span className="text-[9px] font-medium text-white/30">/100</span>
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-snug text-white/70">{o.hook}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// POWERED BY (logos strip)
// ============================================================================
function PoweredBy() {
  const logos = [
    'OpenAI',
    'Anthropic',
    'Google Gemini',
    'ElevenLabs',
    'Shotstack',
    'Pexels',
    'Whisper',
  ]

  return (
    <section className="border-y border-zinc-100 bg-white px-6 py-12">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
        Powered by the best AI stack
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
        {logos.map((logo) => (
          <span
            key={logo}
            className="text-base font-bold tracking-tight text-zinc-400 transition-colors hover:text-zinc-700 sm:text-lg"
          >
            {logo}
          </span>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// HOW IT WORKS
// ============================================================================
function Workflow() {
  const steps = [
    {
      n: '01',
      title: 'Paste or upload',
      desc: 'Drop a YouTube URL, upload a video, or paste a transcript. Works with any source, any length.',
      accent: 'text-violet-600',
    },
    {
      n: '02',
      title: 'AI drafts for every platform',
      desc: 'TikTok, Reels, Shorts and LinkedIn — all in parallel. Brand voice, persona and tone applied automatically.',
      accent: 'text-fuchsia-600',
    },
    {
      n: '03',
      title: 'Render, schedule, publish',
      desc: 'Burn captions, add B-Roll, render real MP4s. Schedule or download — one source, everywhere.',
      accent: 'text-emerald-600',
    },
  ]

  return (
    <section id="workflow" className="bg-zinc-50 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
            How it works
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
            Three steps. That&apos;s it.
          </h2>
          <p className="mt-4 text-lg text-zinc-500">
            No settings to tune. No prompts to write. You supply one video — Clipflow handles the rest.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-zinc-200 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.n}
              className="bg-white p-10 transition-colors hover:bg-zinc-50/50"
            >
              <div
                className={`text-sm font-mono font-semibold ${step.accent}`}
              >
                {step.n}
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-950">
                {step.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FEATURES BENTO
// ============================================================================
function FeaturesBento() {
  return (
    <section id="features" className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
            Features
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
            30+ tools.
            <br />
            One subscription.
          </h2>
          <p className="mt-4 text-lg text-zinc-500">
            Everything you&apos;d stitch together from five separate SaaS products — already integrated.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {/* LARGE — Video Rendering */}
          <BentoCard
            className="lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-violet-600 via-violet-700 to-fuchsia-700 text-white"
            eyebrow="Core"
            title="Real video rendering"
            desc="Not just text outputs. Burn subtitles, stitch B-Roll with voice-over, add brand intros and outros. Real MP4s, cloud-rendered via Shotstack."
            icon={Video}
            variant="dark"
          />

          <BentoCard
            eyebrow="Speed"
            title="4 platform drafts in 30s"
            desc="TikTok, Reels, Shorts, LinkedIn — generated in parallel, not sequentially."
            icon={Layers}
          />

          <BentoCard
            eyebrow="Voice"
            title="Brand voice + AI persona"
            desc="Train a persona on your own writing. Every output sounds like you."
            icon={Mic2}
          />

          <BentoCard
            eyebrow="Strategy"
            title="Virality scoring"
            desc="AI rates each hook on scroll-stop power, shareability and pacing — before you publish."
            icon={TrendingUp}
          />

          <BentoCard
            eyebrow="Creation"
            title="AI Ghostwriter"
            desc="Topic → full script with hooks, CTA and platform variants. Zero prompt writing."
            icon={Wand2}
          />
        </div>

        {/* More-tools strip */}
        <div className="mt-4 overflow-hidden rounded-2xl bg-zinc-950 p-8 text-white sm:p-10">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-violet-400">+ 25 more tools</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight">
                Hashtag research, content DNA, thumbnail generator, trend radar, competitor analysis…
              </h3>
            </div>
            <Link
              href="/signup"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-100"
            >
              Browse all tools
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function BentoCard({
  className = '',
  eyebrow,
  title,
  desc,
  icon: Icon,
  variant = 'light',
}: {
  className?: string
  eyebrow: string
  title: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  variant?: 'light' | 'dark'
}) {
  const isDark = variant === 'dark'
  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-8 transition-all sm:p-10 ${
        isDark
          ? 'border-white/10 shadow-2xl shadow-violet-500/10'
          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-lg'
      } ${className}`}
    >
      <div>
        <div
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
            isDark ? 'bg-white/10' : 'bg-violet-50'
          }`}
        >
          <Icon className={`h-5 w-5 ${isDark ? 'text-white' : 'text-violet-600'}`} />
        </div>
        <p
          className={`mt-6 text-xs font-semibold uppercase tracking-wider ${
            isDark ? 'text-white/60' : 'text-violet-600'
          }`}
        >
          {eyebrow}
        </p>
        <h3
          className={`mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl ${
            isDark ? 'text-white' : 'text-zinc-950'
          }`}
        >
          {title}
        </h3>
        <p
          className={`mt-3 text-[15px] leading-relaxed ${
            isDark ? 'text-white/70' : 'text-zinc-600'
          }`}
        >
          {desc}
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// PLATFORM SHOWCASE
// ============================================================================
function PlatformShowcase() {
  const platforms = [
    {
      name: 'TikTok',
      hue: 'from-pink-500 to-fuchsia-500',
      swatch: 'bg-pink-500',
      caption: 'Hook-first. Scroll-stopping. 9:16 rendered.',
    },
    {
      name: 'Instagram Reels',
      hue: 'from-fuchsia-500 to-violet-500',
      swatch: 'bg-fuchsia-500',
      caption: 'Story-driven. Music-synced. Cover-ready.',
    },
    {
      name: 'YouTube Shorts',
      hue: 'from-red-500 to-orange-500',
      swatch: 'bg-red-500',
      caption: 'Retention-optimized. Pattern-interrupt hooks.',
    },
    {
      name: 'LinkedIn',
      hue: 'from-sky-500 to-blue-500',
      swatch: 'bg-sky-500',
      caption: 'Insight-first. Discussion-worthy. CTA baked in.',
    },
  ]

  return (
    <section className="relative overflow-hidden bg-[#07070a] px-6 py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(50% 50% at 50% 50%, rgba(124, 58, 237, 0.25), transparent 70%)',
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
            Platform-native, not lowest-common-denominator
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
            One source.
            <br />
            <span className="text-white/60">Four voices.</span>
          </h2>
          <p className="mt-4 text-lg text-white/60">
            Every platform has its own rules. Clipflow rewrites — not just reposts — for each.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {platforms.map((p) => (
            <div
              key={p.name}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div
                aria-hidden
                className={`absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${p.hue} opacity-20 blur-3xl transition-opacity group-hover:opacity-40`}
              />
              <div className="relative flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${p.swatch}`} />
                <span className="text-sm font-semibold text-white">{p.name}</span>
              </div>
              <p className="relative mt-6 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {p.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// BYOK HIGHLIGHT
// ============================================================================
function ByokHighlight({ signupHref }: { signupHref: string }) {
  return (
    <section className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-violet-950 p-10 sm:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #ec4899, transparent 70%)' }}
          />

          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white">
                <KeyRound className="h-3.5 w-3.5" />
                BYOK
              </div>
              <h2 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl">
                Bring your own key.
                <br />
                <span className="text-white/60">Pay AI at cost.</span>
              </h2>
              <p className="mt-5 max-w-md text-lg text-white/70">
                Every tool that bakes AI into their subscription makes money on your tokens. We
                don&apos;t. Connect your OpenAI, Anthropic or Google key — all AI calls run through your
                account at provider cost. Teams save $200–$500/month.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={signupHref}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-100"
                >
                  Connect your key
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#faq"
                  className="text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
                >
                  How does BYOK work?
                </a>
              </div>
            </div>

            {/* Cost comparison */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Monthly AI cost · 500 outputs / mo
              </p>
              <div className="mt-6 space-y-4">
                {[
                  { label: 'Typical "AI included" tool', cost: '$247', bar: 100, tone: 'bg-red-500/80' },
                  { label: 'Clipflow + your API key', cost: '$18', bar: 14, tone: 'bg-emerald-500' },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/80">{row.label}</span>
                      <span className="font-semibold text-white">{row.cost}</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full ${row.tone}`}
                        style={{ width: `${row.bar}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-white/40">
                Based on gpt-4o-mini at $0.15/1M input tokens.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// REFERRAL CTA
// ============================================================================
function ReferralCta({ signupHref }: { signupHref: string }) {
  return (
    <section id="referrals" className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-10 text-white sm:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                <Gift className="h-3.5 w-3.5" />
                Refer &amp; earn
              </div>
              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
                Give {REFERRAL_DISCOUNT_PERCENT}%, get {REFERRAL_DISCOUNT_PERCENT}%.
                <br />
                <span className="text-white/80">Forever.</span>
              </h2>
              <p className="mt-5 max-w-xl text-lg text-white/90">
                Every friend you bring in saves {REFERRAL_DISCOUNT_PERCENT}% on any paid plan — and
                so do you, for as long as the subscription runs. No cap on referrals.
              </p>
              <div className="mt-6 flex flex-wrap gap-6 text-sm font-medium text-white/90">
                {['No cap on referrals', 'Stacks across plans', 'Applies forever'].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <Link
              href={signupHref}
              className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-emerald-700 shadow-xl transition-all hover:bg-zinc-50"
            >
              Get your link
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// COMPARE
// ============================================================================
function Compare() {
  const rows = [
    { f: 'All 4 platform drafts in parallel', c: true, o: false, k: false },
    { f: 'Burn captions onto video', c: true, o: true, k: true },
    { f: 'Brand voice + AI persona', c: true, o: false, k: false },
    { f: 'Virality scoring', c: true, o: true, k: false },
    { f: 'AI B-Roll assembly', c: true, o: 'Beta', k: false },
    { f: 'Content DNA analyzer', c: true, o: false, k: false },
    { f: '30-day content calendar', c: true, o: false, k: false },
    { f: 'Creator search (5 platforms)', c: true, o: false, k: false },
    { f: 'BYOK — zero AI markup', c: true, o: false, k: false },
  ]

  return (
    <section id="compare" className="bg-zinc-50 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
            The comparison
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            More tools. Real video. Zero markup.
          </h2>
        </div>

        <div className="mt-14 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/60">
                  <th className="px-6 py-4 text-left text-sm font-medium text-zinc-500">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-violet-600">
                    Clipflow
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-zinc-400">
                    OpusClip
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-zinc-400">
                    Klap
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.f}
                    className={i < rows.length - 1 ? 'border-b border-zinc-100' : ''}
                  >
                    <td className="px-6 py-3.5 text-sm text-zinc-700">{r.f}</td>
                    {[r.c, r.o, r.k].map((v, j) => (
                      <td key={j} className="px-6 py-3.5 text-center">
                        {v === true ? (
                          <Check className="mx-auto h-4 w-4 text-violet-600" strokeWidth={3} />
                        ) : v === false ? (
                          <X className="mx-auto h-4 w-4 text-zinc-300" />
                        ) : (
                          <span className="text-xs font-medium text-zinc-500">{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FINAL CTA
// ============================================================================
function FinalCta({ signupHref }: { signupHref: string }) {
  return (
    <section className="relative overflow-hidden bg-[#07070a] px-6 py-32 sm:py-40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(60% 60% at 50% 100%, rgba(124, 58, 237, 0.4), transparent 70%),
            radial-gradient(30% 40% at 20% 20%, rgba(56, 189, 248, 0.15), transparent 70%)
          `,
        }}
      />
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          Built for creators who ship, not tinker
        </div>
        <h2 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
          Stop editing.
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-500 bg-clip-text text-transparent">
            Start shipping.
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-lg text-white/60">
          30+ AI tools. Real video rendering. Zero AI markup. Free forever plan.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={signupHref}
            className="group inline-flex h-14 items-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-zinc-950 shadow-[0_10px_40px_-10px_rgba(255,255,255,0.4)] transition-all hover:shadow-[0_10px_40px_-5px_rgba(255,255,255,0.6)]"
          >
            Create free account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <p className="mt-6 text-xs text-white/40">No credit card · 30-second signup</p>
      </div>
    </section>
  )
}

// ============================================================================
// FOOTER
// ============================================================================
function Footer() {
  const cols: Array<{ h: string; links: Array<[string, string]> }> = [
    {
      h: 'Product',
      links: [
        ['#features', 'Features'],
        ['#pricing', 'Pricing'],
        ['#compare', 'Compare'],
        ['#referrals', 'Refer & earn'],
        ['/changelog', 'Changelog'],
      ],
    },
    {
      h: 'Account',
      links: [
        ['/login', 'Log in'],
        ['/signup', 'Sign up'],
      ],
    },
    {
      h: 'Legal',
      links: [
        ['/privacy', 'Privacy'],
        ['/terms', 'Terms'],
      ],
    },
  ]

  return (
    <footer className="bg-white px-6 pt-20 pb-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 pb-14 lg:grid-cols-[2fr_3fr]">
          <div>
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-zinc-950"
            >
              Clip<span className="text-violet-600">flow</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              AI content repurposing with real MP4 rendering. One video, every platform, zero markup.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {cols.map((col) => (
              <div key={col.h}>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
                  {col.h}
                </p>
                <ul className="mt-4 space-y-3">
                  {col.links.map(([href, label]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-zinc-100 pt-8 text-xs text-zinc-400 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Clipflow. All rights reserved.</p>
          <p>Made for indie creators and teams that ship.</p>
        </div>
      </div>
    </footer>
  )
}

// ============================================================================
// JSON-LD
// ============================================================================
function StructuredData() {
  return (
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
          offers: [
            { price: '0', name: 'Free' },
            { price: '19', name: 'Solo' },
            { price: '49', name: 'Team' },
            { price: '99', name: 'Agency' },
          ].map((o) => ({ '@type': 'Offer', priceCurrency: 'USD', ...o })),
        }),
      }}
    />
  )
}
