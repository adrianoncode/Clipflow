-- ============================================================================
--  Workspace ownership invariants — last-owner protection + owner_id transfer
-- ============================================================================
--
--  W1: An owner could remove their own workspace_members row, leaving
--      the workspace with zero owners. RLS allowed it (`delete if owner
--      or self`). The workspace then existed but no one could rename,
--      delete, invite, or upgrade it. App-side checks are bypassable —
--      enforce the invariant in a SQL trigger.
--
--  W4: When the last (or any) owner leaves, `workspaces.owner_id` was
--      never updated, leaving a dangling reference to a non-member.
--      Future deletion or auditing keys off this column and breaks
--      silently. Trigger now nulls/transfers it.
--
--  Approach:
--    BEFORE DELETE on workspace_members:
--      - if role='owner' AND there's only one owner left → RAISE
--      - else: if this is the workspaces.owner_id, transfer to the
--        most-senior remaining member (deterministic ordering).
--
--    Same trigger on UPDATE OF role when an owner downgrades themselves
--    (last-owner protection) — prevents `update role='editor' where
--    user_id=auth.uid()` from orphaning the workspace.
-- ============================================================================

create or replace function public.protect_last_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_owners int;
  next_owner_id uuid;
  affected_workspace uuid;
  was_owner_role text;
begin
  -- Two trigger paths: DELETE (NEW is null) and UPDATE OF role (both rows).
  if tg_op = 'DELETE' then
    affected_workspace := old.workspace_id;
    was_owner_role := old.role;
  else
    affected_workspace := new.workspace_id;
    was_owner_role := old.role;
    -- If the role didn't change away from 'owner', let it through
    -- (could be a no-op or owner→owner).
    if old.role <> 'owner' or new.role = 'owner' then
      return new;
    end if;
  end if;

  -- Only fire if the affected user WAS an owner.
  if was_owner_role <> 'owner' then
    if tg_op = 'DELETE' then
      return old;
    else
      return new;
    end if;
  end if;

  -- Count owners that will remain after this operation. We exclude the
  -- row being deleted/demoted from the count.
  select count(*) into remaining_owners
  from public.workspace_members
  where workspace_id = affected_workspace
    and role = 'owner'
    and user_id <> coalesce(old.user_id, new.user_id);

  if remaining_owners = 0 then
    raise exception
      'Cannot remove or demote the last owner of workspace %. Promote another member to owner first, or delete the workspace.',
      affected_workspace;
  end if;

  -- W4: if `workspaces.owner_id` pointed at the leaving member, transfer
  -- to the most-senior remaining owner (oldest membership).
  select user_id into next_owner_id
  from public.workspace_members
  where workspace_id = affected_workspace
    and role = 'owner'
    and user_id <> coalesce(old.user_id, new.user_id)
  order by created_at asc
  limit 1;

  if next_owner_id is not null then
    update public.workspaces
    set owner_id = next_owner_id
    where id = affected_workspace
      and owner_id = coalesce(old.user_id, new.user_id);
  end if;

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end$$;

comment on function public.protect_last_owner() is
  'Trigger: prevents the last owner from leaving (delete or self-demote) and reassigns workspaces.owner_id to the next-most-senior owner when an owner does leave.';

drop trigger if exists workspace_members_protect_last_owner_delete
  on public.workspace_members;
create trigger workspace_members_protect_last_owner_delete
  before delete on public.workspace_members
  for each row execute function public.protect_last_owner();

drop trigger if exists workspace_members_protect_last_owner_update
  on public.workspace_members;
create trigger workspace_members_protect_last_owner_update
  before update of role on public.workspace_members
  for each row execute function public.protect_last_owner();
