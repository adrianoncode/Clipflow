-- ============================================================================
--  AI Agent — multi-provider support
-- ============================================================================
--
--  Adds the `agent_provider` column to `agent_settings` so workspaces
--  can pin the agent to a specific LLM provider (anthropic | openai |
--  google). When NULL (default), the agent runtime auto-detects by
--  checking which providers have a stored key in `ai_keys`, in the
--  priority order [anthropic, openai, google].
--
--  Why not an enum: the list of supported providers will grow as the
--  agent layer adds adapters. text + check constraint is easier to
--  extend (one ALTER TABLE drops/recreates the constraint) than a
--  Postgres enum (which requires a migration to ALTER TYPE ... ADD
--  VALUE, which can't run inside a transaction in older PG versions).
-- ============================================================================

alter table public.agent_settings
  add column if not exists agent_provider text
    check (agent_provider in ('anthropic', 'openai', 'google'));

comment on column public.agent_settings.agent_provider is
  'Pinned LLM provider for the agent. NULL = auto-detect by trying anthropic, openai, google in order and using the first one with a stored ai_keys row. Set explicitly when the workspace owner wants a specific provider regardless of which keys are present.';
