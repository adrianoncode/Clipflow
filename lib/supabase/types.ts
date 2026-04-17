// ---------------------------------------------------------------------------
// Manually authored Database type stub.
//
// In normal operation this file is regenerated from the local Supabase DB via:
//   pnpm db:types
//
// The hand-written types below are kept in sync with
// supabase/migrations/20260411000000_init.sql and 20260412000000_onboarding.sql
// so that the generic parameter on `createServerClient<Database>()` gives us
// real field-level type safety even before `pnpm db:types` has run.
//
// NOTE: Update types are spelled out explicitly (not derived via
// `Partial<Insert>`) because the self-referential lookup
// `Partial<Database['public']['Tables']['x']['Insert']>` causes TypeScript's
// Supabase-js query builder inference to collapse to `never`.
// ---------------------------------------------------------------------------

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type WorkspaceType = 'personal' | 'team' | 'client'
export type WorkspaceRole = 'owner' | 'editor' | 'viewer' | 'client'
export type ContentKind = 'video' | 'text' | 'youtube' | 'url' | 'rss'
export type ContentStatus = 'uploading' | 'processing' | 'ready' | 'failed'
export type OutputPlatform = 'tiktok' | 'instagram_reels' | 'youtube_shorts' | 'linkedin'
export type OutputState = 'draft' | 'review' | 'approved' | 'exported'
export type OnboardingRoleType = 'solo' | 'team' | 'agency'
export type AiProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'shotstack'
  | 'replicate'
  | 'elevenlabs'
  | 'upload-post'
export type BillingPlan = 'free' | 'solo' | 'team' | 'agency'
export type ReferralStatus = 'pending' | 'confirmed' | 'blocked'
export type ScraperFeature =
  | 'trending_sounds'
  | 'hashtag_query'
  | 'competitor_analysis'
  | 'viral_discovery'
  | 'comment_mining'
export type RenderKind =
  | 'burn_captions'
  | 'assemble_broll'
  | 'branded_video'
  | 'clip'
  | 'batch_clip'
  | 'reframe'
  | 'subtitles'
  | 'avatar'
  | 'dub'
  | 'faceless'
export type RenderStatus = 'rendering' | 'done' | 'failed'
export type RenderProvider = 'shotstack' | 'replicate'
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          onboarded_at: string | null
          role_type: OnboardingRoleType | null
          referral_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          onboarded_at?: string | null
          role_type?: OnboardingRoleType | null
          referral_code?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          onboarded_at?: string | null
          role_type?: OnboardingRoleType | null
          referral_code?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          type: WorkspaceType
          owner_id: string
          branding: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type: WorkspaceType
          owner_id: string
          branding?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          type?: WorkspaceType
          owner_id?: string
          branding?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          workspace_id: string
          user_id: string
          role: WorkspaceRole
          created_at: string
        }
        Insert: {
          workspace_id: string
          user_id: string
          role: WorkspaceRole
          created_at?: string
        }
        Update: {
          workspace_id?: string
          user_id?: string
          role?: WorkspaceRole
          created_at?: string
        }
        Relationships: []
      }
      workspace_invites: {
        Row: {
          id: string
          token: string
          workspace_id: string
          invited_by: string
          email: string | null
          role: WorkspaceRole
          is_accepted: boolean
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          token?: string
          workspace_id: string
          invited_by: string
          email?: string | null
          role?: WorkspaceRole
          is_accepted?: boolean
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          token?: string
          workspace_id?: string
          invited_by?: string
          email?: string | null
          role?: WorkspaceRole
          is_accepted?: boolean
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
      ai_keys: {
        Row: {
          id: string
          workspace_id: string
          provider: AiProvider
          label: string | null
          ciphertext: string
          iv: string
          auth_tag: string
          masked_preview: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          provider: AiProvider
          label?: string | null
          ciphertext: string
          iv: string
          auth_tag: string
          masked_preview?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          provider?: AiProvider
          label?: string | null
          ciphertext?: string
          iv?: string
          auth_tag?: string
          masked_preview?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      brand_voices: {
        Row: {
          id: string
          workspace_id: string
          name: string
          tone: string | null
          avoid: string | null
          example_hook: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name?: string
          tone?: string | null
          avoid?: string | null
          example_hook?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          tone?: string | null
          avoid?: string | null
          example_hook?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          id: string
          workspace_id: string
          project_id: string | null
          kind: ContentKind
          status: ContentStatus
          title: string | null
          source_url: string | null
          transcript: string | null
          metadata: Json
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          project_id?: string | null
          kind: ContentKind
          status?: ContentStatus
          title?: string | null
          source_url?: string | null
          transcript?: string | null
          metadata?: Json
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          project_id?: string | null
          kind?: ContentKind
          status?: ContentStatus
          title?: string | null
          source_url?: string | null
          transcript?: string | null
          metadata?: Json
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      outputs: {
        Row: {
          id: string
          content_id: string
          workspace_id: string
          platform: OutputPlatform
          body: string | null
          metadata: Json
          is_starred: boolean
          scheduled_for: string | null
          current_state: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_id: string
          workspace_id: string
          platform: OutputPlatform
          body?: string | null
          metadata?: Json
          is_starred?: boolean
          scheduled_for?: string | null
          current_state?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          workspace_id?: string
          platform?: OutputPlatform
          body?: string | null
          metadata?: Json
          is_starred?: boolean
          scheduled_for?: string | null
          current_state?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      output_states: {
        Row: {
          id: string
          output_id: string
          workspace_id: string
          state: OutputState
          changed_by: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          output_id: string
          workspace_id: string
          state: OutputState
          changed_by?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          output_id?: string
          workspace_id?: string
          state?: OutputState
          changed_by?: string | null
          note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      review_links: {
        Row: {
          id: string
          token: string
          workspace_id: string
          content_id: string
          created_by: string
          label: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          token?: string
          workspace_id: string
          content_id: string
          created_by: string
          label?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          token?: string
          workspace_id?: string
          content_id?: string
          created_by?: string
          label?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      review_comments: {
        Row: {
          id: string
          review_link_id: string
          output_id: string | null
          reviewer_name: string
          reviewer_email: string | null
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          review_link_id: string
          output_id?: string | null
          reviewer_name: string
          reviewer_email?: string | null
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          review_link_id?: string
          output_id?: string | null
          reviewer_name?: string
          reviewer_email?: string | null
          body?: string
          created_at?: string
        }
        Relationships: []
      }
      scraper_usage: {
        Row: {
          id: string
          workspace_id: string
          feature: ScraperFeature
          target: string | null
          cache_hit: boolean
          cache_key: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          feature: ScraperFeature
          target?: string | null
          cache_hit?: boolean
          cache_key?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          feature?: ScraperFeature
          target?: string | null
          cache_hit?: boolean
          cache_key?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      scraper_cache: {
        Row: {
          cache_key: string
          actor: string
          data: Json
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          cache_key: string
          actor: string
          data: Json
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          cache_key?: string
          actor?: string
          data?: Json
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      renders: {
        Row: {
          id: string
          workspace_id: string
          content_id: string | null
          kind: RenderKind
          provider: RenderProvider
          provider_render_id: string | null
          status: RenderStatus
          url: string | null
          error: string | null
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          content_id?: string | null
          kind: RenderKind
          provider?: RenderProvider
          provider_render_id?: string | null
          status?: RenderStatus
          url?: string | null
          error?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          content_id?: string | null
          kind?: RenderKind
          provider?: RenderProvider
          provider_render_id?: string | null
          status?: RenderStatus
          url?: string | null
          error?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          referrer_user_id: string
          referee_user_id: string
          status: ReferralStatus
          source: string | null
          confirmed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          referrer_user_id: string
          referee_user_id: string
          status?: ReferralStatus
          source?: string | null
          confirmed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          referrer_user_id?: string
          referee_user_id?: string
          status?: ReferralStatus
          source?: string | null
          confirmed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          workspace_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan: BillingPlan
          status: SubscriptionStatus | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: BillingPlan
          status?: SubscriptionStatus | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: BillingPlan
          status?: SubscriptionStatus | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          platform: string
          platform_user_id: string
          platform_username: string | null
          access_token: string
          refresh_token: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          platform: string
          platform_user_id: string
          platform_username?: string | null
          access_token: string
          refresh_token?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          platform?: string
          platform_user_id?: string
          platform_username?: string | null
          access_token?: string
          refresh_token?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          id: string
          workspace_id: string
          output_id: string
          social_account_id: string | null
          platform: string
          scheduled_for: string
          status: string
          published_at: string | null
          platform_post_id: string | null
          error_message: string | null
          metadata: Json
          stats_fetched_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          output_id: string
          social_account_id?: string | null
          platform: string
          scheduled_for: string
          status?: string
          published_at?: string | null
          platform_post_id?: string | null
          error_message?: string | null
          metadata?: Json
          stats_fetched_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          output_id?: string
          social_account_id?: string | null
          platform?: string
          scheduled_for?: string
          status?: string
          published_at?: string | null
          platform_post_id?: string | null
          error_message?: string | null
          metadata?: Json
          stats_fetched_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          type: string
          title: string
          body: string | null
          link: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id?: string | null
          type: string
          title: string
          body?: string | null
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          type?: string
          title?: string
          body?: string | null
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      voice_clones: {
        Row: {
          id: string
          workspace_id: string
          name: string
          elevenlabs_voice_id: string
          is_default: boolean
          sample_url: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          elevenlabs_voice_id: string
          is_default?: boolean
          sample_url?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          elevenlabs_voice_id?: string
          is_default?: boolean
          sample_url?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      algorithm_updates: {
        Row: {
          id: string
          source: string
          title: string
          summary: string | null
          url: string | null
          platforms: string[]
          ai_recommendations: string[]
          published_at: string | null
          fetched_at: string
        }
        Insert: {
          id?: string
          source: string
          title: string
          summary?: string | null
          url?: string | null
          platforms?: string[]
          ai_recommendations?: string[]
          published_at?: string | null
          fetched_at?: string
        }
        Update: {
          id?: string
          source?: string
          title?: string
          summary?: string | null
          url?: string | null
          platforms?: string[]
          ai_recommendations?: string[]
          published_at?: string | null
          fetched_at?: string
        }
        Relationships: []
      }
      ai_personas: {
        Row: {
          id: string
          workspace_id: string
          name: string
          backstory: string
          expertise_areas: string[]
          writing_quirks: string
          example_responses: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          backstory?: string
          expertise_areas?: string[]
          writing_quirks?: string
          example_responses?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          backstory?: string
          expertise_areas?: string[]
          writing_quirks?: string
          example_responses?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          id: string
          workspace_id: string
          name: string
          url: string
          events: string[]
          is_active: boolean
          created_by: string | null
          created_at: string
          last_triggered_at: string | null
          last_status: number | null
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          url: string
          events?: string[]
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          last_triggered_at?: string | null
          last_status?: number | null
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          url?: string
          events?: string[]
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          last_triggered_at?: string | null
          last_status?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_workspace_member: {
        Args: { _workspace_id: string; _role?: WorkspaceRole | null }
        Returns: boolean
      }
      is_workspace_editor_or_above: {
        Args: { _workspace_id: string }
        Returns: boolean
      }
      create_workspace_with_owner: {
        Args: { _name: string; _slug: string; _type: WorkspaceType }
        Returns: string
      }
    }
    Enums: {
      workspace_type: WorkspaceType
      workspace_role: WorkspaceRole
      content_kind: ContentKind
      content_status: ContentStatus
      output_platform: OutputPlatform
      output_state: OutputState
      billing_plan: BillingPlan
      subscription_status: SubscriptionStatus
      referral_status: ReferralStatus
      render_kind: RenderKind
      render_status: RenderStatus
      render_provider: RenderProvider
      scraper_feature: ScraperFeature
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
