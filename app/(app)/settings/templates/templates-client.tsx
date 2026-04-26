'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { ChevronDown, Loader2, Plus, Sparkles, X } from 'lucide-react'

import { saveTemplateAction } from './actions'
import type { SaveTemplateState } from './actions'
import type { OutputTemplate } from '@/lib/templates/get-templates'
import {
  InstagramLogo,
  LinkedInLogo,
  TikTokLogo,
  YouTubeLogo,
} from '@/components/brand-logos'

interface TemplatesClientProps {
  workspaceId: string
  templates: OutputTemplate[]
}

interface PlatformOption {
  value: string
  label: string
  Logo: ((p: { size?: number; className?: string }) => ReactNode) | null
  tileBg: string
}

const PLATFORM_OPTIONS: PlatformOption[] = [
  { value: 'tiktok', label: 'TikTok', Logo: TikTokLogo, tileBg: 'bg-black' },
  {
    value: 'instagram_reels',
    label: 'Instagram Reels',
    Logo: InstagramLogo,
    tileBg: 'bg-gradient-to-br from-[#FEDA77] via-[#F58529] via-[#DD2A7B] to-[#8134AF]',
  },
  { value: 'youtube_shorts', label: 'YouTube Shorts', Logo: YouTubeLogo, tileBg: 'bg-[#FF0000]' },
  { value: 'linkedin', label: 'LinkedIn', Logo: LinkedInLogo, tileBg: 'bg-[#0A66C2]' },
  { value: 'custom', label: 'Custom', Logo: null, tileBg: 'bg-muted' },
]

function platformOption(value: string): PlatformOption {
  return PLATFORM_OPTIONS.find((p) => p.value === value) ?? PLATFORM_OPTIONS[PLATFORM_OPTIONS.length - 1]!
}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-px hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5" />
          Save template
        </>
      )}
    </button>
  )
}

export function TemplatesClient({ workspaceId, templates }: TemplatesClientProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [state, formAction] = useFormState<SaveTemplateState, FormData>(saveTemplateAction, {})

  useEffect(() => {
    if (state.ok === true) {
      router.refresh()
      setShowForm(false)
    }
  }, [state, router])

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="text-primary">03</span> · Custom templates
          <span className="ml-2 font-medium normal-case tracking-normal text-muted-foreground/70">
            {templates.length === 0
              ? 'none yet — defaults handle most cases'
              : `${templates.length} saved`}
          </span>
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-background px-2.5 text-[12px] font-bold text-foreground transition-all hover:-translate-y-px hover:border-border hover:shadow-sm"
        >
          {showForm ? (
            <>
              <X className="h-3 w-3" />
              Close
            </>
          ) : (
            <>
              <Plus className="h-3 w-3" />
              New template
            </>
          )}
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <form
          action={(fd) => formAction(fd)}
          className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm shadow-primary/[0.02] sm:p-5"
        >
          <input type="hidden" name="workspace_id" value={workspaceId} />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Template name">
              <input
                name="name"
                required
                maxLength={100}
                placeholder="e.g. Educational TikTok"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>

            <Field label="Platform">
              <div className="relative">
                <select
                  name="platform"
                  required
                  defaultValue="tiktok"
                  className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-9 text-[14px] focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {PLATFORM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              </div>
            </Field>
          </div>

          <Field label="System prompt" hint="Tells the AI how to format and tone this output.">
            <textarea
              name="system_prompt"
              required
              rows={5}
              placeholder="Describe the format and tone the AI should use when generating outputs…"
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-mono text-[13px] leading-relaxed focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field label="Structure hint" hint="Optional one-liner — applied as a soft guide.">
            <input
              name="structure_hint"
              maxLength={300}
              placeholder="Hook → Value → CTA"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-[13px] focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          {state.ok === false && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {state.error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex h-9 items-center rounded-lg border border-border/70 bg-background px-3 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted/40"
            >
              Cancel
            </button>
            <SubmitBtn />
          </div>
        </form>
      )}

      {/* List */}
      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-10 text-center">
          <p className="text-[13px] font-semibold text-foreground">No custom templates yet.</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            The platform defaults + your active niche handle most cases. Add a custom template only when you want a specific format the AI must follow.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => {
            const opt = platformOption(t.platform)
            const Logo = opt.Logo
            return (
              <div
                key={t.id}
                className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-px hover:border-border hover:shadow-md hover:shadow-primary/[0.04]"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${opt.tileBg}`}
                  aria-hidden
                >
                  {Logo ? <Logo size={18} /> : (
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-foreground">
                      {t.platform.slice(0, 3)}
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-[13.5px] font-bold text-foreground">{t.name}</p>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                      {opt.label}
                    </span>
                  </div>
                  {t.structure_hint ? (
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {t.structure_hint}
                    </p>
                  ) : null}
                  <p className="mt-2 line-clamp-2 font-mono text-[11.5px] leading-relaxed text-foreground/70">
                    {t.system_prompt}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint ? (
        <span className="mt-1 block text-[11px] text-muted-foreground/80">{hint}</span>
      ) : null}
    </label>
  )
}
