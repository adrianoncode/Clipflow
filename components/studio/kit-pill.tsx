'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import { ChevronRight, Loader2, Palette, Pencil, Sparkles, Upload } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { saveBrandKitAction, uploadBrandLogoAction } from '@/app/(app)/settings/brand-kit/actions'
import { FONT_CHOICES, type BrandKit } from '@/lib/brand-kit/types'

interface KitPillProps {
  workspaceId: string
  kit: BrandKit | null
}

const COLOR_PRESETS = ['#2A1A3D', '#0F172A', '#FF0000', '#0A66C2', '#16A34A', '#F97316', '#DB2777']

function SubmitKitButton() {
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
          Save kit
        </>
      )}
    </button>
  )
}

export function KitPill({ workspaceId, kit }: KitPillProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [accent, setAccent] = useState(kit?.accentColor ?? '#2A1A3D')
  const [logoUrl, setLogoUrl] = useState(kit?.logoUrl ?? '')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoErr, setLogoErr] = useState<string | null>(null)
  const [state, formAction] = useFormState(saveBrandKitAction, {})

  useEffect(() => {
    if (state.ok === true) {
      router.refresh()
      setOpen(false)
    }
  }, [state, router])

  const hasKit = kit && (kit.logoUrl || kit.accentColor || kit.introText)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    setLogoErr(null)
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadBrandLogoAction(workspaceId, fd)
    setLogoUploading(false)
    if (res.ok) {
      setLogoUrl(res.url)
    } else {
      setLogoErr(res.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative flex flex-col gap-2.5 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm shadow-primary/[0.02] transition-all hover:-translate-y-px hover:border-border hover:shadow-md hover:shadow-primary/[0.04]"
        >
          <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Palette className="h-3.5 w-3.5" />
          </span>

          <div className="pr-8">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
              Kit
            </p>
            <p className="mt-1 text-[14px] font-bold text-foreground">
              {hasKit ? 'Brand kit applied' : 'Set up your kit'}
            </p>
          </div>

          {hasKit ? (
            <div className="flex items-center gap-2">
              {kit?.logoUrl ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-background">
                  <Image
                    src={kit.logoUrl}
                    alt="Logo"
                    width={32}
                    height={32}
                    unoptimized
                    className="h-full w-full object-contain"
                  />
                </span>
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-dashed border-border/60 text-[10px] text-muted-foreground/60">
                  No logo
                </span>
              )}
              <span
                className="h-8 w-8 shrink-0 rounded-md ring-1 ring-border/60"
                style={{ background: kit?.accentColor ?? '#2A1A3D' }}
                aria-label="Accent color"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {kit?.fontFamily ?? 'Inter'} · {kit?.accentColor ?? '#2A1A3D'}
                </p>
                {kit?.introText ? (
                  <p className="truncate text-[11.5px] text-muted-foreground">
                    Intro: {kit.introText}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-[12px] leading-snug text-muted-foreground">
              Logo, accent color, font, intro/outro text — used on rendered videos.
            </p>
          )}

          <span className="mt-auto inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70 group-hover:text-primary">
            <Pencil className="h-2.5 w-2.5" />
            {hasKit ? 'Edit inline' : 'Set up'}
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[18px]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Palette className="h-4 w-4" />
            </span>
            Brand kit
          </DialogTitle>
          <DialogDescription className="text-[12.5px]">
            Logo, accent color, font, and intro/outro — applied to every rendered video.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="logo_url" value={logoUrl} />

          {/* Logo */}
          <Field label="Logo" hint="PNG with transparent background works best.">
            <div className="flex items-center gap-3">
              <label className="group relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 transition-colors hover:border-primary/40 hover:bg-muted/50">
                {logoUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    width={56}
                    height={56}
                    unoptimized
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Upload className="h-4 w-4 text-muted-foreground/60 transition-colors group-hover:text-primary" />
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
              <div className="flex flex-col gap-1 text-[11.5px]">
                <span className="text-foreground">
                  {logoUrl ? 'Logo uploaded' : 'Click to upload'}
                </span>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="self-start text-destructive underline-offset-2 hover:underline"
                  >
                    Remove
                  </button>
                )}
                {logoErr && (
                  <span className="text-destructive">{logoErr}</span>
                )}
              </div>
            </div>
          </Field>

          {/* Accent color */}
          <Field label="Accent color" hint="Used in intro/outro slides + thumbnail accents.">
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="accent_color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border border-border bg-background"
              />
              <input
                type="text"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-[13px] focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAccent(c)}
                  className={`h-6 w-6 rounded-md ring-1 transition-all hover:scale-110 ${
                    accent.toLowerCase() === c.toLowerCase()
                      ? 'ring-2 ring-primary ring-offset-2'
                      : 'ring-border/60'
                  }`}
                  style={{ background: c }}
                  aria-label={`Use ${c}`}
                />
              ))}
            </div>
          </Field>

          {/* Font */}
          <Field label="Font family" hint="Used on rendered video text.">
            <select
              name="font_family"
              defaultValue={kit?.fontFamily ?? 'Inter'}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {FONT_CHOICES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>

          {/* Intro / Outro */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Intro text" hint="Shown for 2s at the start.">
              <input
                name="intro_text"
                defaultValue={kit?.introText ?? ''}
                placeholder="Clipflow"
                maxLength={60}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Outro text" hint="Shown for 3s at the end.">
              <input
                name="outro_text"
                defaultValue={kit?.outroText ?? ''}
                placeholder="Follow for more"
                maxLength={60}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </Field>
          </div>

          {/* Watermark position */}
          <Field label="Watermark position" hint="Where the logo overlays clips.">
            <select
              name="watermark_position"
              defaultValue={kit?.watermarkPosition ?? 'bottom-right'}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="top-left">Top left</option>
              <option value="top-right">Top right</option>
              <option value="bottom-left">Bottom left</option>
              <option value="bottom-right">Bottom right</option>
            </select>
          </Field>

          {state.ok === false && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {state.error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center rounded-lg border border-border/70 bg-background px-3 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted/40"
            >
              Cancel
            </button>
            <SubmitKitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
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
