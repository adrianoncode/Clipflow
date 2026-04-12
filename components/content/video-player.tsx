'use client'

import { useState } from 'react'

interface VideoPlayerProps {
  signedUrl: string
  mimeType?: string
  title?: string
}

function isAudio(mimeType?: string): boolean {
  if (!mimeType) return false
  return mimeType.startsWith('audio/')
}

export function VideoPlayer({ signedUrl, mimeType, title }: VideoPlayerProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className="flex items-center justify-center rounded-md border bg-muted/30 p-6 text-sm text-muted-foreground">
        Preview unavailable
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {title && (
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
      )}
      {isAudio(mimeType) ? (
        <audio
          src={signedUrl}
          controls
          preload="metadata"
          className="w-full"
          onError={() => setError(true)}
        >
          Your browser does not support the audio element.
        </audio>
      ) : (
        <video
          src={signedUrl}
          controls
          preload="metadata"
          className="w-full max-h-96 rounded-md bg-black"
          onError={() => setError(true)}
        >
          Your browser does not support the video element.
        </video>
      )}
    </div>
  )
}
