-- ============================================================
-- 20261030172045_creator_account_deletion.sql
--
-- A Group's creator couldn't delete their account, and the cascade that
-- stopped them would have taken the Group with them.
--
-- groups.created_by has been `references public.users(id) on delete cascade`
-- since 001_initial_schema, and public.users.id cascades from auth.users. So
-- deleting a creator runs
--
--   auth.users -> public.users -> groups (created_by)
--     -> that Group's editions, posts and group_members, for every member
--
-- prepare_account_deletion (20260923003208) removes the leaver's memberships,
-- deletes Groups they were alone in and promotes a successor moderator, but it
-- never touched created_by. The dashboard's "Delete user" doesn't call it at all.
--
-- What actually happens today (replayed on PostgreSQL 17 with this repo's full
-- migration history, 2026-10-30): the cascade reaches the Group's member rows,
-- prevent_last_moderator_removal sees its last moderator going without
-- app.deleting_group set, and raises "Cannot remove the last moderator of a
-- group". The flag can't help: prepare_account_deletion sets it transaction-
-- locally, and the edge function's auth.admin.deleteUser is a later
-- transaction. So, for anyone who created a Group that still has members,
-- including one they have since left:
--
--   * in the app, prepare_account_deletion commits (memberships, avatar and
--     photos gone, a contributor promoted), then deleteUser fails and the
--     function returns 500. The account still exists. Every retry fails the
--     same way;
--   * from the dashboard, the delete fails outright.
--
-- The Group survives only because that trigger happens to sit in the
-- cascade's path. Any transaction with the bypass flag on, or a Group with
-- members and no moderator, would let the cascade delete it for everyone.
--
-- The fix, in three parts:
--
-- 1. hand_over_groups(user): the one rule for a person leaving every Group at
--    once, used by both deletion paths. For each Group they are in or created,
--    locked in id order:
--      * nobody else is in it      -> delete it, and its cover, as before;
--      * they are its last moderator -> the earliest contributor becomes
--        moderator (the rule prepare_account_deletion already had);
--      * they created it           -> created_by passes to a moderator
--        (after that promotion), otherwise the earliest member by joined_at.
--    Groups they created but have since left are covered: the loop selects on
--    created_by as well as on membership.
--
-- 2. A BEFORE DELETE trigger on public.users runs it, so every path that
--    deletes a person runs it: the delete-account edge function, the
--    dashboard, and raw SQL. In the app path prepare_account_deletion has
--    already done the work, and the trigger finds nothing left to do.
--    prepare_account_deletion calls the same function, because it deletes the
--    leaver's memberships with app.deleting_group on and must promote first.
--
-- 3. groups.created_by no longer cascades (ON DELETE NO ACTION). With the
--    trigger in place the cascade never has a row to act on, so this changes
--    nothing that works today. It makes "a Group is only ever deleted by an
--    explicit DELETE on groups" a property of the schema rather than of one
--    trigger body. If the hand-over is ever missed (the trigger disabled, or
--    a later edit that skips a case), the delete fails instead of taking the
--    Group with it. That holds even in a transaction with app.deleting_group
--    on, where prevent_last_moderator_removal wouldn't stop the cascade.
--
-- Why a trigger and not only the foreign key: NO ACTION alone protects the
-- Group, but deleting a creator would still fail on every path. The app would
-- need its own hand-over, and the dashboard would never work for a creator. The
-- trigger makes every path succeed, and the foreign key backs it up.
--
-- Can promotion leave a Group with members and no moderator? Not from a
-- consistent snapshot. Roles are only moderator or contributor, so if others
-- remain and none is a moderator, one is a contributor, and they are promoted.
-- The one gap is a race: the chosen contributor leaves in the instant between
-- being chosen and being promoted. The old loop had the same gap, and on a
-- replay it reported the promotion and left the Group with no moderator. Here
-- the promotion updates no row, and hand_over_groups raises 'hand_over_failed'
-- instead. Nothing is committed, the person retries, and the next pass picks
-- someone else. New members can't slip in mid-hand-over, because joining
-- takes a key lock on the Group row, which the loop holds FOR UPDATE.
-- ============================================================

-- ------------------------------------------------------------
-- 1. hand_over_groups — the leaver's Groups pass on, or go if empty
-- ------------------------------------------------------------
-- SECURITY INVOKER, with every grant revoked. Only the two SECURITY DEFINER
-- callers below run it, as their owner. No client or service-role caller may.
-- Callable directly, it would let anyone move or delete anyone's Groups.
create or replace function public.hand_over_groups(p_user_id uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_group record;
  v_successor uuid;
  v_successor_role text;
  v_deleting_group text;
  v_deleted_group_ids uuid[] := '{}'::uuid[];
  v_promoted_moderator int := 0;
  v_handed_over int := 0;
begin
  for v_group in
    select
      g.id,
      g.created_by,
      exists (
        select 1 from public.group_members gm
        where gm.group_id = g.id
          and gm.user_id = p_user_id
          and gm.role = 'moderator'
      ) as leaver_is_moderator
    from public.groups g
    where g.created_by = p_user_id
       or exists (
         select 1 from public.group_members gm
         where gm.group_id = g.id
           and gm.user_id = p_user_id
       )
    order by g.id
    for update of g
  loop
    -- One query answers all three questions. Moderators sort first, so the
    -- first row is another moderator if there is one, otherwise the earliest
    -- member, who is then necessarily a contributor. No row: nobody else is in
    -- the Group.
    select gm.user_id, gm.role
    into v_successor, v_successor_role
    from public.group_members gm
    where gm.group_id = v_group.id
      and gm.user_id <> p_user_id
    order by (gm.role = 'moderator') desc, gm.joined_at asc, gm.user_id asc
    limit 1;

    if v_successor is null then
      -- The bypass flag lets the cascade past prevent_last_moderator_removal
      -- for this Group's own member rows. Restore it afterwards, so in the
      -- dashboard path the rest of the cascade is still checked.
      v_deleting_group := current_setting('app.deleting_group', true);
      perform set_config('app.deleting_group', 'true', true);
      delete from public.groups where id = v_group.id;
      perform set_config('app.deleting_group', coalesce(v_deleting_group, ''), true);

      v_deleted_group_ids := v_deleted_group_ids || v_group.id;
      continue;
    end if;

    if v_group.leaver_is_moderator and v_successor_role <> 'moderator' then
      update public.group_members
      set role = 'moderator'
      where group_id = v_group.id
        and user_id = v_successor;

      if not found then
        raise exception 'hand_over_failed'
          using errcode = 'P0001',
                detail = format(
                  'Group %s: the member chosen as moderator left during the hand-over.',
                  v_group.id
                ),
                hint = 'Retry; the next attempt picks another member.';
      end if;

      v_promoted_moderator := v_promoted_moderator + 1;
    end if;

    if v_group.created_by = p_user_id then
      update public.groups
      set created_by = v_successor
      where id = v_group.id;

      v_handed_over := v_handed_over + 1;
    end if;
  end loop;

  -- Group-cover objects live under <group_id>/cover.jpg. Remove those for the
  -- Groups just deleted. Covers of Groups that carry on stay.
  if cardinality(v_deleted_group_ids) > 0 then
    perform set_config('storage.allow_delete_query', 'true', true);

    delete from storage.objects
    where bucket_id = 'group-covers'
      and ((storage.foldername(name))[1])::uuid = any(v_deleted_group_ids);
  end if;

  return jsonb_build_object(
    'deleted_groups', cardinality(v_deleted_group_ids),
    'promoted_moderator_count', v_promoted_moderator,
    'handed_over_groups', v_handed_over
  );
end;
$$;

revoke all on function public.hand_over_groups(uuid) from public, anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 2. Every deletion of a person hands their Groups over first
-- ------------------------------------------------------------
-- BEFORE, so it runs ahead of the foreign keys' actions on public.users
-- (group_members, posts and push_tokens cascade, and groups.created_by is
-- checked, all after the row goes).
create or replace function public.handle_user_deletion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.hand_over_groups(old.id);
  return old;
end;
$$;

revoke all on function public.handle_user_deletion() from public, anon, authenticated, service_role;

drop trigger if exists on_user_deletion on public.users;
create trigger on_user_deletion
  before delete on public.users
  for each row
  execute function public.handle_user_deletion();

-- ------------------------------------------------------------
-- 3. groups.created_by stops cascading
-- ------------------------------------------------------------
-- The constraint was created as columns_created_by_fkey and kept that name
-- through the rename to groups. Find it by what it is rather than by name.
-- `into strict` fails the migration if there isn't exactly one.
do $$
declare
  v_name text;
begin
  select c.conname
  into strict v_name
  from pg_constraint c
  where c.conrelid = 'public.groups'::regclass
    and c.confrelid = 'public.users'::regclass
    and c.contype = 'f'
    and c.conkey = array[(
      select a.attnum from pg_attribute a
      where a.attrelid = 'public.groups'::regclass
        and a.attname = 'created_by'
    )]::smallint[];

  execute format('alter table public.groups drop constraint %I', v_name);
end;
$$;

alter table public.groups
  add constraint groups_created_by_fkey
  foreign key (created_by) references public.users(id)
  on delete no action;

-- ------------------------------------------------------------
-- 4. prepare_account_deletion — hand over through the shared rule
-- ------------------------------------------------------------
-- 20260923003208's body, with its loop replaced by hand_over_groups, which
-- also hands created_by over. Unchanged: the authorization check, the
-- app.deleting_group flag held for the whole call, the membership delete, the
-- storage.allow_delete_query opt-in, the avatar and post-image deletes, the
-- cover delete for Groups that went (now inside hand_over_groups), the return
-- shape and the grants.
create or replace function public.prepare_account_deletion(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hand_over jsonb;
begin
  if auth.uid() is distinct from p_user_id and auth.role() <> 'service_role' then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  perform set_config('app.deleting_group', 'true', true);

  v_hand_over := public.hand_over_groups(p_user_id);

  delete from public.group_members where user_id = p_user_id;

  -- Opt this transaction out of storage.protect_delete. Transaction-local, so
  -- it lapses when this function's statement finishes; nothing else in the
  -- session inherits it.
  perform set_config('storage.allow_delete_query', 'true', true);

  delete from storage.objects
  where bucket_id = 'avatars'
    and (storage.foldername(name))[1] = p_user_id::text;

  delete from storage.objects
  where bucket_id = 'post-images'
    and (storage.foldername(name))[1] = p_user_id::text;

  return jsonb_build_object(
    'deleted_groups', (v_hand_over->>'deleted_groups')::int,
    'promoted_moderator_count', (v_hand_over->>'promoted_moderator_count')::int
  );
end;
$$;

-- Grants are unchanged from 20260703000000: service_role only, because
-- deletion always flows through the delete-account edge function.
revoke execute on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;
