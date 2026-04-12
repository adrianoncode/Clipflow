'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Plus, FileText } from 'lucide-react'

import { saveTemplateAction } from './actions'
import type { SaveTemplateState } from './actions'
import type { OutputTemplate } from '@/lib/templates/get-templates'
import { Button } from '@/components/ui/button'

interface TemplatesClientProps {
  workspaceId: string
  templates: OutputTemplate[]
}

const PLATFORM_OPTIONS = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram_reels', label: 'Instagram Reels' },
  { value: 'youtube_shorts', label: 'YouTube Shorts' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'custom', label: 'Custom' },
]

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Saving…' : 'Save template'}
    </Button>
  )
}

export function TemplatesClient({ workspaceId, templates }: TemplatesClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [localTemplates, setLocalTemplates] = useState<OutputTemplate[]>(templates)

  const [state, formAction] = useFormState<SaveTemplateState, FormData>(
    saveTemplateAction,
    {},
  )

  // When saved successfully, hide the form
  const saved = state.ok === true

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Custom Templates
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New template
        </Button>
      </div>

      {/* New template form */}
      {showForm && (
        <form
          action={(fd) => {
            formAction(fd)
          }}
          className="rounded-md border p-4 space-y-3"
        >
          <input type="hidden" name="workspace_id" value={workspaceId} />

          <div className="space-y-1">
            <label className="text-xs font-medium" htmlFor="tmpl-name">
              Template name
            </label>
            <input
              id="tmpl-name"
              name="name"
              required
              maxLength={100}
              placeholder="e.g. Educational TikTok"
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium" htmlFor="tmpl-platform">
              Platform
            </label>
            <select
              id="tmpl-platform"
              name="platform"
              required
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PLATFORM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium" htmlFor="tmpl-prompt">
              System prompt
            </label>
            <textarea
              id="tmpl-prompt"
              name="system_prompt"
              required
              rows={5}
              placeholder="Describe the format and tone the AI should use when generating outputs..."
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium" htmlFor="tmpl-hint">
              Structure hint <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="tmpl-hint"
              name="structure_hint"
              maxLength={300}
              placeholder="e.g. Hook → Value → CTA"
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-3">
            <SubmitBtn />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            {state.ok === false && (
              <p className="text-xs text-destructive">{state.error}</p>
            )}
            {saved && (
              <p className="text-xs text-emerald-600">Template saved!</p>
            )}
          </div>
        </form>
      )}

      {/* Template list */}
      {localTemplates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No custom templates yet. Create one above.
        </p>
      ) : (
        <div className="space-y-2">
          {localTemplates.map((t) => (
            <div
              key={t.id}
              className="rounded-md border bg-background p-3 space-y-1"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">{t.name}</p>
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {t.platform}
                </span>
              </div>
              {t.structure_hint && (
                <p className="text-xs text-muted-foreground font-mono">{t.structure_hint}</p>
              )}
              <p className="text-xs text-muted-foreground line-clamp-2">{t.system_prompt}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
