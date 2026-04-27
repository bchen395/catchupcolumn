-- ============================================================
-- 20260426000001_fix_group_created_trigger.sql
-- The rename migration (20260426000000) renamed the tables but did not
-- update the trigger function.  handle_new_column() still references
-- public.column_members and the old column_id column, causing every
-- INSERT into public.groups to roll back with
-- "relation column_members does not exist".
-- ============================================================

-- 1. Drop stale trigger (table was renamed; trigger followed it)
drop trigger if exists on_column_created on public.groups;

-- 2. Drop stale function
drop function if exists public.handle_new_column();

-- 3. Recreate with correct table/column names
create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'moderator');
  return new;
end;
$$;

-- 4. Attach to the groups table
create trigger on_group_created
  after insert on public.groups
  for each row
  execute function public.handle_new_group();
