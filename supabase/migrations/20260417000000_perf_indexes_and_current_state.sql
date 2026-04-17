-- ===========================================================================
-- Performance: composite indexes + outputs.current_state denormalization
-- ===========================================================================
-- Eliminates N+1 "fetch every output_states row and find latest in JS" scan
-- that currently happens on every pipeline/analytics/dashboard render.
--
-- Adds:
--   1. Composite index on outputs(workspace_id, created_at desc) — matches
--      the pattern used by pipeline, analytics, and dashboard queries.
--   2. Composite index on scheduled_posts(workspace_id, scheduled_for) —
--      matches get-scheduled-posts.ts query pattern.
--   3. Composite index on output_states(workspace_id, output_id,
--      created_at desc) — covers the remaining "give me all state history
--      for these outputs" queries.
--   4. Denormalized `outputs.current_state text` column kept in sync by a
--      trigger on output_states insert. Callers can now read the latest
--      state with a single SELECT instead of fetching full history.
--
-- Backfills existing outputs using distinct-on(output_id) ordered by
-- created_at desc — picks the most recent state per output.
-- ===========================================================================

-- ── Composite indexes ──────────────────────────────────────────────────
create index if not exists outputs_workspace_created_idx
  on public.outputs(workspace_id, created_at desc);

create index if not exists scheduled_posts_workspace_scheduled_idx
  on public.scheduled_posts(workspace_id, scheduled_for);

create index if not exists output_states_workspace_output_created_idx
  on public.output_states(workspace_id, output_id, created_at desc);

-- ── outputs.current_state denormalized column ──────────────────────────
-- Using text (not the enum) so the column is free to drift if we ever
-- need to add intermediate states without rewriting every row.
alter table public.outputs
  add column if not exists current_state text not null default 'draft';

-- Index for filter-by-state queries (e.g. pipeline board columns)
create index if not exists outputs_workspace_current_state_idx
  on public.outputs(workspace_id, current_state);

-- ── Backfill: set current_state to the most recent state per output ─────
-- One-time sync for every existing output. Runs fast because of the new
-- composite index above.
update public.outputs o
set current_state = latest.state
from (
  select distinct on (output_id) output_id, state
  from public.output_states
  order by output_id, created_at desc
) as latest
where latest.output_id = o.id
  and o.current_state <> latest.state;

-- ── Trigger: keep current_state in sync on every new state insert ──────
create or replace function public.sync_output_current_state()
returns trigger as $$
begin
  update public.outputs
  set current_state = new.state
  where id = new.output_id;
  return new;
end;
$$ language plpgsql security definer;

-- Security definer is safe here: the function only touches outputs and
-- only with the output_id the trigger was called for. It does NOT read
-- any user-controlled input that could be used to escalate.

drop trigger if exists output_states_sync_current_state on public.output_states;
create trigger output_states_sync_current_state
  after insert on public.output_states
  for each row
  execute function public.sync_output_current_state();
