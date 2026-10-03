# Launch handoff — orchestration brief

**Rewritten 2026-10-03** (first written 2026-09-24). A living brief for whichever
session is orchestrating the launch. It holds what the lists don't: current live
state, the dependency order, who does what, and how to verify. **Rewrite it at
the end of every orchestration session** (state, dates, first moves). Delete it
at launch.

**Start at "Next steps"** (after Workstreams) — every open item, in the order
it binds. The rest of this file is the context those steps need.

It deliberately does **not** copy the lists — each has one home:

| What | Where |
| --- | --- |
| What's left, short form | `todo.md` |
| Sequence and why; open questions | `docs/POSITIONING.md` §8, §9 (§6 = Group Zero, §5 = revenue) |
| Runbook narrative, commands, live-ops checks | `docs/LAUNCH.md` |
| Submission-day gates (authoritative over LAUNCH) | `docs/PRESUBMISSION_CHECKLIST.md` |
| Code-side residue | `bugs.md` |
| What the Group B organizer gets | `docs/ORGANIZER_PLAYBOOK.md` |
| Group Zero tooling | `scripts/group-zero/` (README), `scripts/group-zero/readout.sql` |
| How to work on each surface | `.claude/skills/*` (auto-load) |

When something gets done, record it **there**, dated — then update this file.

---

## Your role

Run the rest of the launch with the owner. Keep the critical path moving; do the
dev work yourself or in parallel subagents (worktrees); hand the owner the
owner-only steps **one at a time, with exact clicks/commands**; verify every claim
against production (read-only) before recording it. The owner merges PRs — or
tells you to, per PR.

## Live state — re-check before relying on it

Server rows verified 2026-09-25/28 and not re-read since; the EAS, CI and build
rows verified 2026-10-03.

**Working:**
- **Server:** v2 edition email live; cron firing every 15 min; **32 migrations
  applied**, all matching `main` — including the late-slot fix (`20260925212248`,
  bugs.md H1: slots at 23:40 or later now publish) and compile robustness (`20260928155710`, H2 + H3: pg_net waits
  150 s, one invalid Group timezone is skipped and reported, a trigger rejects
  unknown zones). `compile-editions` **v19** (2026-09-28): a 30-minute compile
  window, so every slot gets two ticks; download-and-diff clean. `WEB_BASE_URL` = `www`; `EMAIL_FROM`
  correct; Vercel in sync with `main`.
- **CI green** on every check (#49, 2026-10-03 — after the second Expo patch
  bump; see Traps).
- **EAS env** (`production` + `preview`, read back 2026-10-03): the Supabase
  vars, `EXPO_PUBLIC_SENTRY_DSN`, and — new 2026-10-03 — the source-map trio:
  `SENTRY_AUTH_TOKEN` (Secret), `SENTRY_ORG=catch-up-column`,
  `SENTRY_PROJECT=catchupcolumn` (owner confirmed both slugs in Sentry). The
  first production build is what proves them (LAUNCH 10.4).
- **Pre-flight for the production build** (2026-10-03): `main` clean;
  `app.json` has bundle ID `com.catchupcolumn.app` (final),
  `ITSAppUsesNonExemptEncryption: false`, `applinks:` and `webcredentials:`
  for `www`; `eas.json` production = remote build numbers + `autoIncrement`;
  EAS login `bchen395`. No live App Store app is named "Catch Up Column" (an
  unreleased one could still hold the name).
- **Universal links, server half:** the AASA serves
  `6RDS3S724Z.com.catchupcolumn.app` with `applinks` and `webcredentials` (200,
  `application/json`, on Apple's CDN). Reaches phones with the first device build.
- **First EAS build** (2026-09-24, `preview`, simulator, `cf9f70ee`): SDK 57
  launches — splash, fonts, sign-in, clean logs. On the owner's simulator
  (iPhone 17 Pro). Predates #44, so it still has the old reset-link flow.
- **Verified against production 2026-09-22** (dev build): code sign-in,
  sign-up, moderator removal, account deletion.
- **Group Zero tooling on `main`** — the operator script (verified end to end
  against production 2026-09-25, PR #40's comment) and the readout queries.
- **Auth on `main`** (#44, 2026-09-28): code sign-in by default, an optional
  password from Profile, "Forgot your password?" as a code sign-in, 8-character
  minimum + common-password list, sign-out on this device only. Dashboard items
  1–4 done 2026-09-28 (LAUNCH step 5).
- **Docs match the plan** after #49 (2026-10-03): the Group Zero re-plan below.
  The public privacy policy is current — live at `/privacy`, "Last updated
  September 28, 2026" (read back 2026-09-28); TestFlight's Test Information
  needs its URL.

**Wrong or open right now:**
- **No production build yet** — nothing has run on a phone as a signed binary,
  and nothing behind sign-in has been checked on a release build. The owner
  **skipped the simulator pass** on `cf9f70ee` (2026-10-03): the screens get
  checked on the phone build instead (§2 item 4).
- **#44's app half is on no build yet.** Its `app.json` change moved the
  `fingerprint` runtime, so it can't reach `cf9f70ee` by OTA. The first
  production build carries it; checks are PRESUBMISSION Gates 5 and 7.
- **Two auth dashboard steps wait for that build to be what people run**
  (LAUNCH step 5 items 5 and 7; §5 below). Until then codes really last an hour
  while the copy says 10 minutes — the harmless direction.
- **Cron timeout re-count never done.** Before the 2026-09-28 16:45 UTC fix
  about 1 in 4 ticks timed out at 5 s; the 3 ticks right after it were all
  `200`, too few to close. Expect 0 now (§4). Whether the old timed-out runs
  finished server-side was never read — moot unless timeouts continue.
- No DMARC record. Resend domain status unconfirmed. Both before edition 1.
- The owner's Mac has Xcode 26.3; **local** SDK 57 builds need ≥ 26.4. EAS is
  unaffected.

**Group Zero: not started.** Production has 2 test Groups, 3 users. As of
2026-09-25 the owner has Group A (a friend group they're in) and "can enlist
another group easily" for Group B — its organizer still unnamed. **Re-planned
2026-09-29 (owner, #49):** Group Zero runs on the app from edition 1, through a
TestFlight public link — not the App Store, and no longer off-app for weeks
1–2. Groups A and B are created in the app by their organizers and filled by
invite code; the operator script is for holdouts, and texted entries still
count in editions 1–2 (POSITIONING §6). Still owed: Group A's settings, the
Group B organizer, the family Group, Android (§3). The ~2026-09-30 family-Group
date passed with no family Group.

## Dates that bind

| When | What | Why it's fixed |
| --- | --- | --- |
| **2026-10-04** (owner's plan) | Production build + submit; the owner's phone via internal testing; external TestFlight submitted for review | Edition 1 needs installs. After this, Apple's beta review (usually about a day, not guaranteed) is the wait — friends install ~10-05/06 at the earliest |
| **Overdue** | A family Group publishing | Passed 2026-09-30 with none. Each week later is one fewer edition in a December volume (POSITIONING §5). It can start by email with `create-group` or wait for the app — owner's call |
| Late November | The December test (hand-made volumes, Lulu by hand, Stripe link) | Q4 is 40–60% of gift revenue |
| Before App Store submission | Illustration rework landed (commissioned illustrator) | Owner, 2026-09-25: no store release with the current drawings |

The path into TestFlight is §2, in order. The illustration rework is **not** on
it: the SVGs reach an installed build by OTA (`fingerprint` runtime policy); the
icon/splash change needs one more build, which is cheap by then.

## Workstreams

- **A. Group Zero — owner-led** (§3; POSITIONING §6). `readout.sql` for results;
  reading is measured by asking each member at week 4 (open tracking stays off).
- **B. Production correctness — agent, the owner approves each prod change.**
  Nothing is pending to push or deploy; what's left is watching (§4). Redeploy
  functions after **every** function change; verify by download-and-diff
  (LAUNCH → Deploying edge functions).
- **C. App fixes, then the build — owner-led** (§1, §2).
- **E. Gated — do not start** (POSITIONING §8): the nudge, thin-edition design,
  write-by-web, store screenshots, App Store submission (after Group Zero **and**
  the illustration rework), the house ad (after the December test), the print
  renderer / Lulu API.

## Next steps — rewritten 2026-10-03

Everything open, in the order it binds. **[owner]** = only the owner can do it —
hand these over one at a time with exact clicks or commands. **[agent]** = the
session does it. Record outcomes where each item points, dated, then update
this file.

**§1. Today (2026-10-03) — the owner's app fixes, in a new session**

The owner wants to fix things in the app before tomorrow's build. Start from
their list. Whatever is merged to `main` before the build is in it.
- **Native changes must merge before the build** — anything in `app.json`,
  the icon or splash, a new or upgraded native package. After it they need
  another build.
- **JS-only fixes** (screens, copy, styles) can also land after the build and
  reach installed apps over the air:
  `npx eas-cli update --channel production --message "…"`. That is a
  production change — ask first. It has never been run in this project, so
  check the first one on the owner's phone.
- Run the `verify-changes` skill before calling a fix done, and keep CI green
  (Traps: Expo patch drift).
- **Worth raising with the owner: bugs.md L3.** It was "low priority" because
  the operator script pre-created every Group Zero account with its profile.
  Under the 2026-09-29 invite flow every friend signs up in the app, so every
  one of them is the "genuinely-new user" L3 can strand — if profile creation
  fails twice, they land on screens that join on `users.id`. Rare, but it's a
  first impression. The fix (a retry/error screen in `app/_layout.tsx`) is
  JS-only, so it could also follow the build over the air.

**[agent] Prep for tomorrow, if there's time:**
- Draft the TestFlight **Test Information** as a new section of
  `docs/STORE_LISTING.md`: Beta App Description, What to Test, feedback email,
  privacy policy URL (`https://www.catchupcolumn.com/privacy`), and review notes
  (sign in through *Use a password instead*).
- Settle the **review account address** with the owner: a `+alias` of their own
  address, so the sign-in code reaches them — never a friend's account.
- Optional: after the fixes merge, a fresh `preview` simulator build from `main`
  (no Apple sign-in needed) to check the fixes behind sign-in, and to make the
  review account (code sign-in → Profile → *Set a password*, 8+ characters,
  not a common one) plus its demo
  Group with a published edition. Production writes — ask first. Doing it today
  takes it off tomorrow's path.

**§2. Tomorrow (2026-10-04) — build day** (LAUNCH step 8)

1. **[owner, own Terminal]** — interactive, so not via `!`:
   `npx eas-cli build --platform ios --profile production --no-wait`. Answer
   **Yes** to logging in to Apple (then Apple ID, password, 2FA), to the
   distribution certificate, the provisioning profile, and the push key (APNs —
   without it push never arrives). Team ID `6RDS3S724Z` if asked. If it stops on
   an agreement, accept it at developer.apple.com → Account and re-run. The
   build carries #44's auth, #45's UTC fallback, the `webcredentials`
   entitlement, and whatever of §1 has merged.
2. **[agent] Watch it:** `npx eas-cli build:list --platform ios --limit 1`, then
   `build:view <id> --json`. This is the first build to run the Sentry upload —
   if it fails, read the log before retrying.
3. **[owner, own Terminal]** `npx eas-cli submit --platform ios --latest`.
   Expect: generate an App Store Connect API key → Yes; create the App Store
   Connect app → name "Catch Up Column", English (U.S.). **The bundle ID locks
   on this upload.** Apple then processes the build (minutes to half an hour).
4. **[owner] Own phone, no review:** App Store Connect → the app → TestFlight →
   Internal Testing → new group, add yourself → install from the TestFlight app.
   Device checks: PRESUBMISSION Gate 5 (including the Keychain save prompt) and
   Gate 7 (including the eight #44 auth checks). Create Group A here once its
   settings are known (§3).
5. **[agent + owner] External testing:** the review account and demo Group (if
   not done in §1), then TestFlight → External Testing → new group → add the
   build → Test Information (from the §1 draft) → enable the public link →
   submit for review.
6. Apple's beta review → public link → each Group Zero yes gets the link and the
   invite code (ORGANIZER_PLAYBOOK step 4). Each sign-up sends a code email:
   Supabase's 100/hour limit was sized for a whole Group onboarding in one
   sitting, two Groups included (LAUNCH step 5); Resend's daily cap is the
   unknown (item 11).

**§3. Group Zero — settle before the link goes out**

7. **[owner] Answers still owed** (asked 2026-09-28, re-scoped 2026-09-29):
   - Group A: its name, and the publish day, time and time zone. No member
     emails are needed unless someone holds out (item 9).
   - Who organizes Group B — not the owner. They get ORGANIZER_PLAYBOOK.md and
     the public link.
   - The family Group: start by email now with `create-group` and `add-member`
     (the family installs later), or wait for the app? Overdue either way. The
     owner's own family counts.
   - Is anyone in Group A or B on Android? The build is iPhone-only.
8. **[owner] Recruit now, 1:1** (playbook step 1) — the asks don't wait for the
   link.
9. **[agent] Holdouts:** `add-member` anyone not in by edition 1 (else they get
   no email), `post-for` their texted entries in editions 1–2. Dry run first;
   ask before every `--apply`. Offer the owner to run these in their own
   terminal, keeping friends' emails out of the session.
10. **[owner] Decide bugs.md M1** before edition 1: accept no per-recipient
    email retry (recommended). A holdout has only the email, so check each
    Group Zero publish for failed recipients and forward by hand.
11. **[owner] Before edition 1:** the DMARC TXT at `_dmarc.catchupcolumn.com`
    (value in LAUNCH step 4), and in Resend: is the domain `verified`, what is
    the daily cap (auth and edition email share it, and a Sunday-09:00 edition
    burst plus onboarding can collide — LAUNCH step 5), is open/click tracking
    **off**?

**§4. Keep production honest**

12. **[agent → owner] Re-count cron timeouts.** Auto mode blocks
    `supabase db query --linked`, so hand the owner:
    `! npx supabase db query --linked "select status_code, timed_out, count(*) from net._http_response group by 1, 2 order by 3 desc"`
    (`net._http_response` keeps ~6 h). Expect no `timed_out = true`. If any,
    read that invocation in the dashboard before anything else.

**§5. Once Group Zero is on that build**

13. **[owner] Code expiry → 600 s** (LAUNCH step 5 item 5): Email OTP Expiration
    = 600, and paste the updated `magic-link.html` and `confirm-signup.html` in
    the same sitting (`sed -n '/<!doctype html>/,$p' <file> | pbcopy`).
    **[agent]** then deletes the PENDING notes in those two template headers,
    `reauthentication.html`, `hooks/use-email-code.ts`, and CLAUDE.md's Auth
    line.
14. **[owner] Remove `catchupcolumn://(auth)/reset-password`** from Redirect URLs
    (LAUNCH step 5 item 7).

**§6. Owner, any time — one at a time**

- Publish-day default: the app says Sunday 09:00, the playbook recommends Monday
  (minor; Decisions table).
- Lulu pricing calculator at a real trim size and page count.
- From the 2026-09-22 sign-up test, never recorded: the email's subject, sender,
  and inbox-vs-spam placement. Ask once.
- Optional: Xcode ≥ 26.4 for local builds.

**§7. Agent, when there's slack**

- Illustration support, if the owner wants it (the illustrator draws; these
  help them and the merge): stroke-scale tokens in
  `constants/`, a review screen showing all 8 assets + both loader variants +
  Reduce Motion, and a script that regenerates `icon.png` / `splash-icon.png`
  from `paperboy-mark` geometry. Scope and export contracts:
  `design/ILLUSTRATION_REWORK.md`.
- Not started, deliberately: an email-change flow (the address *is* the
  account; school addresses lapse), and passkeys once Supabase's leave
  experimental (POSITIONING §9).

**First move for the next session:** the owner opens it to fix the app — start
from their list, with §1's native-vs-JS rule in mind; skim Live state first.
Then §1's prep if there's time. §2 is tomorrow.

## Decisions the owner owes

| Decision | Needed by | Where |
| --- | --- | --- |
| Group A's name, publish day, time and time zone | Before creating it in the app (§2 item 4) | Workstream A |
| Who organizes Group B | Before recruiting it | POSITIONING §6 |
| The family Group: start by email now, or wait for the app? | Overdue | POSITIONING §5, §6 |
| Anyone in Group A or B on Android? | Before the link goes out | POSITIONING §6 |
| M1: accept no per-recipient email retry for Group Zero? | Before edition 1 | bugs.md M1 |
| Publish-day default: Sunday 09:00 in the app vs. Monday in the playbook (minor) | Any time | `app/group/create.tsx`, playbook |

Decided: 2026-10-03 — Sentry slugs as set; skip the simulator pass; build
2026-10-04. 2026-09-29 (#49) — the Group Zero re-plan (Live state).
2026-09-24/25 — reading measured by asking; bundle ID final; "shipping" means
the App Store, after the illustration rework; #44's password rules (the
bundled list because Supabase Free has no leaked-password check). Left until
after Group Zero: weekly vs biweekly, classifieds, volume size, whether
friend-group volumes sell (POSITIONING §9).

## How to verify without Docker

- **DB, read-only:** `npx supabase db query --linked "<SQL>"` — but auto mode
  blocks it against production, so hand the owner the `!` command. Its stdout
  starts with `Initialising login role...`, so don't pipe it into `jq`. Never
  run LAUNCH's Vault query 2 unless the cron's HTTP responses fail — it prints
  secrets.
- **Operator script / service-role calls:** derive the key inline so it's never
  printed or written:
  `SUPABASE_SERVICE_ROLE_KEY="$(npx supabase projects api-keys --project-ref wvaxfyhihcfilewygtzp -o json | jq -r '.[] | select(.name=="service_role") | .api_key')"`.
  Dry runs are free; every `--apply` is a production write — ask first.
- **Hashed secrets:** `supabase secrets list` digests are SHA-256 of the value;
  compare with `printf '%s' '<expected>' | shasum -a 256`.
- **What code production runs:** download-and-diff (LAUNCH → Deploying edge functions).
- **Cron:** `net._http_response` status codes, not `cron.job_run_details`.
- **EAS env:** `npx eas-cli env:list --environment production | sed -E 's/=.*/=<redacted>/'`.
  A plaintext value reads back with `env:get --variable-name … --variable-environment …`
  (output `NAME=value`); on a Secret it answers "cannot be displayed", which
  confirms the visibility. Mask the output anyway, in case a token was saved
  as plain text.
- **EAS builds:** `npx eas-cli build:list --platform ios --limit 3`,
  `build:view <id> --json`; install a simulator build with
  `npx eas-cli build:run -p ios --id <id>`; screenshot with
  `xcrun simctl io booted screenshot <file>`.
- **Site / DNS / AASA:** the curls in LAUNCH step 2 and PRESUBMISSION Gate 4;
  Apple's cached copy at
  `https://app-site-association.cdn-apple.com/a/v1/www.catchupcolumn.com`;
  `dig +short TXT _dmarc.catchupcolumn.com`.
- **Flows that touch auth/storage:** a throwaway account and before/after
  snapshots of the rows and storage objects involved. Clean up afterwards.
- Edge function logs: dashboard only (`supabase functions logs` doesn't exist in
  this CLI).

## Guardrails

- No Docker (owner preference). Everything above is Docker-free.
- **Subagents: no system installs without asking.** A 2026-09-24 subagent
  `brew install`ed CocoaPods (plus Ruby 4 and an openssl upgrade) unasked. Say so
  in every prompt that might need a toolchain.
- Branch → PR → CI green → the owner merges (or says to). Commit and PR
  attribution per the session's instructions.
- **Ask before any production change** — `secrets set`, `env:set`,
  `functions deploy`, `db push`, `eas update`, `--apply`, writes via SQL — and
  show the exact command. Read-only checks need no ask.
- Merging anything under `web/` publishes it (privacy, terms, AASA). Treat it
  as outward-facing.
- Record outcomes as they are: a simulator build doesn't tick PRESUBMISSION
  Gate 7 (device release build); say what wasn't checked.
- CLAUDE.md's Non-features are permanent — no engagement mechanics, ever.

## Traps already paid for

- **Expo patch drift fails CI on any PR**, docs-only included: "Expo config and
  native-module checks" (`expo-doctor`) goes red when Expo ships SDK patch
  releases. Fix in its own commit with `npx expo install --fix` (#36, #49).
  Native packages move the `fingerprint` runtime.
- **The Sentry slugs can't be checked from outside** — sentry.io answers the
  same for any slug. Only the owner's Settings page, or the build, proves them.
- **Read long docs in full, never as a summary.** The owner's `shunt` plugin
  blocks whole-file reads over its line limit (default 350) and points at
  `shunt:bulk-reader`, which returns a summary from an external service (and
  isn't signed in). The limit is raised to 5000 for this repo by
  `SHUNT_MIN_LINES` in `.claude/settings.local.json` (2026-10-03; local and
  gitignored). If a read is still blocked, read it with an offset/limit, in
  chunks — never delegate it.
- Three code templates: Magic Link (sign-in, and "Forgot your password?"),
  Confirm signup (sign-up), Reauthentication (confirm-it's-you before setting
  a password). A failed sign-up **creates the user**, so a re-test needs a fresh
  address. OTP length must stay 6 (`CODE_LENGTH`), and OTP expiry must match
  `CODE_EXPIRY_MINUTES`.
- **Every account stores a password hash** — of a random password nobody knows,
  for code sign-ups (GoTrue's `magic_link.go`) as much as for
  `auth.admin.createUser` with no password. `encrypted_password` is never
  empty, so don't test "no password" that way, and never build a "current
  password" check — a code-only person can't pass it (`setPassword` in
  `lib/auth.ts`).
- `storage.protect_delete` is statement-level; direct deletes from
  `storage.objects` need `set_config('storage.allow_delete_query','true',true)`
  (db-migrations skill) — and remove only the row; delete files through the
  Storage API to remove the object too. Deleting a Group by SQL also needs
  `app.deleting_group` (the last-moderator trigger).
- `errcode = 'PGRST301'` is invalid (8 chars) in old migrations; use `P0001`.
- `time + interval` wraps at midnight — never compare a local time of day against
  `publish_time + tolerance`; use timestamps.
- **Merging deploys nothing to Supabase**; a `_shared/` change needs every
  importer redeployed. CI never runs auth, email, or storage against the real project.
- `.env.local` never reaches an EAS build; `EXPO_PUBLIC_*` is inlined at build time.
- **SDK 57 needs Xcode ≥ 26.4** locally; EAS's `sdk-57` image is Xcode 26.6.
- The bundle ID locks on the first TestFlight upload, not at submission.
- External TestFlight needs Apple's review and a demo account the reviewer can
  sign in to — an emailed code won't reach them.
- `supabase functions download` writes every function into one `_shared/`
  folder — re-download the one you care about alone before diffing.
- Profile photo: the app shows the preview before **Save** uploads it. Weak
  evidence it confused anyone — watch it in Group Zero rather than fix it.
