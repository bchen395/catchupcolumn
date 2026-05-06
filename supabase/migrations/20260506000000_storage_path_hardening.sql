-- ============================================================
-- 20260506000000_storage_path_hardening.sql
-- Two related cleanups:
--
-- 1. post-images upload/update RLS only checked the first path segment
--    (user_id). The read policy expects <user_id>/posts/<post_id>/...,
--    so a post saved with any other layout becomes unreadable but is
--    still storable. Enforce the `posts` segment on writes too.
--
-- 2. prepare_account_deletion didn't exist when the group-covers bucket
--    was added (#6). When a moderator deletes their account, group-covers
--    objects for any group they uniquely owned are orphaned. Extend the
--    storage cleanup to cover them.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tighten post-images write RLS to require <uid>/posts/...
-- ------------------------------------------------------------
drop policy if exists "Authenticated users can upload post images" on storage.objects;
drop policy if exists "Users can update their own post images" on storage.objects;
drop policy if exists "Users can delete their own post images" on storage.objects;

create policy "Authenticated users can upload post images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'posts'
  );

create policy "Users can update their own post images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'posts'
  );

create policy "Users can delete their own post images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'posts'
  );

-- ------------------------------------------------------------
-- 2. Extend prepare_account_deletion to clean up group-covers.
--    Any group the user is the *sole member* of has already been
--    deleted by the existing loop, so we just need to remove the
--    storage objects for those group_ids.
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
    raise exception 'Not authorized' using errcode = 'PGRST301';
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

grant execute on function public.prepare_account_deletion(uuid) to authenticated, service_role;
