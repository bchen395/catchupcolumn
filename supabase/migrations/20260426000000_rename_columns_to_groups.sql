-- ============================================================
-- 20260426000000_rename_columns_to_groups.sql
-- Rename "columns" / "column_members" terminology to
-- "groups" / "group_members" throughout the schema.
-- ============================================================

-- --------------------------------------------------------
-- 1. Rename tables
-- --------------------------------------------------------
alter table public.columns rename to groups;
alter table public.column_members rename to group_members;

-- --------------------------------------------------------
-- 2. Rename column_id → group_id on affected tables
-- --------------------------------------------------------
alter table public.group_members rename column column_id to group_id;
alter table public.posts rename column column_id to group_id;
alter table public.editions rename column column_id to group_id;

-- --------------------------------------------------------
-- 3. Rename indexes
-- --------------------------------------------------------
alter index idx_columns_invite_code rename to idx_groups_invite_code;
alter index idx_column_members_user_id rename to idx_group_members_user_id;
alter index idx_posts_column_id rename to idx_posts_group_id;
alter index idx_editions_column_id rename to idx_editions_group_id;

-- --------------------------------------------------------
-- 4. Drop old RLS policies that depend on old helper functions
--    (must happen before dropping the functions)
-- --------------------------------------------------------

-- groups (was columns)
drop policy if exists "Members can read their columns" on public.groups;
drop policy if exists "Authenticated users can create columns" on public.groups;
drop policy if exists "Only moderators can update column settings" on public.groups;
drop policy if exists "Only moderators can delete columns" on public.groups;
drop policy if exists "Creators can read their own columns" on public.groups;

-- group_members (was column_members)
drop policy if exists "Members can see who is in their column" on public.group_members;
drop policy if exists "Users can join a column" on public.group_members;
drop policy if exists "Users can leave a column" on public.group_members;
drop policy if exists "Moderators can manage members" on public.group_members;

-- posts
drop policy if exists "Members can read posts in their columns" on public.posts;
drop policy if exists "Members can create posts in their columns" on public.posts;

-- editions
drop policy if exists "Members can read editions in their columns" on public.editions;
drop policy if exists "Moderators can create editions" on public.editions;

-- --------------------------------------------------------
-- 5. Drop old helper functions (now safe — no policies depend on them)
-- --------------------------------------------------------
drop function if exists public.is_column_member(uuid, uuid);
drop function if exists public.is_column_moderator(uuid, uuid);

-- --------------------------------------------------------
-- 6. Recreate helper functions with new names and references
-- --------------------------------------------------------
create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id
  );
$$;

create or replace function public.is_group_moderator(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id and role = 'moderator'
  );
$$;

-- --------------------------------------------------------
-- 7. Recreate RLS policies using new helper function names
-- --------------------------------------------------------

-- groups
create policy "Members can read their groups"
  on public.groups for select
  to authenticated
  using (public.is_group_member(id, auth.uid()));

create policy "Authenticated users can create groups"
  on public.groups for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Only moderators can update group settings"
  on public.groups for update
  to authenticated
  using (public.is_group_moderator(id, auth.uid()))
  with check (public.is_group_moderator(id, auth.uid()));

create policy "Only moderators can delete groups"
  on public.groups for delete
  to authenticated
  using (public.is_group_moderator(id, auth.uid()));

create policy "Creators can read their own groups"
  on public.groups for select
  to authenticated
  using (created_by = auth.uid());

-- group_members
create policy "Members can see who is in their group"
  on public.group_members for select
  to authenticated
  using (public.is_group_member(group_id, auth.uid()));

create policy "Users can join a group"
  on public.group_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can leave a group"
  on public.group_members for delete
  to authenticated
  using (user_id = auth.uid());

create policy "Moderators can manage members"
  on public.group_members for update
  to authenticated
  using (public.is_group_moderator(group_id, auth.uid()))
  with check (public.is_group_moderator(group_id, auth.uid()));

-- posts
create policy "Members can read posts in their groups"
  on public.posts for select
  to authenticated
  using (public.is_group_member(group_id, auth.uid()));

create policy "Members can create posts in their groups"
  on public.posts for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and public.is_group_member(group_id, auth.uid())
  );

-- editions
create policy "Members can read editions in their groups"
  on public.editions for select
  to authenticated
  using (public.is_group_member(group_id, auth.uid()));

create policy "Moderators can create editions"
  on public.editions for insert
  to authenticated
  with check (public.is_group_moderator(group_id, auth.uid()));

-- --------------------------------------------------------
-- 8. Drop and recreate find_column_by_invite_code
-- --------------------------------------------------------
drop function if exists public.find_column_by_invite_code(text);

create or replace function public.find_group_by_invite_code(p_invite_code text)
returns table (
  id              uuid,
  name            text,
  description     text,
  cover_image_url text,
  publish_day     int,
  publish_time    time,
  created_by      uuid,
  invite_code     text,
  created_at      timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select id, name, description, cover_image_url, publish_day, publish_time,
         created_by, invite_code, created_at
  from public.groups
  where invite_code = upper(trim(p_invite_code))
  limit 1;
$$;

-- --------------------------------------------------------
-- 9. Update storage policies: folder path columns/ → groups/
-- --------------------------------------------------------
drop policy if exists "Authenticated users can upload group cover images" on storage.objects;
drop policy if exists "Authenticated users can update group cover images" on storage.objects;

create policy "Authenticated users can upload group cover images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'groups'
  );

create policy "Authenticated users can update group cover images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'groups'
  );
