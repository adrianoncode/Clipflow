import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Gift,
  Layers,
  Mic2,
  Send,
  TrendingUp,
  Video,
  Wand2,
  X,
} from 'lucide-react'

import { PricingSection } from '@/components/landing/pricing-section'
import { FaqSection } from '@/components/landing/faq-section'
import { Reveal } from '@/components/landing/reveal'
import { SpotlightCard } from '@/components/landing/spotlight-card'
import { LogoMarquee } from '@/components/landing/logo-marquee'
import { AnimatedHeroMockup } from '@/components/landing/animated-hero-mockup'
import { SocialProofPosts } from '@/components/landing/social-proof-posts'
import { ScrollProgress } from '@/components/landing/scroll-progress'
import { AudienceTabs } from '@/components/landing/audience-tabs'
import { TrustBadges } from '@/components/landing/trust-badges'
import {
  SectionBadge,
  HairlineDivider,
  CornerTag,
  DataLabel,
} from '@/components/landing/detail-primitives'
import { normalizeReferralCode } from '@/lib/referrals/normalize-code'
import { lookupReferrerUserId } from '@/lib/referrals/lookup-referrer'
import { REFERRAL_DISCOUNT_PERCENT } from '@/lib/referrals/constants'

export const metadata: Metadata = {
  title: 'Clipflow — One video. Every platform. In 30 seconds.',
  description:
    'The AI content studio that turns one video into TikTok, Reels, Shorts and LinkedIn posts. Real MP4 rendering, auto-subtitles, B-Roll, A/B-tested hooks. BYOK — zero AI markup.',
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
      <ScrollProgress />
      {hasValidRef ? <ReferralRibbon /> : null}
      <Nav signupHref={signupHref} />
      <main>
        <Hero signupHref={signupHref} />
        <HairlineDivider />
        <PoweredBy />
        <Workflow />
        <HairlineDivider />
        <AudienceTabs signupHref={signupHref} />
        <FeaturesBento />
        <PlatformShowcase />
        <ByokHighlight signupHref={signupHref} />
        <SocialProofPosts />
        <PricingSection signupHref={signupHref} />
        <TrustBadges />
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
    <div className="flex items-center justify-center gap-2 bg-violet-600 px-4 py-2 text-center text-sm font-medium text-white">
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
            className="font-display text-xl font-semibold tracking-tight text-violet-600"
          >
            Clipflow
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
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-600/25"
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
    <section className="relative overflow-hidden bg-white px-4 pb-24 pt-16 sm:px-6 sm:pt-20 lg:pt-28">
      {/* Dot-grid texture across the whole hero — adds subtle tactile
          depth without going dark. Masked so it fades at the bottom. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-dots opacity-70"
        style={{
          maskImage:
            'radial-gradient(ellipse 100% 70% at 50% 0%, #000 40%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 100% 70% at 50% 0%, #000 40%, transparent 100%)',
        }}
      />
      {/* Soft violet wash at the top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(60% 45% at 50% 0%, rgba(124, 58, 237, 0.10), transparent 70%),
            radial-gradient(30% 35% at 15% 25%, rgba(124, 58, 237, 0.06), transparent 70%),
            radial-gradient(25% 30% at 85% 15%, rgba(124, 58, 237, 0.05), transparent 70%)
          `,
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Announcement pill */}
        <div className="flex justify-center">
          <Link
            href="#features"
            className="group inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-1.5 text-xs font-semibold text-violet-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-violet-500 animate-soft-pulse" />
            New — real MP4 rendering via Shotstack
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Headline — oversized, mix of weights, italic accent for drama */}
        <h1 className="mx-auto mt-8 max-w-5xl text-center font-display text-[46px] font-semibold leading-[0.98] tracking-[-0.045em] text-zinc-950 sm:text-[64px] md:text-[80px] lg:text-[104px]">
          One video.
          <br />
          <span className="bg-gradient-to-r from-violet-600 via-violet-500 to-violet-700 bg-clip-text italic text-transparent">
            Every platform.
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-xl text-center text-lg leading-relaxed text-zinc-600 sm:text-xl">
          Paste a YouTube link. Get TikTok, Reels, Shorts and LinkedIn drafts — with
          AI subtitles, B-Roll and A/B-tested hooks — in under 30 seconds.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={signupHref}
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-violet-600 px-7 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-600/30"
          >
            Start free — no card
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#workflow"
            className="group inline-flex h-12 items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-900 transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-md"
          >
            See how it works
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] text-zinc-500 transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </a>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3 w-3 text-violet-500" strokeWidth={3} />
            Free forever plan
          </span>
          <span className="text-zinc-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3 w-3 text-violet-500" strokeWidth={3} />
            No credit card
          </span>
          <span className="text-zinc-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3 w-3 text-violet-500" strokeWidth={3} />
            30-second signup
          </span>
        </div>

        {/* Product mockup + floating pills around it */}
        <div className="mx-auto mt-16 max-w-5xl sm:mt-20">
          <div className="relative">
            {/* Floating glass-pills — positioned off the mockup corners
                with a slow float animation. Adds the "this product
                exists" feel without being too noisy. */}
            <div
              className="glass-pill animate-float absolute -left-4 top-6 z-20 hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-800 sm:flex"
              style={{ animationDelay: '0s' }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              4 platforms in parallel
            </div>
            <div
              className="glass-pill animate-float absolute -right-4 top-24 z-20 hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-800 sm:flex"
              style={{ animationDelay: '1.5s' }}
            >
              <span className="font-mono font-bold text-violet-700">+28s</span>
              avg generation
            </div>
            <div
              className="glass-pill animate-float absolute -right-2 bottom-16 z-20 hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-800 md:flex"
              style={{ animationDelay: '3s' }}
            >
              <span className="font-mono font-bold text-violet-700">4×</span>
              platform coverage
            </div>

            <div className="conic-glow rounded-3xl p-px">
              <AnimatedHeroMockup />
            </div>
          </div>
        </div>

        {/* Stats strip — tabular, label on LEFT of number for an editorial feel */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div className="grid grid-cols-2 divide-zinc-200 border-y border-zinc-200 sm:grid-cols-4 sm:divide-x">
            {[
              { n: '30+', l: 'AI tools', s: 'in one place' },
              { n: '4', l: 'platforms', s: 'covered' },
              { n: '~30s', l: 'to generate', s: '4 drafts in parallel' },
              { n: '$0', l: 'AI markup', s: 'BYOK — pay at cost' },
            ].map((stat, i) => (
              <div
                key={stat.l}
                className={`px-4 py-6 sm:px-8 sm:py-8 ${i >= 2 ? 'border-t border-zinc-200 sm:border-t-0' : ''}`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-4xl font-semibold tracking-tight text-violet-600 sm:text-5xl">
                    {stat.n}
                  </span>
                  <span className="text-sm font-medium text-zinc-900">
                    {stat.l}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-400">{stat.s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
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
    'Replicate',
    'Stripe',
    'Resend',
  ]

  return (
    <section className="border-y border-zinc-100 bg-white py-12">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
        Powered by the best AI stack
      </p>
      <div className="mt-8">
        <LogoMarquee logos={logos} />
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
      accent: 'text-violet-500',
    },
    {
      n: '03',
      title: 'Render, then publish in one click',
      desc: 'Burn captions, render real MP4s. Then hit Publish — TikTok, Instagram, YouTube, LinkedIn go live simultaneously. Connect Upload-Post once, never copy-paste again.',
      accent: 'text-violet-600',
    },
  ]

  return (
    <section id="workflow" className="relative bg-zinc-50/60 px-6 py-24 sm:py-32">
      {/* Subtle dot-grid background that gives the section its own texture */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots-subtle" />
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <SectionBadge number="01" label="How it works" className="justify-center" />
            <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
              Three steps.{' '}
              <span className="text-zinc-400 italic">That&apos;s it.</span>
            </h2>
            <p className="mt-4 text-lg text-zinc-500">
              No settings to tune. No prompts to write. You supply one video — Clipflow handles the rest.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 120}>
              <div className="group relative h-full rounded-2xl border border-zinc-200 bg-white p-8 premium-shadow">
                {/* Big step number in the top-right corner */}
                <span className="absolute right-5 top-5 font-display text-5xl font-bold leading-none text-violet-100 transition-colors group-hover:text-violet-200">
                  {step.n}
                </span>
                <div className={`font-mono text-xs font-semibold uppercase tracking-wider ${step.accent}`}>
                  Step {step.n}
                </div>
                <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight text-zinc-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">
                  {step.desc}
                </p>
                {/* Connecting line to next step — hidden on mobile,
                    visible between cards on desktop */}
                {i < steps.length - 1 ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-4 top-1/2 hidden h-px w-4 -translate-y-1/2 bg-gradient-to-r from-violet-300 to-transparent sm:block"
                  />
                ) : null}
              </div>
            </Reveal>
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
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <SectionBadge number="03" label="The feature grid" className="justify-center" />
            <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
              30+ tools.
              <br />
              <span className="italic text-zinc-400">One subscription.</span>
            </h2>
            <p className="mt-4 text-lg text-zinc-500">
              Everything you&apos;d stitch together from five separate SaaS products — already integrated.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {/* LARGE — Video Rendering. Light violet card with corner
              tag + data labels for a non-generic "spec sheet" feel. */}
          <Reveal className="lg:col-span-2 lg:row-span-2">
            <SpotlightCard className="h-full rounded-2xl" size={700}>
              <div className="relative h-full">
                <CornerTag position="tr">CORE</CornerTag>
                <BentoCard
                  className="h-full border-violet-200 bg-gradient-to-br from-violet-50 via-white to-violet-50/30"
                  eyebrow="Real rendering"
                  title="Not just text. Real MP4s."
                  desc="Burn subtitles, stitch B-Roll with voice-over, add brand intros and outros. Cloud-rendered via Shotstack — you get downloadable files, not JSON."
                  icon={Video}
                />
                <div className="absolute bottom-8 left-10 flex flex-wrap gap-2 sm:bottom-10">
                  <DataLabel value="1080p" label="output" />
                  <DataLabel value="9:16" label="auto-reframe" />
                  <DataLabel value="~45s" label="render time" />
                </div>
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal delay={80}>
            <SpotlightCard className="h-full rounded-2xl">
              <BentoCard
                className="h-full"
                eyebrow="Speed"
                title="4 platform drafts in 30s"
                desc="TikTok, Reels, Shorts, LinkedIn — generated in parallel, not sequentially."
                icon={Layers}
              />
            </SpotlightCard>
          </Reveal>

          <Reveal delay={160}>
            <SpotlightCard className="h-full rounded-2xl">
              <BentoCard
                className="h-full"
                eyebrow="Voice"
                title="Brand voice + AI persona"
                desc="Train a persona on your own writing. Every output sounds like you."
                icon={Mic2}
              />
            </SpotlightCard>
          </Reveal>

          <Reveal delay={240}>
            <SpotlightCard className="h-full rounded-2xl">
              <BentoCard
                className="h-full"
                eyebrow="Strategy"
                title="Virality scoring"
                desc="AI rates each hook on scroll-stop power, shareability and pacing — before you publish."
                icon={TrendingUp}
              />
            </SpotlightCard>
          </Reveal>

          <Reveal delay={320}>
            <SpotlightCard className="h-full rounded-2xl">
              <BentoCard
                className="h-full"
                eyebrow="Hooks"
                title="A/B Hook Testing"
                desc="Generate three hook variants with different psychological triggers. Pick the winner before you publish."
                icon={Wand2}
              />
            </SpotlightCard>
          </Reveal>

          <Reveal delay={400}>
            <SpotlightCard className="h-full rounded-2xl">
              <BentoCard
                className="h-full border-violet-100 bg-gradient-to-br from-violet-50 to-white"
                eyebrow="Publishing"
                title="One click → all platforms"
                desc="Connect Upload-Post once. Hit Publish on any output — TikTok, Instagram Reels, YouTube Shorts and LinkedIn go live simultaneously. Your account, your followers, zero copy-paste."
                icon={Send}
              />
            </SpotlightCard>
          </Reveal>
        </div>

        {/* More-tools strip */}
        <Reveal className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 sm:p-10">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-violet-600">+ 25 more tools</p>
                <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight text-zinc-950">
                  Hashtag research, content DNA, thumbnail generator, trend radar, competitor analysis…
                </h3>
              </div>
              <Link
                href="/signup"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-700"
              >
                Browse all tools
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>
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
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border p-8 transition-all sm:p-10 ${
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
          className={`mt-2 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl ${
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
    { name: 'TikTok',          caption: 'Hook-first. Scroll-stopping. 9:16 rendered.' },
    { name: 'Instagram Reels', caption: 'Story-driven. Music-synced. Cover-ready.' },
    { name: 'YouTube Shorts',  caption: 'Retention-optimized. Pattern-interrupt hooks.' },
    { name: 'LinkedIn',        caption: 'Insight-first. Discussion-worthy. CTA baked in.' },
  ]

  return (
    <section className="relative overflow-hidden bg-zinc-50/80 px-6 py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots-subtle" />
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <SectionBadge number="04" label="Platform-native" className="justify-center" />
            <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
              One source.
              <br />
              <span className="italic text-zinc-400">Four voices.</span>
            </h2>
            <p className="mt-4 text-lg text-zinc-500">
              Every platform has its own rules. Clipflow rewrites — not just reposts — for each.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {platforms.map((p, i) => (
            <Reveal key={p.name} delay={i * 80}>
              <SpotlightCard className="rounded-2xl" size={400}>
                <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-600/5">
                  <div className="relative flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                    <span className="text-sm font-semibold text-zinc-900">{p.name}</span>
                  </div>
                  <p className="relative mt-6 font-display text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
                    {p.caption}
                  </p>
                </div>
              </SpotlightCard>
            </Reveal>
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
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white p-10 sm:p-16">
            {/* Subtle violet glow — no dark panels */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-40 blur-3xl"
              style={{
                background:
                  'radial-gradient(circle, rgba(124, 58, 237, 0.15), transparent 70%)',
              }}
            />

            <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <SectionBadge number="05" label="BYOK model" />
                <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
                  Bring your own keys.
                  <br />
                  <span className="italic text-zinc-400">Pay providers at cost.</span>
                </h2>
                <p className="mt-5 max-w-md text-lg text-zinc-600">
                  Every tool that bundles AI, rendering and voice into their price
                  marks your tokens up 5–10×. We don&apos;t. You bring 6 keys — LLM,
                  video render, avatars, voice — and each provider bills you direct.
                  We make money on workflow, not your tokens. Teams save $200–$500/mo.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] text-zinc-600 sm:max-w-md">
                  {[
                    { label: 'OpenAI / Anthropic / Google', tag: 'LLM' },
                    { label: 'Shotstack', tag: 'Render' },
                    { label: 'Replicate', tag: 'Avatars' },
                    { label: 'ElevenLabs', tag: 'Voice' },
                  ].map((svc) => (
                    <div key={svc.label} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                      <span className="truncate">{svc.label}</span>
                      <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-400">
                        {svc.tag}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 max-w-md text-sm text-zinc-500">
                  What <span className="font-semibold text-zinc-700">we</span> provide:
                  the scraper stack, creator database, workflow, and templates. That&apos;s
                  what your subscription pays for.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href={signupHref}
                    className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-violet-600/20 transition-all hover:bg-violet-700"
                  >
                    Connect your keys
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#faq"
                    className="text-sm font-medium text-violet-700 underline-offset-4 hover:underline"
                  >
                    How does BYOK work?
                  </a>
                </div>
              </div>

              {/* Cost comparison — light, with violet fill for Clipflow row */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Monthly cost · 500 outputs + 100 renders
                </p>
                <div className="mt-6 space-y-5">
                  {[
                    {
                      label: 'Typical all-in-one SaaS',
                      cost: '$399',
                      bar: 100,
                      tone: 'bg-zinc-300',
                      costTone: 'text-zinc-500',
                    },
                    {
                      label: 'Clipflow + your keys',
                      cost: '$49 + ~$35 at cost',
                      bar: 21,
                      tone: 'bg-violet-600',
                      costTone: 'text-violet-700 font-bold',
                    },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-700">{row.label}</span>
                        <span className={`font-semibold ${row.costTone}`}>{row.cost}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${row.tone}`}
                          style={{ width: `${row.bar}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-xs text-zinc-400">
                  Each provider has a free tier — new signups test every feature for $0.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
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
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-violet-800 p-10 text-white sm:p-14">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
            />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2.5">
                  <span className="font-mono text-xs font-medium text-white/60">09</span>
                  <span className="h-px w-6 bg-white/40" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Refer &amp; earn
                  </span>
                </div>
                <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                  Give {REFERRAL_DISCOUNT_PERCENT}%, get {REFERRAL_DISCOUNT_PERCENT}%.
                  <br />
                  <span className="italic text-white/80">Forever.</span>
                </h2>
                <p className="mt-5 max-w-xl text-lg text-white/90">
                  Every friend you bring in saves {REFERRAL_DISCOUNT_PERCENT}% on any paid
                  plan — and so do you, for as long as the subscription runs. No cap on
                  referrals.
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
                className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-violet-700 shadow-xl transition-all hover:bg-zinc-50"
              >
                Get your link
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>
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
    { f: 'Publish to TikTok/IG/YT/LI in one click', c: true, o: true, k: false },
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
        <Reveal>
          <div className="text-center">
            <SectionBadge number="10" label="The comparison" className="justify-center" />
            <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950 sm:text-5xl">
              More tools. Real video.{' '}
              <span className="italic text-violet-600">Zero markup.</span>
            </h2>
          </div>
        </Reveal>

        <Reveal delay={100} className="mt-14">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
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
        </Reveal>
      </div>
    </section>
  )
}

// ============================================================================
// FINAL CTA
// ============================================================================
function FinalCta({ signupHref }: { signupHref: string }) {
  return (
    <section className="relative overflow-hidden bg-white px-6 py-24 sm:py-32">
      <div className="relative mx-auto max-w-4xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-violet-50/40 px-6 py-20 text-center sm:px-10 sm:py-24">
            {/* Soft violet wash, no dark panels */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(60% 60% at 50% 100%, rgba(124, 58, 237, 0.12), transparent 70%)',
              }}
            />
            <div className="relative">
              <SectionBadge number="12" label="The ask" className="justify-center" />
              <h2 className="mt-5 font-display text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-zinc-950 sm:text-6xl md:text-7xl lg:text-8xl">
                Stop editing.
                <br />
                <span className="bg-gradient-to-r from-violet-600 via-violet-500 to-violet-700 bg-clip-text italic text-transparent">
                  Start shipping.
                </span>
              </h2>
              <p className="mx-auto mt-6 max-w-lg text-lg text-zinc-600">
                30+ AI tools. Real video rendering. Zero AI markup. Free forever plan.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={signupHref}
                  className="group inline-flex h-14 items-center gap-2 rounded-full bg-violet-600 px-8 text-base font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-600/30"
                >
                  Create free account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              <p className="mt-6 text-xs text-zinc-400">No credit card · 30-second signup</p>
            </div>
          </div>
        </Reveal>
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
        ['/cookies', 'Cookies'],
        ['/dmca', 'DMCA'],
        ['/imprint', 'Imprint'],
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
              className="font-display text-xl font-semibold tracking-tight text-violet-600"
            >
              Clipflow
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
