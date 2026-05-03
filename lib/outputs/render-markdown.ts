import type { PromptOutput } from '@/lib/ai/generate/types'
import type { OutputPlatform } from '@/lib/platforms'

/**
 * Renders the structured PromptOutput as the human-readable markdown
 * string that gets stored in outputs.body and copied by users.
 *
 * LinkedIn is special-cased: no Hook/Script/Caption headers — just the
 * caption body followed by hashtags. The LinkedIn prompt asks the model
 * to put the full post in `caption` and leave `script` empty, so this
 * renderer matches that contract.
 *
 * Pure function, easy to unit test later.
 */
export function renderOutputMarkdown(
  platform: OutputPlatform,
  structured: PromptOutput,
): string {
  const hashtagLine = structured.hashtags
    .filter((tag) => tag.trim().length > 0)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join(' ')

  if (platform === 'linkedin') {
    const caption = structured.caption.trim()
    return hashtagLine ? `${caption}\n\n${hashtagLine}` : caption
  }

  const parts: string[] = []
  if (structured.hook.trim().length > 0) {
    parts.push(`## Hook\n\n${structured.hook.trim()}`)
  }
  if (structured.script.trim().length > 0) {
    parts.push(`## Script\n\n${structured.script.trim()}`)
  }
  if (structured.caption.trim().length > 0) {
    parts.push(`## Caption\n\n${structured.caption.trim()}`)
  }
  if (hashtagLine) {
    parts.push(hashtagLine)
  }

  return parts.join('\n\n')
}
