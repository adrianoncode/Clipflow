-- ===========================================================================
-- User feedback — dropbox for the in-app feedback widget
-- ===========================================================================
-- Deliberately tiny table: type + message + the user who sent it (nullable
-- so anon feedback via a signed-out page also works later). Writes only,
-- reads restricted to the service-role — we surface the contents via a
-- Retool-style admin view, not the app UI.
-- ===========================================================================

create type public.feedback_type as enum ('bug', 'feature', 'feedback');

create table public.user_feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  /** Mirrored from the enum for Retool-style filters. */
  type        public.feedback_type not null,
  message     text not null check (char_length(message) between 1 and 4000),
  /** Populated from headers at write-time: user agent, referer path. Helps
   *  triage where a bug was reported from. Not IP — we don't need that. */
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index user_feedback_created_at_idx
  on public.user_feedback (created_at desc);

-- ---------------------------------------------------------------------------
-- RLS: authenticated users can INSERT their own feedback. No SELECT/UPDATE/
-- DELETE — we review via service-role tooling.
-- ---------------------------------------------------------------------------
alter table public.user_feedback enable row level security;

create policy "user_feedback: insert own"
  on public.user_feedback for insert
  to authenticated
  with check (user_id is null or user_id = auth.uid());
