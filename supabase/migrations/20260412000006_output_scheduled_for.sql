-- M10: Add scheduled_for column to outputs for publishing calendar
alter table public.outputs
  add column if not exists scheduled_for timestamptz;

create index if not exists outputs_scheduled_for_idx
  on public.outputs(workspace_id, scheduled_for)
  where scheduled_for is not null;
