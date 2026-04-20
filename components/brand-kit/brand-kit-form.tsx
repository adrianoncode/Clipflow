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

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
      style={{
        background: '#2A1A3D',
        color: '#D6FF3E',
        boxShadow:
          'inset 0 0 0 1px rgba(214,255,62,.15), 0 4px 14px -4px rgba(42,26,61,.35)',
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
    merged.accentColor ?? DEFAULT_BRAND_KIT.accentColor ?? '#2A1A3D',
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
          <Label eyebrow="Step 1" title="Logo" desc="PNG, JPG, SVG, or WebP up to 2 MB." />
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
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#2A1A3D' }} />
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
              eyebrow="Step 2"
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
                placeholder="#2A1A3D"
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
          </div>

          <div>
            <Label
              eyebrow="Step 3"
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
            eyebrow="Step 4"
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
                    borderColor: active ? '#2A1A3D' : '#E5DDCE',
                    background: active ? '#EDE6F5' : '#FFFFFF',
                    color: active ? '#2A1A3D' : '#3a342c',
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
              eyebrow="Step 5"
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
              eyebrow="Step 6"
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
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]"
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
        className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: '#2A1A3D' }}
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
      style={{ borderColor: active ? '#2A1A3D' : '#CFC4AF', background: '#F3EDE3' }}
    >
      <span
        className="absolute h-2 w-2 rounded-sm"
        style={{
          top,
          left,
          background: active ? '#2A1A3D' : '#7c7468',
        }}
      />
    </span>
  )
}

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
  const wmTop = watermarkPosition?.startsWith('top') ? '12px' : 'auto'
  const wmBottom = watermarkPosition?.startsWith('bottom') ? '12px' : 'auto'
  const wmLeft = watermarkPosition?.endsWith('left') ? '12px' : 'auto'
  const wmRight = watermarkPosition?.endsWith('right') ? '12px' : 'auto'

  return (
    <div
      className="relative mx-auto flex aspect-[9/16] w-full max-w-[240px] overflow-hidden rounded-2xl border"
      style={{ borderColor: '#E5DDCE', background: '#181511' }}
    >
      {/* Mock video frame */}
      <div
        className="relative flex-1"
        style={{
          background:
            'linear-gradient(180deg, #3a342c 0%, #181511 50%, #3a342c 100%)',
        }}
      >
        {/* Intro slide simulation at top third */}
        {introText ? (
          <div
            className="absolute inset-x-0 top-0 flex h-1/3 items-center justify-center px-4 text-center"
            style={{
              background: `linear-gradient(135deg, ${accentColor}88, ${accentColor}22)`,
            }}
          >
            <p
              className="text-[11px] font-extrabold leading-tight text-white"
              style={{ fontFamily: `${fontFamily}, sans-serif` }}
            >
              {introText}
            </p>
          </div>
        ) : null}

        {/* Simulated subtitle */}
        <div
          className="absolute inset-x-3 bottom-14 rounded bg-black/50 px-2 py-1 text-center text-[9px] font-bold text-white"
          style={{ fontFamily: `${fontFamily}, sans-serif` }}
        >
          &ldquo;sample caption…&rdquo;
        </div>

        {/* Outro strip at bottom */}
        {outroText ? (
          <div
            className="absolute inset-x-0 bottom-0 flex h-8 items-center justify-center px-2"
            style={{ background: `${accentColor}` }}
          >
            <p
              className="truncate text-[9px] font-bold text-white"
              style={{ fontFamily: `${fontFamily}, sans-serif` }}
            >
              {outroText}
            </p>
          </div>
        ) : null}

        {/* Watermark */}
        {logoUrl ? (
          <span
            className="absolute flex h-8 w-8 items-center justify-center rounded bg-white/90 p-1"
            style={{ top: wmTop, bottom: wmBottom, left: wmLeft, right: wmRight }}
          >
            <img
              src={logoUrl}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          </span>
        ) : null}
      </div>
    </div>
  )
}
