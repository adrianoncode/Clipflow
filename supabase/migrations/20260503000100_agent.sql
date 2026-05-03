-- ============================================================================
--  AI Agent — chat conversations, autonomous runs, tool-call telemetry,
--  per-workspace settings + budgets.
-- ============================================================================
--
--  Five tables back the agent layer (see lib/agent/):
--
--    agent_conversations  — chat sessions (one row per chat thread)
--    agent_messages       — turn-by-turn history (user|assistant|tool)
--    agent_runs           — every loop invocation, chat OR autopilot,
--                           with state machine for pause/resume on
--                           async tool work (transcription, render).
--    agent_tool_calls     — telemetry: every tool invocation logged
--                           with input, output, latency, cost, success.
--    agent_settings       — per-workspace toggles (auto_process,
--                           auto_highlights, auto_drafts, auto_schedule)
--                           + budget caps + model selection.
--
--  Design choices:
--
--  - **Chat and autopilot are technically separate run-types** even
--    though they share the inner tool loop. `agent_runs.kind` is the
--    discriminator. Dashboards aggregate separately, budgets apply
--    independently. Easier debugging + future per-type tuning.
--
--  - **Approve step is hard-coded human-only** — there is NO
--    `auto_approve` toggle. Workflow can be fully automated except for
--    the human gate at draft → approved. Defense in depth: the
--    schedule_post tool handler also re-checks state internally and
--    refuses non-approved outputs (the model can't bypass).
--
--  - **agent_runs.waiting_on** is jsonb describing the external
--    condition the run is parked on, e.g.
--      { "kind": "content_item_status", "id": "uuid", "expected": "transcribed" }
--    Webhooks (zapcap, shotstack) wake parked runs by querying this
--    column. Cron at 5-min interval is the dropped-webhook fallback.
--
--  - **All amounts in micro-USD** (bigint) to avoid floating-point
--    drift on cost summing. UI converts to dollars at render.
--
--  - **RLS**: members can read their workspace's runs/messages/calls;
--    only owners can mutate agent_settings. Service-role used by the
--    cron sweep + webhook resume path.
-- ============================================================================

-- ─── ENUMS ─────────────────────────────────────────────────────────────

do $$ begin
  create type public.agent_run_kind as enum ('chat', 'autopilot');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.agent_run_status as enum (
    'queued',
    'running',
    'waiting_external',
    'complete',
    'failed',
    'budget_exceeded',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.agent_message_role as enum ('user', 'assistant', 'tool');
exception when duplicate_object then null; end $$;

-- ─── agent_conversations ──────────────────────────────────────────────

create table if not exists public.agent_conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create index if not exists agent_conversations_workspace_recent_idx
  on public.agent_conversations (workspace_id, last_message_at desc);

comment on table public.agent_conversations is
  'Chat threads between a user and the agent. One row per conversation. Autopilot runs do NOT create conversations.';

-- ─── agent_runs ───────────────────────────────────────────────────────
-- Created BEFORE agent_messages so messages can FK to runs (each
-- assistant turn corresponds to exactly one run).

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  kind public.agent_run_kind not null,
  conversation_id uuid references public.agent_conversations(id) on delete cascade,
  -- For autopilot: which trigger fired this run + what it's scoped to.
  -- Example: { "trigger": "auto_highlights", "content_id": "uuid" }
  trigger jsonb not null default '{}'::jsonb,
  status public.agent_run_status not null default 'queued',
  -- External condition the run is parked on (waiting_external only).
  waiting_on jsonb,
  waiting_since timestamptz,
  -- Hard kill time — runs in waiting_external past this become failed.
  deadline timestamptz,
  -- Cumulative cost across the entire run, in micro-USD (1 USD = 1e6).
  total_cost_micro_usd bigint not null default 0 check (total_cost_micro_usd >= 0),
  total_tool_calls integer not null default 0 check (total_tool_calls >= 0),
  total_input_tokens integer not null default 0 check (total_input_tokens >= 0),
  total_output_tokens integer not null default 0 check (total_output_tokens >= 0),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  error text,
  -- Optimistic lock for the cron sweep — increments on every status
  -- transition so two cron ticks can't double-process the same run.
  version integer not null default 0,
  constraint agent_runs_chat_has_conversation
    check (kind <> 'chat' or conversation_id is not null),
  constraint agent_runs_complete_has_ended_at
    check (
      status not in ('complete', 'failed', 'budget_exceeded', 'cancelled')
      or ended_at is not null
    )
);

create index if not exists agent_runs_workspace_recent_idx
  on public.agent_runs (workspace_id, started_at desc);

create index if not exists agent_runs_waiting_external_idx
  on public.agent_runs (status, waiting_since)
  where status = 'waiting_external';

create index if not exists agent_runs_conversation_idx
  on public.agent_runs (conversation_id)
  where conversation_id is not null;

comment on table public.agent_runs is
  'One row per agent loop invocation (chat turn or autopilot run). Runs can park in waiting_external when waiting for async tool work; webhooks resume them. Cron sweeps stuck waiting_external runs past deadline.';

comment on column public.agent_runs.waiting_on is
  'JSON describing the external condition this run is parked on. Example: {"kind":"content_item_status","id":"uuid","expected":"transcribed"}. Webhooks query this to find runs to wake.';

-- ─── agent_messages ───────────────────────────────────────────────────

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.agent_conversations(id) on delete cascade,
  run_id uuid references public.agent_runs(id) on delete set null,
  role public.agent_message_role not null,
  -- Content block array (Anthropic SDK shape: text, tool_use, tool_result).
  content jsonb not null,
  tokens_input integer,
  tokens_output integer,
  cost_micro_usd bigint check (cost_micro_usd is null or cost_micro_usd >= 0),
  created_at timestamptz not null default now()
);

create index if not exists agent_messages_conversation_idx
  on public.agent_messages (conversation_id, created_at);

comment on table public.agent_messages is
  'Turn-by-turn chat history. Anthropic content-block shape stored as jsonb for flexibility (text + tool_use + tool_result blocks).';

-- ─── agent_tool_calls ─────────────────────────────────────────────────

create table if not exists public.agent_tool_calls (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  tool_name text not null,
  input jsonb not null,
  output jsonb,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  cost_micro_usd bigint not null default 0 check (cost_micro_usd >= 0),
  success boolean not null,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists agent_tool_calls_run_idx
  on public.agent_tool_calls (run_id, created_at);

create index if not exists agent_tool_calls_workspace_recent_idx
  on public.agent_tool_calls (workspace_id, created_at desc);

create index if not exists agent_tool_calls_tool_idx
  on public.agent_tool_calls (tool_name, created_at desc);

comment on table public.agent_tool_calls is
  'Telemetry: one row per tool invocation. Used for debugging (which tool failed?), cost auditing, and Phase 2.5 wrong-tool-rate analysis.';

-- ─── agent_settings ───────────────────────────────────────────────────

create table if not exists public.agent_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  -- Per-step auto-pilot toggles. Default false — agent does nothing
  -- autonomously until owner opts in. Approve is intentionally absent
  -- (hard-coded human-only).
  auto_process boolean not null default false,
  auto_highlights boolean not null default false,
  auto_drafts boolean not null default false,
  auto_schedule boolean not null default false,
  -- Default platforms for auto-drafts when not specified per content.
  default_publish_platforms text[] not null default array['linkedin']::text[],
  -- Budget caps in micro-USD. Defaults are conservative.
  chat_max_cost_per_conversation_micro_usd bigint not null default 500000   -- $0.50
    check (chat_max_cost_per_conversation_micro_usd > 0),
  autopilot_max_cost_per_run_micro_usd bigint not null default 5000000      -- $5.00
    check (autopilot_max_cost_per_run_micro_usd > 0),
  -- Tool-call ceilings. Per-turn applies to chat (each user message);
  -- per-run is the run-wide cap (chat conversations have many turns).
  chat_max_tools_per_turn integer not null default 8 check (chat_max_tools_per_turn > 0),
  chat_max_tools_per_run integer not null default 25 check (chat_max_tools_per_run > 0),
  autopilot_max_tools_per_run integer not null default 12 check (autopilot_max_tools_per_run > 0),
  -- Model override. NULL = use platform default (claude-haiku-4-5).
  agent_model text,
  updated_at timestamptz not null default now()
);

comment on table public.agent_settings is
  'Per-workspace agent configuration: per-step auto-pilot toggles, budget caps, model override. Owner-only. Default-safe (everything off).';

comment on column public.agent_settings.auto_schedule is
  'When true, agent automatically schedules approved drafts. Does NOT auto-approve — only schedules outputs already in approved state.';

-- ─── RLS ───────────────────────────────────────────────────────────────

alter table public.agent_conversations enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_messages enable row level security;
alter table public.agent_tool_calls enable row level security;
alter table public.agent_settings enable row level security;

-- agent_conversations: members can read their workspace's; user can
-- only insert/delete conversations they own.
drop policy if exists "members read agent_conversations" on public.agent_conversations;
create policy "members read agent_conversations"
  on public.agent_conversations for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "user owns agent_conversations" on public.agent_conversations;
create policy "user owns agent_conversations"
  on public.agent_conversations for all
  using (
    public.is_workspace_member(workspace_id)
    and user_id = auth.uid()
  )
  with check (
    public.is_workspace_member(workspace_id)
    and user_id = auth.uid()
  );

-- agent_runs: members read; only service-role writes (run lifecycle is
-- managed server-side by the agent loop, never directly by users).
drop policy if exists "members read agent_runs" on public.agent_runs;
create policy "members read agent_runs"
  on public.agent_runs for select
  using (public.is_workspace_member(workspace_id));

-- agent_messages: members read messages in their workspace's
-- conversations.
drop policy if exists "members read agent_messages" on public.agent_messages;
create policy "members read agent_messages"
  on public.agent_messages for select
  using (
    exists (
      select 1 from public.agent_conversations c
      where c.id = agent_messages.conversation_id
        and public.is_workspace_member(c.workspace_id)
    )
  );

-- agent_tool_calls: members read.
drop policy if exists "members read agent_tool_calls" on public.agent_tool_calls;
create policy "members read agent_tool_calls"
  on public.agent_tool_calls for select
  using (public.is_workspace_member(workspace_id));

-- agent_settings: owner-only (read + write).
drop policy if exists "owner reads agent_settings" on public.agent_settings;
create policy "owner reads agent_settings"
  on public.agent_settings for select
  using (public.is_workspace_member(workspace_id, 'owner'));

drop policy if exists "owner writes agent_settings" on public.agent_settings;
create policy "owner writes agent_settings"
  on public.agent_settings for all
  using (public.is_workspace_member(workspace_id, 'owner'))
  with check (public.is_workspace_member(workspace_id, 'owner'));

-- ─── updated_at trigger for agent_settings ────────────────────────────

create or replace function public.touch_agent_settings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agent_settings_updated_at on public.agent_settings;
create trigger agent_settings_updated_at
  before update on public.agent_settings
  for each row execute function public.touch_agent_settings_updated_at();
