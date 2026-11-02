-- ============================================================
-- 20261101204252_user_blocks.sql
--
-- One-way block (App Store Guideline 1.2, decided 2026-10-30). Any member can
-- block another from the foot of one of their stories. After that the
-- blocker stops seeing the blocked person's stories in the app, past
-- editions included, and the blocked person's stories are left out of the
-- blocker's edition emails. The blocked person is not told, can't find out
-- from the API, and still sees the blocker's stories. Unblocking is on the
-- Group page.
--
--   1. user_blocks — one row per (blocker, blocked). A member reads, adds and
--      deletes only their own rows; nobody updates one.
--   2. is_blocked_by_caller — "has the caller blocked this person?", for the
--      posts SELECT policy.
--   3. "Members can read posts in their groups" also hides the posts of
--      anyone the caller has blocked. Every app read of a post goes through
--      that policy: the edition front page and reader, the Editions list and
--      its lead, Home's hero, the this-week bylines, a deep link to one post,
--      and the post-images read policy (20260430000000), which looks the post
--      up as the caller, so a hidden story's photos can't be signed either.
--   4. get_edition_email_payload — each recipient carries hidden_author_ids,
--      the edition's authors they have blocked, and the email worker leaves
--      those stories out of that recipient's email.
--
-- Left as they were, on purpose: the edition push (it carries only the
-- Group's name), the web /edition redirect (it opens the app, which reads
-- through (3)), the roster (the blocker's row for them shows "Blocked" and
-- "Unblock"), and emails already sent. SECURITY DEFINER code that reads posts
-- for its own bookkeeping (compile, publish, take-down) is unaffected: it
-- never shows a post to anyone.
--
-- Why not has_blocked(p_blocker, p_blocked), as planned: a policy runs its
-- functions as the querying role, so the helper must be granted to
-- authenticated, and a two-argument version would let the blocked person
-- call has_blocked(<blocker>, <themselves>) and learn they were blocked. The
-- helper answers only for the caller, as is_caller_banned does
-- (20261101195755).
-- ============================================================

-- ------------------------------------------------------------
-- 1. user_blocks
-- ------------------------------------------------------------
-- Both keys cascade: a block belongs to the two accounts, nobody else reads
-- it, and it means nothing once either account is gone.
create table if not exists public.user_blocks (
  blocker_id uuid not null,
  blocked_id uuid not null,
  created_at timestamptz not null default now(),
  constraint user_blocks_pkey primary key (blocker_id, blocked_id),
  constraint user_blocks_blocker_id_fkey
    foreign key (blocker_id) references public.users (id) on delete cascade,
  constraint user_blocks_blocked_id_fkey
    foreign key (blocked_id) references public.users (id) on delete cascade,
  constraint user_blocks_not_self check (blocker_id <> blocked_id)
);

comment on table public.user_blocks is
  'One-way blocks. The blocker stops seeing the blocked person''s posts (the posts SELECT policy) and their stories in edition emails (get_edition_email_payload). Only the blocker can see a row.';

-- The primary key serves the blocker's lookups. This one serves the cascade
-- when the blocked person's account is deleted.
create index if not exists user_blocks_blocked_id_idx
  on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;

-- Every policy is the blocker's own rows. The blocked person matches none of
-- them, so they can't read, forge or lift a block on themselves: a select
-- returns nothing, an insert naming someone else as blocker fails the check,
-- and a delete matches no row, which looks the same whether or not one
-- exists.
create policy "Members can read their own blocks"
  on public.user_blocks for select
  to authenticated
  using (blocker_id = auth.uid());

create policy "Members can block for themselves"
  on public.user_blocks for insert
  to authenticated
  with check (blocker_id = auth.uid());

create policy "Members can lift their own blocks"
  on public.user_blocks for delete
  to authenticated
  using (blocker_id = auth.uid());

-- No update policy, and no update grant: a block is added or lifted, never
-- edited. service_role keeps Supabase's default grants (it bypasses RLS).
revoke all on table public.user_blocks from anon;
revoke update, truncate, references, trigger
  on table public.user_blocks from authenticated;
grant select, insert, delete on table public.user_blocks to authenticated;

-- ------------------------------------------------------------
-- 2. is_blocked_by_caller
-- ------------------------------------------------------------
-- SECURITY DEFINER so the posts policy doesn't run user_blocks' own RLS for
-- every post it checks. It reads only the caller's rows, which that RLS would
-- show them anyway, so it tells nobody anything new.
create or replace function public.is_blocked_by_caller(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.user_blocks
    where blocker_id = auth.uid() and blocked_id = p_user_id
  );
$$;

-- Policies run their functions as the querying role, so authenticated needs
-- EXECUTE. The posts policy is for authenticated only, so anon never does.
revoke execute on function public.is_blocked_by_caller(uuid) from public, anon;
grant execute on function public.is_blocked_by_caller(uuid) to authenticated;

-- ------------------------------------------------------------
-- 3. Posts: hide the stories of anyone the caller has blocked
-- ------------------------------------------------------------
-- Same name and membership test as 20260426000000. An author's own posts
-- always pass (user_blocks_not_self), so the composer's insert...returning
-- and update...returning are unchanged.
drop policy if exists "Members can read posts in their groups" on public.posts;

create policy "Members can read posts in their groups"
  on public.posts for select
  to authenticated
  using (
    public.is_group_member(group_id, auth.uid())
    and not public.is_blocked_by_caller(author_id)
  );

-- ------------------------------------------------------------
-- 4. Email payload: hidden_author_ids per recipient
--    (recreated from 20261003154759_multi_photo_posts.sql, its latest
--    definition; 20261101195502 cited it and left it as it was)
-- ------------------------------------------------------------
-- Only this edition's authors are listed, so the payload never carries a
-- block that has nothing to do with this edition. Everything else is
-- unchanged, the email_subscribed filter and the grants included.
--
-- A worker deployed before this migration ignores the new field and sends
-- every story to everyone, as it did before. A worker deployed after it reads
-- a missing field as "nothing hidden". So: db push, then deploy the
-- functions.
create or replace function public.get_edition_email_payload(p_edition_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_edition record;
  v_group record;
  v_posts jsonb;
  v_recipients jsonb;
begin
  select id, group_id, edition_number, published_at, emailed_at, email_attempts
  into v_edition
  from public.editions
  where id = p_edition_id;

  if not found then
    return null;
  end if;

  select id, name
  into v_group
  from public.groups
  where id = v_edition.group_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'author_id', p.author_id,
      'title', p.title,
      'body', p.body,
      'image_url', p.image_url,
      'blocks', p.blocks,
      'author_name', u.display_name,
      'author_avatar_url', u.avatar_url,
      'created_at', p.created_at
    )
    order by p.created_at
  ), '[]'::jsonb)
  into v_posts
  from public.posts p
  join public.users u on u.id = p.author_id
  where p.edition_id = p_edition_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'user_id', u.id,
      'email', u.email,
      'display_name', u.display_name,
      'unsubscribe_token', gm.unsubscribe_token,
      'hidden_author_ids', coalesce((
        select jsonb_agg(ub.blocked_id order by ub.blocked_id)
        from public.user_blocks ub
        where ub.blocker_id = gm.user_id
          and exists (
            select 1 from public.posts p
            where p.edition_id = p_edition_id
              and p.author_id = ub.blocked_id
          )
      ), '[]'::jsonb)
    )
  ), '[]'::jsonb)
  into v_recipients
  from public.group_members gm
  join public.users u on u.id = gm.user_id
  where gm.group_id = v_edition.group_id
    and gm.email_subscribed = true;

  return jsonb_build_object(
    'edition_id', v_edition.id,
    'edition_number', v_edition.edition_number,
    'published_at', v_edition.published_at,
    'emailed_at', v_edition.emailed_at,
    'email_attempts', v_edition.email_attempts,
    'group_id', v_group.id,
    'group_name', v_group.name,
    'posts', v_posts,
    'recipients', v_recipients
  );
end;
$$;

-- Unchanged: it returns recipient emails, unsubscribe tokens and now who has
-- blocked whom, so service_role only (20260627000000).
revoke all on function public.get_edition_email_payload(uuid) from public, anon, authenticated;
grant execute on function public.get_edition_email_payload(uuid) to service_role;
