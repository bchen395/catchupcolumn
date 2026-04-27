-- ============================================================
-- 20260426000004_prevent_last_moderator_removal.sql
-- Add a BEFORE DELETE trigger on group_members that prevents
-- the last moderator of a group from being removed.
-- Without this, a sole moderator could leave a group, leaving
-- it permanently without any admin (nobody can update settings
-- or delete the group).
-- ============================================================

create or replace function public.check_last_moderator_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_moderators int;
begin
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

create trigger prevent_last_moderator_removal
  before delete on public.group_members
  for each row
  execute function public.check_last_moderator_removal();
