'use client'

import { Button } from '@/components/ui/button'
import type { OutputRow } from '@/lib/content/get-outputs'
import { PLATFORM_LONG_LABELS as PLATFORM_LABELS } from '@/lib/platforms'

interface ExportAllButtonProps {
  outputs: OutputRow[]
  contentTitle: string
}

export function ExportAllButton({ outputs, contentTitle }: ExportAllButtonProps) {
  function handleExport() {
    const sections = outputs.map((o) => {
      const label = PLATFORM_LABELS[o.platform] ?? o.platform
      return `# ${label}\n\n${o.body ?? '(empty)'}`
    })

    const markdown = [
      `# ${contentTitle}`,
      `_Exported from Clipflow on ${new Date().toLocaleDateString()}_`,
      '',
      ...sections,
    ].join('\n\n---\n\n')

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${contentTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-outputs.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (outputs.length === 0) return null

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      Export all .md
    </Button>
  )
}
