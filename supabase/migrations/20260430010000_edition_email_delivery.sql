-- ============================================================
-- 20260430010000_edition_email_delivery.sql
-- Phase 7: Email delivery
--   • idempotency + retry tracking on editions
--   • per-Group unsubscribe state on group_members
--   • RPCs for the edge function to fetch email payloads,
--     mark editions emailed, increment attempts, and unsubscribe
-- ============================================================

-- --------------------------------------------------------
-- 1. Idempotency / retry columns on editions
-- --------------------------------------------------------
alter table public.editions
  add column if not exists emailed_at timestamptz,
  add column if not exists email_attempts int not null default 0;

-- --------------------------------------------------------
-- 2. Per-Group unsubscribe on group_members
-- --------------------------------------------------------
alter table public.group_members
  add column if not exists email_subscribed boolean not null default true,
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

-- Token must be unique (it's the only identifier in unsubscribe links).
create unique index if not exists idx_group_members_unsubscribe_token
  on public.group_members(unsubscribe_token);

-- --------------------------------------------------------
-- 3. RPC: pending email payload for an edition
--    Returns one row per still-subscribed recipient with
--    the data the edge function needs to render and send.
-- --------------------------------------------------------
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
      'body', p.body,
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
      'unsubscribe_token', gm.unsubscribe_token
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

grant execute on function public.get_edition_email_payload(uuid) to service_role;

-- --------------------------------------------------------
-- 4. RPC: mark an edition as successfully emailed
-- --------------------------------------------------------
create or replace function public.mark_edition_emailed(p_edition_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.editions
  set emailed_at = now()
  where id = p_edition_id
    and emailed_at is null;
$$;

grant execute on function public.mark_edition_emailed(uuid) to service_role;

-- --------------------------------------------------------
-- 5. RPC: bump the attempt counter on a failed send
-- --------------------------------------------------------
create or replace function public.increment_edition_email_attempts(p_edition_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempts int;
begin
  update public.editions
  set email_attempts = email_attempts + 1
  where id = p_edition_id
  returning email_attempts into v_attempts;

  return v_attempts;
end;
$$;

grant execute on function public.increment_edition_email_attempts(uuid) to service_role;

-- --------------------------------------------------------
-- 6. RPC: unsubscribe by opaque token (no auth required;
--    security is the unguessability of the uuid)
-- --------------------------------------------------------
create or replace function public.unsubscribe_by_token(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_name text;
  v_already_unsubscribed boolean;
begin
  select g.name, not gm.email_subscribed
  into v_group_name, v_already_unsubscribed
  from public.group_members gm
  join public.groups g on g.id = gm.group_id
  where gm.unsubscribe_token = p_token;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid_token');
  end if;

  update public.group_members
  set email_subscribed = false
  where unsubscribe_token = p_token
    and email_subscribed = true;

  return jsonb_build_object(
    'ok', true,
    'group_name', v_group_name,
    'already_unsubscribed', v_already_unsubscribed
  );
end;
$$;

-- The unsubscribe edge function calls this with the anon key (no JWT),
-- so the anon role needs execute access. The token itself is the secret.
grant execute on function public.unsubscribe_by_token(uuid) to anon;
grant execute on function public.unsubscribe_by_token(uuid) to authenticated;
