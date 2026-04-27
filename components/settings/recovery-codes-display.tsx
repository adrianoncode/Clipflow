'use client'

import { useState } from 'react'
import { Copy, Check, Download, AlertTriangle } from 'lucide-react'

/**
 * Shown ONCE after a user enrolls 2FA or regenerates codes. The
 * plaintext codes are never returned by any endpoint again — the
 * user has to save them now.
 *
 * UI deliberately has friction: a "I've saved my codes" checkbox
 * must be checked before the parent can dismiss the dialog.
 */
export function RecoveryCodesDisplay({
  codes,
  onAcknowledge,
}: {
  codes: string[]
  onAcknowledge?: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  function copyAll() {
    const text = codes.join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadTxt() {
    const text = [
      'Clipflow recovery codes',
      `Generated: ${new Date().toISOString()}`,
      '',
      'Each code can be used ONCE to log in if you lose your authenticator app.',
      'Store these somewhere safe — they will not be shown again.',
      '',
      ...codes,
    ].join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clipflow-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 rounded-xl border border-amber-200/60 bg-amber-50/40 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Save these recovery codes now
          </p>
          <p className="mt-0.5 text-xs text-amber-800">
            Each code works once. If you lose your authenticator app, these are
            the only way to get back in. We won&apos;t show them again.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/50 bg-background p-3">
        {codes.map((code) => (
          <code
            key={code}
            className="select-all rounded border border-border/40 bg-muted/30 px-2 py-1.5 text-center font-mono text-[13px] tracking-wider"
          >
            {code}
          </code>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyAll}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs font-medium hover:border-primary/40"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy all'}
        </button>
        <button
          type="button"
          onClick={downloadTxt}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs font-medium hover:border-primary/40"
        >
          <Download className="h-3.5 w-3.5" />
          Download .txt
        </button>
      </div>

      {onAcknowledge && (
        <div className="flex items-center justify-between gap-3 border-t border-amber-200/60 pt-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={saved}
              onChange={(e) => setSaved(e.target.checked)}
              className="h-4 w-4 rounded border-border/60 accent-primary"
            />
            I&apos;ve saved my recovery codes somewhere safe
          </label>
          <button
            type="button"
            disabled={!saved}
            onClick={onAcknowledge}
            className="cf-btn-3d cf-btn-3d-primary rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
