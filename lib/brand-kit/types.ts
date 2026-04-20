// Shared shape for the per-workspace brand kit. Stored in the
// `workspaces.branding` JSON column so reads are one SQL hop, no new
// table, and workspace RLS is inherited automatically.
//
// Every field is optional — a fresh workspace saves nothing and the
// render pipeline falls back to Clipflow-neutral defaults.
export interface BrandKit {
  /** Public-readable URL of the logo (Supabase Storage path). */
  logoUrl?: string
  /** Which corner the logo watermarks to on rendered clips. */
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Hex, used for intro/outro slide gradients and accent pulls. */
  accentColor?: string
  /** Human font family — Shotstack is picky, so we keep a short allowlist. */
  fontFamily?: 'Inter' | 'Poppins' | 'Montserrat' | 'Roboto' | 'Helvetica'
  /** Optional 2-second intro slide text. */
  introText?: string
  /** Optional 3-second outro slide text. */
  outroText?: string
}

export const FONT_CHOICES: NonNullable<BrandKit['fontFamily']>[] = [
  'Inter',
  'Poppins',
  'Montserrat',
  'Roboto',
  'Helvetica',
]

export const WATERMARK_POSITIONS: NonNullable<BrandKit['watermarkPosition']>[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
]

export const DEFAULT_BRAND_KIT: BrandKit = {
  accentColor: '#2A1A3D',
  fontFamily: 'Inter',
  watermarkPosition: 'bottom-right',
}
