-- ============================================================
-- 20260426000005_delete_group_rpc.sql
-- Fixes a cascade conflict: the prevent_last_moderator_removal
-- trigger on group_members fires during a group deletion's
-- cascade, preventing the delete from completing.
--
-- Solution: a security-definer RPC that:
--   1. Verifies the caller is a moderator
--   2. Sets a transaction-local flag that the trigger reads
--   3. Deletes the group (cascade handles the rest)
-- The trigger is updated to skip its check when that flag is set.
-- ============================================================

-- --------------------------------------------------------
-- 1. Update the trigger to respect the bypass flag
-- --------------------------------------------------------
create or replace function public.check_last_moderator_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_moderators int;
begin
  -- Allow cascade when the whole group is being deleted
  if current_setting('app.deleting_group', true) = 'true' then
    return OLD;
  end if;

  -- Only check when a moderator row is being deleted
  if OLD.role <> 'moderator' then
    return OLD;
  end if;

  select count(*)
    into remaining_moderators
  from public.group_members
  where group_id = OLD.group_id
    and role = 'moderator'
    and user_id <> OLD.user_id;

  if remaining_moderators = 0 then
    raise exception
      'Cannot remove the last moderator of a group. Transfer moderator rights to another member first.'
      using errcode = 'P0001';
  end if;

  return OLD;
end;
$$;

-- --------------------------------------------------------
-- 2. RPC that safely deletes a group as its moderator
-- --------------------------------------------------------
create or replace function public.delete_group_as_moderator(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verify the caller is a moderator of this group
  if not public.is_group_moderator(p_group_id, auth.uid()) then
    raise exception 'Not authorized to delete this Group' using errcode = 'PGRST301';
  end if;

  -- Set transaction-local flag so the trigger allows the cascade
  perform set_config('app.deleting_group', 'true', true);

  delete from public.groups where id = p_group_id;
end;
$$;

-- Grant execute to authenticated users (authorization enforced inside the function)
grant execute on function public.delete_group_as_moderator(uuid) to authenticated;
