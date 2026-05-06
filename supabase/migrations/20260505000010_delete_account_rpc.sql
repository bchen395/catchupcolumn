-- ============================================================
-- 20260505000010_delete_account_rpc.sql
-- Account deletion helper. Without this, auth.users → public.users
-- → group_members CASCADE collides with the prevent_last_moderator_removal
-- trigger and the whole deleteUser call fails.
--
-- This RPC sets the app.deleting_group bypass flag, then for each
-- group the user is in:
--   * if they are the sole member          → delete the group
--   * else if they are the sole moderator  → promote the oldest
--                                            remaining contributor
-- After the loop it removes the user's remaining group_members rows
-- and cleans up their objects in the avatars and post-images buckets.
-- The auth.users delete that follows is then a clean cascade.
-- ============================================================

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
  v_deleted_groups int := 0;
  v_promoted_moderator int := 0;
begin
  -- Caller must be deleting their own account, or be the service role
  -- invoked by the delete-account edge function.
  if auth.uid() is distinct from p_user_id and auth.role() <> 'service_role' then
    raise exception 'Not authorized' using errcode = 'PGRST301';
  end if;

  -- Allow cascade delete through prevent_last_moderator_removal
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
      -- Sole member: delete the group; cascade removes posts and editions.
      delete from public.groups where id = v_group.group_id;
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
        -- Promote the longest-tenured remaining contributor.
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

  -- Remove this user's remaining memberships. The bypass flag set above
  -- lets us drop a "last moderator" row in any edge case where promotion
  -- did not run (e.g. group with only contributors and a non-moderator
  -- caller — should not happen, but defence in depth).
  delete from public.group_members where user_id = p_user_id;

  -- Storage cleanup: remove the user's objects from avatar and
  -- post-image buckets. SECURITY DEFINER runs as the function owner
  -- (postgres), which can write to storage.objects.
  delete from storage.objects
  where bucket_id = 'avatars'
    and (storage.foldername(name))[1] = p_user_id::text;

  delete from storage.objects
  where bucket_id = 'post-images'
    and (storage.foldername(name))[1] = p_user_id::text;

  return jsonb_build_object(
    'deleted_groups', v_deleted_groups,
    'promoted_moderator_count', v_promoted_moderator
  );
end;
$$;

grant execute on function public.prepare_account_deletion(uuid) to authenticated, service_role;
