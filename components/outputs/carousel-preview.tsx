'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { Layers, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CarouselData {
  coverSlide: { title: string; subtitle: string }
  slides: Array<{ slideNumber: number; headline: string; body: string; visualSuggestion: string }>
  closingSlide: { cta: string; handle: string }
}

interface Props {
  workspaceId: string
  contentId: string
  generateAction: (prev: unknown, formData: FormData) => Promise<{ ok?: boolean; carousel?: CarouselData; error?: string }>
}

export function CarouselPreview({ workspaceId, contentId, generateAction }: Props) {
  const [state, formAction] = useFormState(generateAction, {})
  const [currentSlide, setCurrentSlide] = useState(0)
  const [copied, setCopied] = useState(false)

  const carousel = state.ok ? (state as { carousel: CarouselData }).carousel : null

  const totalSlides = carousel
    ? 1 + carousel.slides.length + 1 // cover + content + closing
    : 0

  function prev() {
    setCurrentSlide((s) => Math.max(0, s - 1))
  }
  function next() {
    setCurrentSlide((s) => Math.min(totalSlides - 1, s + 1))
  }

  function copyAll() {
    if (!carousel) return
    const text = [
      `[Cover] ${carousel.coverSlide.title}`,
      carousel.coverSlide.subtitle,
      '',
      ...carousel.slides.flatMap((s) => [
        `[Slide ${s.slideNumber}] ${s.headline}`,
        s.body,
        `Visual: ${s.visualSuggestion}`,
        '',
      ]),
      `[CTA] ${carousel.closingSlide.cta}`,
      carousel.closingSlide.handle,
    ].join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-semibold">Carousel Generator</h3>
        </div>
        <form action={formAction}>
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="content_id" value={contentId} />
          <Button type="submit" size="sm" variant="outline">
            Generate carousel
          </Button>
        </form>
      </div>

      {state.ok === false && (
        <p className="text-xs text-destructive">{(state as { error: string }).error}</p>
      )}

      {carousel && (
        <div className="space-y-3">
          {/* Slide preview — phone-like aspect ratio */}
          <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-2xl border bg-gradient-to-b from-card to-muted">
            {/* Cover slide */}
            {currentSlide === 0 && (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <h2 className="text-xl font-bold leading-tight">{carousel.coverSlide.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{carousel.coverSlide.subtitle}</p>
              </div>
            )}
            {/* Content slides */}
            {currentSlide > 0 && currentSlide <= carousel.slides.length && (() => {
              const slide = carousel.slides[currentSlide - 1]
              if (!slide) return null
              return (
                <div className="flex h-full flex-col justify-center px-8">
                  <span className="mb-3 text-xs font-bold text-muted-foreground">
                    {slide.slideNumber}
                  </span>
                  <h3 className="text-lg font-bold leading-snug">
                    {slide.headline}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {slide.body}
                  </p>
                  <p className="mt-6 text-[10px] text-muted-foreground/50 italic">
                    Visual: {slide.visualSuggestion}
                  </p>
                </div>
              )
            })()}
            {/* Closing slide */}
            {currentSlide === totalSlides - 1 && (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <p className="text-lg font-bold">{carousel.closingSlide.cta}</p>
                <p className="mt-3 text-sm text-violet-400">{carousel.closingSlide.handle}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-3">
            <Button variant="ghost" size="sm" onClick={prev} disabled={currentSlide === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs tabular-nums text-muted-foreground">
              {currentSlide + 1} / {totalSlides}
            </span>
            <Button variant="ghost" size="sm" onClick={next} disabled={currentSlide === totalSlides - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Slide dots */}
          <div className="flex justify-center gap-1">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentSlide ? 'w-4 bg-violet-400' : 'w-1.5 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Copy */}
          <Button size="sm" variant="outline" onClick={copyAll} className="gap-1.5 w-full">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy all slides'}
          </Button>
        </div>
      )}
    </div>
  )
}
