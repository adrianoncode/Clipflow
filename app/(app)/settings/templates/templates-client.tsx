'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { ChevronDown, Loader2, Plus, Sparkles, Wand2, X } from 'lucide-react'

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
  {
    value: 'tiktok',
    label: 'TikTok',
    Logo: TikTokLogo,
    tileBg: 'linear-gradient(140deg, #1F1F1F 0%, #050505 100%)',
  },
  {
    value: 'instagram_reels',
    label: 'Instagram Reels',
    Logo: InstagramLogo,
    tileBg:
      'linear-gradient(135deg, #FEDA77 0%, #F58529 30%, #DD2A7B 65%, #8134AF 100%)',
  },
  {
    value: 'youtube_shorts',
    label: 'YouTube Shorts',
    Logo: YouTubeLogo,
    tileBg: 'linear-gradient(140deg, #FF3B30 0%, #C40000 100%)',
  },
  {
    value: 'linkedin',
    label: 'LinkedIn',
    Logo: LinkedInLogo,
    tileBg: 'linear-gradient(140deg, #0A66C2 0%, #074C8E 100%)',
  },
  { value: 'custom', label: 'Custom', Logo: null, tileBg: 'linear-gradient(140deg, #2A1A3D 0%, #4A2A6E 100%)' },
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
      className="cf-btn-3d cf-btn-3d-primary inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-[13px] disabled:opacity-50"
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
    <div className="space-y-3">
      {/* "+ New template" lives next to the parent SectionHeader title;
          the parent already names this section "Your overrides" so the
          internal sub-header that used to live here was redundant. */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/70 bg-background px-3 text-[12.5px] font-bold tracking-tight text-foreground transition-all hover:-translate-y-px hover:border-foreground/30 hover:shadow-sm"
          style={{
            fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
          }}
        >
          {showForm ? (
            <>
              <X className="h-3.5 w-3.5" />
              Close
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              New template
            </>
          )}
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <form
          action={(fd) => formAction(fd)}
          className="relative space-y-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-5 sm:p-6"
          style={{
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(42,26,61,0.04), 0 12px 28px -20px rgba(42,26,61,0.20)',
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          />
          <input type="hidden" name="workspace_id" value={workspaceId} />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Template name">
              <input
                name="name"
                required
                maxLength={100}
                placeholder="e.g. Educational TikTok"
                className="w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </Field>

            <Field label="Platform">
              <div className="relative">
                <select
                  name="platform"
                  required
                  defaultValue="tiktok"
                  className="w-full appearance-none rounded-xl border border-border/70 bg-background px-3 py-2.5 pr-9 text-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                >
                  {PLATFORM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              </div>
            </Field>
          </div>

          <Field
            label="System prompt"
            hint="Tells the AI how to format and tone this output."
          >
            <textarea
              name="system_prompt"
              required
              rows={5}
              placeholder="Describe the format and tone the AI should use when generating outputs…"
              className="w-full resize-y rounded-xl border border-border/70 bg-background px-3 py-2.5 font-mono text-[12.5px] leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </Field>

          <Field
            label="Structure hint"
            hint="Optional one-liner — applied as a soft guide."
          >
            <input
              name="structure_hint"
              maxLength={300}
              placeholder="Hook → Value → CTA"
              className="w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 font-mono text-[12.5px] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </Field>

          {state.ok === false && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3 py-2 text-[12px] font-semibold text-destructive">
              {state.error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border/55 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex h-10 items-center rounded-xl border border-border/70 bg-background px-3.5 text-[13px] font-semibold tracking-tight text-foreground transition-colors hover:bg-muted/40"
              style={{
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }}
            >
              Cancel
            </button>
            <SubmitBtn />
          </div>
        </form>
      )}

      {/* List or empty */}
      {templates.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {templates.map((t) => {
            const opt = platformOption(t.platform)
            const Logo = opt.Logo
            return (
              <div
                key={t.id}
                className="group relative flex items-start gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-px hover:border-border"
                style={{
                  boxShadow:
                    '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(42,26,61,0.04), 0 10px 24px -20px rgba(42,26,61,0.20)',
                }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
                />
                <span
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
                  style={{
                    background: opt.tileBg,
                    boxShadow:
                      '0 1px 0 rgba(255,255,255,0.18) inset, 0 6px 14px -6px rgba(42,26,61,0.30)',
                  }}
                  aria-hidden
                >
                  <span
                    className="pointer-events-none absolute inset-1 rounded-[10px]"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 50%)',
                    }}
                  />
                  {Logo ? (
                    <Logo size={18} />
                  ) : (
                    <Wand2 className="h-4 w-4" strokeWidth={1.85} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className="text-[14px] font-bold tracking-tight text-foreground"
                      style={{
                        fontFamily:
                          'var(--font-inter-tight), var(--font-inter), sans-serif',
                      }}
                    >
                      {t.name}
                    </p>
                    <span
                      className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10.5px] font-medium tracking-tight text-muted-foreground"
                      style={{
                        fontFamily:
                          'var(--font-inter-tight), var(--font-inter), sans-serif',
                      }}
                    >
                      {opt.label}
                    </span>
                  </div>
                  {t.structure_hint ? (
                    <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] tracking-tight text-foreground/85">
                      {t.structure_hint
                        .split(/\s*(?:→|->|\|)\s*/)
                        .map((step, i, arr) => (
                          <span key={i} className="inline-flex items-center gap-1.5">
                            <span
                              className="font-semibold"
                              style={{
                                fontFamily:
                                  'var(--font-inter-tight), var(--font-inter), sans-serif',
                              }}
                            >
                              {step}
                            </span>
                            {i < arr.length - 1 ? (
                              <span
                                aria-hidden
                                className="text-[11px] font-bold text-primary/55"
                              >
                                →
                              </span>
                            ) : null}
                          </span>
                        ))}
                    </div>
                  ) : null}
                  <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                    {t.system_prompt}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card px-6 py-10 text-center"
      style={{
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(42,26,61,0.04), 0 10px 24px -16px rgba(42,26,61,0.18)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-12 h-32 w-32 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(42,26,61,0.14) 0%, rgba(42,26,61,0) 60%)',
        }}
      />
      <span
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
        style={{
          background:
            'linear-gradient(140deg, #2A1A3D 0%, #120920 60%, #2A1A3D 100%)',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 18px -8px rgba(42,26,61,0.55)',
        }}
        aria-hidden
      >
        <span
          className="pointer-events-none absolute inset-1 rounded-[10px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)',
          }}
        />
        <Wand2 className="relative h-5 w-5" strokeWidth={1.7} />
      </span>
      <div className="relative max-w-md space-y-1">
        <p
          className="text-[15px] font-bold tracking-tight text-foreground"
          style={{
            fontFamily:
              'var(--font-inter-tight), var(--font-inter), sans-serif',
          }}
        >
          Defaults handle most cases.
        </p>
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          The platform templates plus your active niche cover almost every
          draft. Add a custom override only when you need a specific format
          the AI must follow.
        </p>
      </div>
    </div>
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
      <span
        className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85"
        style={{
          fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
        }}
      >
        <span aria-hidden className="inline-block h-px w-3.5 bg-primary/40" />
        {label}
      </span>
      <div className="mt-2">{children}</div>
      {hint ? (
        <span className="mt-1.5 block text-[11.5px] leading-relaxed text-muted-foreground/85">
          {hint}
        </span>
      ) : null}
    </label>
  )
}
