import 'server-only'

export interface CompetitorAnalysis {
  url: string
  title: string | null
  tone: string // e.g. "educational and formal"
  contentPillars: string[] // 3-5 main topics they cover
  writingStyle: string // brief description
  strengths: string[]
  gaps: string[] // topics they miss / opportunities for you
  targetAudience: string
  postingApproach: string // how they structure content
  differentiatorSuggestions: string[] // how YOU can stand out
  analyzedAt: string
}
