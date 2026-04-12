import 'server-only'
import type { TrendItem } from './fetch-google-trends'

export interface MatchedTrend {
  trend: TrendItem
  relevanceScore: number // 0-100
  contentAngle: string // AI-generated content angle suggestion
  isRelevant: boolean
}

export interface TrendMatchResult {
  niche: string
  matchedTrends: MatchedTrend[]
  contentIdeas: string[] // 3-5 content ideas based on trends
  analyzedAt: string
}
