-- ============================================================
-- 20260710000000_invite_preview_rpcs.sql
-- Invite-link preview for the join-flow redesign. Two tiers:
--   1. get_invite_preview          — anon-callable, minimal. Lets a
--      logged-out invitee see what they were invited to before
--      creating an account. Returns NO invite_code, NO created_by,
--      NO member identities — only name/description/cover/count.
--   2. get_invite_preview_details  — authenticated. Adds the publish
--      cadence, an is_member flag, and a capped member sample
--      (display_name + avatar_url) for the "familiar faces" byline.
-- find_group_by_invite_code (20260505000000) is left untouched; the
-- app stops calling it once the join screen moves to these RPCs.
-- ============================================================

-- --------------------------------------------------------
-- 1. Minimal preview, callable without a session.
--    Holding a valid 12-char code (16^12 space, unguessable) is the
--    capability; the return set is deliberately tiny so widening the
--    anon surface later requires touching this file on purpose.
-- --------------------------------------------------------
create or replace function public.get_invite_preview(p_invite_code text)
returns table (
  group_id        uuid,
  name            text,
  description     text,
  cover_image_url text,
  member_count    int
)
language sql
security definer
stable
set search_path = public
as $$
  select g.id,
         g.name,
         g.description,
         g.cover_image_url,
         (select count(*)::int
          from public.group_members gm
          where gm.group_id = g.id)
  from public.groups g
  where p_invite_code is not null
    and length(trim(p_invite_code)) between 4 and 64
    and lower(g.invite_code) = lower(trim(p_invite_code))
  limit 1;
$$;

revoke all on function public.get_invite_preview(text) from public;
grant execute on function public.get_invite_preview(text) to anon, authenticated;

-- --------------------------------------------------------
-- 2. Rich preview for signed-in invitees.
--    member_sample: first 6 members by joined_at (the creator joins
--    first via handle_new_group, so the moderator leads the byline).
-- --------------------------------------------------------
create or replace function public.get_invite_preview_details(p_invite_code text)
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
  member_sample   jsonb
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  -- Defense in depth behind the grant (anon has no EXECUTE). Note: the
  -- 'PGRST301' string used by older RPCs is not a valid 5-char SQLSTATE and
  -- would itself error if raised — use a real one.
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
         coalesce((
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
  from public.groups g
  where p_invite_code is not null
    and lower(g.invite_code) = lower(trim(p_invite_code))
  limit 1;
end;
$$;

revoke all on function public.get_invite_preview_details(text) from public, anon;
grant execute on function public.get_invite_preview_details(text) to authenticated;
