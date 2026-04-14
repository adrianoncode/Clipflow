'use client'

import Image from 'next/image'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

import {
  analyzeContentDnaAction,
  fullRepurposeAction,
  generateViralHooksAction,
  generateThumbnailsAction,
  generateRepliesAction,
  researchHashtagsAction,
  recycleContentAction,
  generateVisualStoryboardAction,
  findCollabsAction,
} from '@/app/(app)/workspace/[id]/tools/actions'

type ActionResult = { ok?: undefined } | { ok: true; data: unknown } | { ok: false; error: string }

interface ToolConfig {
  title: string
  description: string
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  fields: Array<{ name: string; label: string; type: 'text' | 'textarea' | 'select'; placeholder: string; required?: boolean; options?: Array<{ value: string; label: string }> }>
  needsContentId?: boolean
}

const TOOL_CONFIGS: Record<string, ToolConfig> = {
  'content-dna': {
    title: 'Content DNA Analyzer',
    description: 'Analyzes your last 5 content items to extract your unique winning formula — hook patterns, storytelling structure, tone profile.',
    action: analyzeContentDnaAction,
    fields: [], // No input needed — analyzes existing content
  },
  'full-repurpose': {
    title: 'One-Click Full Repurpose',
    description: 'Generates newsletter + carousel + YouTube chapters + blog post — all in parallel from one content item.',
    action: fullRepurposeAction,
    fields: [
      { name: 'content_id', label: 'Content ID', type: 'text', placeholder: 'Paste a content item ID', required: true },
    ],
    needsContentId: true,
  },
  'viral-hooks': {
    title: 'Viral Hook Database',
    description: 'Generate 25 proven hook templates for your niche, categorized by emotion, format, and platform.',
    action: generateViralHooksAction,
    fields: [
      { name: 'niche', label: 'Your niche', type: 'text', placeholder: 'e.g. fitness, SaaS, cooking, personal finance', required: true },
      { name: 'platform', label: 'Platform', type: 'select', placeholder: '', options: [
        { value: '', label: 'All platforms' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'instagram', label: 'Instagram Reels' },
        { value: 'youtube', label: 'YouTube Shorts' },
        { value: 'linkedin', label: 'LinkedIn' },
      ]},
      { name: 'emotion', label: 'Emotion focus', type: 'select', placeholder: '', options: [
        { value: '', label: 'Mixed emotions' },
        { value: 'curiosity', label: 'Curiosity' },
        { value: 'fear', label: 'Fear / Urgency' },
        { value: 'surprise', label: 'Surprise' },
        { value: 'joy', label: 'Joy / Humor' },
      ]},
    ],
  },
  'thumbnails': {
    title: 'AI Thumbnail Generator',
    description: 'Generate 3 thumbnail concepts with DALL-E prompts. If you have an OpenAI key, actual images are generated.',
    action: generateThumbnailsAction,
    fields: [
      { name: 'title', label: 'Video title', type: 'text', placeholder: 'e.g. How I grew to 100K followers in 90 days', required: true },
      { name: 'hook', label: 'Hook / subtitle', type: 'text', placeholder: 'Optional — adds context for the thumbnail' },
    ],
  },
  'engagement-replies': {
    title: 'Engagement Reply Generator',
    description: 'Paste your top comments and get AI-written replies that boost engagement and build community.',
    action: generateRepliesAction,
    fields: [
      { name: 'comments', label: 'Comments (one per line)', type: 'textarea', placeholder: 'This changed my life!\nHow do you edit your videos?\nWhat camera do you use?', required: true },
    ],
  },
  'hashtag-research': {
    title: 'Smart Hashtag Research',
    description: 'Data-driven hashtag analysis with reach estimates, competition levels, and 3 ready-to-use sets.',
    action: researchHashtagsAction,
    fields: [
      { name: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g. home workouts, AI tools, vegan recipes', required: true },
      { name: 'platform', label: 'Platform', type: 'select', placeholder: '', options: [
        { value: 'tiktok', label: 'TikTok' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'linkedin', label: 'LinkedIn' },
      ]},
    ],
  },
  'content-recycler': {
    title: 'Content Recycler',
    description: 'Remix old content with fresh hooks and current trends. 3 new angles from one original.',
    action: recycleContentAction,
    fields: [
      { name: 'content_id', label: 'Content ID', type: 'text', placeholder: 'Paste the ID of old content to remix', required: true },
    ],
    needsContentId: true,
  },
  'visual-storyboard': {
    title: 'Visual Storyboard',
    description: 'Turn a script into a scene-by-scene storyboard with AI-generated image prompts for each scene.',
    action: generateVisualStoryboardAction,
    fields: [
      { name: 'script', label: 'Script', type: 'textarea', placeholder: 'Paste your video script here...', required: true },
    ],
  },
  'collab-finder': {
    title: 'Collab Finder',
    description: 'AI suggests ideal collaboration partners with outreach templates and content ideas.',
    action: findCollabsAction,
    fields: [
      { name: 'niche', label: 'Your niche', type: 'text', placeholder: 'e.g. fitness tech, productivity', required: true },
      { name: 'topics', label: 'Content topics (comma-separated)', type: 'text', placeholder: 'e.g. workouts, nutrition, gear reviews' },
      { name: 'audience_size', label: 'Your audience size', type: 'text', placeholder: 'e.g. 10K, 50K, 100K+' },
      { name: 'goals', label: 'Collab goals', type: 'text', placeholder: 'e.g. grow audience, cross-promotion, joint content' },
    ],
  },
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? 'Generating...' : label}
    </Button>
  )
}

export function ToolPage({ toolId, workspaceId }: { toolId: string; workspaceId: string }) {
  const config = TOOL_CONFIGS[toolId]

  // Must call hooks before any early returns
  const fallbackAction = async (_prev: ActionResult, _fd: FormData): Promise<ActionResult> => ({ ok: false, error: 'Tool not found' })
  const [state, formAction] = useFormState(config?.action ?? fallbackAction, {} as ActionResult)

  if (!config) return <div className="text-muted-foreground">Tool not found</div>

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/workspace/${workspaceId}/tools`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Tools
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">{config.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
      </div>

      {/* Form */}
      <form action={formAction} className="space-y-4 rounded-xl border border-border/50 bg-card p-5">
        <input type="hidden" name="workspace_id" value={workspaceId} />

        {config.fields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No input needed — this tool analyzes your existing content automatically.
          </p>
        )}

        {config.fields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={field.name}>{field.label}</Label>
            {field.type === 'textarea' ? (
              <Textarea
                id={field.name}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
                rows={5}
              />
            ) : field.type === 'select' && field.options ? (
              <select
                id={field.name}
                name={field.name}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <Input
                id={field.name}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
          </div>
        ))}

        <SubmitButton label={`Run ${config.title}`} />
      </form>

      {/* Error */}
      {state.ok === false && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(state as { error: string }).error}
        </div>
      )}

      {/* Results */}
      {state.ok === true && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-emerald-400">✓ Results</h2>
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <ResultsRenderer data={(state as { data: unknown }).data} toolId={toolId} />
          </div>
        </div>
      )}
    </div>
  )
}

/** Renders results based on the tool type */
function ResultsRenderer({ data, toolId }: { data: unknown; toolId: string }) {
  if (!data) return <p className="text-sm text-muted-foreground">No results.</p>

  // For structured results, try to render nicely
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>

    // Viral hooks
    if (toolId === 'viral-hooks' && Array.isArray(obj.hooks)) {
      return (
        <div className="space-y-3">
          {(obj.hooks as Array<Record<string, unknown>>).map((hook, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{String(hook.template ?? hook.example ?? '')}</p>
                {hook.example ? <p className="mt-1 text-xs text-muted-foreground">Example: {String(hook.example)}</p> : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {hook.emotion ? <span className="rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-medium text-pink-400">{String(hook.emotion)}</span> : null}
                  {hook.format ? <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">{String(hook.format)}</span> : null}
                  {hook.estimatedViralScore ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">{String(hook.estimatedViralScore)}/100</span> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Hashtag research
    if (toolId === 'hashtag-research' && Array.isArray(obj.recommended)) {
      return (
        <div className="space-y-4">
          {Array.isArray(obj.hashtagSets) ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Ready-to-use sets</h3>
              {(obj.hashtagSets as Array<Record<string, unknown>>).map((set, i) => (
                <div key={i} className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs font-semibold">{String(set.name ?? '')}</p>
                  <p className="mt-1 text-sm text-primary">{Array.isArray(set.hashtags) ? set.hashtags.map((h) => `#${String(h)}`).join(' ') : ''}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{String(set.bestFor ?? '')}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )
    }

    // Thumbnails
    if (toolId === 'thumbnails' && Array.isArray(obj.thumbnails)) {
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          {(obj.thumbnails as Array<Record<string, unknown>>).map((thumb, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-border/50 p-3">
              {thumb.imageUrl ? (
                // DALL-E returns time-limited S3 URLs from various hosts —
                // `unoptimized` skips Next's optimizer so we don't have to
                // whitelist each.
                <Image
                  src={String(thumb.imageUrl)}
                  alt={String(thumb.style ?? '')}
                  width={512}
                  height={512}
                  unoptimized
                  className="w-full rounded-lg"
                />
              ) : null}
              <p className="text-xs font-semibold">{String(thumb.style ?? '')}</p>
              <p className="text-xs text-muted-foreground">{String(thumb.textOverlay ?? '')}</p>
              {!thumb.imageUrl ? (
                <p className="rounded bg-muted/30 p-2 text-[10px] text-muted-foreground">{String(thumb.dallePrompt ?? '').slice(0, 100)}...</p>
              ) : null}
            </div>
          ))}
        </div>
      )
    }
  }

  // Generic JSON display for other tools
  return (
    <pre className="max-h-96 overflow-auto rounded-lg bg-muted/30 p-4 text-xs text-muted-foreground whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}
