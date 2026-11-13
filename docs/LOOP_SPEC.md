# The weekly loop — pre-test-Group build spec

**Working document, written 2026-11-13. Delete each section when it ships.**

The app has one push ("Your Group is ready!"), sent after the deadline, and an
invite link that does nothing for someone without the app. This spec closes the
leaks a first real Group would hit in its first two weeks. It is meant to be
built while the illustration rework is in progress, so the test Groups (owner's
friends, partner's friends, one family) start on a loop that works.

Build order is the section order. Sections 1–3 are the core; section 4 is small
and rides along; section 5 lists what is deliberately left out.

Read the matching skill before each part: `db-migrations`, `edge-functions`,
`frontend-design`, `data-layer`, and `verify-changes` before calling any of it
done.

---

## 1. An invite link that works without the app

**Today.** `buildInviteLink` (`lib/groups.ts:429`) returns
`catchupcolumn://group/join?code=…`. iMessage does not make it tappable, and
without the app it goes nowhere. `web/` has no join page; the association file
covers only `/edition/*`. The share message works around this by leading with
the code (`Strings.groupInvite.shareMessage`, `constants/strings.ts:416`).

**Build.**

- **Link format:** `https://www.catchupcolumn.com/join/{CODE}` (`www`, never the
  apex). `buildInviteLink` returns this. The QR code on the invite card encodes
  the same URL.
- **Web page `web/join/index.html`**, with a `vercel.json` rewrite
  `/join/:path*` → `/join`, modelled on `web/edition/index.html`:
  - Reads the code from the path and calls `get_invite_preview` (already
    anon-callable) to show the Group's name, description, cover and member
    count. This needs the Supabase URL and anon key in `web/config.js`; both
    are public by design.
  - Shows the code large, with a "Copy the code" button, and the steps in one
    line each: get the app, sign up, you're in.
  - Store buttons from `config.js`. Add a `testFlightUrl` key so the same page
    serves the test Groups before the store listing exists.
  - On a phone, tries `catchupcolumn://group/join?code=…` first, as the edition
    bouncer does, for installs where the universal link didn't fire.
  - Invalid or inactive code: say so plainly and point back to whoever sent it.
    `noindex`, like the edition page.
- **Universal link:** add `/join/*` to `web/.well-known/apple-app-site-association`.
  `associatedDomains` already lists `applinks:www.catchupcolumn.com`
  (`app.json:23`), so no entitlement change is expected. The app must route the
  incoming `/join/{CODE}` path to the existing `app/group/join` screen with the
  code filled in. Verify on a device whether this can ship by OTA or needs a
  build.
- **Share message:** rewrite now that the link is tappable. Link first, code
  second, for example: `You're invited to "{name}" on Catch Up Column: {link}
  (or enter code {code} in the app).` Update the comment above it.
- **After install:** the code is not carried through the App Store. The page
  shows the code and the app's join screen accepts it; `savePendingInvite`
  and `use-auto-join-invite` already carry it through sign-up. No clipboard
  reading and no install-attribution SDK.

**Not in this section:** Android `assetlinks.json` (Android is deferred).

**Done when:** a text containing the link is tappable in iMessage; with the app
it opens the join screen for that Group; without it, it opens a page that names
the Group and gets the person to the app with the code in hand.

---

## 2. The reminder before the deadline

Build [`NUDGE_SPEC.md`](./NUDGE_SPEC.md) as written. It is complete: table,
RPC, wiring inside `compile-editions`, copy, tone rules, checklist.

**What changes from that document:**

- **The gate is lifted** (owner, 2026-11-13). It was sequenced after Group
  Zero, which was skipped. The test Groups start with the reminder on.
- **Keep the lead time a parameter.** 48h stays the default; tune it from
  `posts.created_at` once the test Groups have run three or four editions.
- **Marker table:** create it as `group_slot_notices (group_id, slot_at, kind,
  sent_at)`, primary key `(group_id, slot_at, kind)`, instead of
  `edition_nudges`. Section 3 needs the same once-per-slot guarantee for a
  second kind of notice. Service-role only: RLS on, no policies.
- **Drafts publish, and the reminder says so** (owner, 2026-11-13). Anything
  written goes to press at the deadline, filed or not. To tell the two apart,
  add a nullable `posts.filed_at`, set when the writer presses "File my story"
  and cleared by a later edit, matching the composer's own `filed` state
  (`hooks/use-composer-draft.ts:70`). **The compiler ignores it.** The reminder
  then has three cases, still one push per member per cycle:
  - filed this cycle: no push;
  - a draft that isn't filed: `Two days to press` / `Your story for {day} is
    saved and will run as it stands. Open it if you'd like to finish.` Deep
    link to that draft;
  - nothing written: the copy in NUDGE_SPEC.
- **Home's bylines count filed stories only** (`fetchThisWeeksBylines`,
  `lib/posts.ts:50`), so "Ruth has written this week" is never about half a
  sentence. Posts saved by builds without `filed_at` count as filed.
- **The composer says it once**, near the save status: a saved story runs in
  {day}'s edition whether or not it's filed. Copy to be set in the paper's
  voice under BRAND §9 → "The composer".

Everything binding in NUDGE_SPEC stays binding: push only, one per member per
cycle, who *has* written and never who hasn't, no urgency language.

---

## 3. Thin weeks and empty weeks

### 3a. A one-story edition reads as a letter

Called for in POSITIONING §3 and never finished. Part of it exists: the reader
has an `isSingle` branch (`app/edition/[id]/index.tsx:197`) and the email
subject has a single-writer form (`_shared/edition-email.ts:160`).

- **Audit first.** Render a one-story edition in the reader and through the
  email fixture renderer. Write down what still says "edition" where it should
  say "letter".
- **Push copy for a single-writer edition:** `A letter from {first name}` /
  `{first name} wrote to {group} this week.` in place of "Your Group is
  ready!". Lives beside the existing push copy in
  `_shared/edition-dispatch.ts`.
- **Reader and email:** the masthead line drops "1 story · 1 writer", which
  reads as a score. Keep the Group name, the date and the edition number. The
  rest is a design call inside BRAND §9; no new illustration (illustrations
  stay out of editions).
- Add a one-story fixture to the email preview set if there isn't one.

### 3b. A week with nothing

Today `compile_due_editions` records `skipped_no_posts` and nobody is told.
Keep not publishing. Add:

- **A quiet note to the Group's moderators only**, by push, when a slot is
  skipped: `No paper this week` / `Nothing was filed for {group}. The press is
  open for {next day}.` Deep link to the composer. One per skipped slot,
  guarded by `group_slot_notices` with its own `kind`. Skip single-member
  Groups. Respect `push_subscribed`.
- **Not the whole Group.** A broadcast that nobody wrote is the signal that
  ends a friend Group. The organizer is the one who can act on it.
- **Home:** `ThisWeekStrip` needs no change. It already says "No stories yet
  this week — yours could be the first."

**Done when:** a one-writer week arrives as a letter in push, email and reader;
an empty week sends one push to moderators and nothing to anyone else; invoking
the cron twice sends neither twice.

---

## 4. Small things that ride along

- **A way to write from the email.** The edition email footer gains one line
  above the existing links: `Next edition: {day}. Write for it →`, linking to
  `https://www.catchupcolumn.com/write`. That path is added to the association
  file and opens the composer; without the app it shows the same get-the-app
  block as the join page. This is a signpost, not the web composer
  (POSITIONING §4), which stays gated. Check the fixtures still clear Gmail's
  clip limit.
- **A readout for any Group.** `scripts/group-zero/readout.sql` is hard-coded
  to named Groups. Generalize it to take a Group id and return, per edition:
  writers, stories, members at the time, and when in the week each post was
  written relative to the slot. This is the only measurement the test Groups
  will have; reading is still measured by asking.
- **Resend's free plan** (100 a day, shared with sign-in codes) holds for three
  test Groups. Move to a paid plan before the store release. No build work;
  add the line to `docs/LAUNCH.md`.
- **Push permission is asked once**, at sign-in, and never again. With the
  reminder shipping, a denial costs more. In "Your delivery" on the Group
  page, when the system permission is off, say so and link to Settings. No
  repeated prompts.

---

## 5. Deliberately not in this spec

These wait for what the test Groups show. Reasoning and status go in
POSITIONING.md once agreed.

- Letters to the editor (a reply that prints in next week's Edition).
- Sections of the paper: a Group's question of the week, an advice column,
  surveys, classifieds.
- The monthly print edition and the Volume: costing, test prints, payment.
- Archive features: "a year ago", search, export, the 60-edition list cap.
- The web composer.
- Android links.
