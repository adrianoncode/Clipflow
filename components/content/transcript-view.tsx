'use client'

import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'

interface TranscriptViewProps {
  text: string
}

export function TranscriptView({ text }: TranscriptViewProps) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — silently no-op
    }
  }, [text])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Transcript
        </h2>
        <Button type="button" variant="ghost" size="sm" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="whitespace-pre-wrap break-words rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">
        {text}
      </div>
    </div>
  )
}
