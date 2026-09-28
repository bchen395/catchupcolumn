-- ============================================================================
-- Group Zero readout — read-only SQL
-- ============================================================================
--
-- The numbers docs/POSITIONING.md §6 asks for, per Group, at the end of Group
-- Zero or any week before it: the writing pass condition, whether the four
-- editions ran on consecutive slots, when in the week people write (the
-- nudge's 48h guess — §3, docs/NUDGE_SPEC.md), and when each member installed.
--
-- Read-only throughout: select and CTEs only, nothing created. Every run also
-- opens with `set transaction read only`, so Postgres itself refuses a write
-- even if a query here is later edited badly. (The CLI connects as `postgres`,
-- which bypasses RLS — hence the belt and braces.)
--
-- ----------------------------------------------------------------------------
-- HOW TO RUN
-- ----------------------------------------------------------------------------
-- `npx supabase db query` takes SQL either as its argument ("<SQL>") or from
-- `--file` / `-f`, and returns only the LAST statement's result, so running
-- this whole file prints one table. Run one query at a time: the shared setup
-- block plus one query block, each cut out by its marker lines (the bracketed
-- comment lines that open and close it), piped in as the file. From the root
-- of the checkout where `npx supabase link` was run:
--
--   readout() {
--     sed -n -e '/^-- \[setup\]/,/^-- \[\/setup\]/p' \
--            -e "/^-- \[$1\]/,/^-- \[\/$1\]/p" scripts/group-zero/readout.sql \
--       | npx supabase db query --linked -f /dev/stdin
--   }
--   readout q0    # cohort check: run this first, every time you edit
--   readout q1    # the pass sheet: one row per Group
--
-- A worktree that was never linked can add `--project-ref <ref>` after
-- `--linked`. The CLI prints a table in a terminal but JSON when it detects
-- an agent; add `--agent no` for the table. In the dashboard SQL editor: paste
-- the setup block plus one query block and run it.
--
--   q0  Cohort check — every key resolves; schedule; next slot
--   q1  Pass sheet — §6 conditions per Group, PASS / FAIL / IN PROGRESS
--   q2  Writing per member — which editions each person wrote in, zeros too
--   q3  The four editions — slots, gaps, writers per edition
--   q4  When people write — every post, hours before its publish slot
--   q5  When people write — the distribution that tests the 48h guess
--   q6  Install dates — first push token per member
--   q7  Weeks 3–4 — which posts arrived unprompted (needs your reminder log)
--
-- ----------------------------------------------------------------------------
-- WHERE TO EDIT
-- ----------------------------------------------------------------------------
-- Only the three EDIT blocks at the top of the setup block. EDIT 1 lists the
-- Groups; it ships holding the two production test Groups so the file runs
-- as-is — replace them. EDIT 2 (observers) and EDIT 3 (reminders) are
-- optional; each keeps a placeholder row that is filtered out, so add rows
-- above it and leave it in place.
--
-- ----------------------------------------------------------------------------
-- DECISIONS (and why)
-- ----------------------------------------------------------------------------
-- The run. A Group's run is edition_number first_edition .. first_edition+3
-- (EDIT 1), i.e. §6's four editions. Editions after that are ignored.
--
-- "Write at least twice" counts EDITIONS written in, not posts. The app keeps
-- one post per member per edition (`fetchCurrentPost`, lib/posts.ts), but
-- nothing enforces it, and two posts in one edition are not two weeks of the
-- ritual. q2 shows raw post counts per edition beside it.
--
-- "≥5 of 8" is applied as a share: needed = ceil(5/8 × eligible members). A
-- 5-person family Group needs 4, a 10-person Group needs 7; at exactly 8 it is
-- the literal 5. q1 also prints the literal "≥5" test beside it. §6's own
-- parenthetical argues in percentages (3 of 8 = 37%), hence the share.
--
-- Late joiners. A member's available editions = the run's editions published
-- after they joined (their post could only land in those). They count in the
-- denominator iff they could still write twice: available + editions still to
-- come ≥ 2. So joining before edition 3 publishes counts, with no proration;
-- joining later drops them from the denominator, shown as "joined too late to
-- count". Anyone who meets the bar counts regardless.
--
-- Leavers. A member who wrote in the run and then left, or was removed
-- (remove_group_member keeps their compiled posts), stays in the denominator
-- with the whole run available — leaving is part of the result, not a reason
-- to shrink the denominator. Someone who left WITHOUT ever writing leaves no row
-- anywhere; compare q1's roster column against your own headcount. A deleted
-- account takes its posts with it (on delete cascade) and vanishes entirely.
--
-- The organizer counts like any member (they are one of the 8). Put anyone
-- who is in a Group only to watch it — e.g. you, in a family Group — in EDIT 2.
--
-- Timestamp: posts.created_at, never updated_at. compile_due_editions and
-- publish_edition_now `update posts set edition_id = …`, which fires the
-- posts_updated_at trigger, so every compiled post's updated_at is its
-- edition's published_at — verified on all 10 compiled production posts,
-- 2026-09-24. The last edit before publish is not recoverable after compile.
-- created_at is the first autosave: the compose screen inserts the row once
-- the body is non-empty, then updates it. So created_at = "started writing",
-- which is the moment a nudge has to precede. Two caveats:
--   * A post the organizer enters for someone (editions 1–2 accept entries by
--     any channel) carries the ORGANIZER's entry time. Nothing in the row says
--     who typed it. q5 splits editions 1–2 from 3–4; read 3–4 for the nudge.
--   * A post deleted and rewritten restarts the clock.
--
-- Timezone and slots. Each edition is matched to its scheduled slot the way
-- compile_due_editions matches one: publish_day + publish_time as wall-clock
-- time in groups.timezone, so DST moves the UTC instant, not the local slot.
-- The slot is the latest one at or before the edition's published_at. An
-- edition published within 20 minutes of it (compile-editions'
-- p_tolerance_minutes) is a cron edition, anchored to its slot. Anything else is
-- off-slot — a moderator's "publish now", or a schedule changed since — and is
-- anchored to its own published_at. Uses the Group's CURRENT schedule, so a
-- schedule changed mid-run makes earlier editions read as off-slot and can
-- invent a skipped slot in q3; if a moderator changes the day, note the date.
-- Hours are elapsed hours (DST-safe); every local time shown is in the Group's
-- zone. Uncompiled posts are anchored to the Group's next slot.
--
-- Install date: the first push_tokens.created_at per member — NOT
-- auth.users.last_sign_in_at, which signing in as someone (or code sign-in on
-- their behalf) also moves. What a token row does and doesn't mean, from the
-- code that writes and deletes them:
--   * Written only by registerForPushAsync (lib/notifications.ts), which
--     hooks/use-auth.ts calls whenever a session appears for a new user: cold
--     start or sign-in, on a PHYSICAL device (not a simulator, not web), with
--     notification permission GRANTED. The row means "installed and allowed
--     notifications"; a member who installed but declined is invisible here.
--     q6 flags anyone who wrote in editions 3–4 with no token.
--   * The upsert on (user_id, token) never touches created_at, so
--     re-registering on every cold start doesn't move it.
--   * Deleted on sign-out (lib/auth.ts signOut → unregisterPushAsync). Signing
--     back in writes a NEW row with a new created_at.
--   * Deleted by compile-editions when Expo answers DeviceNotRegistered —
--     uninstall, permission revoked, token reissued (pruneDeadPushTokens,
--     supabase/functions/_shared/edition-dispatch.ts).
--   * Deleted with the account (cascade).
--   So this is the earliest SURVIVING token: it can only move later, never
--   earlier. Read q6 every week and keep the output, rather than trusting a
--   week-4 read. (Production example: the one member with a token has posted
--   since April; their surviving token is from the 2026-09-22 dev-build test.)
--   One contamination path: signing in AS a member on your own phone writes
--   your device's token under their user_id until you sign out, and signing
--   back in as yourself re-stamps your own. The operator script avoids both.
--
-- ----------------------------------------------------------------------------
-- NOT ANSWERABLE HERE
-- ----------------------------------------------------------------------------
--   * §6 condition 2, "≥6 of 8 open the edition email, every edition".
--     Nothing here measures reading, deliberately: how to measure it is an
--     open owner decision (§9 — Resend open tracking is a pixel the privacy
--     policy promises the email doesn't carry). q1 prints it as not measured.
--   * §6 condition 3, "at least one post in weeks 3–4 arrives unprompted".
--     The database can't see your reminders. q7 lists the candidate posts and
--     classifies them only against reminders you log in EDIT 3.
--   * Who actually typed a post: the member in the app, or you entering it for
--     them. Keep your own list for editions 1–2.
--   * "Forgot" vs "declined" (§6, "If it dies") — the data look identical.
--   * Install with notifications declined (see above).
--   * §6 "Also collect": the $20 deposits and who paid without hesitating
--     (Stripe), and where "family" felt wrong (your notes).
-- ============================================================================


-- [setup] Shared by every query below. Only the three EDIT blocks change.
set transaction read only;
with
-- ── EDIT 1 of 3 — the Group Zero Groups ─────────────────────────────────────
-- One row per Group: a label for the readout, the Group's uuid or invite code
-- (either works — the code is what the app's invite screen shows; prefer the
-- uuid if you commit this file, since a code is a join credential), and the
-- edition_number that counts as Group Zero edition 1. Leave that at 1 unless
-- the Group published a test edition first. Last row: no trailing comma.
cohort (label, group_key, first_edition) as (
  values
    -- ('Group A',   '<uuid or invite code>', 1),
    -- ('Group B',   '<uuid or invite code>', 1),
    -- ('C1 family', '<uuid or invite code>', 1),
    -- ('C2 family', '<uuid or invite code>', 1),
    -- The two production test Groups (2026-09-24). Replace them.
    ('test Williams',  '08e1f751-e0ad-42be-b0f2-1ce097be6d2a', 1),
    ('test Castaways', '53c4bb70-40a5-404d-b50a-eb586dc3b4e4', 1)
),
-- ── EDIT 2 of 3 — observers (optional) ──────────────────────────────────────
-- Emails of members to leave out of every count and every timing: someone
-- who is in a Group only to watch it. Add rows above the placeholder.
observers (email) as (
  select email from (values
    -- ('you@example.com'),
    (null::text)
  ) v (email)
  where email is not null
),
-- ── EDIT 3 of 3 — reminders you sent (optional; feeds q1's condition 3 and q7)
-- One row per reminder: the Group (uuid or invite code), the member's email —
-- or null if you reminded the whole Group at once — and when you sent it.
-- A post counts as unprompted when no reminder reached its author between
-- the previous edition and the moment they started writing. Add rows above
-- the placeholder.
reminders (group_key, email, reminded_at) as (
  select group_key, email, reminded_at from (values
    -- ('<uuid or invite code>', 'sarah@example.com', timestamptz '2026-10-09 18:00 America/New_York'),
    -- ('<uuid or invite code>', null,                timestamptz '2026-10-10 09:00 America/New_York'),
    (null::text, null::text, null::timestamptz)
  ) v (group_key, email, reminded_at)
  where group_key is not null
),
-- ── End of edits. Everything below is shared machinery. ─────────────────────
rules (run_length, min_editions, pass_share, cron_grace) as (
  -- §6: four consecutive editions; "≥5 of 8 members write at least twice",
  -- applied as a share. cron_grace = compile-editions' p_tolerance_minutes.
  values (4, 2, 5.0 / 8, interval '20 minutes')
),
grp as (
  -- The cohort resolved to real Groups. A key that matches nothing, or a Group
  -- whose timezone Postgres doesn't know (compile skips those too), drops out
  -- here; q0 shows both. A Group listed twice is kept once (q0 says so).
  select distinct on (g.id)
         c.label, c.first_edition, g.id as group_id, g.name, g.timezone as tz,
         g.publish_day, g.publish_time
  from cohort c
  join public.groups g
    on g.id::text = lower(trim(c.group_key))
    or lower(g.invite_code) = lower(trim(c.group_key))
  where exists (select 1 from pg_timezone_names z where z.name = g.timezone)
  order by g.id, c.label
),
observer_ids as (
  select u.id as user_id
  from public.users u
  join observers o on lower(u.email) = lower(trim(o.email))
),
run_editions as (
  -- Each Group's run, each edition matched to its scheduled slot (see
  -- DECISIONS). local_pub / slot_local are wall-clock times in the Group's zone.
  select g.label, g.group_id, g.tz,
         e.id as edition_id,
         e.edition_number,
         e.edition_number - g.first_edition + 1 as run_no,
         e.published_at,
         (select max(e0.published_at)
            from public.editions e0
           where e0.group_id = e.group_id
             and e0.edition_number < e.edition_number) as prev_published_at,
         s.slot_local,
         s.slot_local at time zone g.tz as slot_at,
         e.published_at - (s.slot_local at time zone g.tz) <= r.cron_grace as on_slot,
         case when e.published_at - (s.slot_local at time zone g.tz) <= r.cron_grace
              then s.slot_local at time zone g.tz
              else e.published_at
         end as anchor_at
  from grp g
  cross join rules r
  join public.editions e
    on e.group_id = g.group_id
   and e.edition_number between g.first_edition and g.first_edition + r.run_length - 1
  cross join lateral (select e.published_at at time zone g.tz as local_pub) l
  cross join lateral (
    -- this week's slot on or before local_pub's date, as local wall-clock
    select (l.local_pub::date - ((extract(dow from l.local_pub)::int - g.publish_day + 7) % 7))
           + g.publish_time as local_slot
  ) c
  cross join lateral (
    -- same weekday but the slot time is still ahead → last week's slot
    select case when c.local_slot > l.local_pub then c.local_slot - interval '7 days'
                else c.local_slot end as slot_local
  ) s
),
next_slot as (
  -- Each Group's next slot from now: where uncompiled posts will land.
  select g.group_id,
         (case when c.local_slot > l.local_now then c.local_slot
               else c.local_slot + interval '7 days' end) at time zone g.tz as slot_at
  from grp g
  cross join lateral (select now() at time zone g.tz as local_now) l
  cross join lateral (
    select (l.local_now::date + ((g.publish_day - extract(dow from l.local_now)::int + 7) % 7))
           + g.publish_time as local_slot
  ) c
),
latest_due_slot as (
  -- The most recent slot that should already have produced an edition.
  select g.group_id,
         case when c.local_slot > l.local_due then c.local_slot - interval '7 days'
              else c.local_slot end as slot_local
  from grp g
  cross join rules r
  cross join lateral (select (now() - r.cron_grace) at time zone g.tz as local_due) l
  cross join lateral (
    select (l.local_due::date - ((extract(dow from l.local_due)::int - g.publish_day + 7) % 7))
           + g.publish_time as local_slot
  ) c
),
scope_posts as (
  -- Every post the readout looks at: the run's compiled posts (anchored to
  -- their edition) and the open window's uncompiled ones (run_no null,
  -- anchored to the next slot). Observers' posts are left out.
  select re.label, re.group_id, re.tz, re.run_no, re.edition_number, re.on_slot,
         re.anchor_at, re.prev_published_at,
         p.id as post_id, p.author_id, p.created_at
  from run_editions re
  join public.posts p on p.edition_id = re.edition_id
  where p.author_id not in (select user_id from observer_ids)
  union all
  select g.label, g.group_id, g.tz, null, null, null,
         ns.slot_at,
         (select max(e0.published_at) from public.editions e0 where e0.group_id = g.group_id),
         p.id, p.author_id, p.created_at
  from grp g
  join next_slot ns on ns.group_id = g.group_id
  join public.posts p on p.group_id = g.group_id and p.edition_id is null
  where p.author_id not in (select user_id from observer_ids)
),
roster as (
  -- Current members, plus anyone who wrote here but is no longer a member.
  select g.label, g.group_id, g.tz, m.user_id, m.role, m.joined_at
  from grp g
  join public.group_members m on m.group_id = g.group_id
  where m.user_id not in (select user_id from observer_ids)
  union
  select sp.label, sp.group_id, sp.tz, sp.author_id, 'former member', null::timestamptz
  from scope_posts sp
  where not exists (select 1 from public.group_members m
                     where m.group_id = sp.group_id and m.user_id = sp.author_id)
),
member_stats as (
  select x.*,
         x.role = 'former member'
           or x.available + greatest(x.run_length - x.published, 0) >= x.min_editions as eligible
  from (
    select r.label, r.group_id, r.tz, r.user_id, r.role, r.joined_at,
           u.display_name, u.email,
           left(r.user_id::text, 8) as member_ref,
           ru.run_length, ru.min_editions,
           (select count(*) from run_editions re where re.group_id = r.group_id) as published,
           (select count(*) from run_editions re
             where re.group_id = r.group_id
               and (r.joined_at is null or re.published_at > r.joined_at)) as available,
           (select count(distinct sp.run_no) from scope_posts sp
             where sp.group_id = r.group_id and sp.author_id = r.user_id
               and sp.run_no is not null) as written,
           (select count(*) from scope_posts sp
             where sp.group_id = r.group_id and sp.author_id = r.user_id
               and sp.run_no is null) as open_posts
    from roster r
    cross join rules ru
    left join public.users u on u.id = r.user_id
  ) x
),
edition_gaps as (
  -- Scheduled slots that passed with no edition between this run edition and
  -- the one before it. Counted on local wall-clock, so a DST week is still a week.
  select re.*,
         case when re.run_no = 1 or re.prev_published_at is null then null
              else greatest(
                     case when re.slot_local > (re.prev_published_at at time zone re.tz)
                          then floor(extract(epoch from re.slot_local
                                       - (re.prev_published_at at time zone re.tz)) / 604800)::int + 1
                          else 0 end
                     - case when re.on_slot then 1 else 0 end,
                     0)
         end as missed_before
  from run_editions re
),
cadence as (
  select g.group_id,
         count(eg.edition_id) as published,
         coalesce(sum(eg.missed_before), 0) as missed_between,
         count(eg.edition_id) filter (where not eg.on_slot) as off_slot,
         max(eg.run_no) as last_run_no,
         -- For a run still short of four: slots due since its last edition.
         case when count(eg.edition_id) = 0 then null
              when lds.slot_local > (max(eg.published_at) at time zone g.tz)
              then floor(extract(epoch from lds.slot_local
                           - (max(eg.published_at) at time zone g.tz)) / 604800)::int + 1
              else 0
         end as missed_since_last
  from grp g
  join latest_due_slot lds on lds.group_id = g.group_id
  left join edition_gaps eg on eg.group_id = g.group_id
  group by g.group_id, g.tz, lds.slot_local
),
reminder_log as (
  select g.id as group_id, lower(trim(rm.email)) as email, rm.reminded_at
  from reminders rm
  join public.groups g
    on g.id::text = lower(trim(rm.group_key))
    or lower(g.invite_code) = lower(trim(rm.group_key))
),
weeks_3_4 as (
  -- §6 condition 3's candidates: posts in run editions 3 and 4.
  select sp.label, sp.group_id, sp.tz, sp.run_no, sp.author_id, sp.created_at,
         u.display_name,
         (select count(*) from reminder_log rl
           where rl.group_id = sp.group_id
             and (rl.email is null or rl.email = lower(u.email))
             and rl.reminded_at > coalesce(sp.prev_published_at, '-infinity'::timestamptz)
             and rl.reminded_at <= sp.created_at) as reminders_before,
         exists (select 1 from reminder_log rl where rl.group_id = sp.group_id) as group_has_log
  from scope_posts sp
  left join public.users u on u.id = sp.author_id
  where sp.run_no between 3 and 4
)
-- [/setup]


-- [q0] Cohort check — every key resolves; schedule; next slot. Run first.
-- (Slots at 23:40 or later used to be flagged "SLOT NEVER FIRES": the compile's
-- time-of-day window wrapped at midnight. Fixed by migration 20260925212248,
-- live 2026-09-25.)
select c.label,
       g.name as group_name,
       case when g.id is null then 'NO SUCH GROUP: check the key'
            when count(*) over (partition by g.id) > 1
              then 'LISTED TWICE: counted once, as ' || (select gg.label from grp gg where gg.group_id = g.id)
            when not exists (select 1 from pg_timezone_names z where z.name = g.timezone)
              then 'UNKNOWN TIMEZONE: fails the compile for every Group, not just this one'
            else 'ok' end as status,
       g.timezone,
       (array['Sun','Mon','Tue','Wed','Thu','Fri','Sat'])[g.publish_day + 1]
         || ' ' || to_char(g.publish_time, 'HH24:MI') as publishes,
       (select u.display_name
          from public.group_members m join public.users u on u.id = m.user_id
         where m.group_id = g.id and m.role = 'moderator'
         order by m.joined_at limit 1) as moderator,
       (select count(*) from public.group_members m where m.group_id = g.id) as members,
       (select count(*) from public.editions e where e.group_id = g.id) as editions_ever,
       (select count(*) from run_editions re where re.group_id = g.id)
         || ' of ' || r.run_length as run_editions,
       to_char(ns.slot_at at time zone g.timezone, 'Dy YYYY-MM-DD HH24:MI') as next_slot_local
from cohort c
cross join rules r
left join public.groups g
  on g.id::text = lower(trim(c.group_key))
  or lower(g.invite_code) = lower(trim(c.group_key))
left join next_slot ns on ns.group_id = g.id
order by c.label;
-- [/q0]


-- [q1] Pass sheet — one row per Group. §6: four consecutive editions AND all
-- three conditions. Condition 2 (reading) is not measured here; see header.
select g.label,
       c.published || ' of ' || r.run_length as editions,
       w.roster,
       w.eligible,
       w.met_bar as wrote_2_plus,
       w.needed,
       case when c.published < r.run_length then 'IN PROGRESS'
            when w.met_bar >= w.needed then 'PASS'
            else 'FAIL' end as cond1_writers,
       case when w.met_bar >= 5 then 'yes' else 'no' end as literal_5_writers,
       wr.by_edition as writers_by_edition,
       case when c.published = 0 then 'not started'
            when c.missed_between > 0
              then 'NO: ' || c.missed_between || ' slot(s) skipped inside the run'
            when c.published < r.run_length and c.missed_since_last > 0
              then 'NO: ' || c.missed_since_last || ' slot(s) since edition '
                   || c.last_run_no || ' with no edition'
            when c.published < r.run_length then 'so far'
            else 'YES' end
         || case when c.off_slot > 0 then ' (' || c.off_slot || ' off-slot)' else '' end
         as four_consecutive,
       case when c.published < 3 then 'weeks 3-4 not reached'
            when u.posts = 0 then case when c.published < r.run_length then 'none yet'
                                       else 'FAIL: no posts in weeks 3-4' end
            when not u.has_log then u.posts || ' post(s); no reminders logged'
            when u.unprompted > 0 then 'PASS: ' || u.unprompted || ' unprompted'
            when c.published < r.run_length then 'none unprompted yet'
            else 'FAIL: all prompted' end as cond3_unprompted,
       'not measured here (§9)' as cond2_reading
from grp g
cross join rules r
join cadence c on c.group_id = g.group_id
cross join lateral (
  select count(*) as roster,
         count(*) filter (where ms.eligible) as eligible,
         count(*) filter (where ms.written >= r.min_editions) as met_bar,
         ceil(r.pass_share * count(*) filter (where ms.eligible))::int as needed
  from member_stats ms
  where ms.group_id = g.group_id
) w
cross join lateral (
  select string_agg(coalesce(n.writers, 0)::text, ' / ' order by re.run_no) as by_edition
  from run_editions re
  left join lateral (
    select count(distinct sp.author_id) as writers
    from scope_posts sp where sp.group_id = re.group_id and sp.run_no = re.run_no
  ) n on true
  where re.group_id = g.group_id
) wr
cross join lateral (
  select count(*) as posts,
         count(*) filter (where wk.reminders_before = 0) as unprompted,
         exists (select 1 from reminder_log rl where rl.group_id = g.group_id) as has_log
  from weeks_3_4 wk
  where wk.group_id = g.group_id
) u
order by g.label;
-- [/q1]


-- [q2] Writing per member — every member, including those who wrote nothing.
-- e1..e4 = posts in that run edition; 'late' = not yet a member when it
-- published; blank = not published yet. open_window = uncompiled posts now.
select ms.label,
       ms.display_name as member,
       ms.member_ref,
       ms.role,
       to_char(ms.joined_at at time zone ms.tz, 'YYYY-MM-DD') as joined_local,
       e.e1, e.e2, e.e3, e.e4,
       ms.written as editions_written,
       ms.available as editions_available,
       ms.open_posts as open_window,
       case when ms.written >= ms.min_editions then 'meets the bar'
            when not ms.eligible then 'joined too late to count'
            when ms.role = 'former member' then 'left the Group'
            when ms.published < ms.run_length
              then 'in progress: ' || (ms.min_editions - ms.written) || ' more needed'
            else 'below the bar' end as status
from member_stats ms
cross join lateral (
  select max(case when k.run_no = 1 then k.cell end) as e1,
         max(case when k.run_no = 2 then k.cell end) as e2,
         max(case when k.run_no = 3 then k.cell end) as e3,
         max(case when k.run_no = 4 then k.cell end) as e4
  from (
    select re.run_no,
           case when n.posts = 0 and ms.joined_at is not null
                     and re.published_at <= ms.joined_at then 'late'
                else n.posts::text end as cell
    from run_editions re
    cross join lateral (
      select count(*) as posts from scope_posts sp
      where sp.group_id = re.group_id and sp.run_no = re.run_no
        and sp.author_id = ms.user_id
    ) n
    where re.group_id = ms.group_id
  ) k
) e
order by ms.label, (ms.role = 'moderator') desc, ms.display_name;
-- [/q2]


-- [q3] The four editions — did they run on consecutive slots? A slot with no
-- posts produces no edition, so a skipped slot is a week nobody wrote.
select re.label,
       re.run_no,
       re.edition_number,
       to_char(re.published_at at time zone re.tz, 'Dy YYYY-MM-DD HH24:MI') as published_local,
       case when re.on_slot then 'cron slot'
            else 'off-slot: publish now, or schedule changed' end as kind,
       re.missed_before as slots_skipped_before,
       (select count(*) from scope_posts sp
         where sp.group_id = re.group_id and sp.run_no = re.run_no) as posts,
       (select count(distinct sp.author_id) from scope_posts sp
         where sp.group_id = re.group_id and sp.run_no = re.run_no) as writers,
       (select string_agg(distinct u.display_name, ', ')
          from scope_posts sp join public.users u on u.id = sp.author_id
         where sp.group_id = re.group_id and sp.run_no = re.run_no) as who
from edition_gaps re
order by re.label, re.run_no;
-- [/q3]


-- [q4] When people write — every post, with hours between starting it
-- (created_at) and its publish slot. Open-window posts use the next slot.
select sp.label,
       case when sp.run_no is null then 'open'
            else 'e' || sp.run_no || ' (#' || sp.edition_number || ')' end as edition,
       u.display_name as member,
       to_char(sp.created_at at time zone sp.tz, 'Dy YYYY-MM-DD HH24:MI') as started_local,
       to_char(sp.anchor_at at time zone sp.tz, 'Dy YYYY-MM-DD HH24:MI') as publish_local,
       h.hours_before,
       case when h.hours_before < 0 then 'after the slot'
            when h.hours_before <= 6 then 'last 6h'
            when h.hours_before <= 24 then '6-24h'
            when h.hours_before <= 48 then '24-48h'
            when h.hours_before <= 72 then '48-72h'
            else 'over 72h' end as lead,
       case when sp.run_no is null then 'next slot (open window)'
            when sp.on_slot then 'cron slot'
            else 'off-slot: own publish time' end as anchored_to
from scope_posts sp
left join public.users u on u.id = sp.author_id
cross join lateral (
  select round(extract(epoch from sp.anchor_at - sp.created_at) / 3600, 1) as hours_before
) h
order by sp.label, sp.run_no nulls last, sp.created_at;
-- [/q4]


-- [q5] When people write — the distribution that tests the nudge's 48h
-- guess. Compiled run posts only (an open window is still filling). Read the
-- editions 3-4 rows: editions 1-2 can hold posts you entered for someone,
-- stamped with YOUR entry time. within_48h = share started inside the last
-- 48h, i.e. after a 48h nudge would already have gone out.
select case when grouping(t.label) = 1 then 'ALL GROUPS' else t.label end as label,
       t.half,
       count(*) as posts,
       round(percentile_cont(0.25) within group (order by t.h)::numeric, 1) as p25_hours,
       round(percentile_cont(0.50) within group (order by t.h)::numeric, 1) as median_hours,
       round(percentile_cont(0.75) within group (order by t.h)::numeric, 1) as p75_hours,
       round(100.0 * count(*) filter (where t.h <= 6) / count(*)) as pct_within_6h,
       round(100.0 * count(*) filter (where t.h <= 24) / count(*)) as pct_within_24h,
       round(100.0 * count(*) filter (where t.h <= 48) / count(*)) as pct_within_48h,
       round(100.0 * count(*) filter (where t.h <= 72) / count(*)) as pct_within_72h,
       count(*) filter (where not t.on_slot) as off_slot_posts
from (
  select sp.label,
         case when sp.run_no <= 2 then 'editions 1-2' else 'editions 3-4' end as half,
         (extract(epoch from sp.anchor_at - sp.created_at) / 3600)::float8 as h,
         sp.on_slot
  from scope_posts sp
  where sp.run_no is not null
) t
group by grouping sets ((t.half, t.label), (t.half))
order by t.half, grouping(t.label), t.label;
-- [/q5]


-- [q6] Install dates — first surviving push token per member (see header for
-- what a token row does and doesn't mean). app_from = the first run edition
-- the member had the app for.
select ms.label,
       ms.display_name as member,
       ms.member_ref,
       ms.role,
       to_char(ms.joined_at at time zone ms.tz, 'YYYY-MM-DD') as joined_local,
       to_char(t.first_at at time zone ms.tz, 'Dy YYYY-MM-DD HH24:MI') as first_token_local,
       coalesce(t.tokens, 0) as tokens_now,
       t.platforms,
       case when t.first_at is null then 'no token'
            when a.first_run_no is not null then 'edition ' || a.first_run_no
            when ms.published < ms.run_length then 'edition ' || (ms.published + 1) || ' (upcoming)'
            else 'after the run' end as app_from,
       round(extract(epoch from t.first_at - ms.joined_at) / 86400, 1) as days_join_to_token,
       case when t.first_at is null and exists (
              select 1 from scope_posts sp
               where sp.group_id = ms.group_id and sp.author_id = ms.user_id
                 and sp.run_no between 3 and 4)
            then 'wrote in e3/e4 with no token: notifications declined, a simulator, or entered for them'
       end as note
from member_stats ms
left join (
  select pt.user_id,
         min(pt.created_at) as first_at,
         count(*) as tokens,
         string_agg(distinct pt.platform, ',') as platforms
  from public.push_tokens pt
  group by pt.user_id
) t on t.user_id = ms.user_id
left join lateral (
  select min(re.run_no) as first_run_no
  from run_editions re
  where re.group_id = ms.group_id and re.published_at > t.first_at
) a on true
order by ms.label, t.first_at nulls last, ms.display_name;
-- [/q6]


-- [q7] Weeks 3-4 — which posts arrived unprompted. Classified only against
-- the reminders logged in EDIT 3; with no log, every row says so.
select wk.label,
       'e' || wk.run_no as edition,
       wk.display_name as member,
       to_char(wk.created_at at time zone wk.tz, 'Dy YYYY-MM-DD HH24:MI') as started_local,
       wk.reminders_before,
       case when not wk.group_has_log then 'no reminders logged for this Group'
            when wk.reminders_before = 0 then 'UNPROMPTED'
            else 'prompted' end as verdict
from weeks_3_4 wk
order by wk.label, wk.run_no, wk.created_at;
-- [/q7]
