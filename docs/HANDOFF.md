# Launch handoff — orchestration brief

**Rewritten 2026-11-03, updated 2026-11-04, 2026-11-05 and 2026-11-14; Next steps rewritten 2026-11-15** as the one launch list, merging LOOP_SPEC and the UI pass (first written 2026-09-24). This is a living brief for
whichever session is running the launch. It holds what the lists don't: current
live state, the order things must happen in, who does what, and how to verify.
**Rewrite it at the end of every orchestration session** (state, decisions,
first moves). Delete it at launch.

**To resume:** open Claude Code in the repo and say *"Read docs/HANDOFF.md and
walk me through the next steps one at a time."* Skim **Live state**, then start
at **Next steps**. **Run `git fetch` and read this file from `origin/main`
first:** the owner's checkout can be behind, and on 2026-11-05 a stale copy
re-ran a whole batch of checks that had already passed.

It deliberately does **not** copy the lists. Each has one home:

| What | Where |
| --- | --- |
| What's left, short form | `todo.md` |
| **The order of work** | **this file → Next steps** (the one list; other docs hold the detail) |
| Why: audience, test Groups, revenue | `docs/POSITIONING.md` §0 (2026-11-13; wins over the later sections) |
| The loop to build before the test Groups | `docs/LOOP_SPEC.md` |
| The owner's UI-pass decisions (2026-11-08) | `docs/UI_PASS.md` |
| Runbook narrative, commands, live-ops checks | `docs/LAUNCH.md` |
| Submission-day gates (authoritative over LAUNCH) | `docs/PRESUBMISSION_CHECKLIST.md` |
| Every App Store Connect value, the review account, the Review Notes | `docs/STORE_LISTING.md` §13 (§9.1 age rating, §7 privacy labels, §5 screenshots) |
| Acting on a report: take down, remove, ban (internal) | `docs/MODERATION.md` |
| Guideline 1.2: what Apple asks, what ships | `docs/STORE_LISTING.md` §9.3; `docs/LAUNCH.md` step 9 |
| Code-side residue and accepted trade-offs | `bugs.md` (M1, G1–G4, L6) |
| Illustration commission: spec, contracts, integration | `design/ILLUSTRATION_REWORK.md` |
| The artist-facing brief (a shareable doc) | <https://claude.ai/code/artifact/c729acda-f9d2-4fd5-a929-04382415acaa> |
| How to work on each surface | `.claude/skills/*` (auto-load) |
| Back in use for the test Groups (POSITIONING §0) | `docs/ORGANIZER_PLAYBOOK.md`, STORE_LISTING §12 (TestFlight external); `scripts/group-zero/readout.sql` gets generalized (LOOP_SPEC §4) |

When something gets done, record it **there**, dated, then update this file.

---

## Your role

Run the rest of the launch with the owner.
- **Owner-only steps go one at a time**, with exact clicks or commands, and
  wait for the result before the next one.
- **Decisions go through AskUserQuestion**, recommended option first, every
  option viable. The owner does pick the other ones: skip Group Zero, no word
  filter, CLI v3 now, batch the OTA. Restate what they chose, then follow it.
- **Dev work** goes to worktree subagents that open PRs. Review each PR against
  the plan before asking to merge.
- **Verify every claim** against production (read-only) before recording it.
- **The owner merges PRs**, or tells you to, one PR at a time. Ask before every
  production change (Guardrails).

## Live state — 2026-11-14, re-check before relying on it

**Hardening pass, 2026-11-13 and 11-14 (#85–#89): merged, applied, deployed
and published.**
- #85: CI runs each job only for its surface, with one required-able check,
  `CI passed`. Date-dependent checks moved to the weekly `Dependency health`
  run. Added: a fingerprint warning on PRs, CodeQL, a deploy reminder on
  `main`, Dependabot for the pinned actions.
- #86: in-range npm advisory fixes (28 → 21; critical 1 → 0, high 10 → 5) and
  `expo-linking` added to the drift hold. Fingerprint unchanged.
- #87: migration `20261113191544` closes five direct-write paths (CLAUDE.md
  schema; bugs.md → Hardening pass). **Applied 2026-11-14.**
- #88: edge functions (bugs.md → Hardening pass). **Four deployed 2026-11-14.**
- #89: app client fixes and site security headers (live on Vercel, checked).
- **OTA published 2026-11-14:** update group `55ba9092-2369-4129-9844-7c983f919066`
  on `production`, runtime `dd742296…`, iOS only. It carries #74, #77, #86 and
  #89. It's the first update ever published to the channel.

**What was checked on 2026-11-14, and what wasn't:**
- Checked in Expo Go on the simulator, as T1, on `main` against production:
  compose with a photo, file, Publish now, the edition and reader (Take down
  shown, no Report or Block on your own story), photos on Home, Editions and
  the composer, profile save, sign-out. The owner tested the four deployed
  functions (publish, email, push, report) before the OTA.
- **Not checked on build 10 since the OTA** (the owner chose to defer them):
  that the OTA applied at all, push arriving, tapping a push with the app
  killed and open, pushes stopping after sign-out, an https link opening the
  app, password sign-in. **Push receive and push tap are the two that matter
  before release:** #89 changed how the push token is saved and how a tapped
  push is routed, and nothing but a phone can show either. The rest fold into
  §3.
- T1's Test Group now has Edition No. 1 ("Simulator walkthrough", one photo).

**Code:** `main` at `383da9c` (#89), plus the 2026-11-14 records PR. CI is
green. Since build 10, the merged app changes are JS or config only:
- #74, the keyboard fix
- #76, which records the checks; it also adds the security notifications to
  `supabase/config.toml` (local-stack config)
- #78, Expo patch drift: 8 packages listed in `expo.install.exclude`, so
  expo-doctor stops failing every PR without moving the fingerprint (Traps)
- #77, a read-only Email field on Set a password, as a username so iOS
  offers Strong Password (bugs.md L6)
- #86 and #89 (above)

None of them moved the fingerprint: the owner's checkout resolved `dd742296…`
on 2026-11-14, before the OTA.

**Production:**
- **Database:** all 39 migrations applied (CLI v3: `migration list --remote`
  matched 2026-11-14).
- **Functions:**

  | Function | Version | Notes |
  | --- | --- | --- |
  | `compile-editions` | v22 | deployed from `main` 2026-11-14 (#88); not downloaded and diffed |
  | `publish-edition-now` | v11 | same |
  | `report-story` | v2 | same |
  | `delete-account` | v12 | same; its only change is the pinned import |
  | `unsubscribe` | v7 | old on purpose: its new wording deploys on release day |

- **Cron:** healthy. Checked 2026-10-30: the last tick returned 200, and 0 of
  24 kept responses timed out.
- **Auth dashboard (LAUNCH step 5): all done.** Codes expire after 600 s, the
  templates were pasted 2026-10-30, and the `reset-password` redirect is
  removed. **The Password changed and Email address changed notifications
  were found off on 2026-11-04** and turned back on (cause unknown; the
  template had survived). `npx supabase config diff --remote` (read-only, no
  prompt) now checks them: it should list no `notification` paths. On
  2026-11-04 it also confirmed OTP expiry 600, code length 6, Secure password
  change on and minimum password length 8. The 15 other differences it lists
  are expected: local-only values such as `site_url`, SMTP, pooler sizes and
  MFA.
- **Email:**
  - Resend domain verified. Free plan: 100/day and 3,000/month, shared by
    sign-in codes, edition email and reports.
  - **No tracking subdomain, so no open or click tracking.** Never set one up;
    the tracking switches can't save without one, and that's expected.
  - `support@` receives mail through Cloudflare Email Routing; DMARC is `p=none`.
- **Public pages:**
  - Terms effective 2026-11-02 (zero tolerance, blocking, moderators).
    `TERMS_VERSION` in `lib/auth.ts` matches.
  - Privacy policy has the safety-records line and the support inbox
    (Cloudflare); the support page and delete-account page are updated.
  - All live on Vercel.

**Guideline 1.2: done in code, live on the server.** It's #64–#70: report
from the app, a creator's Groups handed over on account deletion, removal as
a ban with "Let back in", agreeing at sign-up, the email and push switches,
take-down, and one-way block. There's **no word filter**, by decision. The
Review Notes make the structural case instead.

**The build on the owner's phone:**

| | |
| --- | --- |
| Build | 10 (1.0.0) |
| EAS build id | `7ba2ae35-d86a-43e4-afbb-f053d6c98406` |
| Built from | `4392385` |
| Channel | `production` |
| Runtime (fingerprint) | `dd742296d0f188b486a1af3dee8fe6f7ef7e662b` |
| Status | submitted 2026-11-03; App Store Connect app **`6830424103`** created; installed through internal TestFlight |

It has every PR up to #72 built in, and since 2026-11-14 an OTA with #74,
#77, #86 and #89 (cold-launch twice to apply it; not yet confirmed on the
phone). The UI pass and LOOP_SPEC's app half will be the second OTA (Next
steps, Step 5).

**The owner's local checkout:**
- `package.json` has an **uncommitted** change: the `ios`/`android` scripts say
  `expo run:*`, from running `npx expo run:ios`. It doesn't affect the
  fingerprint.
- There's a gitignored `ios/` folder from the same command.
- **Never `git commit -a`/`-am` in that checkout.** Stage files by name. When
  switching branches, stash and pop.

**Test accounts:** T1 = `bchen395+t1@gmail.com` (moderator of a test Group).
T2 and T3 will be `bchen395+t2@`/`+t3@gmail.com`. On 2026-11-08 the owner was
about to sign up T2 in the simulator through T1's invite link; **check whether
T2 exists** before creating it.

**Review account and demo Group: done 2026-11-08** (§6 step 11, in the UI
session; it never reached this file until 11-15):
- Review account `bchen395+appreview@gmail.com`, display name **App Review**,
  with a password (in the owner's password manager).
- Demo Group **Teddy's Crew**, moderated by App Review. Second member **Henry
  Miller** (`bchen395+appreview2@gmail.com`, no password).
- Edition 1 published with both stories (App Review's has 3 photos, Henry's
  at least one). Email to both, push, and Report/Block on Henry's story all
  worked.
- **Still owed:** write the names into the Review Notes in STORE_LISTING §13.3
  (measured at 3,691 bytes with them in, under 4,000), then paste into App
  Store Connect.
- Don't type in the composer as App Review: autosave makes it a real post in
  Teddy's Crew's next edition, which the reviewer sees.

**Sentry, 2026-11-08:** no issues ever received. Release `1.0.0 (10)` lists 2
artifacts (bundle and source map), so build 10 had the org, project and token.
That doesn't prove the DSN is in the build: the test event (#83) does, and it
**did not ride the 11-14 OTA**. It goes in the next one.

**Local launch config:** `.claude/launch.json` has an uncommitted
`expo-ios-go` entry (Expo Go on the simulator, port 8081) from the UI session.
Like the `package.json` change, leave it out of commits unless the owner says.

**Phone check batch 1: done 2026-11-03.** Sign-up with the Terms agreement,
the 10-minute code, onboarding, the photo permission wording, notifications
allowed, creating a Group, the switches, Profile, and Help & support. It
passed apart from the keyboard (fixed in #74). T1's query passed 2026-11-04:
`terms_version` `2026-11-02`, agreed, 1 push token, 1 Group.

**Phone check batch 2: done 2026-11-04.** Everything passed:
- `catchupcolumn://`, and a tapped `/edition/…` universal link
- every Gate 7 Auth item (set and change a password and the email, password
  sign-in, the wrong-password hint, `password1` refused, *Forgot your
  password?*)
- #68's notifications-blocked note

The exceptions:
- Set a password gets no strong-password suggestion or Keychain save. It was
  accepted for 1.0 on 11-04, then **fixed in #77 on 11-05** after a re-run
  (bugs.md L6). **Re-check it on the phone after the OTA:** the Strong
  Password suggestion, the save, and the update-saved-password prompt after
  *Forgot your password?*. The sign-in screen offers to save and autofills,
  so the entitlement works.
- 2026-11-05: a session over a day old asked for a code on Set a password,
  and the right code saved (a wrong code wasn't tried).
- The password-changed email only came once the notification was switched
  back on.

**App Store Connect: mostly filled 2026-11-04** (STORE_LISTING §13.5). Done:
- App Information: subtitle, categories, content rights, age rating 4+ → 18+,
  and the privacy URL
- the privacy label, published
- Free, in **147 of 175 regions**: the EU was dropped for 1.0 on 2026-11-05,
  so there's no DSA declaration, and App Store Connect shows no DSA flag
- the version page's text and URLs, manual release, copyright, and the review
  contact

Open:
- the review sign-in and Notes (the account exists; see Review account above)
- screenshots and the build

## Decisions since 2026-10-24 (all the owner's)

| Date | Decision |
| --- | --- |
| 10-24 | **Skip Group Zero.** ~~No external TestFlight, no beta review; submit once the art lands and the checks pass.~~ (Reversed 11-13, below.) Multi-photo ships in v1 |
| 10-30 | Age rating **18+** override; Terms §1 stays at 18. Messaging & Chat: Yes. Content rights: Yes (the art contract must grant the rights). EU **trader**. Every region except mainland China. **Manual** release. Reports answered **within 24 hours, every day** |
| 10-30 | Guideline 1.2 closed in code before the final build: one-way block, "Let back in", **no word filter**, report sent from the app, email and push switches for each Group. Existing accounts aren't asked to re-agree to the Terms. bugs.md M1 accepted |
| 10-31 – 11-02 | Accepted for 1.0: report spam can use up the shared Resend cap (G1); push isn't filtered by blocks (G2); a moderator's block hides stories in their own Group too (G3); deleting an account removes that person's stories (G4) |
| 11-01 | Take-downs are silent: the author isn't told. The invite card keeps "Anyone with this code can join" (standard, short) |
| 11-02 | Privacy label declares Customer Support; support inbox disclosed; **Supabase CLI v3 now** (rather than pinning 2.x) |
| 11-03 | Short multi-line fields (Group description, bio): Return reads **Done** and closes the keyboard. **Batch the OTA:** #74 waits for the phone-check fixes |
| 11-04 | ~~**Accept**~~ (fixed instead on 11-05) the missing strong-password suggestion on Set a password for 1.0 (bugs.md L6). **Copyright** names the owner's legal name; the App Review contact is the owner's personal phone and email. **DSA trader declaration deferred**: which address to publish is still open |
| 11-08 | **The UI pass, decided screen by screen:** all in `docs/UI_PASS.md`. Also: **Sign in with Apple** is the first update after launch, not 1.0; **dark mode** waits until after launch; the paperboy stays static. The illustrations are drawn by someone the owner knows personally: **no fee and no fixed dates**; the owner asks for pieces when they're needed (this replaces the "commission, finals ~11-07" framing in §7 and ILLUSTRATION_REWORK) |
| 11-13 | **Real test Groups before submission, after the art** (POSITIONING §0): two or three Groups (the owner's friends, the owner's partner's friends, one family) on **external TestFlight**, so Beta App Review is back. The wait is spent building `docs/LOOP_SPEC.md`. **A draft still publishes** at the deadline (`posts.filed_at`, ignored by the compiler). Revenue leads with a monthly printed paper |
| 11-14 | **Publish the OTA now** rather than after the UI pass, iOS only, and **defer the phone checks** of it (Live state lists them). `unsubscribe` still waits for release day |
| 11-05 | **Drop the EU for 1.0** rather than publish a trader address, phone and email on EU product pages: 147 of 175 regions (UK, Norway, Iceland, Liechtenstein and Switzerland stay). When the EU comes back, the email is support@. **Fix the Keychain gap after all** (#77, rides the OTA). **Hold Expo patch drift** in `expo.install.exclude` until the final build (#78) |

## Next steps — the one launch list (2026-11-15)

**[owner]** means only the owner can do it: one step at a time, with exact
clicks or commands. **[agent]** means the session does it. Work top to bottom;
lanes marked *parallel* can run at the same time in separate worktrees because
they don't share files. Every **server** item (migration, function deploy) asks
first; batch them so the owner approves one deploy, not five.

Finished and kept for the record: phone check batches 1 and 2 (11-03/04), App
Store Connect fields (11-04/05), the review account and demo Group (11-08), the
hardening pass and first OTA (11-14).

### Step 1. Close out the 11-14 OTA — [owner], 10 minutes, on the phone

1. Cold-launch build 10 twice. Home loading means the OTA applied.
2. Publish in T1's Test Group; see the push arrive; tap it once with the app
   killed and once with it open (#89 changed both).
3. Set a password: the Strong Password suggestion, the Keychain save, and the
   update prompt after *Forgot your password?* (bugs.md L6, #77).

### Step 2. Start Beta App Review early — [owner, agent dictates]

The test Groups need external TestFlight, and Apple's beta review is the one
wait nobody here controls. Revive STORE_LISTING §12 (TestFlight external),
create the external group, and submit **build 10** for beta review now, so any
questions Apple asks come back while the build work runs. Testers won't be
invited until Step 6.

### Step 3. Build — [agent], PRs off `main`

Read `docs/UI_PASS.md` and `docs/LOOP_SPEC.md` in full first. They overlap in
four places, already reconciled in UI_PASS: Done sets `filed_at`; "Write yours"
counts filed stories; "· N writers" goes everywhere and the whole line goes for
one-story editions; the invite preview's faces versus the public web page.

3a. **The ghost-button style** (UI_PASS §1). First and alone: it touches every
    screen.

Then three lanes, *parallel*:

- **Lane A — invite and join:** LOOP_SPEC §1 (https link, `web/join`, AASA,
  routing, share message) together with UI_PASS §9 (faces on the signed-out
  invite preview, **server**). Needs the owner's answer on faces on the web
  page first (Decisions the owner owes). Merging `web/` publishes it. Check on
  the phone whether `/join/*` works by OTA or needs the final build.
- **Lane B — composer, then the loop's server half, in this order:**
  UI_PASS §6 (Done, the stamp, the toolbar, the date button) → LOOP_SPEC §2
  (`group_slot_notices`, `filed_at`, the reminder, **server**) → LOOP_SPEC §3
  (the one-story letter, the empty-week note to moderators, **server**) →
  #81 (the email photo credit, **server**). All touch `compile-editions` or
  `_shared/`, so they go one at a time.
- **Lane C — the other screens:** UI_PASS §2 (sign-up copy), §3 (Home; "Write
  yours" lands after Lane B's `filed_at`), §4 (Editions), §5 (front page;
  coordinate the masthead line with LOOP_SPEC §3a), §7 (Groups tab), §8 (Group
  page), §10 (Profile initial), #80, #82.

3b. **LOOP_SPEC §4** once Lanes A and B are in: the "Write for it →" email
    line (**server**), the generalized readout, the push-permission note in
    Your delivery, and the Resend paid-plan line in LAUNCH.

3c. **One server deploy** for everything above: `db push --remote`, then
    `compile-editions` and `publish-edition-now` (and any other importer of a
    changed `_shared/` file). Ask first; download and diff afterwards.

### Step 4. Walk what changed — [owner + agent]

In Expo Go on the simulator, then on the phone after the OTA:
- the screens never walked (UI_PASS §11): onboarding, join, welcome, Set a
  password, the reader, **through the new `/join` link**;
- every screen changed in Step 3.

New notes go into UI_PASS as decisions first, then get built. Keep this to one
round: anything that isn't a bug or a broken promise waits for the test Groups.

### Step 5. Second OTA, then the multi-account checks

1. **[agent → owner] Publish the OTA** (ask first): confirm
   `npx expo-updates runtimeversion:resolve --platform ios` prints
   `dd742296…`, then
   `npx eas-cli update --channel production --environment production --platform ios --message "…"`.
   It carries Step 3 and #83 (the Sentry test). Cold-launch twice.
2. **[owner + agent] Sentry** (LAUNCH 10.3/10.5): the #83 event arrives;
   check what it contains.
3. **[owner + agent] Phone check batch 3** (the rest of Gate 7) on the updated
   build. Needs the second device or account switching (Decisions the owner
   owes). T1 moderator, T2/T3 contributors:
   - T2 joins **by the new https link**.
   - A post with 2 photos → Publish now. The email arrives from the verified
     domain, its link opens the app, push fires.
   - The reminder push before a slot, and the empty-week note (LOOP_SPEC §2–3).
   - Report (#64), reaching `support@`.
   - Block and Unblock (#70).
   - The delivery switches, and the unsubscribe link flipping the switch (#68).
   - Take down a published 2-photo story (#69): **the production take-down
     test**, with #69's before/after file counts; the agent hands over the
     read-only queries.
   - Remove, the removed member refused at the join screen, then Let back in
     (#66).
   - Delete a *creator's* account while their Group has a member (#65).
   - Profile → Delete my account.
   - Share an invitation and the QR code (UI_PASS §8).
   - Clean up the test Groups afterwards (not Teddy's Crew).

### Step 6. The art, the final build, the test Groups

1. **[owner]** Ask for the art when Steps 3–5 are close: there's no fee and no
   fixed date, so the ask is the trigger. The SVGs ride an OTA; the icon and
   splash need the build.
2. **[agent]** Integrate per ILLUSTRATION_REWORK → Integration; decide the
   mug (UI_PASS §10); fold the outcomes into BRAND §4/§11 and delete
   ILLUSTRATION_REWORK.
3. **[owner] The final build:** remove `expo.install.exclude` from
   `package.json`, run `npx expo install --fix`, then the production build. Its
   runtime is new, so build 10 stops getting OTAs. Remove #83's test line
   before building.
4. **[owner] Start the test Groups** on that build through external TestFlight,
   with ORGANIZER_PLAYBOOK. Run them before or alongside App Review
   (POSITIONING §0). Read them with the generalized readout.

### Step 7. Submit

1. **[owner]** Screenshots, last, from Teddy's Crew with the new art (check
   the size slots in Media Manager first; STORE_LISTING §5).
2. **[agent]** Write the demo names into the Review Notes (§13.3), re-measure
   under 4,000 bytes; **[owner]** paste them and the review sign-in into App
   Store Connect.
3. **[owner]** Move Resend to a paid plan (LOOP_SPEC §4).
4. **[owner]** Submit the build with `npx eas-cli submit --platform ios --id <id>`
   and add it to the version page.
5. **[owner + agent]** The final PRESUBMISSION pass (all gates), then
   **Submit for Review**. Release is manual.

### Step 8. Release day and after

1. **[agent → owner]** `npx supabase functions deploy unsubscribe --use-api
   --remote` (asks first; default No).
2. **[agent]** After approval, set `appStoreUrl` in `web/config.js` (a PR; this
   publishes the site).
3. The first update after launch: **Sign in with Apple** (UI_PASS → Post-launch).
4. What the test Groups show decides letters to the editor and sections of the
   paper (POSITIONING §0, LOOP_SPEC §5).

**Not blocking:**
- Make CI's schema lint able to fail (todo.md).
- Authors can delete their own *published* post through the API without its
  photos (`001_initial_schema.sql:201`).
- Members can read each other's delivery flags through the API.
- From the 2026-11-14 pass (bugs.md → Hardening pass, open items): the
  unsubscribe link acts on GET; switching Groups in the composer can drop an
  unsaved draft; `users.avatar_url` and `groups.cover_image_url` accept any
  URL; the `query-string` advisory waits for SDK 58.
- Repo settings, set 2026-11-14: `main` requires the `CI passed` check (no
  review requirement; force-pushes and deletion are off), and Dependabot
  alerts are on (alerts only, no automatic npm PRs).

**First move for the next session:** Step 1 if the owner hasn't done it, then
Step 2's beta review and Step 3a. Lanes A–C can each go to their own session
once 3a is merged.

## Decisions the owner owes

| Decision | Needed by | Where |
| --- | --- | --- |
| Faces and first names on the **public web** join page too, or only in the app | Step 3, Lane A | UI_PASS §9 |
| Second device or tester for batch 3 | Step 5 | Step 5.3 |
| Which friends and family make up the two or three test Groups, and who organizes each | Step 6 | POSITIONING §0 |
| A written grant of rights for the drawings (App Store Connect says Content rights: Yes) | Step 7 | ILLUSTRATION_REWORK |
| Screenshot size slots (Media Manager) | Step 7 | STORE_LISTING §5 |
| Publish-day default (minor): the app says Sunday 09:00 | Any time | `app/group/create.tsx` |

## How to verify without Docker

- **DB, read-only:** `npx supabase db query --read-only "<SQL>" --remote`.
  Auto mode blocks it against production, so hand the owner the `!` command.
  Under v3 it prints `Target: …` and then JSON with a `rows` array (confirmed
  2026-11-03). Never run LAUNCH's Vault query 2 unless the cron's HTTP responses
  fail, because it prints secrets.
- **Non-DB remote reads aren't blocked:** `migration list --remote`,
  `db push --dry-run --remote`, `functions list`, `functions download`.
- **Service-role calls:** derive the key inline so it's never printed:
  `SUPABASE_SERVICE_ROLE_KEY="$(npx supabase projects api-keys -o json --remote=wvaxfyhihcfilewygtzp | jq -r '.[] | select(.name=="service_role") | .api_key')"`.
  v3 still returns an array (checked 2026-11-03).
- **Hashed secrets:** `supabase secrets list` digests are the SHA-256 of the
  value. Compare with `printf '%s' '<expected>' | shasum -a 256`.
- **What code production runs:** download and diff (LAUNCH → Deploying edge
  functions).
- **Cron:** read the status codes in `net._http_response`, not
  `cron.job_run_details`.
- **EAS:**
  - `npx eas-cli build:view <id> --json` gives the status, `updateChannel` and
    `runtime.version`.
  - `npx eas-cli update:list --branch production` lists updates.
  - `npx expo-updates runtimeversion:resolve --platform ios` gives the local
    fingerprint.
- **Site / DNS / AASA:** the curls in LAUNCH step 2 and PRESUBMISSION Gate 4;
  `dig +short MX catchupcolumn.com`; `dig +short TXT _dmarc.catchupcolumn.com`.
- **Merging several PRs:**
  - Test-merge them in order in a scratch worktree off `origin/main`, and
    **typecheck the merged result before pushing**. A conflict-resolution
    push once broke typecheck on a type a sibling PR had renamed.
  - Parallel PRs routinely conflict in CLAUDE.md, BRAND §9 and the skills.
    Resolve by keeping both sides.
- **Flows that touch auth or storage:** use a throwaway account and take
  before/after snapshots. Clean up afterwards.
- **Edge function logs:** dashboard only.

## Guardrails

- No Docker (owner preference). Everything above is Docker-free.
- **Subagents: no system installs without asking.** A subagent that installs
  npm packages does it in its own worktree's `node_modules`, never the main
  checkout's.
- Branch → PR → CI green → the owner merges (or says to). Commit and PR
  attribution follow the session's instructions.
- **Ask before any production change, and show the exact command:**
  `secrets set`, `env:set`, `functions deploy`, `db push`, `eas update`,
  `--apply`, and any write via SQL. Read-only checks need no ask.
- Merging anything under `web/` publishes it, so treat it as outward-facing.
- Record outcomes as they are, and say what wasn't checked.
- CLAUDE.md's Non-features are permanent: no engagement mechanics, ever.

## Traps already paid for

- **An OTA reaches a build only while their fingerprints match.**
  - The fingerprint covers `app.json`, **all of `eas.json`** (adding
    `submit.production.ios.ascAppId` moved it, so that change was dropped on
    2026-11-03), config plugins and native deps.
  - Check with `runtimeversion:resolve` in a checkout with its **own**
    `node_modules`. A worktree that symlinks them computes a different value
    for identical code, so only compare such worktrees with each other.
- **The `production` channel is the owner's TestFlight build now,** and after
  release it's everyone's. There is no `staging` build: the profile exists,
  but none was built.
- **Publish OTAs with `--platform ios`.** There is no Android build to
  receive one. Until 2026-11-14 the flag was also required: `eas update`
  exports web too, and the web render rejected an invalid
  `unstable_settings` anchor in `app/_layout.tsx` ("invalid anchor"). The
  anchor is removed; don't add one back (the comment there says why). A failed
  export publishes nothing.
- **The simulator can run the app after all, in Expo Go** (`npx expo start`,
  then open it on a booted simulator). It runs `main`'s JS against production,
  so it covers screens, photos, compose and publish. It can't receive this
  app's pushes or open its https links, and a local build is still
  impossible (Xcode 26.3).
- **Apple ID lockout (error -20209):** a wrong password locks the account;
  unlock it at iforgot.apple.com. EAS caches the password in the Keychain
  before auth succeeds, so delete the wrong one with
  `security delete-internet-password -s "deliver.<apple id>"`.
- **Supabase CLI v3 (pinned 3.0.0 in `package.json` and CI, since 2026-11-02)
  targets the local stack by default.**
  - Production commands need `--remote`, placed last; `--linked` is deprecated.
  - Every production change asks first, and the default is No. In a script
    use `--yes`, never `echo y |`.
  - Bump `package.json` and CI together.
  - An unpinned `npx supabase` broke on 3.0.0's release day.
- **Expo patch drift fails the weekly `Dependency health` run**, and any PR
  that itself changes `package.json`, the lockfile or `app.json` (expo-doctor).
  It no longer fails unrelated PRs. Fix it in its own
  commit with `npx expo install --fix`. Native packages move the fingerprint;
  CI's `fingerprint` job warns on a PR that does.
  **Until the final build, don't:** since 2026-11-05 the drifted packages are
  listed in `package.json` → `expo.install.exclude`, which silences the check
  without moving the fingerprint (checked), so OTAs still reach build 10. Add
  any new drift there too.
- **Merging deploys nothing to Supabase.** A `_shared/` change needs every
  importer redeployed. CI never runs auth, email or storage against the real
  project, and its schema lint can't fail (todo.md).
- **Read long docs in full, never as a summary.** The `shunt` plugin's limit
  is raised to 5,000 lines here; if a read is still blocked, read in chunks.
- **Sign-in templates:**
  - There are three code templates: Magic Link (sign-in), Confirm signup and
    Reauthentication.
  - A failed sign-up **creates the user**, so a re-test needs a fresh address.
    Plus-aliases work.
  - The code is 6 digits and expires in 10 minutes, the same numbers in the
    app and the dashboard.
- **Dashboard auth settings can drift with no record.** Both security
  notifications were found off on 2026-11-04 after being set on 2026-09-28.
  Run `npx supabase config diff --remote` before trusting LAUNCH step 5. The
  local `config.toml` declares the notifications; the other step 5 values
  matched.
- **Every account stores a password hash** (a random one for code sign-ups).
  Never build a "current password" check.
- **Deleting storage files by SQL:** `storage.protect_delete` needs
  `set_config('storage.allow_delete_query','true',true)` for a direct delete.
  Remove files through the Storage API. Deleting a Group by SQL also needs
  `app.deleting_group`.
- **A policy subquery runs under the other table's RLS.** Put hidden lookups in
  a SECURITY DEFINER helper scoped to `auth.uid()` (`is_caller_banned`,
  `is_blocked_by_caller`). A two-argument helper would leak who blocked or
  removed whom.
- `errcode = 'PGRST301'` is invalid in old migrations; use `P0001`.
  `time + interval` wraps at midnight, so use timestamps.
- `.env.local` never reaches an EAS build; `EXPO_PUBLIC_*` values are inlined
  at build time from EAS's `production` environment.
- **SDK 57 needs Xcode ≥ 26.4 locally** (this Mac has 26.3); EAS's build
  image is fine.
- `supabase functions download` writes every function into one `_shared/`
  folder, so re-download the one you care about on its own before diffing.
- `gh pr merge --delete-branch` can't delete a local branch that a worktree
  still uses. The merge itself succeeds.
