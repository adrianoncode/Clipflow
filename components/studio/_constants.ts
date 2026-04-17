import { Smartphone, Monitor, Square } from 'lucide-react'
import type React from 'react'

/**
 * Render-studio constants — extracted from render-studio-client.tsx to
 * keep the main client component focused on orchestration.
 *
 * Not a 'use client' file — consumers re-export or import directly.
 */

export const PLATFORMS = [
  {
    value: '9:16' as const,
    label: 'TikTok',
    emoji: '🎵',
    desc: 'Vertical',
    icon: Smartphone,
    w: 14,
    h: 24,
  },
  {
    value: '9:16' as const,
    label: 'Reels',
    emoji: '📸',
    desc: 'Vertical',
    icon: Smartphone,
    w: 14,
    h: 24,
  },
  {
    value: '9:16' as const,
    label: 'Shorts',
    emoji: '▶️',
    desc: 'Vertical',
    icon: Smartphone,
    w: 14,
    h: 24,
  },
  {
    value: '1:1' as const,
    label: 'LinkedIn',
    emoji: '💼',
    desc: 'Square',
    icon: Square,
    w: 18,
    h: 18,
  },
  {
    value: '16:9' as const,
    label: 'Landscape',
    emoji: '🖥️',
    desc: 'Wide',
    icon: Monitor,
    w: 28,
    h: 16,
  },
] as const

export interface CaptionStyle {
  value: string
  label: string
  preview: string
  captionStyle: React.CSSProperties
  captionBg?: string
  phoneBg: string
  desc: string
  badge: string | null
  badgeColor: string
}

export const CAPTION_STYLES: readonly CaptionStyle[] = [
  {
    value: 'tiktok-bold',
    label: 'TikTok Bold',
    preview: 'BIG TEXT',
    captionStyle: {
      fontFamily: "'Arial Black', Arial",
      fontSize: 9,
      fontWeight: 900,
      color: '#FFFFFF',
      WebkitTextStroke: '0.5px #000',
      textAlign: 'center' as const,
      letterSpacing: '-0.3px',
      lineHeight: 1.1,
    },
    captionBg: undefined,
    phoneBg: 'linear-gradient(160deg, #0f0f0f 0%, #1a1a2e 100%)',
    desc: 'Huge white text, black stroke',
    badge: 'Most popular',
    badgeColor: 'bg-violet-600 text-white',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    preview: 'Clean text',
    captionStyle: {
      fontFamily: 'Arial',
      fontSize: 7,
      fontWeight: 500,
      color: 'rgba(255,255,255,0.95)',
      textAlign: 'center' as const,
      letterSpacing: '-0.1px',
    },
    captionBg: undefined,
    phoneBg: 'linear-gradient(160deg, #1a1a1a 0%, #2d2d3d 100%)',
    desc: 'Small, clean — premium / educational',
    badge: null,
    badgeColor: '',
  },
  {
    value: 'neon',
    label: 'Neon',
    preview: 'GLOW',
    captionStyle: {
      fontFamily: "'Arial Black', Arial",
      fontSize: 9,
      fontWeight: 800,
      color: '#FFE600',
      textShadow:
        '0 0 6px rgba(255,230,0,0.9), 0 0 14px rgba(255,230,0,0.5), 1px 1px 0 #000',
      textAlign: 'center' as const,
    },
    captionBg: undefined,
    phoneBg: 'linear-gradient(160deg, #0a0a0a 0%, #0a0a1a 100%)',
    desc: 'Yellow glow — gaming / high energy',
    badge: null,
    badgeColor: '',
  },
  {
    value: 'white-bar',
    label: 'White Bar',
    preview: 'Bar style',
    captionStyle: {
      fontFamily: 'Arial',
      fontSize: 7,
      fontWeight: 700,
      color: '#FFFFFF',
      textAlign: 'center' as const,
    },
    captionBg: 'rgba(0,0,0,0.72)',
    phoneBg: 'linear-gradient(160deg, #1f2937 0%, #111827 100%)',
    desc: 'Dark pill bar — Instagram Reels style',
    badge: null,
    badgeColor: '',
  },
]
