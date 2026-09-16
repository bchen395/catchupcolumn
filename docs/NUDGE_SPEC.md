# Pre-publish nudge — build spec

**Working document. Delete this file when the nudge ships.** Why it matters and
when to build it are [POSITIONING.md](./POSITIONING.md) §3 and §8 step 7 — the
short version is that it is sequenced **after** Group Zero's four clean editions,
not during them, and only if the run showed people *forgetting* rather than
declining.

Read the `db-migrations` and `edge-functions` skills before starting.

---

## The copy already exists

`constants/strings.ts:167–177` (`Strings.thisWeek`) has the right register:

- `bylines` — `"Martha and Dave have written this week"` + `bylinesAddYours` —
  `" — there's still time to add yours."`
- `noBylines` — `"No stories yet this week — yours could be the first."`

These render on Home today, which means **only people who already opened the app
see them.** The people who need them are precisely the ones who didn't. The nudge
is mostly a delivery problem, not a writing problem.

## Spec

**Timing.** ~48 hours before publish (Friday morning for a Sunday 9am edition),
evaluated in the group's own `timezone`, same as compilation.

**Where it runs.** Inside the existing `compile-editions` function. The Supabase
cron already invokes it every 15 minutes; add a `nudgeDueGroups(client)` call
alongside `dispatchPendingEmails` / `dispatchPendingPushes`. **No new cron, no
new function, no new secret.**

**Idempotency.** The compile path guards against duplicate work with a
slot-scoped check plus an advisory lock. Mirror it — at nudge time no edition row
exists yet, so the marker needs its own home:

```sql
create table edition_nudges (
  group_id  uuid not null references groups(id) on delete cascade,
  slot_at   timestamptz not null,   -- the publish slot this nudge is for
  sent_at   timestamptz not null default now(),
  primary key (group_id, slot_at)
);
```

Insert-on-send; the PK makes a double-tick a no-op. RLS: no client access needed
at all (service-role only), so enable RLS and add no policies.

**New RPC** — `nudge_due_groups(p_lead_hours int default 48,
p_tolerance_minutes int default 20)`, `SECURITY DEFINER`, returning the members to
notify. Selection rules:

- Groups whose next publish slot is `p_lead_hours` away, ± tolerance, in the
  group's `timezone`
- Skip groups already in `edition_nudges` for that slot
- **Skip single-member groups** — there is nothing social about nudging yourself
- Skip members who have already written an uncompiled post for this cycle
- Respect `group_members.push_subscribed`
- Return, per recipient: group name, count and first names of who *has* written

Note: existing migrations use an invalid 8-character SQLSTATE in
`raise … using errcode`. Use a valid 5-character code in this one.

**Channel: push only. Do not email the nudge.** Email is the edition's channel; a
second weekly email cheapens the one that matters and invites unsubscribes that
also kill edition delivery. If a member has no push token, they get nothing this
cycle — accept that (and see POSITIONING §4, which fixes it properly).

**Tone — binding.** Positive social proof only. Report who *has* written, never
who hasn't. No counts of missing people, no streaks, no guilt, no urgency
language. BRAND.md calls for "a warm nudge, never urgency," and this community in
particular will uninstall over an engagement-mechanic smell. One nudge per member
per cycle, hard cap.

Suggested copy, matching `Strings.push.editionReady`'s register:

- Title: `Two days to press`
- Body, with writers: `Martha and Dave have written this week — there's still time to add yours.`
- Body, empty: `No stories yet this week — yours could be the first.`

**Copy-duplication caveat:** the edge functions are Deno and can't import
`constants/strings.ts`, so push copy is already duplicated between the app and
`_shared/edition-dispatch.ts`. Put the nudge strings next to the existing push
copy in `_shared/` rather than inventing a third location, and leave a comment in
`strings.ts` pointing at it.

**Deep link.** Straight to the composer, not Home. The nudge's only job is to get
one post written.

## Checklist

- [ ] Migration: `edition_nudges` table + RLS enabled, no policies
- [ ] Migration: `nudge_due_groups` RPC
- [ ] `nudgeDueGroups()` in `_shared/` + wired into `compile-editions`
- [ ] Nudge copy in `_shared/`, cross-referenced from `strings.ts`
- [ ] Deep link to composer verified on a real device
- [ ] `deno check` across `supabase/functions`
- [ ] Manual test: POST to `compile-editions` with the `CRON_SECRET` bearer token
      against a group with a slot ~48h out
- [ ] Verify the double-tick no-op (invoke twice, confirm one row, one push)

## Tune the lead time against real data

48h is a guess. Group Zero produces the answer for free — query `posts.created_at`
in the Supabase SQL editor to see *when* in the week people actually write, and
set `p_lead_hours` from that distribution rather than from this document.

## Adjacent, and not part of this build

**What does a thin edition look like?** Empty editions are already skipped
(`skipped_no_posts`) — correct. But an edition where exactly one person wrote
still publishes, and for a friend group that's the moment the ritual either
survives or visibly fails. **A one-story edition should read as a letter, not as
a failure.** That's a design task in the reader and the email, not a copy tweak,
and it's worth doing before launch independent of the nudge.
