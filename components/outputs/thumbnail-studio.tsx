'use client'

import { useMemo, useState } from 'react'
import { Download, ImageIcon, RefreshCw, Sparkles } from 'lucide-react'

interface ThumbnailStudioProps {
  /** Best headline we have for this output — falls back to the output
   *  body's first sentence when no explicit title is set. */
  defaultTitle: string
  /** Optional eyebrow — e.g. the platform or a tag. */
  defaultSub?: string
  /** Brand-kit-aware colors (override Clipflow's default lime + plum). */
  brandAccent?: string
  brandBg?: string
  /** Logo/name shown bottom-left of the thumbnail. */
  brandName?: string
}

const LAYOUTS = [
  { id: 'yt', label: 'YouTube', ratio: '16 : 9', size: '1280×720' },
  { id: 'square', label: 'Square', ratio: '1 : 1', size: '1200×1200' },
  { id: 'link', label: 'LinkedIn', ratio: '1200 : 627', size: '1200×627' },
] as const

const VARIANTS = [
  { id: 'bold', label: 'Bold highlight' },
  { id: 'soft', label: 'Editorial' },
  { id: 'split', label: 'Low-thirds' },
] as const

/**
 * Thumbnail studio — self-contained preview + download UI. Produces
 * YouTube / Square / LinkedIn thumbnails by composing a query into
 * /api/thumbnail (edge ImageResponse). Three variants, instant
 * preview, no persistence — user saves what they like.
 *
 * Later pass: persist chosen URL on output.metadata.thumbnail so it
 * auto-fills on LinkedIn uploads and YouTube scheduling. For now,
 * plain download.
 */
export function ThumbnailStudio({
  defaultTitle,
  defaultSub,
  brandAccent,
  brandBg,
  brandName = 'Clipflow',
}: ThumbnailStudioProps) {
  const [title, setTitle] = useState(defaultTitle)
  const [sub, setSub] = useState(defaultSub ?? '')
  const [layout, setLayout] = useState<(typeof LAYOUTS)[number]['id']>('yt')
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]['id']>('bold')
  const [nonce, setNonce] = useState(0)

  const src = useMemo(() => {
    const params = new URLSearchParams({
      title,
      sub,
      layout,
      variant,
      logoText: brandName,
      ...(brandAccent ? { accent: brandAccent } : {}),
      ...(brandBg ? { bg: brandBg } : {}),
      // nonce busts CDN cache when the user hits regenerate without
      // changing any params — primarily useful during design iteration.
      n: String(nonce),
    })
    return `/api/thumbnail?${params.toString()}`
  }, [title, sub, layout, variant, brandAccent, brandBg, brandName, nonce])

  return (
    <section className="rounded-2xl border bg-card p-5">
      <header className="mb-4 flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: '#EDE6F5' }}
        >
          <ImageIcon className="h-4 w-4" style={{ color: '#2A1A3D' }} />
        </div>
        <div>
          <h3 className="text-sm font-bold">Thumbnail Studio</h3>
          <p className="text-[11px] text-muted-foreground">
            Generate a YouTube / LinkedIn thumbnail from this draft — auto-
            applies your brand kit.
          </p>
        </div>
      </header>

      {/* ── Preview ── */}
      <div
        className="relative overflow-hidden rounded-xl border"
        style={{
          aspectRatio:
            layout === 'square' ? '1 / 1' : layout === 'link' ? '1200 / 627' : '16 / 9',
          background: 'var(--lv2d-bg-2, #F3EDE3)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Thumbnail preview"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* ── Controls ── */}
      <div className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="thumb-title"
            className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            Headline
          </label>
          <input
            id="thumb-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={110}
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label
            htmlFor="thumb-sub"
            className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            Eyebrow (optional)
          </label>
          <input
            id="thumb-sub"
            type="text"
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            maxLength={60}
            placeholder="e.g. PODCAST · EP 47"
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Layout
            </p>
            <div className="flex gap-1">
              {LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLayout(l.id)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                    layout === l.id
                      ? 'border-[#2A1A3D] bg-[#2A1A3D] text-[#D6FF3E]'
                      : 'border-border/60 text-muted-foreground hover:border-border'
                  }`}
                  title={`${l.ratio} · ${l.size}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Style
            </p>
            <div className="flex gap-1">
              {VARIANTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariant(v.id)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                    variant === v.id
                      ? 'border-[#2A1A3D] bg-[#2A1A3D] text-[#D6FF3E]'
                      : 'border-border/60 text-muted-foreground hover:border-border'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNonce((n) => n + 1)}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </button>
          <a
            href={src}
            download={`clipflow-thumbnail-${layout}-${variant}.png`}
            className="cf-btn-3d cf-btn-3d-primary ml-auto inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        </div>

        <p className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground/60">
          <Sparkles className="h-3 w-3" />
          Generated per request · YouTube uploads accept 1280×720 JPG up to 2MB
        </p>
      </div>
    </section>
  )
}
