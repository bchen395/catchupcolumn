# Copy pass — friends + family

**Working document. Delete this file when the pass lands.** The reasoning behind
it is [POSITIONING.md](./POSITIONING.md) §2; the vocabulary rule it enforces is
CLAUDE.md → Key Terminology → **Audience vocabulary**. Neither is repeated here.

**Status: not started** (verified against the tree 2026-09-16 — every line below
still reads "family"). Cheapest, highest-leverage item on the board. Do this
before any store submission, or you launch pointed at the wrong audience.

---

## Files to change

### `constants/strings.ts`

- [ ] `:80` — `empty.groups.body`: "start your family newsletter" → "start your
      group's newsletter"
- [ ] `:136` — `home.deckLines`: "Every family has stories worth printing." →
      "Everyone has stories worth printing." (keep the line count at 5; the
      rotation is by `dailyIndex`)
- [ ] `:155` — `home.firstEdition.deck`: "Everything your family writes this
      week…" → "Everything your people write this week…"
- [ ] `:228` — `invite.errorRevoked`: "Ask your family for a fresh code." → "Ask
      whoever invited you for a fresh code." (also better copy — the inviter may
      not be family in either framing)
- [ ] `:247` — update the section comment above `inviteCard`
- [ ] `:249` — `inviteCard.title`: "Invite your family" → "Invite your people"

### `app/group/create.tsx`

- [ ] `:85` — "Give your Group a name so your family can find it." → "…so your
      people can find it."
- [ ] `:184` — placeholder "e.g. The Williams Family Weekly". **Rotate two
      examples** so neither audience feels like the afterthought — e.g. "The
      Williams Family Weekly" and "The Sunday Dispatch." A friends-only example
      here is the single clearest signal that friend groups belong.

### `app/(tabs)/profile.tsx` and `app/(auth)/onboarding.tsx`

- [ ] `profile.tsx:158` — "Enter the name you want your family to see." → "…you
      want your Group to see."
- [ ] `onboarding.tsx:145` — same string, same fix
- [ ] `onboarding.tsx:205` — "Add the name your family will see." → "…your Group
      will see."

### `components/invite-family-card.tsx`

- [ ] Rename to `invite-card.tsx` (kebab-case, per CLAUDE.md Code Style)
- [ ] Rename the component `InviteFamilyCard` → `InviteCard`
- [ ] Update the import at `app/group/[id].tsx:19` and the usage at `:586`

### `web/index.html`

The landing page is the single most audience-defining surface, and it currently
says "family" four times.

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

### `docs/STORE_LISTING.md` — [owner] re-paste into App Store Connect after

- [ ] Subtitle (30 char max): "A newspaper by your family" → **"A newspaper by
      your people"** (26 chars) or **"The opposite of a feed"** (22). The second
      is stronger for this community; the first is safer for App Review and
      search. Owner's call — tracked as an open question in POSITIONING §9.
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

### Low priority — comments and fixtures, cosmetic only

- [ ] `app/group/welcome.tsx:16` — comment says "family record"
- [ ] `app/edition/[id]/index.tsx:211` — comment says "long family names"
- [ ] `supabase/functions/_shared/edition-email.ts:271` — comment says "never
      shout over the family"
- [ ] `supabase/functions/_shared/preview/render-email-fixtures.ts:52` — the
      fixture group is "The Williams Family Weekly". Changing it re-renders the
      email fixtures; harmless, but run the fixture renderer after (see CLAUDE.md
      Commands) since it fails on Gmail's clip limit.

---

## Docs to update when the pass lands

Per CLAUDE.md's self-maintaining-skills rule, the source of truth moves with the
change:

- [x] **CLAUDE.md → "Target Audience"** — rewritten friends-first 2026-09-14
- [x] **CLAUDE.md → "Key Terminology"** — "your people" convention added as
      **Audience vocabulary**; "NOT in MVP" restructured into **Non-features**
- [ ] **`.claude/skills/frontend-design/SKILL.md`** — grep it for family language
      and the audience description
- [ ] **`design/BRAND.md` §9** (language tone) — the examples are family-flavored;
      add a friend-group example beside them
- [ ] **This file** — delete it

---

## Verification

- [ ] `npm run typecheck` and `npm run lint` (the component rename is the only
      part that can actually break)
- [ ] `grep -rn -i "famil" constants/ app/ web/ components/ | grep -v
      "fontFamily\|Typography.families\|font-family"` — should return only
      deliberate uses
- [ ] Walk the onboarding flow on device; the family framing is densest there
