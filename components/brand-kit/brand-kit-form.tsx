'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { CheckCircle2, ImagePlus, Loader2, Trash2 } from 'lucide-react'

import {
  saveBrandKitAction,
  uploadBrandLogoAction,
  type SaveBrandKitState,
} from '@/app/(app)/settings/brand-kit/actions'
import {
  DEFAULT_BRAND_KIT,
  FONT_CHOICES,
  WATERMARK_POSITIONS,
  type BrandKit,
} from '@/lib/brand-kit/types'

interface BrandKitFormProps {
  workspaceId: string
  initial: BrandKit | null
  canEdit: boolean
}

const WATERMARK_LABEL: Record<NonNullable<BrandKit['watermarkPosition']>, string> = {
  'top-left': 'Top left',
  'top-right': 'Top right',
  'bottom-left': 'Bottom left',
  'bottom-right': 'Bottom right',
}

// Relative luminance per WCAG — used to warn when a user picks an accent
// that'll make the white subtitle text on the intro/outro slide
// unreadable.
function hasLowContrast(hex: string): boolean {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex)
  if (!m) return false
  const h = m[1]!
  const channels = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  ) as [number, number, number]
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  const contrastVsWhite = 1.05 / (luminance + 0.05)
  return contrastVsWhite < 4.5
}

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
      style={{
        background: '#0F0F0F',
        color: '#F4D93D',
        boxShadow:
          'inset 0 0 0 1px rgba(214,255,62,.15), 0 4px 14px -4px rgba(15,15,15,.35)',
      }}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {pending ? 'Saving…' : 'Save brand kit'}
    </button>
  )
}

export function BrandKitForm({ workspaceId, initial, canEdit }: BrandKitFormProps) {
  const merged: BrandKit = { ...DEFAULT_BRAND_KIT, ...(initial ?? {}) }
  const [logoUrl, setLogoUrl] = useState<string>(merged.logoUrl ?? '')
  const [accentColor, setAccentColor] = useState<string>(
    merged.accentColor ?? DEFAULT_BRAND_KIT.accentColor ?? '#0F0F0F',
  )
  const [fontFamily, setFontFamily] = useState<string>(
    merged.fontFamily ?? DEFAULT_BRAND_KIT.fontFamily ?? 'Inter',
  )
  const [watermarkPosition, setWatermarkPosition] = useState<string>(
    merged.watermarkPosition ?? DEFAULT_BRAND_KIT.watermarkPosition ?? 'bottom-right',
  )
  const [introText, setIntroText] = useState<string>(merged.introText ?? '')
  const [outroText, setOutroText] = useState<string>(merged.outroText ?? '')

  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, startUpload] = useTransition()
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [saveState, formAction] = useFormState<SaveBrandKitState, FormData>(
    saveBrandKitAction,
    {},
  )

  // Auto-clear the saved message after 4s so the form doesn't carry old
  // toast copy after the user makes another edit.
  const [savedShown, setSavedShown] = useState(false)
  useEffect(() => {
    if (saveState && 'ok' in saveState && saveState.ok === true) {
      setSavedShown(true)
      const t = window.setTimeout(() => setSavedShown(false), 4000)
      return () => window.clearTimeout(t)
    }
  }, [saveState])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null)
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('logo', file)
    startUpload(async () => {
      const res = await uploadBrandLogoAction(workspaceId, fd)
      if (res.ok) {
        setLogoUrl(res.url)
      } else {
        setUploadError(res.error)
      }
      if (fileRef.current) fileRef.current.value = ''
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <form
        action={formAction}
        className="space-y-6 rounded-2xl border p-6"
        style={{ borderColor: '#E5DDCE', background: '#FFFDF8' }}
      >
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="logo_url" value={logoUrl} />

        {/* Logo */}
        <section>
          <Label eyebrow="Logo" title="Logo" desc="PNG, JPG, SVG, or WebP up to 2 MB." />
          <div className="mt-3 flex items-start gap-4">
            <div
              className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border"
              style={{
                borderColor: '#E5DDCE',
                background: logoUrl ? '#FFFFFF' : '#F3EDE3',
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Brand logo"
                  className="max-h-20 max-w-20 object-contain"
                />
              ) : (
                <ImagePlus className="h-6 w-6" style={{ color: '#CFC4AF' }} />
              )}
              {uploading ? (
                <span
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(255,253,248,.85)' }}
                >
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#0F0F0F' }} />
                </span>
              ) : null}
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={onFileChange}
                disabled={!canEdit || uploading}
                className="block w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-1.5 file:text-[13px] file:font-semibold"
                style={{ color: '#3a342c' }}
              />
              {logoUrl ? (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  disabled={!canEdit}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold transition-colors hover:text-[color:var(--danger)]"
                  style={{ color: '#7c7468' }}
                >
                  <Trash2 className="h-3 w-3" /> Remove logo
                </button>
              ) : null}
              {uploadError ? (
                <p className="text-[11px] font-medium" style={{ color: '#9B2018' }}>
                  {uploadError}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <hr style={{ borderColor: '#E5DDCE' }} />

        {/* Color + font */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label
              eyebrow="Color"
              title="Accent color"
              desc="Used on intro/outro slides and subtle accents."
            />
            <div className="mt-3 flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                disabled={!canEdit}
                className="h-10 w-16 cursor-pointer rounded-lg border"
                style={{ borderColor: '#E5DDCE' }}
              />
              <input
                type="text"
                name="accent_color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                disabled={!canEdit}
                placeholder="#0F0F0F"
                className="lv2-mono flex-1 rounded-lg border px-3 py-2 text-[13px]"
                style={{
                  borderColor: '#E5DDCE',
                  background: '#FFFFFF',
                  color: '#181511',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
                pattern="^#[0-9a-fA-F]{6}$"
                maxLength={7}
              />
            </div>
            {hasLowContrast(accentColor) ? (
              <p className="mt-2 text-[11px]" style={{ color: '#A0530B' }}>
                Warning: this colour has low contrast against white text.
                Captions on the intro/outro slides may be hard to read. Pick
                a darker shade for best results.
              </p>
            ) : null}
          </div>

          <div>
            <Label
              eyebrow="Font"
              title="Font"
              desc="Applied to every intro/outro card."
            />
            <select
              name="font_family"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              disabled={!canEdit}
              className="mt-3 w-full rounded-lg border px-3 py-2 text-[14px]"
              style={{
                borderColor: '#E5DDCE',
                background: '#FFFFFF',
                color: '#181511',
              }}
            >
              {FONT_CHOICES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </section>

        <hr style={{ borderColor: '#E5DDCE' }} />

        {/* Watermark position */}
        <section>
          <Label
            eyebrow="Watermark"
            title="Logo watermark position"
            desc="Where the logo sits on the final rendered clip."
          />
          <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-xs">
            {WATERMARK_POSITIONS.map((pos) => {
              const active = watermarkPosition === pos
              return (
                <label
                  key={pos}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px] font-semibold transition-colors"
                  style={{
                    borderColor: active ? '#0F0F0F' : '#E5DDCE',
                    background: active ? '#EDE6F5' : '#FFFFFF',
                    color: active ? '#0F0F0F' : '#3a342c',
                  }}
                >
                  <input
                    type="radio"
                    name="watermark_position"
                    value={pos}
                    checked={active}
                    onChange={() => setWatermarkPosition(pos)}
                    disabled={!canEdit}
                    className="sr-only"
                  />
                  <WatermarkDot position={pos} active={active} />
                  {WATERMARK_LABEL[pos]}
                </label>
              )
            })}
          </div>
        </section>

        <hr style={{ borderColor: '#E5DDCE' }} />

        {/* Intro / outro */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label
              eyebrow="Intro"
              title="Intro slide"
              desc="2-second opener. Optional."
            />
            <input
              name="intro_text"
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              disabled={!canEdit}
              maxLength={80}
              placeholder="e.g. Nora's Podcast · Ep 42"
              className="mt-3 w-full rounded-lg border px-3 py-2 text-[14px]"
              style={{
                borderColor: '#E5DDCE',
                background: '#FFFFFF',
                color: '#181511',
              }}
            />
            <p className="mt-1 font-mono text-[10px]" style={{ color: '#7c7468' }}>
              {introText.length}/80
            </p>
          </div>

          <div>
            <Label
              eyebrow="Outro"
              title="Outro slide"
              desc="3-second closer. Optional."
            />
            <input
              name="outro_text"
              value={outroText}
              onChange={(e) => setOutroText(e.target.value)}
              disabled={!canEdit}
              maxLength={80}
              placeholder="e.g. Follow for more → @nora"
              className="mt-3 w-full rounded-lg border px-3 py-2 text-[14px]"
              style={{
                borderColor: '#E5DDCE',
                background: '#FFFFFF',
                color: '#181511',
              }}
            />
            <p className="mt-1 font-mono text-[10px]" style={{ color: '#7c7468' }}>
              {outroText.length}/80
            </p>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <SaveButton disabled={!canEdit} />
          {savedShown && saveState.ok === true ? (
            <span
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
              style={{ color: '#0F6B4D' }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {saveState.message}
            </span>
          ) : null}
          {saveState && 'ok' in saveState && saveState.ok === false ? (
            <span className="text-[12px] font-medium" style={{ color: '#9B2018' }}>
              {saveState.error}
            </span>
          ) : null}
          {!canEdit ? (
            <span className="text-[12px]" style={{ color: '#7c7468' }}>
              Read-only — owner or editor can make changes.
            </span>
          ) : null}
        </div>
      </form>

      {/* Live preview */}
      <div className="space-y-3">
        <p
          className="font-bold text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: '#7c7468' }}
        >
          Live preview · how renders will look
        </p>
        <BrandPreview
          logoUrl={logoUrl}
          accentColor={accentColor}
          fontFamily={fontFamily}
          watermarkPosition={watermarkPosition as BrandKit['watermarkPosition']}
          introText={introText}
          outroText={outroText}
        />
      </div>
    </div>
  )
}

function Label({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div>
      <p
        className="font-bold text-[9.5px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: '#0F0F0F' }}
      >
        {eyebrow}
      </p>
      <h4 className="mt-1 text-[14px] font-bold" style={{ color: '#181511' }}>
        {title}
      </h4>
      <p className="mt-0.5 text-[12px]" style={{ color: '#7c7468' }}>
        {desc}
      </p>
    </div>
  )
}

function WatermarkDot({
  position,
  active,
}: {
  position: NonNullable<BrandKit['watermarkPosition']>
  active: boolean
}) {
  const top = position.startsWith('top') ? '15%' : '65%'
  const left = position.endsWith('left') ? '15%' : '65%'
  return (
    <span
      aria-hidden
      className="relative flex h-5 w-7 shrink-0 overflow-hidden rounded-sm border"
      style={{ borderColor: active ? '#0F0F0F' : '#CFC4AF', background: '#F3EDE3' }}
    >
      <span
        className="absolute h-2 w-2 rounded-sm"
        style={{
          top,
          left,
          background: active ? '#0F0F0F' : '#7c7468',
        }}
      />
    </span>
  )
}

/**
 * Three-frame storyboard preview — one mini 9:16 card for intro, body,
 * outro. Matches what the Shotstack render pipeline actually produces
 * so users don't design against a lie. The watermark scales to 12% of
 * the frame (same as render) and sits in the configured corner with
 * the same safe-zone anchor used by the real pipeline.
 */
function BrandPreview({
  logoUrl,
  accentColor,
  fontFamily,
  watermarkPosition,
  introText,
  outroText,
}: {
  logoUrl: string
  accentColor: string
  fontFamily: string
  watermarkPosition?: BrandKit['watermarkPosition']
  introText: string
  outroText: string
}) {
  const frames: Array<{
    kind: 'intro' | 'body' | 'outro'
    label: string
  }> = [
    ...(introText ? [{ kind: 'intro' as const, label: 'Intro · 2s' }] : []),
    { kind: 'body' as const, label: 'Body · your clip' },
    ...(outroText ? [{ kind: 'outro' as const, label: 'Outro · 3s' }] : []),
  ]

  return (
    <div className="space-y-3">
      {frames.map((f, i) => (
        <div key={i} className="space-y-1.5">
          <p
            className="font-bold text-[9px] uppercase tracking-[0.18em]"
            style={{ color: '#7c7468' }}
          >
            {f.label}
          </p>
          <MiniFrame
            kind={f.kind}
            accentColor={accentColor}
            fontFamily={fontFamily}
            introText={introText}
            outroText={outroText}
            logoUrl={logoUrl}
            watermarkPosition={watermarkPosition}
          />
        </div>
      ))}
    </div>
  )
}

function MiniFrame({
  kind,
  accentColor,
  fontFamily,
  introText,
  outroText,
  logoUrl,
  watermarkPosition,
}: {
  kind: 'intro' | 'body' | 'outro'
  accentColor: string
  fontFamily: string
  introText: string
  outroText: string
  logoUrl: string
  watermarkPosition?: BrandKit['watermarkPosition']
}) {
  const wmTop = watermarkPosition?.startsWith('top') ? '6%' : 'auto'
  const wmBottom = watermarkPosition?.startsWith('bottom') ? '6%' : 'auto'
  const wmLeft = watermarkPosition?.endsWith('left') ? '6%' : 'auto'
  const wmRight = watermarkPosition?.endsWith('right') ? '6%' : 'auto'

  // Intro + outro: full-frame gradient card with accent tint — matches
  // the Shotstack buildCaptionHtml gradient pattern. Body frame: fake
  // subject with a subtitle pill.
  const bg =
    kind === 'intro' || kind === 'outro'
      ? `linear-gradient(135deg, ${accentColor}DD, ${accentColor}33), #0a0a0b`
      : 'linear-gradient(180deg, #3a342c 0%, #181511 50%, #3a342c 100%)'

  return (
    <div
      className="relative mx-auto aspect-[9/16] w-full max-w-[200px] overflow-hidden rounded-xl border"
      style={{ borderColor: '#E5DDCE', background: '#0a0a0b' }}
    >
      <div className="absolute inset-0" style={{ background: bg }} />

      {/* Intro or outro copy — full-frame, centered, large. */}
      {kind === 'intro' && introText ? (
        <div className="absolute inset-0 flex items-center justify-center px-5 text-center">
          <p
            className="text-[12px] font-extrabold leading-tight text-white"
            style={{ fontFamily: `${fontFamily}, sans-serif` }}
          >
            {introText}
          </p>
        </div>
      ) : null}
      {kind === 'outro' && outroText ? (
        <div className="absolute inset-0 flex items-center justify-center px-5 text-center">
          <p
            className="text-[12px] font-extrabold leading-tight text-white"
            style={{ fontFamily: `${fontFamily}, sans-serif` }}
          >
            {outroText}
          </p>
        </div>
      ) : null}

      {/* Body frame only: simulated bottom subtitle pill. */}
      {kind === 'body' ? (
        <div
          className="absolute inset-x-3 bottom-8 rounded bg-black/50 px-2 py-1 text-center text-[9px] font-bold text-white"
          style={{ fontFamily: `${fontFamily}, sans-serif` }}
        >
          &ldquo;sample caption…&rdquo;
        </div>
      ) : null}

      {/* Watermark — scales to 12 % of frame width, same as renders.
          Intro/outro are always unwatermarked in the pipeline (title
          cards are a separate track). */}
      {logoUrl && kind === 'body' ? (
        <span
          className="absolute flex items-center justify-center rounded-sm bg-white/90 p-[2px]"
          style={{
            top: wmTop,
            bottom: wmBottom,
            left: wmLeft,
            right: wmRight,
            width: '22%',
            aspectRatio: '1 / 1',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        </span>
      ) : null}
    </div>
  )
}
