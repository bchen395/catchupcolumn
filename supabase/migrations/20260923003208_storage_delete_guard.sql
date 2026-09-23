-- ============================================================
-- 20260923003208_storage_delete_guard.sql
--
-- Account deletion has been failing in production with:
--
--   42501  Direct deletion from storage tables is not allowed.
--          Use the Storage API instead.
--   HINT   This prevents accidental data loss from orphaned objects.
--
-- Supabase added `storage.protect_delete`, a trigger on storage.objects that
-- raises unless the transaction-local GUC `storage.allow_delete_query` is
-- 'true'. Two things about it matter here:
--
--   1. It is a STATEMENT-level trigger, so it fires even when the DELETE
--      matches zero rows. That is why deletion failed for an account with no
--      avatar, no posts and no uploads at all — the RPC never got past its
--      first storage statement.
--   2. The GUC is the sanctioned escape hatch; the Storage API sets the same
--      flag. Setting it inside a SECURITY DEFINER function, transaction-local,
--      is the narrow equivalent for deletes that are already path-scoped and
--      deliberate.
--
-- Two functions delete from storage.objects and both are affected:
--
--   * prepare_account_deletion — three unconditional deletes, so account
--     deletion was broken for EVERY user. Called only by the delete-account
--     edge function (service_role).
--   * remove_group_member — one delete, guarded by `if v_deleted_post_ids is
--     not null`, so ejecting a member only failed when that member had draft
--     posts. Called from the app by a moderator.
--
-- Bodies are otherwise unchanged from 20260506000000 and 20260806003026
-- respectively; the only edits are the set_config line and, in
-- prepare_account_deletion, the errcode noted below.
--
-- Also fixed here: `raise ... using errcode = 'PGRST301'`. A SQLSTATE is
-- exactly five characters, and 'PGRST301' is eight, so that raise would itself
-- have errored had the guard ever been reached. Replaced with '42501'
-- (insufficient_privilege). The value is not load-bearing — the caller is the
-- edge function, which reports its own message — so nothing downstream changes.
-- Other migrations still carry 'PGRST301'; they are untouched here and remain
-- latent until each is next edited.
-- ============================================================

-- ------------------------------------------------------------
-- 1. prepare_account_deletion
-- ------------------------------------------------------------
create or replace function public.prepare_account_deletion(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group record;
  v_other_members int;
  v_other_moderators int;
  v_promoted_user uuid;
  v_deleted_group_ids uuid[] := '{}'::uuid[];
  v_deleted_groups int := 0;
  v_promoted_moderator int := 0;
begin
  if auth.uid() is distinct from p_user_id and auth.role() <> 'service_role' then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  perform set_config('app.deleting_group', 'true', true);

  for v_group in
    select gm.group_id, gm.role
    from public.group_members gm
    where gm.user_id = p_user_id
  loop
    select count(*) into v_other_members
    from public.group_members
    where group_id = v_group.group_id
      and user_id <> p_user_id;

    if v_other_members = 0 then
      delete from public.groups where id = v_group.group_id;
      v_deleted_group_ids := v_deleted_group_ids || v_group.group_id;
      v_deleted_groups := v_deleted_groups + 1;
      continue;
    end if;

    if v_group.role = 'moderator' then
      select count(*) into v_other_moderators
      from public.group_members
      where group_id = v_group.group_id
        and user_id <> p_user_id
        and role = 'moderator';

      if v_other_moderators = 0 then
        select user_id into v_promoted_user
        from public.group_members
        where group_id = v_group.group_id
          and user_id <> p_user_id
          and role = 'contributor'
        order by joined_at asc
        limit 1;

        if v_promoted_user is not null then
          update public.group_members
          set role = 'moderator'
          where group_id = v_group.group_id
            and user_id = v_promoted_user;
          v_promoted_moderator := v_promoted_moderator + 1;
        end if;
      end if;
    end if;
  end loop;

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

  -- Group-cover objects live under <group_id>/cover.jpg. Remove those
  -- for any group we just deleted (sole-member case). Covers for groups
  -- that survived deletion are still valid and stay.
  if array_length(v_deleted_group_ids, 1) is not null then
    delete from storage.objects
    where bucket_id = 'group-covers'
      and ((storage.foldername(name))[1])::uuid = any(v_deleted_group_ids);
  end if;

  return jsonb_build_object(
    'deleted_groups', v_deleted_groups,
    'promoted_moderator_count', v_promoted_moderator
  );
end;
$$;

-- Grants are unchanged from 20260703000000: service_role only, because
-- deletion always flows through the delete-account edge function.
revoke execute on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;

-- ------------------------------------------------------------
-- 2. remove_group_member
-- ------------------------------------------------------------
create or replace function public.remove_group_member(
  p_group_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_deleted_post_ids text[];
begin
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if not public.is_group_moderator(p_group_id, v_actor) then
    raise exception 'not_moderator' using errcode = 'P0001';
  end if;

  -- Removing yourself is "leave", not "eject". Routing it here would let a
  -- sole moderator sidestep the leave flow's transfer prompt, and the two
  -- actions want different confirmation copy.
  if p_user_id = v_actor then
    raise exception 'cannot_remove_self' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id
  ) then
    raise exception 'not_a_member' using errcode = 'P0001';
  end if;

  -- Drafts only (edition_id is null). Posts already compiled into a published
  -- edition stay put: that edition has been emailed and read, and rewriting it
  -- after the fact would leave members' inboxes disagreeing with the app.
  with deleted as (
    delete from public.posts
    where group_id = p_group_id
      and author_id = p_user_id
      and edition_id is null
    returning id
  )
  select array_agg(id::text) into v_deleted_post_ids from deleted;

  -- Their images go too. The post-images read policy joins back to public.posts
  -- (20260430000000), so these objects are already unreachable once the rows are
  -- gone — this just stops them accumulating as dead storage. Path layout is
  -- <user_id>/posts/<post_id>/image.<ext>.
  if v_deleted_post_ids is not null then
    perform set_config('storage.allow_delete_query', 'true', true);

    delete from storage.objects
    where bucket_id = 'post-images'
      and (storage.foldername(name))[3] = any (v_deleted_post_ids);
  end if;

  -- prevent_last_moderator_removal still fires here, so ejecting the group's
  -- only moderator raises rather than orphaning the group.
  delete from public.group_members
  where group_id = p_group_id and user_id = p_user_id;
end;
$$;

-- Grants unchanged from 20260806005907: authenticated only, authorization
-- enforced inside the function against auth.uid().
revoke execute on function public.remove_group_member(uuid, uuid) from public, anon;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;
