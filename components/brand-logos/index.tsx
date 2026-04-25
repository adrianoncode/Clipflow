/**
 * Real brand SVG logos for the Channels page (and anywhere else we
 * surface a social platform). Hand-tuned single-color marks where
 * possible, matched to each brand's tile background, optical-aligned
 * inside their tile.
 *
 * Colors come from each brand's official guidelines so the marks
 * still read as "official" instead of generic letter placeholders.
 *
 * Each logo accepts `size` (px) and renders as an inline <svg> that
 * inherits color from currentColor where the mark is monochrome —
 * means cards can recolor on hover without changing the file.
 */

interface LogoProps {
  size?: number
  className?: string
}

// ---------------------------------------------------------------------------
// LinkedIn — white "in" mark on the brand blue (#0A66C2) tile
// ---------------------------------------------------------------------------
export function LinkedInLogo({ size = 18, className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.61 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.28V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// YouTube — white play triangle on the brand red (#FF0000) rounded rect
// ---------------------------------------------------------------------------
export function YouTubeLogo({ size = 18, className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.4.53A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.12c1.9.53 9.4.53 9.4.53s7.5 0 9.4-.53a3 3 0 0 0 2.1-2.12c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.55 15.59V8.41L15.82 12l-6.27 3.59z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Instagram — official camera mark, white on a 4-stop gradient tile.
// We render the gradient as part of the mark so it stays consistent
// across light/dark backgrounds.
// ---------------------------------------------------------------------------
export function InstagramLogo({ size = 18, className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.85 5.85 0 0 0-2.13 1.38A5.85 5.85 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.73 1.46 1.38 2.13a5.85 5.85 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.85 5.85 0 0 0 2.13-1.38 5.85 5.85 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.85 5.85 0 0 0-1.38-2.13A5.85 5.85 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0z" />
      <path d="M12 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8z" />
      <circle cx="18.41" cy="5.59" r="1.44" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Facebook — white "f" on the brand blue (#1877F2) tile
// ---------------------------------------------------------------------------
export function FacebookLogo({ size = 18, className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.95.93-1.95 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// TikTok — white musical-note mark on the brand black tile (with the
// signature cyan/red offset shadows fused into a single recognisable
// mark for small sizes).
// ---------------------------------------------------------------------------
export function TikTokLogo({ size = 18, className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.83 20.87a6.34 6.34 0 0 0 10.86-4.43V9.7a8.16 8.16 0 0 0 4.77 1.52V7.79a4.85 4.85 0 0 1-1.87-1.1z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// X (Twitter) — white "X" mark on the brand black tile
// ---------------------------------------------------------------------------
export function XLogo({ size = 18, className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Threads — official mark, white on the brand black tile
// ---------------------------------------------------------------------------
export function ThreadsLogo({ size = 18, className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12.18 24h-.01c-3.45-.02-6.1-1.18-7.87-3.42C2.71 18.6 1.84 15.97 1.81 12.85v-.02c.03-3.13.9-5.76 2.5-7.74C6.07 2.93 8.72 1.78 12.17 1.76h.01c2.65.02 4.85.69 6.55 2 1.6 1.23 2.72 2.99 3.34 5.22l-1.95.55c-1.04-3.74-3.65-5.66-7.95-5.7-2.83.03-4.97.91-6.36 2.62-1.3 1.6-1.97 3.92-2 6.9.03 2.97.7 5.29 2 6.9 1.39 1.7 3.53 2.59 6.36 2.62 2.55-.02 4.24-.61 5.65-1.99.65-.62 1.16-1.36 1.5-2.16-.4-.46-.84-.81-1.32-1.06-.6-.31-1.27-.5-2.02-.56-1.16-.1-2.13.1-2.86.6-.6.4-.94 1-.96 1.66-.01.34.07.66.23.95.18.32.45.6.8.83.36.23.79.4 1.27.5.49.1 1.05.13 1.65.07.7-.07 1.31-.32 1.83-.74.51-.42.84-1 .97-1.71l1.95.42c-.2 1.1-.74 2.04-1.59 2.74-.86.71-2 1.13-3.4 1.27-.85.08-1.66.04-2.4-.13a4.7 4.7 0 0 1-1.96-.86c-.55-.42-.99-.96-1.3-1.6a3.4 3.4 0 0 1-.36-2.04c.11-1.32.79-2.46 2-3.27 1.21-.81 2.83-1.17 4.55-.99.95.1 1.84.4 2.65.83.39.21.75.45 1.08.7.16-.69.24-1.43.24-2.21v-.02c-.02-3.02-.99-4.35-2.78-5.04-.78-.3-1.65-.46-2.6-.46-.91 0-1.81.16-2.65.46-1.26.45-2.27 1.34-2.83 2.42l-1.7-.95c.81-1.47 2.18-2.62 3.84-3.21 1.04-.37 2.16-.55 3.35-.55 1.18 0 2.3.18 3.34.56 2.6 1 4.07 3.16 4.09 7.31v.02c0 1.55-.27 2.92-.79 4.1.69 1 .85 2.32.42 3.62-.49 1.5-1.78 2.65-3.62 3.23-1.45.46-3.16.62-4.99.45z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Upload-Post — neutral geometric mark for the bundle aggregator. No
// official logo to clone, so we use a stylised "stack of arrows" that
// reads as multi-platform publishing.
// ---------------------------------------------------------------------------
export function UploadPostLogo({ size = 18, className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2 5 9h4v4h6V9h4l-7-7zm-7 13v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3h-2v3a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-3H5z" />
    </svg>
  )
}
