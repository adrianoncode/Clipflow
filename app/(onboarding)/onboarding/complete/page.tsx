import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  Check,
  KeyRound,
  Sparkles,
  Upload,
  Wand2,
  CheckCircle2,
  Send,
} from 'lucide-react'

import { OnboardingStepper } from '@/components/onboarding/stepper'
import { LaunchConfetti } from '@/components/onboarding/launch-confetti'
import { getUser } from '@/lib/auth/get-user'
import { getProfile } from '@/lib/auth/get-profile'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email/send-welcome'

export const metadata = { title: 'Welcome to Clipflow' }

const PLATFORM_PREVIEWS = [
  {
    name: 'TikTok',
    tag: 'Hook-heavy 60s',
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    initial: 'T',
  },
  {
    name: 'Instagram Reels',
    tag: 'Caption-driven',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    initial: 'I',
  },
  {
    name: 'YouTube Shorts',
    tag: 'Up to 60s',
    bg: 'bg-red-100',
    text: 'text-red-700',
    initial: 'Y',
  },
  {
    name: 'LinkedIn',
    tag: 'Text-first post',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    initial: 'L',
  },
]

const FLOW_STEPS = [
  { icon: Upload, label: 'Import video' },
  { icon: Wand2, label: 'AI generates 4 drafts' },
  { icon: CheckCircle2, label: 'You review + approve' },
  { icon: Send, label: 'Publish or schedule' },
]

export default async function OnboardingCompletePage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const [profile, workspaces] = await Promise.all([getProfile(), getWorkspaces()])
  const currentWorkspace =
    workspaces.find((w) => w.type === 'personal') ?? workspaces[0] ?? null
  const aiKeys = currentWorkspace ? await getAiKeys(currentWorkspace.id) : []

  // Mark as onboarded exactly once.
  if (!profile?.onboarded_at) {
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ onboarded_at: new Date().toISOString() })
      .eq('id', user.id)

    // Welcome email — fire-and-forget, don't block the render.
    const fullName =
      typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : user.email?.split('@')[0] ?? 'there'
    sendWelcomeEmail({
      toEmail: user.email ?? '',
      userName: fullName,
    }).catch(() => {})
  }

  const firstName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name.split(' ')[0] ?? 'there'
      : user.email?.split('@')[0] ?? 'there'

  const hasAiKey = aiKeys.length > 0

  return (
    <div className="relative space-y-8">
      <LaunchConfetti />
      <OnboardingStepper activeStep={4} />

      {/* ── Hero ── */}
      <div className="space-y-3 text-center">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-xl shadow-primary/30">
            <Check className="h-8 w-8 text-primary-foreground" strokeWidth={3} />
          </div>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Step 04 — launch
        </p>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          You&apos;re in, {firstName}.
        </h1>
        <p className="mx-auto max-w-md text-base text-muted-foreground">
          Import one video — get TikTok, Reels, Shorts, and LinkedIn drafts in under a minute.
        </p>
      </div>

      {/* ── What you'll get: platform preview grid ── */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Every import produces
          </p>
          <p className="font-mono text-[10px] tabular-nums text-muted-foreground/60">~60s</p>
        </div>
        <div className="grid grid-cols-2 divide-border/40 sm:grid-cols-4 sm:divide-x">
          {PLATFORM_PREVIEWS.map((p) => (
            <div
              key={p.name}
              className="flex flex-col items-start gap-2 border-b border-border/40 p-4 last:border-b-0 sm:border-b-0"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl font-mono text-sm font-bold shadow-sm ${p.bg} ${p.text}`}
              >
                {p.initial}
              </div>
              <div>
                <p className="text-sm font-bold">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.tag}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it flows — 4 step mini-flow ── */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto rounded-2xl border border-border/50 bg-muted/20 px-4 py-3">
        {FLOW_STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={step.label} className="flex shrink-0 items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-sm">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-semibold text-foreground">{step.label}</span>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/30" aria-hidden />
              )}
            </div>
          )
        })}
      </div>

      {/* ── No-key warning ── */}
      {!hasAiKey && currentWorkspace && (
        <Link
          href="/settings/ai-keys"
          className="group flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 transition-all hover:-translate-y-px hover:border-amber-300 hover:shadow-md"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <AlertCircle className="h-4 w-4 text-amber-700" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-900">
              Add an AI key before importing
            </p>
            <p className="mt-0.5 text-xs text-amber-800/80">
              Without OpenAI / Anthropic / Google, Clipflow can&apos;t generate drafts.
              Each has free credits at signup — takes a minute.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-transform group-hover:translate-x-0.5">
            <KeyRound className="h-3 w-3" />
            Add key
          </span>
        </Link>
      )}

      {/* ── Primary CTAs — path splits based on state ── */}
      <div className="space-y-3 text-center">
        {hasAiKey ? (
          <Link
            href={
              currentWorkspace
                ? `/workspace/${currentWorkspace.id}/content/new`
                : '/dashboard'
            }
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
          >
            <Sparkles className="h-4 w-4" />
            Import your first video
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <Link
            href="/settings/ai-keys"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
          >
            <KeyRound className="h-4 w-4" />
            Add an AI key first
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
        <p>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            or explore the dashboard first →
          </Link>
        </p>
      </div>
    </div>
  )
}
