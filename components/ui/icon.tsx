import type { LucideIcon } from 'lucide-react'
import type { ComponentProps } from 'react'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Tone = 'default' | 'muted' | 'primary' | 'accent' | 'success' | 'warn' | 'danger'

// Single source of truth for icon sizing + tonal color across the app.
// Use <Icon as={Plus} size="md" tone="primary" /> instead of hand-rolled
// `<Plus className="h-4 w-4 text-primary" />` so every icon agrees on
// stroke width, pixel size, and tonal mapping.
const SIZE_PX: Record<Size, number> = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }
const STROKE: Record<Size, number> = { xs: 1.75, sm: 1.75, md: 2, lg: 1.75, xl: 1.5 }
const TONE_COLOR: Record<Tone, string> = {
  default: '#181511',
  muted: '#7c7468',
  primary: '#0F0F0F',
  accent: '#F4D93D',
  success: '#0F6B4D',
  warn: '#A0530B',
  danger: '#9B2018',
}

type IconProps = Omit<ComponentProps<LucideIcon>, 'size' | 'strokeWidth' | 'color'> & {
  as: LucideIcon
  size?: Size
  tone?: Tone
}

export function Icon({ as: IconComponent, size = 'md', tone, className, style, ...rest }: IconProps) {
  const px = SIZE_PX[size]
  return (
    <IconComponent
      width={px}
      height={px}
      strokeWidth={STROKE[size]}
      className={className}
      style={tone ? { color: TONE_COLOR[tone], ...style } : style}
      {...rest}
    />
  )
}
