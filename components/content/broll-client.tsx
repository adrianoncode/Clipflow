'use client'

import { useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import {
  searchBrollAction,
  type SearchBrollState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/broll/actions'
import type { PexelsVideo, PexelsPhoto } from '@/lib/broll/search-pexels'

interface BrollClientProps {
  workspaceId: string
  contentId: string
  initialKeywords: string[]
  initialVideos: PexelsVideo[]
}

function SearchButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Searching…' : 'Search'}
    </Button>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function VideoCard({ video }: { video: PexelsVideo }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    void navigator.clipboard.writeText(video.videoUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      <div className="relative aspect-[9/16] overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt={`Video by ${video.photographer}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatDuration(video.duration)}
        </span>
      </div>
      <div className="p-2 space-y-2">
        <p className="text-xs text-muted-foreground truncate">by {video.photographer}</p>
        <div className="flex gap-1.5">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-md border px-2 py-1 text-xs font-medium hover:bg-accent"
          >
            Preview
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex flex-1 items-center justify-center rounded-md border px-2 py-1 text-xs font-medium hover:bg-accent"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PhotoCard({ photo }: { photo: PexelsPhoto }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    void navigator.clipboard.writeText(photo.src.large).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      <div className="relative aspect-[9/16] overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src.medium}
          alt={photo.alt ?? `Photo by ${photo.photographer}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-2 space-y-2">
        <p className="text-xs text-muted-foreground truncate">by {photo.photographer}</p>
        <div className="flex gap-1.5">
          <a
            href={photo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-md border px-2 py-1 text-xs font-medium hover:bg-accent"
          >
            Open on Pexels
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex flex-1 items-center justify-center rounded-md border px-2 py-1 text-xs font-medium hover:bg-accent"
          >
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
        </div>
      </div>
    </div>
  )
}

const initialState: SearchBrollState = {}

export function BrollClient({
  workspaceId,
  contentId,
  initialKeywords,
  initialVideos,
}: BrollClientProps) {
  const [mediaType, setMediaType] = useState<'video' | 'photo'>('video')
  const [query, setQuery] = useState(initialKeywords[0] ?? '')
  const queryInputRef = useRef<HTMLInputElement>(null)
  const [state, formAction] = useFormState(searchBrollAction, initialState)

  // When a keyword pill is clicked, update the query input and auto-submit
  const formRef = useRef<HTMLFormElement>(null)

  function handleKeywordClick(keyword: string) {
    setQuery(keyword)
    // Trigger form submission after state update
    setTimeout(() => {
      formRef.current?.requestSubmit()
    }, 0)
  }

  // Determine current results to display
  const currentResults: PexelsVideo[] | PexelsPhoto[] =
    state.ok === true
      ? (state.results as PexelsVideo[] | PexelsPhoto[])
      : initialVideos

  const isPhotoMode = state.ok === true && state.type === 'photo'

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href={`/workspace/${workspaceId}/content/${contentId}`}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to content
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">B-Roll Suggestions</h1>
        <p className="text-sm text-muted-foreground">
          AI-matched stock footage for your content
        </p>
      </div>

      {/* Keyword pills */}
      {initialKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {initialKeywords.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => handleKeywordClick(kw)}
              className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-accent transition-colors"
            >
              {kw}
            </button>
          ))}
        </div>
      )}

      {/* Search form */}
      <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-2">
        <input
          ref={queryInputRef}
          type="text"
          name="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stock footage…"
          className="flex-1 min-w-0 rounded-md border bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {/* Media type toggle */}
        <div className="flex rounded-md border overflow-hidden">
          <button
            type="button"
            onClick={() => setMediaType('video')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              mediaType === 'video' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            Videos
          </button>
          <button
            type="button"
            onClick={() => setMediaType('photo')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              mediaType === 'photo' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            Photos
          </button>
        </div>
        {/* Hidden field for type */}
        <input type="hidden" name="type" value={mediaType} />
        <SearchButton />
      </form>

      {/* Error state */}
      {state.ok === false && state.error ? (
        <FormMessage variant="error">{state.error}</FormMessage>
      ) : null}

      {/* Results grid */}
      {currentResults.length > 0 ? (
        <div className="overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {isPhotoMode
              ? (currentResults as PexelsPhoto[]).map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} />
                ))
              : (currentResults as PexelsVideo[]).map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No results found. Try a different search term.
        </p>
      )}

      {/* Pexels attribution */}
      <p className="text-xs text-muted-foreground">
        Photos and videos provided by{' '}
        <a
          href="https://www.pexels.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          Pexels
        </a>
      </p>
    </div>
  )
}
