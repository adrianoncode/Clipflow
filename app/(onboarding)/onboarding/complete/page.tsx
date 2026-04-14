import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Check, Sparkles } from 'lucide-react'

import { OnboardingStepper } from '@/components/onboarding/stepper'
import { LaunchConfetti } from '@/components/onboarding/launch-confetti'
import { getUser } from '@/lib/auth/get-user'
import { getProfile } from '@/lib/auth/get-profile'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email/send-welcome'

export const metadata = { title: 'Welcome to Clipflow' }

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

  const checklistItems = [
    {
      label: 'Profile',
      value: user.email ?? 'Signed in',
      done: true,
    },
    {
      label: 'Workspace',
      value: currentWorkspace?.name ?? '—',
      done: Boolean(currentWorkspace),
    },
    {
      label: 'AI key',
      value: aiKeys.length > 0 ? `${aiKeys[0]?.provider ?? 'connected'}` : 'Skipped — add later',
      done: aiKeys.length > 0,
    },
  ]

  return (
    <div className="relative space-y-10">
      <LaunchConfetti />
      <OnboardingStepper activeStep={4} />

      <div className="space-y-3 text-center">
        {/* Big animated checkmark */}
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
          Workspace is ready. Let&apos;s turn your first video into four drafts.
        </p>
      </div>

      {/* Setup summary checklist — data-sheet style */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border/60 px-5 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Your setup
          </p>
        </div>
        <ul className="divide-y divide-border/50">
          {checklistItems.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-3 px-5 py-3.5"
            >
              <span
                className={
                  item.done
                    ? 'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary'
                    : 'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground/60'
                }
              >
                {item.done ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : (
                  <span className="font-mono text-[10px]">?</span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </p>
                <p className="truncate text-sm font-medium">{item.value}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Single primary CTA — no ambiguity on what to do next */}
      <div className="space-y-3 text-center">
        <Link
          href={
            currentWorkspace
              ? `/workspace/${currentWorkspace.id}/content/new`
              : '/dashboard'
          }
          className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
        >
          <Sparkles className="h-4 w-4" />
          Create your first content
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <p>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            or go to dashboard →
          </Link>
        </p>
      </div>
    </div>
  )
}
