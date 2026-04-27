import type { AiProvider } from '@/lib/ai/providers/types'

/**
 * Real brand marks for the AI Keys page. We render inline SVG so the
 * logos sit in the page's color stack (no external asset fetch, no
 * cache tier, no theme-mismatched PNGs). Each mark has its own
 * accent color baked in — the provider's actual brand color, not a
 * substitute — and a soft halo so it reads as a premium chip rather
 * than a flat rectangle of branding.
 */

interface BrandLogoProps {
  provider: AiProvider
  /** size in px, default 44 (matches the chip size). */
  size?: number
  className?: string
}

export function BrandLogo({ provider, size = 44, className = '' }: BrandLogoProps) {
  const Logo = LOGO_MAP[provider] ?? FallbackLogo
  return <Logo size={size} className={className} />
}

type LogoComponent = (props: { size: number; className?: string }) => JSX.Element

const LOGO_MAP: Partial<Record<AiProvider, LogoComponent>> = {
  openai: OpenAILogo,
  anthropic: AnthropicLogo,
  google: GeminiLogo,
  shotstack: ShotstackLogo,
  replicate: ReplicateLogo,
  elevenlabs: ElevenLabsLogo,
  'upload-post': UploadPostLogo,
}

function chipBase(size: number, className: string, bg: string, halo: string) {
  return {
    style: {
      width: size,
      height: size,
      background: bg,
      boxShadow: halo,
    },
    className: `inline-flex shrink-0 items-center justify-center rounded-2xl ${className}`,
  }
}

function OpenAILogo({ size, className = '' }: { size: number; className?: string }) {
  const inner = Math.round(size * 0.58)
  return (
    <span
      {...chipBase(
        size,
        className,
        'linear-gradient(140deg, #1F1F1F 0%, #0A0A0A 100%)',
        '0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 22px -10px rgba(15,15,15,0.55)',
      )}
    >
      <svg
        width={inner}
        height={inner}
        viewBox="0 0 320 320"
        fill="#fff"
        aria-hidden
      >
        <path d="M297.06 130.97a80.05 80.05 0 0 0-6.88-65.65c-15.89-27.61-47.78-41.78-79.04-35.18-13.94-15.61-33.93-24.59-54.95-24.69-32.04-.07-60.45 20.62-70.34 51.16-19.31 3.96-35.98 16.1-45.78 33.36-16.07 27.6-12.4 62.39 9.13 86.18-4.21 11.49-5.32 23.79-3.22 35.69 2.1 11.91 7.36 22.85 15.31 31.92 16.96 27.34 49.35 41.76 80.71 35.92 14 15.8 33.91 24.78 54.95 24.69 32.06.07 60.55-20.66 70.49-51.21 19.43-3.94 36.21-16.07 46.06-33.32 16.07-27.61 12.49-62.5-9.07-86.32l-7.37-2.55Zm-120.28 168c-13.83.02-27.23-4.83-37.83-13.7l1.87-1.06 62.84-36.29c3.14-1.85 5.07-5.23 5.07-8.87v-88.62l26.55 15.34a.95.95 0 0 1 .51.73v73.39c-.04 32.83-26.7 59.46-59.53 59.46l.52-.38ZM49.21 234.61c-7.04-12.16-9.65-26.41-7.36-40.27l1.87 1.12 62.92 36.31c3.14 1.83 7 1.83 10.14 0l76.81-44.34v30.66c.05.36-.11.7-.42.91l-63.59 36.7c-28.4 16.42-64.74 6.7-81.16-21.7l.79-1.14V234.61Zm-16.5-137.8a59.04 59.04 0 0 1 31-25.95v75.04c-.04 3.62 1.87 7 5 8.81l76.34 44.07-26.55 15.34a.97.97 0 0 1-.91 0l-63.55-36.78c-28.36-16.46-38.05-52.79-21.59-81.21l.26-2.32Zm218.43 50.85-76.5-44.42 26.5-15.28a.97.97 0 0 1 .91 0l63.55 36.71c18.3 10.59 29.59 30.13 29.59 51.27 0 21.13-11.29 40.67-29.59 51.27v-75.05c.05-3.6-1.83-6.96-4.91-8.78l8.45 4.28Zm26.41-39.71-1.87-1.13-62.78-36.59c-3.14-1.85-7.04-1.85-10.18 0l-76.79 44.34v-30.66c-.05-.36.11-.7.42-.91l63.55-36.65c28.39-16.4 64.71-6.69 81.13 21.69 9.93 17.16 9.93 38.32 0 55.48l6.52-15.57Zm-166.5 54.6-26.59-15.34a.95.95 0 0 1-.51-.73v-73.39c.06-32.85 26.74-59.46 59.6-59.41 13.83.05 27.21 4.91 37.81 13.74l-1.87 1.06-62.83 36.29c-3.14 1.85-5.07 5.23-5.07 8.87l-.55 88.91h.01Zm14.42-31.07 34.2-19.74 34.32 19.74v39.46l-34.18 19.74-34.32-19.74-.02-39.46Z" />
      </svg>
    </span>
  )
}

function AnthropicLogo({ size, className = '' }: { size: number; className?: string }) {
  const inner = Math.round(size * 0.5)
  return (
    <span
      {...chipBase(
        size,
        className,
        'linear-gradient(140deg, #FAF1EA 0%, #F4DDC9 100%)',
        '0 1px 0 rgba(255,255,255,0.65) inset, 0 8px 22px -10px rgba(212,88,11,0.35)',
      )}
    >
      <svg width={inner} height={inner} viewBox="0 0 256 176" aria-hidden>
        <path
          fill="#D4580B"
          d="M147.262 0H183.5L256 175.515h-36.238L147.262 0ZM72.762 0H109L36.5 175.515H0L72.762 0Zm17.84 113.5h36.293L108.95 67.83 90.602 113.5Z"
        />
      </svg>
    </span>
  )
}

function GeminiLogo({ size, className = '' }: { size: number; className?: string }) {
  const inner = Math.round(size * 0.55)
  return (
    <span
      {...chipBase(
        size,
        className,
        'linear-gradient(140deg, #FFFFFF 0%, #F2F4FB 100%)',
        '0 1px 0 rgba(255,255,255,0.85) inset, 0 8px 22px -10px rgba(66,133,244,0.35)',
      )}
    >
      <svg width={inner} height={inner} viewBox="0 0 24 24" aria-hidden>
        <defs>
          <linearGradient id="bv-gemini" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4285F4" />
            <stop offset="50%" stopColor="#9B72CB" />
            <stop offset="100%" stopColor="#D96570" />
          </linearGradient>
        </defs>
        <path
          fill="url(#bv-gemini)"
          d="M12 1.5c.4 4.6 1.6 7.5 3.5 9.4 1.9 1.9 4.8 3.1 9.4 3.5h.1V12.4h-.1c-4.6-.4-7.5-1.6-9.4-3.5C13.6 7 12.4 4.1 12 -.5h-1.4c-.4 4.6-1.6 7.5-3.5 9.4-1.9 1.9-4.8 3.1-9.4 3.5h-.1v1.5h.1c4.6.4 7.5 1.6 9.4 3.5 1.9 1.9 3.1 4.8 3.5 9.4v.2H12v-.2c.4-4.6 1.6-7.5 3.5-9.4 1.9-1.9 4.8-3.1 9.4-3.5h.1V12.4h-.1c-4.6-.4-7.5-1.6-9.4-3.5C13.6 7 12.4 4.1 12 1.5Z"
          transform="translate(-0.6 -0.5)"
        />
      </svg>
    </span>
  )
}

function ShotstackLogo({ size, className = '' }: { size: number; className?: string }) {
  const inner = Math.round(size * 0.5)
  return (
    <span
      {...chipBase(
        size,
        className,
        'linear-gradient(140deg, #6F2BFF 0%, #120920 100%)',
        '0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 22px -10px rgba(42,26,61,0.55)',
      )}
    >
      <svg width={inner} height={inner} viewBox="0 0 24 24" aria-hidden>
        <rect x="2" y="8" width="13" height="13" rx="2.5" fill="rgba(255,255,255,0.32)" />
        <rect x="6" y="5" width="13" height="13" rx="2.5" fill="rgba(255,255,255,0.55)" />
        <path
          d="M11.5 4.8 22 9.85v.7L11.5 15.6.5 10.55v-.7L11.5 4.8Z"
          fill="#fff"
        />
      </svg>
    </span>
  )
}

function ReplicateLogo({ size, className = '' }: { size: number; className?: string }) {
  const inner = Math.round(size * 0.5)
  return (
    <span
      {...chipBase(
        size,
        className,
        'linear-gradient(140deg, #1A1B1F 0%, #050608 100%)',
        '0 1px 0 rgba(255,255,255,0.05) inset, 0 8px 22px -10px rgba(0,0,0,0.55)',
      )}
    >
      <svg width={inner} height={inner} viewBox="0 0 1000 1000" aria-hidden>
        <g fill="#fff">
          <polygon points="1000,427.6 1000,540 689.8,540 689.8,1000 567,1000 567,427.6" />
          <polygon points="1000,254.5 1000,366.9 487.7,366.9 487.7,1000 365,1000 365,254.5" />
          <polygon points="1000,82 1000,194.4 287.9,194.4 287.9,1000 165.1,1000 165.1,82" />
        </g>
      </svg>
    </span>
  )
}

function ElevenLabsLogo({ size, className = '' }: { size: number; className?: string }) {
  const inner = Math.round(size * 0.5)
  return (
    <span
      {...chipBase(
        size,
        className,
        'linear-gradient(140deg, #161616 0%, #000 100%)',
        '0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 22px -10px rgba(0,0,0,0.5)',
      )}
    >
      <svg width={inner} height={inner} viewBox="0 0 24 24" aria-hidden>
        <rect x="6.5" y="3.5" width="3.6" height="17" rx="0.8" fill="#fff" />
        <rect x="13.9" y="3.5" width="3.6" height="17" rx="0.8" fill="#fff" />
      </svg>
    </span>
  )
}

function UploadPostLogo({ size, className = '' }: { size: number; className?: string }) {
  const inner = Math.round(size * 0.5)
  return (
    <span
      {...chipBase(
        size,
        className,
        'linear-gradient(140deg, #10B981 0%, #047857 100%)',
        '0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 22px -10px rgba(4,120,87,0.45)',
      )}
    >
      <svg width={inner} height={inner} viewBox="0 0 24 24" aria-hidden fill="none">
        <path
          d="M12 4v12M7 9l5-5 5 5"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="4.5"
          y="17"
          width="15"
          height="3"
          rx="1.4"
          fill="#fff"
          opacity="0.85"
        />
      </svg>
    </span>
  )
}

function FallbackLogo({ size, className = '' }: { size: number; className?: string }) {
  return (
    <span
      {...chipBase(
        size,
        className,
        'linear-gradient(140deg, #2A1A3D 0%, #4A2A6E 100%)',
        '0 1px 0 rgba(255,255,255,0.1) inset, 0 8px 22px -10px rgba(42,26,61,0.45)',
      )}
    >
      <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" aria-hidden fill="none">
        <path
          d="M21 12.5a4.5 4.5 0 1 1-7.5-3.4l-7.7 7.7a1.5 1.5 0 0 0 0 2.1l1.4 1.4a1.5 1.5 0 0 0 2.1 0L13 18.6"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="16.5" cy="7.5" r="1.2" fill="#fff" />
      </svg>
    </span>
  )
}
