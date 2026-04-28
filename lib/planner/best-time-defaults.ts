/**
 * Industry-default best-time slots per platform.
 *
 * Used as the cold-start signal for the AI Content Planner — when a
 * workspace hasn't published enough posts to compute its own
 * audience-specific peaks, we seed the plan with these well-known
 * windows. Pulled from public engagement studies (Buffer, Sprout
 * Social, Later, HubSpot) cross-referenced against creator-side
 * observations from 2025/2026.
 *
 * Each slot is one (weekday, hour, minutes) tuple in workspace-local
 * time. Times are interpreted by the planner against whatever
 * timezone the workspace's owner publishes in.
 *
 * The data is intentionally a per-platform array, not a per-niche
 * map. Niche tuning happens at the LLM layer — we tell the model
 * "here are the platform defaults, here's the user's brand niche,
 * adjust where useful". Hardcoding 50 niche-specific maps would be
 * stale within months.
 */

import type { OutputPlatform } from '@/lib/platforms'

export interface BestTimeSlot {
  /** 0 = Sunday, 1 = Monday, ..., 6 = Saturday — JS getDay() convention. */
  dayOfWeek: number
  hour: number
  minute: number
  /** Free-form context the LLM gets as a hint. */
  rationale: string
}

const TIKTOK: BestTimeSlot[] = [
  { dayOfWeek: 2, hour: 9, minute: 0, rationale: 'Tuesday morning peak — pre-work scroll' },
  { dayOfWeek: 2, hour: 19, minute: 30, rationale: 'Tuesday evening peak' },
  { dayOfWeek: 3, hour: 7, minute: 30, rationale: 'Wednesday early — morning commute' },
  { dayOfWeek: 4, hour: 12, minute: 0, rationale: 'Thursday lunch break' },
  { dayOfWeek: 5, hour: 17, minute: 0, rationale: 'Friday late afternoon — wind-down' },
  { dayOfWeek: 0, hour: 11, minute: 0, rationale: 'Sunday late morning — high US engagement' },
]

const INSTAGRAM_REELS: BestTimeSlot[] = [
  { dayOfWeek: 1, hour: 9, minute: 0, rationale: 'Monday 9am — peak Reels engagement' },
  { dayOfWeek: 2, hour: 12, minute: 0, rationale: 'Tuesday lunch' },
  { dayOfWeek: 3, hour: 19, minute: 0, rationale: 'Wednesday evening' },
  { dayOfWeek: 4, hour: 9, minute: 0, rationale: 'Thursday morning' },
  { dayOfWeek: 4, hour: 21, minute: 0, rationale: 'Thursday late evening' },
  { dayOfWeek: 5, hour: 13, minute: 0, rationale: 'Friday early afternoon' },
]

const YOUTUBE_SHORTS: BestTimeSlot[] = [
  { dayOfWeek: 2, hour: 18, minute: 0, rationale: 'Tuesday after-work' },
  { dayOfWeek: 3, hour: 18, minute: 0, rationale: 'Wednesday after-work' },
  { dayOfWeek: 4, hour: 18, minute: 0, rationale: 'Thursday after-work — strongest weekday' },
  { dayOfWeek: 5, hour: 15, minute: 0, rationale: 'Friday afternoon' },
  { dayOfWeek: 6, hour: 11, minute: 0, rationale: 'Saturday late morning' },
  { dayOfWeek: 0, hour: 11, minute: 0, rationale: 'Sunday late morning' },
]

const LINKEDIN: BestTimeSlot[] = [
  { dayOfWeek: 2, hour: 8, minute: 30, rationale: 'Tuesday before-meetings — peak B2B' },
  { dayOfWeek: 2, hour: 12, minute: 0, rationale: 'Tuesday lunch' },
  { dayOfWeek: 3, hour: 8, minute: 30, rationale: 'Wednesday before-meetings — strongest day' },
  { dayOfWeek: 3, hour: 17, minute: 0, rationale: 'Wednesday end-of-day' },
  { dayOfWeek: 4, hour: 9, minute: 0, rationale: 'Thursday morning' },
  { dayOfWeek: 4, hour: 12, minute: 0, rationale: 'Thursday lunch' },
]

const PINTEREST: BestTimeSlot[] = [
  // Pinterest is bimodal — early morning saves and late-evening
  // discovery. Saturday is also a top day historically.
  { dayOfWeek: 6, hour: 20, minute: 0, rationale: 'Saturday evening — strongest Pinterest day' },
  { dayOfWeek: 0, hour: 20, minute: 0, rationale: 'Sunday evening — discovery peak' },
  { dayOfWeek: 5, hour: 20, minute: 0, rationale: 'Friday evening' },
  { dayOfWeek: 1, hour: 8, minute: 0, rationale: 'Monday morning — weekly planner saves' },
  { dayOfWeek: 3, hour: 21, minute: 0, rationale: 'Wednesday late — bookmark-for-later' },
  { dayOfWeek: 4, hour: 21, minute: 0, rationale: 'Thursday late' },
]

export const BEST_TIMES_BY_PLATFORM: Record<OutputPlatform, BestTimeSlot[]> = {
  tiktok: TIKTOK,
  instagram_reels: INSTAGRAM_REELS,
  youtube_shorts: YOUTUBE_SHORTS,
  linkedin: LINKEDIN,
  pinterest: PINTEREST,
}

/**
 * Default per-platform cadence (posts per week) — applied if the
 * workspace's brand settings don't carry an explicit override. Used
 * by the planner to know when to STOP suggesting more slots for a
 * given platform in the same week.
 */
export const DEFAULT_CADENCE_PER_WEEK: Record<OutputPlatform, number> = {
  tiktok: 4,
  instagram_reels: 3,
  youtube_shorts: 3,
  linkedin: 3,
  pinterest: 5,
}
