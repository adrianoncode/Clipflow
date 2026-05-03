import { describe, it, expect } from 'vitest'
import {
  OUTPUT_PLATFORMS,
  PUBLISH_PLATFORMS,
  PLATFORM_LABELS,
  PLATFORM_LONG_LABELS,
  platformLabel,
  platformLongLabel,
  outputToPublishPlatform,
} from '@/lib/platforms'

describe('lib/platforms', () => {
  it('exports all output platforms', () => {
    expect(OUTPUT_PLATFORMS).toEqual([
      'tiktok',
      'instagram_reels',
      'youtube_shorts',
      'linkedin',
    ])
  })

  it('exports all publish platforms (plain names)', () => {
    expect(PUBLISH_PLATFORMS).toEqual([
      'tiktok',
      'instagram',
      'youtube',
      'linkedin',
    ])
  })

  it('PLATFORM_LABELS has short labels per platform', () => {
    expect(PLATFORM_LABELS.instagram_reels).toBe('Reels')
    expect(PLATFORM_LABELS.youtube_shorts).toBe('Shorts')
    expect(PLATFORM_LABELS.tiktok).toBe('TikTok')
    expect(PLATFORM_LABELS.linkedin).toBe('LinkedIn')
  })

  it('PLATFORM_LONG_LABELS uses full names', () => {
    expect(PLATFORM_LONG_LABELS.instagram_reels).toBe('Instagram Reels')
    expect(PLATFORM_LONG_LABELS.youtube_shorts).toBe('YouTube Shorts')
  })

  it('platformLabel falls back gracefully for unknown platforms', () => {
    expect(platformLabel('tiktok')).toBe('TikTok')
    expect(platformLabel('some_new_platform')).toBe('some_new_platform')
    expect(platformLabel(null)).toBe('Unknown')
    expect(platformLabel(undefined)).toBe('Unknown')
  })

  it('platformLongLabel mirrors platformLabel for long form', () => {
    expect(platformLongLabel('instagram_reels')).toBe('Instagram Reels')
    expect(platformLongLabel(null)).toBe('Unknown')
  })

  it('outputToPublishPlatform maps correctly', () => {
    expect(outputToPublishPlatform('tiktok')).toBe('tiktok')
    expect(outputToPublishPlatform('instagram_reels')).toBe('instagram')
    expect(outputToPublishPlatform('youtube_shorts')).toBe('youtube')
    expect(outputToPublishPlatform('linkedin')).toBe('linkedin')
  })
})
