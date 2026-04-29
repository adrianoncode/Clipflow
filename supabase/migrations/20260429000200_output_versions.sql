-- ===========================================================================
-- output_versions — append-only history of every output body change
-- ===========================================================================
-- Today an output has exactly one body. When the user edits, we
-- overwrite. When AI regenerates, we delete + reinsert. Either way
-- the previous body is gone — no way to compare versions, roll back,
-- or feed the previous draft back into the LLM as context.
--
-- This table records every body-write as a numbered version. The
-- output_versions live forever (CASCADE on output delete only); the
-- outputs row keeps its current body for fast rendering.
--
-- source enum:
--   ai            — original AI generation OR fresh regenerate
--   edit          — user edited the body in the inline editor
--   reject_regen  — Slice 11 reject-with-comment triggered a regen
--                   that incorporated the revision_notes into the
--                   prompt (different from a no-context regen)
-- ===========================================================================

create table public.output_versions (
  id            uuid primary key default gen_random_uuid(),
  output_id     uuid not null references public.outputs(id) on delete cascade,
  workspace_id  uuid not null,
  /** Monotonically increasing per output_id. v1 is the initial AI gen. */
  version_number int not null check (version_number >= 1),
  source        text not null check (source in ('ai', 'edit', 'reject_regen')),
  body          text not null,
  /** Same shape as outputs.metadata — we copy the structured payload
   *  here so a version can be re-rendered without needing the live
   *  outputs row. */
  metadata      jsonb not null default '{}'::jsonb,
  created_by    uuid,
  created_at    timestamptz not null default now(),
  unique (output_id, version_number)
);

create index output_versions_output_idx
  on public.output_versions (output_id, version_number desc);

create index output_versions_workspace_idx
  on public.output_versions (workspace_id, created_at desc);

alter table public.output_versions enable row level security;

create policy "output_versions: read workspace members"
  on public.output_versions
  for select
  using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "output_versions: insert workspace members"
  on public.output_versions
  for insert
  with check (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

comment on table public.output_versions is
  'Append-only history of every body-write on an output. Powers the version badge ("v3") and the future "Keep edits, regenerate as v4" flow.';
