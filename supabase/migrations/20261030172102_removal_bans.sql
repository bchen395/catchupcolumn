-- ============================================================
-- 20261030172102_removal_bans.sql
--
-- Removal becomes a ban (App Store Guideline 1.2, decided 2026-10-30).
--
-- A moderator could already remove a member (remove_group_member), and that
-- also pulled the member's uncompiled posts and their photos. But
-- join_group_by_invite_code never looked at who was asking, so the removed
-- person could rejoin at once with the same code — and the app has no way to
-- issue a new one. Apple expects us to be able to eject the person who posted
-- something offending, so removal now records a ban that the join refuses,
-- until a moderator lets them back in.
--
--   1. group_bans — one row per (Group, removed person). Moderators of the
--      Group can read it; nobody writes it directly.
--   2. operator_remove_group_member — the removal itself (drafts, their
--      photos, the membership) plus the ban. service_role only: it is also the
--      operator's tool for acting on a report, so it trusts its caller.
--   3. remove_group_member — the moderator's RPC. Same signature and checks
--      as 20260923003208, then delegates to (2) with the moderator as
--      banned_by.
--   4. unban_group_member — "Let back in". Moderator-only; deletes the ban.
--      It does not re-add anyone: they join again with the code.
--   5. join_group_by_invite_code — refuses a banned caller with
--      'removed_from_group'. Also replaces the 8-character 'PGRST301' errcode,
--      which is not a legal SQLSTATE (that raise itself errored, as 42704),
--      with 'not_authenticated' / P0001.
--   6. get_invite_preview_details — adds is_removed, so the join screen can
--      say why before showing a Join button that would only refuse, and stops
--      handing a removed person the Group's member sample.
--
-- Why 'removed_from_group' is raised with P0002 and not P0001: P0002 is what
-- invalid_invite_code uses, and the build people have installed today maps
-- any P0002 from the join to "That invitation isn't active anymore" and
-- clears the pending invite. Any other code would land in the auto-join's
-- "keep the invite and retry on every cold start" branch
-- (hooks/use-auto-join-invite.ts) — a removed person would be retried
-- forever. New builds read the message before the code.
-- ============================================================

-- ------------------------------------------------------------
-- 1. group_bans
-- ------------------------------------------------------------
-- Constraint names are spelled out because the app embeds the banned
-- person's profile through the user_id key by name
-- (users!group_bans_user_id_fkey in lib/groups.ts). There are two keys to
-- users here, so PostgREST can't pick one on its own.
create table if not exists public.group_bans (
  group_id   uuid not null,
  user_id    uuid not null,
  banned_by  uuid,
  created_at timestamptz not null default now(),
  constraint group_bans_pkey primary key (group_id, user_id),
  constraint group_bans_group_id_fkey
    foreign key (group_id) references public.groups (id) on delete cascade,
  constraint group_bans_user_id_fkey
    foreign key (user_id) references public.users (id) on delete cascade,
  -- A moderator deleting their account leaves the ban standing.
  constraint group_bans_banned_by_fkey
    foreign key (banned_by) references public.users (id) on delete set null
);

comment on table public.group_bans is
  'People removed from a Group. join_group_by_invite_code refuses them until a moderator lets them back in (unban_group_member). Written only by SECURITY DEFINER RPCs.';

alter table public.group_bans enable row level security;

-- Only the Group's moderators see who was removed — they are the ones who can
-- let someone back in. The removed person is never shown the list; the join
-- tells them, through is_removed and removed_from_group below.
create policy "Moderators can read their Group's removals"
  on public.group_bans for select
  to authenticated
  using (public.is_group_moderator(group_id, auth.uid()));

-- No insert, update or delete policy: with RLS on, that already denies every
-- direct write. The revokes make it explicit at the privilege layer too.
-- Writers are operator_remove_group_member and unban_group_member, which run
-- as the owner. service_role keeps Supabase's default grants (it bypasses RLS).
revoke all on table public.group_bans from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.group_bans from authenticated;
grant select on table public.group_bans to authenticated;

-- ------------------------------------------------------------
-- 2. operator_remove_group_member
-- ------------------------------------------------------------
-- The removal body is remove_group_member's from 20260923003208, including
-- the storage.allow_delete_query opt-in that storage.protect_delete needs.
--
-- It does not insist the person is still a member. remove_group_member
-- checks that before it delegates, so the moderator's path is unchanged; an
-- operator acting on a report may find the person already left, and the ban
-- (and any drafts they left behind) is still what they want. A Group or user
-- id that doesn't exist fails on the foreign keys.
create or replace function public.operator_remove_group_member(
  p_group_id uuid,
  p_user_id uuid,
  p_banned_by uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_post_ids text[];
begin
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

  -- Their photos go too. The post-images read policy joins back to
  -- public.posts (20260430000000), so these objects are already unreachable
  -- once the rows are gone — this stops them accumulating as dead storage.
  -- Every file of a post sits in <user_id>/posts/<post_id>/.
  if v_deleted_post_ids is not null then
    perform set_config('storage.allow_delete_query', 'true', true);

    delete from storage.objects
    where bucket_id = 'post-images'
      and (storage.foldername(name))[3] = any (v_deleted_post_ids);
  end if;

  -- prevent_last_moderator_removal still fires here, so removing a Group's
  -- only moderator raises and the whole call rolls back, ban included.
  delete from public.group_members
  where group_id = p_group_id and user_id = p_user_id;

  insert into public.group_bans (group_id, user_id, banned_by)
  values (p_group_id, p_user_id, p_banned_by)
  on conflict (group_id, user_id) do nothing;
end;
$$;

-- No caller-side check inside, so no client may reach it. remove_group_member
-- calls it as the owner; operators call it with the service role or from the
-- SQL editor.
revoke execute on function public.operator_remove_group_member(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.operator_remove_group_member(uuid, uuid, uuid)
  to service_role;

-- ------------------------------------------------------------
-- 3. remove_group_member
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

  perform public.operator_remove_group_member(p_group_id, p_user_id, v_actor);
end;
$$;

-- Grants unchanged from 20260923003208: authenticated only, authorization
-- enforced inside the function against auth.uid().
revoke execute on function public.remove_group_member(uuid, uuid) from public, anon;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;

-- ------------------------------------------------------------
-- 4. unban_group_member
-- ------------------------------------------------------------
-- Safe to repeat: letting back in someone who isn't banned does nothing.
create or replace function public.unban_group_member(
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
begin
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if not public.is_group_moderator(p_group_id, v_actor) then
    raise exception 'not_moderator' using errcode = 'P0001';
  end if;

  delete from public.group_bans
  where group_id = p_group_id and user_id = p_user_id;
end;
$$;

revoke execute on function public.unban_group_member(uuid, uuid) from public, anon;
grant execute on function public.unban_group_member(uuid, uuid) to authenticated;

-- ------------------------------------------------------------
-- 5. join_group_by_invite_code
-- ------------------------------------------------------------
-- Latest definition: 20260505000000. Changes: the not_authenticated raise,
-- and the ban check once the Group is found.
create or replace function public.join_group_by_invite_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_group_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if p_invite_code is null or length(trim(p_invite_code)) = 0 then
    raise exception 'invalid_invite_code' using errcode = 'P0002';
  end if;

  select id into v_group_id
  from public.groups
  where lower(invite_code) = lower(trim(p_invite_code))
  limit 1;

  if v_group_id is null then
    raise exception 'invalid_invite_code' using errcode = 'P0002';
  end if;

  -- P0002, not P0001 — see the header.
  if exists (
    select 1 from public.group_bans
    where group_id = v_group_id and user_id = v_user_id
  ) then
    raise exception 'removed_from_group' using errcode = 'P0002';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, v_user_id, 'contributor')
  on conflict (group_id, user_id) do nothing;

  return v_group_id;
end;
$$;

-- 20260505000000 only granted to authenticated and left PUBLIC's default
-- execute in place. anon has no auth.uid(), so it could never join; say so
-- at the privilege layer too.
revoke execute on function public.join_group_by_invite_code(text) from public, anon;
grant execute on function public.join_group_by_invite_code(text) to authenticated;

-- ------------------------------------------------------------
-- 6. get_invite_preview_details
-- ------------------------------------------------------------
-- Latest definition: 20260710000000. Adds is_removed, and returns an empty
-- member_sample to a removed caller: someone the Group removed shouldn't keep
-- watching who is in it through the invite code they still hold. The anon
-- tier (get_invite_preview) never carried identities and is unchanged.
--
-- A new output column changes the return type, which `create or replace`
-- can't do, so drop and recreate (in this migration's transaction), then
-- restore the grants. Builds that predate is_removed ignore the extra key.
drop function if exists public.get_invite_preview_details(text);

create function public.get_invite_preview_details(p_invite_code text)
returns table (
  group_id        uuid,
  name            text,
  description     text,
  cover_image_url text,
  member_count    int,
  publish_day     int,
  publish_time    time,
  timezone        text,
  is_member       boolean,
  is_removed      boolean,
  member_sample   jsonb
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  -- Defense in depth behind the grant (anon has no EXECUTE).
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  return query
  select g.id,
         g.name,
         g.description,
         g.cover_image_url,
         (select count(*)::int
          from public.group_members gm
          where gm.group_id = g.id),
         g.publish_day,
         g.publish_time,
         g.timezone,
         public.is_group_member(g.id, auth.uid()),
         removal.is_removed,
         case
           when removal.is_removed then '[]'::jsonb
           else coalesce((
             select jsonb_agg(
                      jsonb_build_object(
                        'display_name', u.display_name,
                        'avatar_url', u.avatar_url
                      )
                      order by sample.joined_at asc)
             from (
               select gm2.user_id, gm2.joined_at
               from public.group_members gm2
               where gm2.group_id = g.id
               order by gm2.joined_at asc
               limit 6
             ) sample
             join public.users u on u.id = sample.user_id
           ), '[]'::jsonb)
         end
  from public.groups g
  cross join lateral (
    select exists (
      select 1 from public.group_bans b
      where b.group_id = g.id and b.user_id = auth.uid()
    ) as is_removed
  ) removal
  where p_invite_code is not null
    and lower(g.invite_code) = lower(trim(p_invite_code))
  limit 1;
end;
$$;

revoke all on function public.get_invite_preview_details(text) from public, anon;
grant execute on function public.get_invite_preview_details(text) to authenticated;
