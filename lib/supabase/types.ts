// ---------------------------------------------------------------------------
// Manually authored Database type stub.
//
// In normal operation this file is regenerated from the local Supabase DB via:
//   pnpm db:types
//
// The hand-written types below are kept in sync with
// supabase/migrations/20260411000000_init.sql so that the generic parameter on
// `createServerClient<Database>()` gives us real field-level type safety even
// before `pnpm db:types` has run.
// ---------------------------------------------------------------------------

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type WorkspaceType = 'personal' | 'team' | 'client'
export type WorkspaceRole = 'owner' | 'editor' | 'viewer' | 'client'
export type ContentKind = 'video' | 'text'
export type ContentStatus = 'uploading' | 'processing' | 'ready' | 'failed'
export type OutputPlatform = 'tiktok' | 'instagram_reels' | 'youtube_shorts' | 'linkedin'
export type OutputState = 'draft' | 'review' | 'approved' | 'exported'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          onboarded_at: string | null
          role_type: 'solo' | 'team' | 'agency' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          onboarded_at?: string | null
          role_type?: 'solo' | 'team' | 'agency' | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          type: WorkspaceType
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type: WorkspaceType
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['workspaces']['Insert']>
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
        Update: Partial<Database['public']['Tables']['workspace_members']['Insert']>
        Relationships: []
      }
      ai_keys: {
        Row: {
          id: string
          workspace_id: string
          provider: 'openai' | 'anthropic' | 'google'
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
          provider: 'openai' | 'anthropic' | 'google'
          label?: string | null
          ciphertext: string
          iv: string
          auth_tag: string
          masked_preview?: string | null
          created_by: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['ai_keys']['Insert']>
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
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
        Relationships: []
      }
      brand_voices: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          guidelines: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          guidelines?: Json
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['brand_voices']['Insert']>
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
        Update: Partial<Database['public']['Tables']['content_items']['Insert']>
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
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['outputs']['Insert']>
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
        Update: Partial<Database['public']['Tables']['output_states']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
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
    }
    CompositeTypes: Record<string, never>
  }
}
