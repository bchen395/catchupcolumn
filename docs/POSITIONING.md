# POSITIONING.md — Friends-first repositioning, retention, and money

**Decision date: 2026-09-14.** This doc is the handoff for a change of direction
made before launch, and the checklist for executing it. It is a companion to
[LAUNCH.md](./LAUNCH.md) (the submission runbook),
[STORE_LISTING.md](./STORE_LISTING.md) (store metadata), and
[ORGANIZER_PLAYBOOK.md](./ORGANIZER_PLAYBOOK.md) (the one-page process an
organizer follows to start and run a Group — §6's Group B is a test of that
page).

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

Storyworth (§5) is a monetization comp, not a product comp. The product comp is
the private-friend-group app, and that category has produced no durable
business. Path — the best-known attempt, deliberately capped at 50 friends and
once valued near $500M — shut down in 2018. Cocoon raised VC through Y
Combinator in 2019 on explicitly the same premise, "dedicated software for your
most important group chat."

> **Verification note, 2026-09-14.** An earlier draft of this section asserted
> that Cocoon shut down and that Geneva was absorbed. Path's shutdown is
> documented; those two outcomes were *not* confirmed by research and should not
> be repeated as fact. What research did confirm is the claim that carries the
> weight here: **no private-friend-group social app was found with meaningful
> direct revenue.** See §5 for what that implies.

They fail for one shared reason — **nothing brings people back between events.**
The app is a place you have to remember to go, and a small private group
generates no ambient reason to go there.

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
but sequenced after Group Zero, not during it. See §8 step 7 for why.**

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

**Status: planning only, now backed by research (2026-09-14). Revenue target
brought forward — see "the December test" below. Ads costed and rejected
2026-09-15 — see "Ads" below.**

### How this section got here

Three positions in one day, recorded because the reversals are informative:

1. **Printed volume as the primary revenue path.** Right instinct, no evidence.
2. **Deferred in favour of in-app monetization** — on the reasoning that a
   physical product means sourcing a manufacturer, COGS, shipping and returns,
   which is a second business for a solo founder.
3. **Print restored as the primary path**, because research showed the premise
   behind (2) was wrong. Print-on-demand APIs make "find a manufacturer" a
   solved problem, and the artifact is the only model in this category with
   demonstrated revenue.

Position (2)'s *operational* concern was legitimate and is what the research
had to answer. It did.

A fourth position was raised and closed on 2026-09-15: **advertising**, on the
reasonable-sounding ground that newspapers carry ads and even the paid NYT does.
It was costed rather than waved off, and it lost on arithmetic before it ever got
to taste. The numbers are below, because a one-line refusal is how a decision
gets relitigated every six months.

### The constraint (unchanged, and it still binds)

Post-grads will not pay a monthly subscription to talk to their friends. The
community being courted is actively hostile to paying for connection — it's a
large part of what they're leaving. **Any plan that charges the six friends
kills the network before it forms.** Every option below is filtered through this.

### What the research found

| Company | Model | Result |
| --- | --- | --- |
| **Storyworth** | $59 / $109 / $199 a year; weekly prompt email → hardcover | **$1.5M ARR, bootstrapped**, no outside funding, ~10 people, founded 2011 |
| **Remento** | $99/yr, AOV $119; prompts → hardcover | **$620k in its first 10 months**, projecting $4.6M; **$16 to print and ship**, ~86% gross margin |

Both are one storyteller answering prompts, with the book bought *for* them by
an adult child. Both are family/legacy products. **No friend-group social app
was found with meaningful direct revenue.**

Three more numbers that shape the decision:

- **Freemium conversion is 2–5% at median**; RevenueCat's day-35 figure is
  **2.1% for freemium against 10.7% for a hard paywall**. A supporter tier that
  withholds nothing lands at the bottom of that range or below.
- **Marco Polo does roughly $800k/month** on a group-video app with an explicit
  "no ads, no selling your data" stance, monetized on *conveniences* — playback
  speed, background listening, custom emoji, a family plan — never on gating the
  core. Proof the thesis and revenue can coexist. Not proof it can happen soon;
  that is years of scale.
- **Gift businesses run 40–60% of annual revenue in Q4.** If the artifact is the
  path, the calendar is most of the strategy.

### The premise that was wrong: print operations

Lulu's Print API has **no setup fees, no handling fees, no inventory and no
minimum order**. They print, bind, package and dropship to 200+ countries, and
you pay per copy at order time. There is an Order Import tool built specifically
for fulfilling a batch of preorders. Remento's $16 print-and-ship against a $119
order is what this looks like in practice.

"Find a manufacturer" is an API key. The deferral in position (2) was answering
a problem that print-on-demand already solved.

**Two caveats, both real.** Full-colour interiors cost 3–5x black-and-white per
page, and a colour hardcover can run ~6x a B&W novel; one estimate for a colour
photo hardcover was €25–35. This product is photo-bearing, so Remento's $16
likely reflects tight format control rather than what we would pay.
- [ ] **Run Lulu's own calculator against a real trim size and page count before
      trusting any number in this section.** Nothing here is costed until that
      happens.

### Friends distribute; families pay

The research splits a thing this doc had been conflating. **Do not reverse §1.**

- **Friend groups remain the distribution strategy.** The reasoning in §1 holds:
  the owner is a member, the community is findable, and he is not a member of
  the family-caregiver world. That is about where users come from.
- **Families are the revenue.** They have the proven gift purchase, the Q4
  occasion, the higher AOV, and two companies demonstrating it. The product
  already serves them first-class — CLAUDE.md mandates it — so this costs
  nothing in positioning and requires no new audience work.

The paid artifact is aimed at the family Group first. A friend-group volume can
exist too; it just won't be what pays first.

### The differentiator, in one sentence

Storyworth and Remento are **one elder answering prompts**. Catch Up Column is
**a whole family writing to each other every week.** CLAUDE.md lists writing
prompts as a permanent non-feature, so their model isn't available to copy and
shouldn't be wanted — "everyone's year, in their own words" is a different
object from "Grandma's memoir."

### The ladder

| Tier | Price | Notes |
| --- | --- | --- |
| **The paper** | Free forever — unlimited Groups, members, editions, archive | Nothing is ever withheld from anyone |
| **Digital volume** (PDF, 12 editions) | $39 | ~100% margin; also the cheap test of whether the object sells at all |
| **Printed volume** (hardcover, Lulu) | **$89–99** | ~$55–70/copy pending the calculator run |

Any member of a Group can buy — this was the owner's call, and it matches the
social dynamic better than organizer-only. One volume per Group per period,
priced for the Group rather than per person; a PDF is trivially shared and
pretending otherwise would just add DRM anxiety for no revenue.

An earlier draft of this section priced the digital volume at $29. That was well
under market for the category — the comps sit at $59–199 with $119 as a working
AOV. Start at $39 and raise; prices go up as the product improves.

### Why this is the faster path, in one comparison

At $89 with roughly $30 of COGS, **$2,000/month needs about 400 volumes a year**
— and if Q4 seasonality holds, more than half land in an eight-week window.

The same $2,000/month from a $5/month subscription needs 400 paying organizers,
which at a 3% conversion rate implies roughly **13,000 active Groups**.

Same revenue, **~25x difference in the user base required.** That is the entire
argument for the artifact over the subscription, and it's why "in-app
monetization" as a frame was the wrong target rather than merely a slow one.

### The payment rail

Unchanged from the earlier analysis, and the artifact model keeps it simple:

- **Sell on the web via Stripe, not in the app.** A physical book is a physical
  good, which Apple directs *away* from IAP; a PDF sold in-app would be a
  digital good and would attract IAP, so sell both the same way and keep the
  buy flow out of the app entirely.
- **The edition email is the sales channel.** It is already the retention
  surface (§1), it arrives weekly, and the Volume offer belongs in the footer of
  edition twelve. Apple's rules govern what the app does; an email is not the
  app. The practical constraint is simply **no "Buy the Volume" button in the
  UI**. Spec for the offer block itself: "The house ad" below.
- **RevenueCat stays a "no"** (§11). It wraps StoreKit for digital in-app
  purchases, which is not what this sells.

### The house ad — the only advertisement the paper carries

The Volume offer is an ad in our own newspaper, and it should look like one.
That is the whole of what survives the ads question: **the form, not the
advertiser.** A ruled classified box set in the paper's own type is native to a
newspaper in a way a banner never is — so build that, and keep 100% of the
revenue with nobody to report metrics to.

Today the edition email ends with the colophon (`renderColophon` in
`supabase/functions/_shared/edition-email.ts`) — printer's mark, "written by
{group}, printed by Catch Up Column", and "Start one for your people". The
Volume offer is a **separate block sitting immediately above** it, in the
classified register rather than the colophon's italic whisper.

Spec:

- **Cadence.** Renders only when `payload.edition_number % 12 === 0`. Never on
  any other edition. A Group that hasn't reached twelve editions never sees it,
  and a Group that has just read its twelfth is being offered the thing it just
  finished making.
- **Form.** A hairline-ruled box — `INK_SOFT` at 1px, no fill, no shadow, width
  matched to the post column. This is the one boxed element permitted in an
  email that otherwise forbids cards, and it is permitted *because* it is a
  classified, visibly not part of the editorial matter.
- **Type.** Kicker in Jost 11px / 2px letter-spacing / uppercase, vermilion —
  the existing kicker role and the one place the accent is licensed. Headline in
  Lora. Body in Lora **16px**: the accessibility floor applies here too, this is
  copy meant to be read.
- **Copy, in the paper's own voice.** No marketing register, no urgency, no
  countdown, no "limited time":

  > **THE VOLUME**
  > Twelve editions, bound.
  > Everything {group_name} wrote from No. {n−11} to No. {n}, printed and posted
  > to whoever you like. $89.
  > *Order the volume →*

  Anchor the copy to edition numbers, not to "this year" — twelve weekly
  editions is a quarter, and §9 hasn't settled whether a volume is 12 or 52. The
  edition-number framing is true under either answer.

- **Link.** Plain `https` to a Stripe Payment Link on `WEB_BASE_URL`, untracked
  and unredirected — the same rule as every other link in the email. No UTM, no
  click wrapper, no pixel. If we ever need to know which Groups converted,
  Stripe's own checkout metadata carries it without instrumenting the email.
- **Apple.** Load-bearing and unchanged: this lives in the email only. **No "Buy
  the Volume" button anywhere in the app UI.**
- **The floor.** If the block ever reads louder than the members' writing above
  it, it is wrong and gets quieter. This is `renderColophon`'s standing rule
  ("it must never shout over the family" — a comment §2's copy pass should
  reword to *your people*) extended to the block above it.

**Build it only after the December test passes.** The manual version is a Stripe
Payment Link pasted into a personal email, and that is what December uses.

### Ads — costed and rejected, 2026-09-15

The instinct was worth costing: newspapers carry ads as a structural element,
and the NYT runs them against a paid subscription. It does not survive contact
with the numbers.

**What the NYT comparison actually shows.** FY2025: total advertising revenue
**$566.0M**, digital roughly 73% of it (~$413M), against ~12.21M digital-only
subscribers — **~$34/subscriber/year, about $2.82/month** — versus digital-only
ARPU of **$9.68/month**. At the most successful subscription newspaper in the
world, with a direct ad-sales organisation, advertising is **~23% of per-user
digital revenue** — and that $2.82 is earned across dozens of impressions a
month (daily app, Games, Cooking, Wirecutter). An edition arrives **once a
week**: ~4.3 impressions per member per month. Same model, an order of magnitude
less inventory per person.

The deeper mismatch is whose attention is being sold. The NYT sells strangers an
audience gathered around journalism it paid to produce. Our inventory is one
member's letter to seven friends.

**The arithmetic.** One slot per edition, 8-member Groups, against the same
$2,000/month target used above:

| Scenario | CPM | Rev / Group / mo | Groups for $2,000/mo |
| --- | --- | --- | --- |
| Direct-sold premium, 2 slots, every open | $25 | $1.20 | ~1,700 (13,600 people) |
| Remnant / programmatic, 1 slot, 60% open | $3–5 | ~$0.14 | ~14,000–19,000 (110k–155k people) |
| Printed volume, for comparison | — | — | ~2,000–3,000 Groups at 15% attach |

The top row is not available to us. The practical floor for *any* sponsor
interest is 1,000–2,000 engaged subscribers **in a clear commercial niche**;
~2,500 for basic ad opportunities, 25,000+ for real brands. "Eight friends from
college, now scattered across five states" is not a niche — it is the absence of
one. The realistic row is the one that applies, and it needs roughly **10x the
users of the print path for the same money**.

In one line: at the *optimistic* CPM, **one $89 volume is worth about four years
of ad revenue from that Group.** At the realistic CPM, about thirty-five years.

**Three blockers that are structural, not aesthetic.**

1. **You cannot sell what you cannot count.** `edition-dispatch.ts` records
   `emailed_at` and nothing else — no open pixel, no click redirect, no
   per-recipient log. CPM sales require all three. Building them means building
   the tracking layer that `docs/PRIVACY.md` and `web/privacy.html` promise in
   writing does not exist. The measurement apparatus is the product's negation.
2. **It degrades the only retention channel there is.** §1 concluded the edition
   email *is* the retention surface. Gmail Primary placement averages **57.8%**
   with **37.7%** diverted to Promotions, and ad markup, promotional formatting
   and tracked outbound links are primary triggers. That is the product's entire
   delivery mechanism wagered for ~$0.15 per member per month.
3. **Adjacency cannot be controlled.** A member writes that their mother went
   into hospice; a mattress ad renders below it. The only fix is scanning the
   content to place against it — reading private letters — which is the
   forbidden data model. Note that Meta, with every incentive to do otherwise,
   put WhatsApp ads in Status and Channels and kept personal messaging ad-free.
   An edition is personal messaging.

**And the promise is already made in writing.** "No ads" is the line §2 says
should *lead* the store listing (`STORE_LISTING.md`), and the privacy policy
states it twice. Marco Polo does ~$800k/month with "no ads, no selling your
data" as its pitch. In this category the refusal is an asset with revenue
attached, not a cost — retracting it at launch would spend the one thing the
product has before it has users.

Sources: NYT FY2025 10-K and Q4 2025 release; beehiiv and Paved newsletter CPM
benchmarks; SponsorPriceIQ sponsor thresholds; Gmail inbox-placement benchmarks;
WhatsApp ads rollout coverage, Dec 2025.

**What survives:** the form, not the advertiser — "The house ad" above. The
other newspaper-shaped idea this raised, a member-written classifieds section,
is a *content* decision rather than a revenue one and is logged in §9.

### The December test [owner]

The calendar is the plan. Q4 is the revenue event and there are roughly ten
weeks left in it. A print renderer, a Lulu integration and a checkout flow do
not fit in that window — so don't build them.

Do it by hand instead. This is the manual stage, and it is the only version that
produces revenue in 2026:

- [ ] Get Group Zero running now (§6), with **as many family Groups as the
      arithmetic below says you need** — not the one the first draft of this
      section called for.
- [ ] Late November: take the editions that exist, lay out a volume manually,
      upload the PDF to Lulu's website by hand, order copies.
- [ ] Invoice directly or send a Stripe Payment Link. No renderer, no API, no
      integration, no code.
- [ ] Pass condition: **five families pay $89.** That's ~$450, proof the object
      sells, and a finished spec for the renderer that would otherwise have been
      built on speculation. If nobody bites, that was learned in six weeks for
      the price of a few book orders.

### The December arithmetic

**Corrected 2026-09-16.** The pass condition above and the Group Zero plan in §6
were written separately and don't reconcile.

A volume is bound from a Group's own editions, and the ladder sells one volume
per Group per period. So every December buyer has to be a family Group that has
been publishing since roughly now — a family recruited in November has nothing
to print. **The number of family Groups running by the end of September is a
hard cap on December revenue.** §6 started one. The pass condition wants five.

Three ways to close it. They are not equivalent and the first is the real one:

1. **Recruit to three–five family Groups this month.** [owner] The honest
   version of the pass condition. It is also a lot of recruiting for someone who
   has not yet started one, and it competes for the same September hours as
   Groups A and B — which is the actual cost of the December deadline, and worth
   seeing before committing to it rather than in November.
2. **Sell more than one copy per family.** [owner, decision needed] The ladder's
   "one volume per Group per period" was your call and it is right for the *PDF*
   — a digital file is trivially shared and DRM would be worse than the lost
   revenue. A hardcover is not that: it has real per-copy COGS, and three
   siblings each wanting their own is the Storyworth gift dynamic the whole
   section is built on. Selling additional printed copies at $89 is not a
   paywall and withholds nothing. If this is a yes, five paid copies can come
   from two or three family Groups and item 1 gets much smaller. **Decide this
   before you decide how many families to recruit**, because it sets the number.
3. **Restate the pass condition to what the Groups you have can prove.** Two
   families paying from two family Groups is a 100% hit rate and tells you as
   much about whether the object sells as five out of eight would. What it does
   not produce is $450 or a sense of volume. If September ends with fewer family
   Groups than item 1 needs, write the smaller number down here *in advance* —
   the failure mode is reaching December, missing five, and reading a sound
   result as a failed test because the bar was set by an arithmetic mistake.

Whichever way this goes, the deposit link in §6 runs in week 2 regardless. It is
the same question asked ten weeks earlier for $20 instead of $89, and it is not
capped by any of this.

### Open work, after December

- [ ] Print renderer: editions → print-ready PDF. Reuse the email renderer's
      layout logic. **Build only if the December test passes.**
- [ ] Lulu Print API integration, replacing the manual upload.
- [ ] Revisit price against real orders. Raise before adding tiers.

### Explicitly not doing

Ads of any kind — third-party advertising, sponsorships, sponsored posts, a
patron line, affiliate placements, and every other arrangement where someone
outside the Group pays to appear inside its edition. Costed and rejected above;
do not reopen without new numbers. The house ad is not an exception to this — it
sells our own object and answers to nobody.

Also: engagement-based anything. Charging readers for access. Selling data.
Paywalling group size. Paywalling the ritual itself. All of these are the thing
this community is fleeing, and the privacy policy already promises the absence
of most of them in writing.

Note what the ladder above never does: **nothing is ever withheld from a Group
that doesn't pay.** Everything charged for is an object, not access. That is
what keeps this compatible with an audience leaving monetized connection.

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
      **Hand them [ORGANIZER_PLAYBOOK.md](./ORGANIZER_PLAYBOOK.md), not a verbal
      briefing** (added 2026-09-16). Recruiting six friends is the one process
      the whole distribution model rests on and it has never existed outside
      your head; briefing them in person re-inserts you into the experiment and
      tests the person instead of the process. If they fail while following the
      page, distribution is the broken thing. If they fail because there was no
      page, you learned nothing. Its last section lists what they report back.
- [ ] **Groups C1–Cn — families, plural.** Added 2026-09-14 after the
      monetization research; **corrected 2026-09-16.** §5 bets that families are
      who buys the artifact, and there was no family Group to test that against.
      The original plan started *one* — which caps the December test at one
      possible buyer against a pass condition of five. One can be your own
      family; the rest are recruiting work that happens this month or not at
      all. The arithmetic, and the two alternatives to recruiting, are in §5,
      "The December arithmetic." **Settle that number before you finish
      recruiting Group A**, because it changes how much recruiting there is.

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
      text them, take the text, and put it in for them — but **not under your
      own account.** See "Posting for someone who hasn't installed" below; the
      naive version silently ruins the edition. This measures the ritual alone.
- [ ] **Editions 3–4: require the app.** The delta between the two halves *is*
      the install-resistance number, and it feeds the §4 decision much better
      than a headcount does.

### Posting for someone who hasn't installed

**Added 2026-09-16.** "Paste it in yourself" does not work the way it reads, and
the failure is silent.

Post inserts are gated on `author_id = auth.uid()`
(`supabase/migrations/20260426000000_rename_columns_to_groups.sql:146`) and every
reading surface renders the author's own name next to their avatar
(`components/edition-brief-column.tsx:38`,
`components/story-article.tsx:40-47`).
Pasting six friends' entries from your own account produces an edition where
all six stories are bylined *you*, with your face on each one. That isn't a thin
edition, it's a wrong one — and it corrupts the exact signal Group Zero exists
to read.

**Create the accounts yourself instead.** The organizer is the app for the first
month:

- [ ] For each member who hasn't installed: Supabase dashboard →
      Authentication → Add user, with **Auto Confirm User** checked and user
      metadata `{"display_name": "Their Name"}`. The `on_auth_user_created`
      trigger reads exactly that key
      (`supabase/migrations/001_initial_schema.sql:240`), so the `public.users`
      row and therefore the byline come out right with no further work.
- [ ] Add them to the Group from the SQL editor — insert the `group_members`
      row directly. `join_group_by_invite_code` is caller-scoped
      (`supabase/migrations/20260505000000_critical_security_fixes.sql:73`) and
      can't be used on someone else's behalf.
- [ ] Write their entries from their session, not yours.

Two things fall out of this that are worth more than the convenience:

- **The edition email reaches everyone from day one.** Recipients are every
  `group_members` row with `email_subscribed = true`
  (`supabase/migrations/20260711000000_edition_email_payload_images.sql:69`) —
  install status is not consulted anywhere. §1 says the retention surface is the
  email, not the app; this makes editions 1–2 a real test of that claim rather
  than a workaround, because the whole loop runs with zero installs.
- **You get a cleaner install-resistance number.** An account already exists for
  each of them, so "installing" is a password reset, and *when each person does
  it* is a per-person date rather than the 1–2 vs. 3–4 headcount delta. Tell
  them the account is waiting; don't make them create one.

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
- [ ] **Take a deposit in week 2**, before any print work exists. Revised
      2026-09-16: the earlier version of this bullet asked the question — "at
      the end of the quarter I'll turn these into a real hardcover — $89, want
      one?" — and a verbal yes about an object that doesn't exist yet, given to
      a friend, is the weakest data in this document. Send a **Stripe Payment
      Link for a $20 deposit against the $89 volume** instead. A hosted link
      takes fifteen minutes, needs no integration, and is already the December
      rail (§5). Refund anyone who changes their mind; the refund rate is itself
      a finding.
- [ ] Send it to a family Group *and* a friend Group. §5's open question is
      whether the artifact sells to both or only to families, and this answers
      it ten weeks before the December test does, for the cost of one link.
- [ ] Watch whether anyone pays **without hesitating**. That, not the $20, is
      the signal — and note that this is the only price signal the product
      produces all quarter. The paper is free forever by design (§5), so
      participation in Group Zero tells you nothing about willingness to pay.
      Don't let a ritual that holds get read as demand for an object.

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
3. **This week** — start Group Zero: Group A, Group B, and the family Groups
   (§6). It's the long pole; every week of delay is a week of evidence you don't
   have. Recruiting the Group B organizer is the other part with a lead time, so
   start asking now, and hand them
   [ORGANIZER_PLAYBOOK.md](./ORGANIZER_PLAYBOOK.md) rather than a verbal
   briefing — the point of Group B is to test the process, not the person.
   Editions 1–2 run off-app, so this does not wait on enrollment.
4. **This week, and it expires** — settle the extra-copies question and the
   family-Group count (§5, "The December arithmetic"). Every family Group not
   publishing by roughly the end of September is a December buyer that cannot
   exist. This is the only item on the list whose window closes in weeks rather
   than months.
5. **This week, in parallel** — the copy pass (§2). Cheap, no dependencies, and
   it stops you from launching at the wrong audience.
6. **Weeks 1–4** — community presence (§7). Also long-pole; standing accrues
   slowly and can't be bought later.
7. **Week 4, not weeks 2–3** — the nudge (§3), and only if Group Zero showed
   people *forgetting* rather than declining. Shipping it mid-run was the
   earlier plan and it's the wrong order twice over: it's a fix for a churn
   mechanism nobody has observed yet, and it destroys the clean four-edition
   baseline you're trying to read.
8. **Week 4** — decide on write-by-web (§4) from the editions 1–2 vs. 3–4 delta.
9. **After 4 clean editions** — App Store submission (resume LAUNCH.md).
10. **Late November — the December test (§5).** Hand-made volumes, uploaded to
   Lulu by hand, sold by invoice or Payment Link. This is the only revenue item
   with a deadline attached: Q4 is 40–60% of annual revenue for gift products,
   and the window closes. Everything else on this list can slip a week; this
   can't.

### Deliberately deferred

- **The print renderer and the Lulu API integration** — but *not* the printed
  volume itself, which is back on as the primary revenue path (§5). December's
  volumes get laid out and uploaded by hand. Build the automation only once
  someone has paid for the manual version.
- **Any payment rail beyond a Stripe Payment Link.** A hosted link needs no
  integration and takes fifteen minutes. IAP and RevenueCat stay off the table
  entirely — the artifact is sold on the web (§5, §11).
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
- [ ] What does a volume actually cost to print at *our* specs? Everything in
      §5's ladder is uncosted until Lulu's calculator has been run against a real
      trim size and page count. Colour interiors are 3–5x B&W per page, so this
      could move the price materially.
- [ ] How many editions make a volume worth $89? Twelve is a quarter and fits
      the feedback loop, but 12 editions × 3 writers is ~36 posts, which may be a
      pamphlet rather than a book. Mock one up before committing to the number.
- [ ] Does the friend-group volume sell at all, or is the artifact a
      family-only product? §5 bets families pay first; the friend-group version
      is untested and may need a different object entirely.
- [ ] Classifieds: should an edition carry a short ruled section of member-written
      one-liners — "Sarah's looking for a roommate in Chicago", "Dan's band plays
      Nov 3"? It came out of the ads question (§5) and is the most
      newspaper-shaped thing we aren't doing. It is content, not an engagement
      mechanic, and it is free. The risk is drift: a section that accumulates
      starts to behave like a feed, which is the one shape the product forbids.
      Decide after Group Zero, on whether anyone actually wants it.
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
| Post-grads won't pay | Don't charge them for access at all (§5). Sell an object, to whoever wants it, and never withhold anything from a Group that doesn't buy |
| Monetization drifts toward paywalls or microtransactions — the exact register this community left | §5's ladder charges only for objects; nothing is ever withheld. CLAUDE.md's Non-features list is the backstop |
| The artifact is a family product and the primary audience is friend groups | Acknowledged and deliberate (§5): friends are the distribution strategy, families are the revenue. The product serves both first-class already, so this needs no repositioning — but if friend-group volumes never sell, revenue scales with the *secondary* audience, which is worth knowing early |
| Print economics don't survive contact with colour photo pages | Nothing in §5 is costed until Lulu's calculator is run; the December test uses real orders at real cost before any renderer is built |
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
- **RevenueCat — no, and the condition that would have revived it is gone.** It
  wraps StoreKit and Google Play Billing, so it only matters for digital in-app
  purchases. It became briefly relevant when monetization moved in-app, and
  stopped being relevant again when research moved it back to a physical
  artifact sold on the web (§5). A printed book is a physical good, which Apple
  directs away from IAP. Keep the buy flow out of the app and this never comes
  back.
- **Product analytics (PostHog, Amplitude, Mixpanel) — no.** Eight users and a
  SQL editor. Resend already reports edition-email opens, which is the one
  retention metric that matters (§6).
- **Stripe — yes, but only as a hosted Payment Link.** Fifteen minutes, no
  integration, no webhook, no code. A real Stripe integration earns its keep
  somewhere north of 50 orders; until then, manual invoicing teaches more.
- **A print partner API (Lulu, Blurb, Peecho, Mixam) — not yet, but Lulu is the
  chosen one.** Its Print API has no setup fees, no handling fees, no inventory
  and no minimum, and it dropships to 200+ countries; there is also an Order
  Import tool built for batch-fulfilling preorders. That combination is what
  made §5 reverse the print deferral. **The integration still waits** — December's
  volumes get uploaded through Lulu's website by hand, and the API only earns
  its keep once the manual version has sold.
- **A push vendor — no.** Expo Push is free and already working.
