# POSITIONING.md — Friends-first repositioning, retention, and money

**Decision date: 2026-09-14.** This doc is the handoff for a change of direction
made before launch, and the checklist for executing it. It is a companion to
[LAUNCH.md](./LAUNCH.md) (the submission runbook) and
[STORE_LISTING.md](./STORE_LISTING.md) (store metadata).

Steps marked **[owner]** need your accounts, your friends, or your judgment and
can't be done from the repo.

---

## 1. The decision

**Catch Up Column is for post-grad friend groups first, families second.**

The previous target audience — "older adults (grandparents, older parents)" —
was a demographic, not a community. It isn't reachable: grandparents don't
gather anywhere you can post, and neither do families. Every install would have
depended on finding one determined organizer with no way to find them.

The new framing, in two parts:

- **The unit of use is the friend group.** 6–10 people who were close in one
  place and now live in five states. The pain is not "we don't care" — it's
  "there is no occasion." The group text is dead or it's memes. Instagram
  reports that they exist, not how they are.
- **The community is the movement.** People consciously trying to leave the
  attention economy without losing their friends in the process. That community
  *is* findable, has shared language and a canon, and its members are exactly
  the organizers who will start a Group and drag six friends in. The six friends
  never need to have heard of the movement.

**Why this and not the alternatives:** the owner is a genuine member of this
community and has the pain personally (friends scattered across America, family
in two states). The diaspora and sibling-caregiver segments score higher on pain
and willingness to pay, but the owner is not a member of either, and pretending
otherwise is the most reliable way to fail.

**The pitch, for reuse across copy:**

> You have eight people you'd take a bullet for, scattered across five states.
> You haven't really talked in four months. Not because you don't care —
> because there's no occasion.

**What is already true and should be marketed as the point:** there are no
likes, no reactions, no comments, and no follower counts anywhere in the schema
or in any of the 24+ migrations. That isn't a missing feature; it's the thesis,
already shipped. `STORE_LISTING.md` buries the line that should be the headline:
*"No feeds to scroll. No strangers. No ads. Just the people you choose,
catching up."*

### What does NOT change

- **No schema rewrite, no redesign.** The product is right; the words around it
  point at the wrong people.
- **Families stay a first-class use case.** This is a generalization, not a
  replacement. "The Williams Family Weekly" must keep working and keep feeling
  native.
- **The accessibility floor stays exactly where it is.** BRAND.md §6's scale
  floor (19px row headlines, 16px UI body, ≥56px targets) is currently justified
  as "the grandparent clause." Keep the floor and keep the name — family groups
  still contain grandparents, and large readable type is not a concession to
  one audience.
- **The app name survives untouched.**

### Why the comparable products died

Storyworth (§5) is the monetization comp, not the product comp. The product comp
is the private-friend-group app, and that category is a graveyard: Path shut
down, Cocoon shut down, Geneva was absorbed. They died from one cause —
**nothing brought people back between events.** The app was a place you had to
remember to go, and a small private group generates no ambient reason to go
there.

The structural answer here is already shipped, and stating it explicitly changes
what to prioritize: **the retention surface is the edition email, not the app.**
The edition arrives on a schedule whether or not anyone opens the app; the app
is the composer and the archive. Two consequences:

- §3's nudge is push-only by design, but a member with no push token is then
  invisible to the only mechanism that reaches people *between* editions. That's
  a real hole, not a rounding error.
- §4 (write-by-web) matters more than its "gated on evidence" status implies. If
  email is the retention surface and this community is app-averse by identity,
  the app is the weakest link in the chain. Also check whether inbound email is
  available on the current Resend plan — "reply to this edition to write next
  week's entry" is cheaper than a magic-link composer and matches the
  community's stated preference better.

---

## 2. Work item — the copy pass (friends + family)

**Status: not started.** Cheapest, highest-leverage item on the board. Do this
before any store submission, or you launch pointed at the wrong audience.

### House vocabulary

The repo already contains the neutral phrase in two places
(`web/index.html:24`, and the edition-email footer's "Start one for your
people"). Make it the convention:

- **Default: "your people."** Warm, true for both audiences, already in the
  product's voice.
- **When you need to be explicit: "family and friends."**
- **"Family" only when the sentence is literally about a family.**
- **Never "loved ones"** — greeting-card register, wrong for a 26-year-old
  writing to college friends.

Add this to CLAUDE.md's **Key Terminology** section when the pass lands.

### Files to change

**`constants/strings.ts`**
- [ ] `:80` — `empty.groups.body`: "start your family newsletter" → "start your
      group's newsletter"
- [ ] `:136` — `home.deckLines`: "Every family has stories worth printing." →
      "Everyone has stories worth printing." (keep the line count at 5; the
      rotation is by `dailyIndex`)
- [ ] `:155` — `home.firstEdition.deck`: "Everything your family writes this
      week…" → "Everything your people write this week…"
- [ ] `:228` — `invite.errorRevoked`: "Ask your family for a fresh code." →
      "Ask whoever invited you for a fresh code." (also better copy — the
      inviter may not be family in either framing)
- [ ] `:247` — update the section comment above `inviteCard`
- [ ] `:249` — `inviteCard.title`: "Invite your family" → "Invite your people"

**`app/group/create.tsx`**
- [ ] `:85` — "Give your Group a name so your family can find it." → "…so your
      people can find it."
- [ ] `:184` — placeholder "e.g. The Williams Family Weekly". **Rotate two
      examples** so neither audience feels like the afterthought — e.g. "The
      Williams Family Weekly" and "The Sunday Dispatch." A friends-only example
      here is the single clearest signal that friend groups belong.

**`app/(tabs)/profile.tsx`**
- [ ] `:158` — "Enter the name you want your family to see." → "…you want your
      Group to see."

**`components/invite-family-card.tsx`**
- [ ] Rename to `invite-card.tsx` (kebab-case, per CLAUDE.md Code Style)
- [ ] Rename the component `InviteFamilyCard` → `InviteCard`
- [ ] Update the import at `app/group/[id].tsx:19` and the usage at `:586`

**`web/index.html`** — the landing page is the single most audience-defining
surface, and it currently says "family" four times.
- [ ] `:6` — `<title>`: "a weekly newspaper, written by your family" → "…written
      by your people"
- [ ] `:7` — meta description: same substitution
- [ ] `:18` — `.dateline`: same substitution
- [ ] `:21` — body paragraph: "…arrives for the whole family as one beautiful
      edition" → "…for everyone". **Also consider leading with the friend-group
      pain here** — "The group text scrolls away. This doesn't." is already a
      good first line; the paragraph after it is where the new pitch belongs.
- [ ] `:35` — colophon: "Written by families. Printed by us." → "Written by you.
      Printed by us."

**`docs/STORE_LISTING.md`** — [owner] re-paste into App Store Connect after.
- [ ] Subtitle (30 char max): "A newspaper by your family" → **"A newspaper by
      your people"** (26 chars) or **"The opposite of a feed"** (22). The second
      is stronger for this community; the first is safer for App Review and
      search. Owner's call.
- [ ] Short description (80 max): "…with family and friends" — already fine,
      verify it reads friends-first
- [ ] Full description: reorder so "No feeds to scroll. No strangers. No ads."
      appears in the **first** paragraph, not the third
- [ ] Keywords: drop `grandparents` (12 chars), add `friends` (7). Frees 5 chars
      against the 100-char cap. Consider also `nosurf` or `minimalism` if they
      fit.
- [ ] Promotional text: currently "Your family's weekly newspaper" — rewrite
      friends-first (this field is updatable without review, so it's the
      cheapest place to A/B the pitch post-launch)

**Low priority — comments and fixtures, cosmetic only**
- [ ] `app/group/welcome.tsx:16` — comment says "family record"
- [ ] `supabase/functions/_shared/edition-email.ts:271` — comment says "never
      shout over the family"
- [ ] `supabase/functions/_shared/preview/render-email-fixtures.ts:52` — the
      fixture group is "The Williams Family Weekly". Changing it re-renders the
      email fixtures; harmless, but run the fixture renderer after (see
      CLAUDE.md Commands) since it fails on Gmail's clip limit.

### Docs to update when the pass lands

Per CLAUDE.md's self-maintaining-skills rule, the source of truth moves with the
change:
- [x] **CLAUDE.md → "Target Audience"** — rewritten friends-first 2026-09-14
      (heading lost its "(MVP)" suffix). This is the one that matters; it's what
      every future session reads.
- [x] **CLAUDE.md → "Key Terminology"** — "your people" convention added as
      **Audience vocabulary**, and "NOT in MVP" was restructured into
      **Non-features** (permanent vs. merely deferred)
- [ ] **`.claude/skills/frontend-design/SKILL.md`** — grep it for family
      language and the audience description
- [ ] **design/BRAND.md §9** (language tone) — the examples are family-flavored;
      add a friend-group example beside them

### Verification

- [ ] `npm run typecheck` and `npm run lint` (the component rename is the only
      part that can actually break)
- [ ] `grep -rn -i "famil\(y\|ies\)" constants/ app/ web/ components/ | grep -v
      "fontFamily\|Typography.families\|css2?family"` — should return only
      deliberate uses
- [ ] Walk the onboarding flow on device; the family framing is densest there

---

## 3. Work item — the pre-publish nudge (the retention feature)

**Status: does not exist. Highest retention-per-line-of-code item on the board —
but sequenced after Group Zero, not during it. See §8 step 5 for why.**

### Why this is the priority

Friend groups die from a specific failure: two people skip a week, the edition
lands thin, everyone reads the signal, and it's over by week four. Families
tolerate a quiet week because the relationship is permanent; friend groups don't,
because the group only exists as long as the ritual does. **Churn is the single
biggest risk to the friends-first bet, and the nudge is the direct answer.**

Right now nothing tells anyone the deadline is coming. Push exists, but only
fires *after* an edition publishes — which is exactly too late to affect it.

### The copy already exists

`constants/strings.ts:167-177` (`Strings.thisWeek`) has the right register:

- `bylines` — `"Martha and Dave have written this week"` + `bylinesAddYours` —
  `" — there's still time to add yours."`
- `noBylines` — `"No stories yet this week — yours could be the first."`

These render on Home today, which means **only people who already opened the app
see them.** The people who need them are precisely the ones who didn't. The
nudge is mostly a delivery problem, not a writing problem.

### Spec

**Timing.** ~48 hours before publish (Friday morning for a Sunday 9am edition),
evaluated in the group's own `timezone`, same as compilation.

**Where it runs.** Inside the existing `compile-editions` function. The Supabase
cron already invokes it every 15 minutes; add a `nudgeDueGroups(client)` call
alongside `dispatchPendingEmails` / `dispatchPendingPushes`. **No new cron, no
new function, no new secret.**

**Idempotency.** The compile path guards against duplicate work with a
slot-scoped check plus an advisory lock. Mirror it — at nudge time no edition
row exists yet, so the marker needs its own home:

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
p_tolerance_minutes int default 20)`, `SECURITY DEFINER`, returning the members
to notify. Selection rules:

- Groups whose next publish slot is `p_lead_hours` away, ± tolerance, in the
  group's `timezone`
- Skip groups already in `edition_nudges` for that slot
- **Skip single-member groups** — there is nothing social about nudging yourself
- Skip members who have already written an uncompiled post for this cycle
- Respect `group_members.push_subscribed`
- Return, per recipient: group name, count and first names of who *has* written

Note: existing migrations use an invalid 8-character SQLSTATE in
`raise … using errcode`. Use a valid 5-character code in this one.

**Channel: push only. Do not email the nudge.** Email is the edition's channel;
a second weekly email cheapens the one that matters and invites unsubscribes
that also kill edition delivery. If a member has no push token, they get
nothing this cycle — accept that (and see §4, which fixes it properly).

**Tone — binding.** Positive social proof only. Report who *has* written, never
who hasn't. No counts of missing people, no streaks, no guilt, no urgency
language. BRAND.md calls for "a warm nudge, never urgency," and this community
in particular will uninstall over an engagement-mechanic smell. One nudge per
member per cycle, hard cap.

Suggested copy, matching `Strings.push.editionReady`'s register:
- Title: `Two days to press`
- Body, with writers: `Martha and Dave have written this week — there's still time to add yours.`
- Body, empty: `No stories yet this week — yours could be the first.`

**Copy-duplication caveat:** the edge functions are Deno and can't import
`constants/strings.ts`, so push copy is already duplicated between the app and
`_shared/edition-dispatch.ts`. Put the nudge strings next to the existing push
copy in `_shared/` rather than inventing a third location, and leave a comment
in `strings.ts` pointing at it.

**Deep link.** Straight to the composer, not Home. The nudge's only job is to
get one post written.

### Checklist

- [ ] Migration: `edition_nudges` table + RLS enabled, no policies
- [ ] Migration: `nudge_due_groups` RPC
- [ ] `nudgeDueGroups()` in `_shared/` + wired into `compile-editions`
- [ ] Nudge copy in `_shared/`, cross-referenced from `strings.ts`
- [ ] Deep link to composer verified on a real device
- [ ] `deno check` across `supabase/functions`
- [ ] Manual test: POST to `compile-editions` with the `CRON_SECRET` bearer
      token against a group with a slot ~48h out
- [ ] Verify the double-tick no-op (invoke twice, confirm one row, one push)

### The adjacent question: what does a thin edition look like?

Empty editions are already skipped (`skipped_no_posts`) — correct. But an
edition where exactly one person wrote still publishes, and for a friend group
that's the moment the ritual either survives or visibly fails. **Decide
deliberately:** a one-story edition should read as a letter, not as a failure.
This is a design task, not a copy task, and it's worth doing before launch.

---

## 4. Work item — write-by-web (decide after Group Zero)

**Status: not started. Gated on evidence.**

Today you cannot write without the app: `web/` serves edition permalinks and the
legal pages only. For this community specifically that's a real problem —
you're asking self-identified digital minimalists to install an app to fix their
app problem, and that objection is identity-level, not convenience-level.

The structural answer is a **magic-link web composer**: everyone already gets a
weekly email; let the email be the way in. Participation without installing
anything, and the app becomes optional for the friends who won't install it.

Infrastructure is mostly there — Vercel deployment, Supabase Auth (magic links
are a built-in flow), the storage buckets, and the edition permalink route.

**Do not build this on speculation.** Run Group Zero (§6) first and read the
number off the editions 1–2 (any channel) vs. editions 3–4 (app required)
delta — that's a measured drop-off, not a self-reported headcount. If 2+ of 8
fall out when the app becomes mandatory, build it. If nobody does, it's a
distraction.

Note that §1 ("Why the comparable products died") argues this is more load-
bearing than a gated experiment usually is: if the edition email is the real
retention surface, the app is the weakest link in the chain, and this is the
item that removes it.

Secondary benefit if built: it also fixes the nudge's "no push token" gap, since
a web-only member can be reached by a link.

---

## 5. Work item — monetization

**Status: planning only. Revenue target is 6–12 months from 2026-09-14.**

**Direction changed 2026-09-14 (same day, owner's call): in-app monetization is
the path; the printed volume is deferred until the app has users and some
proven success.** The reasoning is operational, not strategic — a physical
product means sourcing a manufacturer, COGS, shipping, damaged-copy support,
and returns, and that is a second business bolted onto a solo founder who has
not yet run one edition. The artifact thesis below is still sound; it is just
not the thing to do first. §5 previously had this the other way around.

### The constraint (unchanged, and it still binds)

Post-grads will not pay a monthly subscription to talk to their friends. The
community being courted is actively hostile to paying for connection — it's a
large part of what they're leaving. **Any plan that charges the six friends
kills the network before it forms.**

This constraint does not relax because the strategy moved in-app. It is the
filter the in-app options have to pass through, and it eliminates most of them.

### The three in-app options, against that filter

The mechanism is explicitly undecided and does not need deciding yet. What can
be decided now is which options are still live:

| Option | Verdict |
| --- | --- |
| **Organizer pays, readers always free** | **The live one.** Charges exactly one person — the one who already wants the group to survive and who does the recruiting work. The six friends are never asked for money, so the constraint holds |
| **Paywalled features** | Risky, and partly foreclosed. "Paywalling group size" is already in *Explicitly not doing* below, and the accessibility floor and the simplicity mandate rule out crippling the base experience. A cosmetic or archival tier could work; anything that degrades the weekly ritual cannot |
| **Microtransactions** | Worst fit. This is a product whose thesis is the absence of engagement mechanics, sold to people leaving the attention economy. Per-item purchase prompts read as exactly the thing they left, and they'd land inside the one surface that must stay clean |

Note that "organizer pays" was already §5's *secondary* before this change, so
the reversal is mostly a promotion of something that was already written down
and already passed the constraint — not a new invention.

### The payment-rail consequence (this reverses the earlier tooling answer)

When the product being sold was a physical book, Stripe was correct and
RevenueCat was category-wrong — Apple directs physical goods *away* from IAP.
Moving monetization in-app inverts that, and the doc should say so plainly:

- **A digital subscription or unlock consumed inside the iOS app must use
  Apple IAP**, at 15–30%. RevenueCat is the sane wrapper over StoreKit and
  Google Play Billing, and becomes the right tool if this is the path.
- **The cheaper path is to sell the organizer plan on the web**, via Stripe,
  and have the app read entitlement from your own backend. As of the 2025 US
  injunction, apps may link out to external purchase in the US storefront
  without commission — but this specific rule has moved repeatedly, so
  **verify the current guidelines before building**, don't build against this
  paragraph.
- **Do neither yet.** At zero users there is nothing to charge for. The first
  real signal is whether an organizer who isn't you (Group B, §6) would pay to
  keep their group running — and that is a question you ask, not a rail you
  integrate.

### Open work

None of it blocks launch, and none of it should start before Group Zero
produces a result.

- [ ] **[owner]** Ask the Group B organizer, after edition 4: "if this cost you
      $5/month and stayed free for everyone else, would you keep it?" That is
      the entire price discovery for this path, and it costs one message.
- [ ] Decide the mechanism only once someone has said yes. Then pick the rail
      (web/Stripe first, IAP/RevenueCat if the guidelines force it).
- [ ] Keep the free tier genuinely free and unlimited, whatever the mechanism.

### Deferred: the printed volume

Still the best *artifact* idea available, and the reasons it fit are unchanged:
post-grads buy gifts rather than subscriptions; the book converts "will anyone
keep this up?" into the reason to keep going; it charges for an object rather
than for access; and `_shared/edition-email.ts` already proves an edition can
be rendered to a fixed layout outside the app, so a print renderer is adjacent
work rather than new work.

Revisit when there are users and a proven ritual. A "Volume One" can be any N
editions — 12 (a quarter) rather than 52 — so the feedback loop is three months
whenever you choose to start it.

**One piece of it was not deferred, because it could not be.** Image resolution
is decided irreversibly at upload time:

- [x] **Checked and fixed 2026-09-14.** `lib/image.ts` was clamping every
      upload to 1600px at JPEG q0.82 and keeping nothing else; the composer's
      picker added a second compression pass at q0.85. 1600px is ~5.3in at 300
      DPI — not enough for a full-page photo, and the double pass showed.
      Post images now upload at `POST_IMAGE_MAX_EDGE` 2600px / q0.9
      (`lib/posts.ts`), which is ~8.7in at 300 DPI, and the picker is set to
      quality 1 so the upload is the only lossy step. Avatars (512px) and group
      covers (1600px) are unchanged — they are display-only.
- [ ] Photos uploaded *before* this fix are permanently capped. There are none
      outside seed data, so the cost is zero — but it would not have been in
      four weeks.

### Explicitly not doing

Ads of any kind. Engagement-based anything. Charging readers. Selling data.
Paywalling group size. All of these are the thing this community is fleeing, and
the privacy policy already promises the absence of most of them in writing.

### Competitive note

Storyworth (~$99/yr, weekly prompt email → bound book) remains the closest comp
and proves the artifact monetizes — which is why the printed volume is deferred
rather than dropped. The difference to be able to state in one sentence:
**Storyworth is one elder answering prompts; Catch Up Column is a whole group
writing to each other every week.** Note also that CLAUDE.md lists writing
prompts as a deliberate non-feature — that stays true; the difference is the
many-to-many cadence, not the prompting.

---

## 6. Work item — Group Zero [owner]

**Status: not started. This is the validation gate for everything above.**

The app has never been run on real people — everything to date is seed data. A
weekly-ritual product whose ritual has never been lived once is not ready to
submit, and this costs nothing to fix.

### Before you start — how the app gets onto their phones

**This collides with the sequencing and needs starting now.** Expo Go dropped
remote push support in SDK 53, and the app depends on `expo-notifications`, so
Group Zero cannot run on Expo Go. Your friends need a real build:

- [ ] **[owner] Start the Apple Developer enrollment this week.** $99/yr, and it
      is not instant — it can take days, sometimes longer if Apple asks for
      verification. LAUNCH.md has this paused; unpause it. Enrollment is
      waiting-time, not working-time, so it costs nothing to start early and
      blocks everything if you start late.
- [ ] **TestFlight is the distribution channel**, not EAS internal distribution.
      Internal distribution means collecting eight device UDIDs from eight
      non-technical people; TestFlight is a link and an email address.
- [ ] Slack in the schedule: the editions 1–2 / 3–4 split below means no one
      needs the app until **week 3**. That's roughly two weeks of buffer for
      enrollment and a first build — use it, don't spend it.

**While you're reducing install friction:** `lib/auth.ts:43` is
`signInWithPassword`, and it's the only way in. For a grandmother in a family
Group and for a digital minimalist without a password manager, "enter the
6-digit code we emailed you" converts better than "create a password." Supabase
supports it natively via `signInWithOtp` — one function and one screen, no new
vendor, and it's the same primitive §4's web composer would need.

- [ ] Add email OTP / magic-link sign-in alongside the password flow before
      edition 3. Keep passwords working for anyone already signed up.

### Run two groups, not one

- [ ] **Group A — you as organizer.** Your actual scattered friends. Do the
      recruiting, feel the friction.
- [ ] **Group B — someone else as organizer.** Recruit one person who is not you
      to start their own Group with their own friends, from week 1, in parallel.

Group B is not a nice-to-have. The whole distribution model is *one organizer
brings six friends*, and you are not a representative organizer: you built it,
you will nag, and you will absorb friction a real organizer would quit over. If
nobody but you will do the recruiting work, that is the business — and it is far
cheaper to learn in week 2 than in month 6.

### Isolate the two failures

A thin edition has two very different causes — *the ritual doesn't hold* and
*people wouldn't install the app* — and they call for opposite responses. Don't
let them blur:

- [ ] **Editions 1–2: accept posts by any channel.** If someone won't install,
      text them, take the text, paste it in yourself. This measures the ritual
      alone.
- [ ] **Editions 3–4: require the app.** The delta between the two halves *is*
      the install-resistance number, and it feeds the §4 decision much better
      than a headcount does.

### Pass condition

Four consecutive editions, and all three of these:

- [ ] **≥5 of 8 members write at least twice** across the four editions. (The
      earlier bar — 3 distinct writers per edition — is 37% participation, from
      the founder's own friends, with the founder actively nagging. If that
      counts as passing, it fails at scale.)
- [ ] **≥6 of 8 open the edition email**, every edition. Writing is only half
      the ritual; a newsletter nobody reads is dead even when three people
      write. Resend already reports opens and clicks per send, so this costs
      nothing and still needs no analytics in the app.
- [ ] **At least one post in weeks 3–4 arrives unprompted** — written without
      you reminding that person. Unprompted contribution is the only real signal
      in the exercise; everything else can be manufactured by nagging.

If it dies, diagnose *why* before shipping. The most likely cause is the missing
nudge (§3) — but "forgot" and "declined" look identical in the data and need
opposite fixes, so establish which one before building anything.

### Also collect, while you're in there

- [ ] Query `posts.created_at` in the Supabase SQL editor to see *when* in the
      week people actually write — that distribution tells you whether 48h is
      the right nudge lead time.
- [ ] Note every place the copy says "family" and it felt wrong to your friends.
      Free user research on §2.
- [ ] **Ask the price question in week 2**, before any print work exists: "at
      the end of the quarter I'll bind these into a book — $49, want one?" A
      real preorder from a real friend is worth more than the whole §5
      checklist, and it costs one text message.

---

## 7. Work item — community presence [owner]

Where the organizers are. Join as a person, months before mentioning the app.

- **r/nosurf, r/digitalminimalism, r/dumbphones** — the core; self-identified
  and discussing this exact problem weekly
- **Light Phone owners** — highest-signal group that exists: people who paid
  ~$300 to escape the feed and then discovered they'd lost the thread with
  their friends. Acute version of the pain, proven willingness to pay
- **Cal Newport's audience** — *Digital Minimalism* readers, the podcast, the
  adjacent Substacks. They've already bought a book about this
- **are.na** — you're already there; anti-algorithmic by design and its members
  are this person
- **Substack essayists on internet exhaustion** — dense, interlinked, and they
  have distribution
- **The leaving moment** — people publicly announcing "deleting Instagram,
  here's my email." Highest-intent signal available, and it's dated

**Rules of engagement:**
- [ ] Pick **two**, not six. Contribute for weeks before you mention the app.
- [ ] Never post a launch announcement into a community you haven't
      participated in. It will go badly and it's not recoverable.
- [ ] Expect "another app to fix apps." The honest answer is the positioning:
      *it wants twenty minutes a week and then it goes away.* Have it ready.
- [ ] **Do not launch to Product Hunt or indie-maker circles** because it's
      comfortable. You'll get makers who install, admire the typography, never
      start a Group, and churn — and you'll misread the spike as traction.
      Applause from your community is not demand from your market.

---

## 8. Sequencing

1. **Done 2026-09-14** — ~~fix the post-image resolution cap (§5)~~, plus the two
   pieces of tooling that protect the Group Zero signal: crash reporting and OTA
   updates. See §11.
2. **This week, [owner], starts the clock** — Apple Developer enrollment (§6).
   Pure waiting-time with a multi-day tail, and nothing gets onto a friend's
   phone without it. Start it before anything else on this list.
3. **This week** — start Group Zero, both groups (§6). It's the long pole; every
   week of delay is a week of evidence you don't have. Recruiting the Group B
   organizer is the other part with a lead time, so start asking now. Editions
   1–2 run off-app, so this does not wait on enrollment.
4. **This week, in parallel** — the copy pass (§2). Cheap, no dependencies, and
   it stops you from launching at the wrong audience.
4. **Weeks 1–4** — community presence (§7). Also long-pole; standing accrues
   slowly and can't be bought later.
5. **Week 4, not weeks 2–3** — the nudge (§3), and only if Group Zero showed
   people *forgetting* rather than declining. Shipping it mid-run was the
   earlier plan and it's the wrong order twice over: it's a fix for a churn
   mechanism nobody has observed yet, and it destroys the clean four-edition
   baseline you're trying to read.
6. **Week 4** — decide on write-by-web (§4) from the editions 1–2 vs. 3–4 delta.
7. **After 4 clean editions** — App Store submission (resume LAUNCH.md).
8. **Only after an organizer says yes** — in-app monetization (§5). The gate is
   one question to the Group B organizer after edition 4, not a rail to build.

### Deliberately deferred

- **The printed volume** — deferred 2026-09-14 in favour of in-app
  monetization; see §5. Physical goods mean a manufacturer, COGS, shipping and
  returns, and that's a second business. The image-resolution fix that it
  depended on already landed, so nothing about deferring it is irreversible.
- **Any payment rail at all** — Stripe, IAP, RevenueCat. There is nothing to
  charge for until someone has said they'd pay. See §5 and §11.
- **App Store submission** — a launch with no retention mechanism spends your
  one shot at organic attention. LAUNCH.md's remaining steps (Apple enrollment,
  screenshots) stay paused, and the screenshots now want friend-group sample
  content anyway, which Group Zero produces for free.
- **Android** — already deferred per LAUNCH.md (2026-08-22). Unchanged.

---

## 9. Open questions [owner]

- [ ] Subtitle: "A newspaper by your people" (safe, searchable) or "The opposite
      of a feed" (sharper, riskier with App Review)?
- [ ] Is weekly the right cadence for friend groups, or does biweekly retain
      better? Weekly is the brand and the routine is the stated point — but
      Group Zero is the only way to find out, and the schema already supports
      per-group scheduling.
- [ ] In-app monetization: which mechanism? Organizer-pays is the only one of
      the three that clears §5's constraint intact, but the shape (flat monthly,
      annual, one-time "keep this group running") is open — and shouldn't be
      answered before an organizer who isn't you says they'd pay.
- [ ] If organizer-pays happens: sell on the web via Stripe, or in-app via
      IAP/RevenueCat? Cheaper on the web, but the App Store link-out rules have
      moved repeatedly and need re-checking at build time, not now.
- [ ] Does the revenue window survive contact with Group Zero? If the ritual
      doesn't hold for four weeks with your own friends, monetization timing is
      the wrong thing to be optimizing.

---

## 10. Risks

| Risk | Mitigation |
| --- | --- |
| Friend groups churn after 2–3 editions | The nudge (§3); a thin-edition design that reads as a letter, not a failure; Group Zero proves or disproves it before launch |
| Community is app-averse by identity | Write-by-web (§4); positioning as the app that doesn't want your attention |
| Awareness ≠ adoption — forums full of people who enjoy discussing the problem | Membership first (§7); recruit organizers one at a time, not by announcement |
| Post-grads won't pay | Charge the organizer, never the six friends (§5); keep the free tier genuinely free and unlimited |
| In-app monetization drifts toward paywalls or microtransactions — the exact register this community left | §5 ranks the three options against the constraint and rules two of them out in advance; CLAUDE.md's Non-features list is the backstop |
| Nobody can install the app in time for edition 3 | Apple enrollment started week 1 (§6); editions 1–2 run off-app, which buys ~2 weeks of buffer |
| Family users feel abandoned by the new copy | Generalize, don't replace: rotate examples, keep the accessibility floor, keep "family" where it's literally true |
| Launching before retention is proven | Sequencing (§8) — Group Zero gates submission |
| No organizer exists except you — the whole distribution model assumes one person recruits six | Group B (§6): a second organizer who isn't you, from week 1. If nobody will take the role, the broken thing is distribution, not the product, and that changes what to build next |
| ~~Photos accumulate below print DPI~~ | **Closed 2026-09-14.** Post images now upload at 2600px/q0.9 with a single compression pass. Retired as a risk, but the general form stands: check for irreversible defaults *before* real data arrives, not after |
| A crash on a friend's phone reads as "they lost interest," corrupting the only signal Group Zero produces | Sentry, wired 2026-09-14 (§11) |

---

## 11. Tooling decisions

Recorded so they don't get re-litigated. Three vendor questions came up
2026-09-14; two were "no," and the answers turn on facts about this repo rather
than on the merits of the products.

### Landed 2026-09-14

- **Crash reporting — Sentry** (`@sentry/react-native`, config plugin in
  `app.json`, init in `app/_layout.tsx`). Deliberately the narrowest possible
  setup: crashes and unhandled errors only, `tracesSampleRate: 0`, no session
  replay, `sendDefaultPii: false`, and a `beforeBreadcrumb` that strips query
  strings so Supabase group/post ids don't ride along. Disabled in dev and
  no-ops when `EXPO_PUBLIC_SENTRY_DSN` is unset.
  **[owner]** create the Sentry project and set the DSN; set `SENTRY_ORG`,
  `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN` as EAS secrets for source-map upload.
  **`docs/PRIVACY.md` was updated in the same change** — it previously claimed
  "no third-party SDKs," which Sentry makes untrue. `docs/STORE_LISTING.md`'s
  privacy-label and data-safety answers still need the owner to re-check
  "Diagnostics → Crash Data" before submission.
- **OTA updates — `expo-updates` + EAS Update.** `eas.json` already declared
  `preview` and `production` channels, but `expo-updates` wasn't installed, so
  those fields were inert. Now wired with `runtimeVersion.policy: "fingerprint"`
  (safer than `appVersion` — a JS update can't land on a build with mismatched
  native code). During a four-week live run this is how a typo or a crash gets
  fixed without a TestFlight round trip.
- **Print-resolution fix** — see §5.

### Sentry setup [owner]

The code is wired and inert until a DSN exists. Sentry's free tier (5k errors a
month) is far more than Group Zero will produce. Steps 1–3 take about ten
minutes and are the ones that matter; 4–5 make the traces readable.

**1. Create the project.** sentry.io → new organization if you don't have one →
**Create Project** → platform **React Native** → name it `catch-up-column`.
Alert frequency: "on every new issue" is right at this scale; you want the email.

**2. Copy the DSN.** Shown on the setup screen, and afterwards under
*Settings → Projects → catch-up-column → Client Keys (DSN)*. It looks like
`https://<hash>@o<org>.ingest.sentry.io/<project>`. The DSN is not a secret —
it's compiled into the app binary and only allows *writing* events — so
`EXPO_PUBLIC_` is the correct prefix and committing it would be harmless. It's
in `.env.local` (gitignored) purely to keep environments separable.

```bash
# .env.local
EXPO_PUBLIC_SENTRY_DSN=https://…@o0.ingest.sentry.io/0
```

**3. Verify it reports.** `Sentry.init` is deliberately disabled in dev
(`enabled: !__DEV__`), so a simulator run will *not* send anything — this is the
step people get stuck on. Test on a preview build:

```bash
eas build --profile preview --platform ios
```

Then temporarily add `Sentry.captureException(new Error('sentry smoke test'))`
to a screen, trigger it, and confirm the issue appears in the Sentry dashboard
within a minute or so. Remove the line afterwards. If nothing arrives, check
that the DSN was present at build time — `EXPO_PUBLIC_*` values are inlined
during the bundle step, not read at runtime, so a DSN added after the build
won't apply.

**4. Source maps.** Without these, every stack frame is a minified one-liner and
the reports are close to useless. The `@sentry/react-native` config plugin
uploads them during an EAS build when three build-time variables are present.
Create an auth token at *Settings → Auth Tokens* with the `project:releases`
scope, then:

```bash
eas secret:create --scope project --name SENTRY_ORG        --value <org-slug>
eas secret:create --scope project --name SENTRY_PROJECT    --value catch-up-column
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value <token>
```

`SENTRY_AUTH_TOKEN` **is** a real secret — never put it in `.env.local`, app.json,
or a commit. The other two are just names.

**5. Sanity-check what's being sent** once real reports arrive. Open an issue and
confirm it carries a stack trace, device model, OS and app version — and *not* a
display name, email, post body, or a URL with a group id in the query string.
The config in `app/_layout.tsx` is written to prevent all of those; if any shows
up, the config drifted and `docs/PRIVACY.md` plus the App Store privacy labels
in `docs/STORE_LISTING.md` need re-checking before submission.

**Not worth turning on:** performance tracing, session replay, profiling, user
feedback widgets. Each one widens what you collect, each needs a privacy-doc
update, and none of them answer a question you have at eight users.

### Decided against

- **Clerk, replacing Supabase Auth — no.** The security surface here is RLS and
  `SECURITY DEFINER` RPCs, not credential handling, and three migrations are
  dedicated to hardening exactly that. Clerk touches none of it. What it *would*
  touch: every policy resolves identity through `auth.uid()` off the Supabase
  JWT, `users.id` is keyed to `auth.users.id`, `prepare_account_deletion` walks
  that relationship, and the service-role edge functions assume it. That's the
  highest-risk refactor available in this repo for zero user-visible change.
  The real auth improvement is passwordless sign-in, which Supabase already does
  — see §6.
- **RevenueCat — not now, and conditional later.** It wraps StoreKit and Google
  Play Billing, so it's only relevant to digital in-app purchases. It became
  *potentially* relevant when monetization moved in-app (§5) and stops being
  irrelevant only if the App Store rules force IAP over a web/Stripe checkout.
  Revisit at that point, not before.
- **Product analytics (PostHog, Amplitude, Mixpanel) — no.** Eight users and a
  SQL editor. Resend already reports edition-email opens, which is the one
  retention metric that matters (§6).
- **A print partner API (Lulu, Blurb, Peecho, Mixam) — no.** Deferred with the
  printed volume. When it happens, book one gets uploaded through a website by
  hand.
- **A push vendor — no.** Expo Push is free and already working.
