import {
  ACCEPTED_VIDEO_EXTENSIONS,
  extensionToMime,
  type AcceptedVideoExtension,
} from '@/lib/content/schemas'

/**
 * Canonical storage path for a content item's source file.
 * Shape: `<workspace_id>/<content_id>/source.<ext>`
 *
 * The first path segment MUST be the workspace UUID — the M1 storage RLS
 * policy checks `(storage.foldername(name))[1]::uuid` against the user's
 * workspace memberships. Postgres arrays are 1-indexed, so segment 1 is
 * the workspace id.
 */
export function videoStoragePath(
  workspaceId: string,
  contentId: string,
  ext: AcceptedVideoExtension,
): string {
  return `${workspaceId}/${contentId}/source.${ext}`
}

/**
 * Returns the lowercased extension without the leading dot, or null if the
 * filename has no extension or the extension isn't in the accepted set.
 */
export function parseExtension(filename: string): AcceptedVideoExtension | null {
  const dot = filename.lastIndexOf('.')
  if (dot === -1 || dot === filename.length - 1) return null
  const ext = filename.slice(dot + 1).toLowerCase()
  return (ACCEPTED_VIDEO_EXTENSIONS as readonly string[]).includes(ext)
    ? (ext as AcceptedVideoExtension)
    : null
}

/**
 * Resolves a MIME type for an accepted extension. Used as a fallback when
 * the browser's `File.type` comes back empty.
 */
export function mimeForExtension(ext: AcceptedVideoExtension): string {
  return extensionToMime[ext]
}
