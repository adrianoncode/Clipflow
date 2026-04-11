-- ===========================================================================
-- Clipflow — Onboarding + BYOK persistence (Milestone 2)
-- ===========================================================================
-- Adds onboarding tracking to profiles, a masked-preview column to ai_keys,
-- and the create_workspace_with_owner RPC needed to bootstrap new team
-- workspaces without tripping the workspace_members "must already be owner to
-- insert" policy from M1.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. profiles: onboarding state
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column onboarded_at timestamptz,
  add column role_type    text check (role_type in ('solo', 'team', 'agency'));


-- ---------------------------------------------------------------------------
-- 2. ai_keys: non-sensitive preview for the vault UI (e.g., "sk-...abc4")
-- ---------------------------------------------------------------------------
alter table public.ai_keys
  add column masked_preview text;


-- ---------------------------------------------------------------------------
-- 3. Backfill: any profile that predates this migration counts as onboarded.
--    Role defaults to 'solo' since we can't reconstruct intent retroactively.
-- ---------------------------------------------------------------------------
update public.profiles
   set onboarded_at = coalesce(onboarded_at, created_at),
       role_type    = coalesce(role_type, 'solo')
 where onboarded_at is null;


-- ---------------------------------------------------------------------------
-- 4. RPC: atomically create a workspace and its first owner-member row.
--
-- Why this exists: the M1 policy "workspace_members: insert if owner" calls
-- is_workspace_member(workspace_id, 'owner'), but on the very first insert
-- into a brand-new workspace the caller isn't a member yet — so the policy
-- blocks. SECURITY DEFINER with an explicit auth.uid() check is the cleanest
-- escape hatch (the alternative is using the service-role client from the
-- app, which leaks admin privileges into user-facing action code).
-- search_path is pinned to defend against search-path hijack.
-- ---------------------------------------------------------------------------
create or replace function public.create_workspace_with_owner(
  _name text,
  _slug text,
  _type public.workspace_type
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_workspace_id uuid;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  insert into public.workspaces (name, slug, type, owner_id)
  values (_name, _slug, _type, auth.uid())
  returning id into v_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, auth.uid(), 'owner');

  return v_workspace_id;
end;
$$;

revoke all on function public.create_workspace_with_owner(text, text, public.workspace_type) from public;
grant execute on function public.create_workspace_with_owner(text, text, public.workspace_type) to authenticated;
