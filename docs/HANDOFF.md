# Launch handoff — orchestration brief

**Rewritten 2026-09-25** (first written 2026-09-24). A living brief for whichever
session is orchestrating the launch. It holds what the lists don't: current live
state, the dependency order, who does what, and how to verify. **Rewrite it at
the end of every orchestration session** (state, dates, first moves). Delete it
at launch.

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

## Live state (verified 2026-09-25 — re-check before relying on it)

**Working:**
- **Server:** v2 edition email live (functions from `main`, 2026-09-24); cron 200s
  every 15 min; 30 migrations applied; `WEB_BASE_URL` = `www`; `EMAIL_FROM`
  correct; Vercel in sync with `main`.
- **CI green** on every check again (Expo patch bump, #36).
- **EAS env** (`production` + `preview`): Supabase vars and
  `EXPO_PUBLIC_SENTRY_DSN` (set 2026-09-24, read back).
- **Universal links, server + config half:** the AASA serves
  `6RDS3S724Z.com.catchupcolumn.app` (200, `application/json`, and Apple's CDN
  already has it); `app.json` declares `applinks:www.catchupcolumn.com`. Bundle ID
  `com.catchupcolumn.app` confirmed final. Reaches phones with the first device
  build.
- **First EAS build** (2026-09-24, `preview`, simulator, build `cf9f70ee`): SDK 57
  builds and launches — splash hides, fonts load, sign-in renders, clean logs.
  Installed on the owner's simulator (iPhone 17 Pro).
- **Group Zero tooling on `main`:** the operator script (verified end to end
  against production 2026-09-25 with a throwaway Group, cleaned up — PR #40's
  comment) and the readout queries.
- Code sign-in, sign-up, moderator removal, account deletion verified against
  production 2026-09-22 (dev build).

**Wrong or open right now:**
- **A Group with a publish time ≥ 23:40 never auto-publishes** (`time + interval`
  wraps at midnight in `compile_due_editions`; the picker offers 11:45 PM). Fix in
  flight on branch `fix-late-publish-slot`; it needs the owner's OK to
  `db push`. Until it's live, `create-group` refuses ≥ 23:40 and `readout.sql`
  q0 flags such a Group — relax both *after* the push is verified.
- **Every production EAS build fails at the Sentry step** until `SENTRY_ORG`,
  `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` exist (LAUNCH 10.4). Deliberate:
  `preview` skips the upload, `production` doesn't.
- Nothing behind sign-in has been checked on a release build (owner's simulator
  pass pending). Nothing has run on a phone as a signed binary.
- No DMARC record. Resend domain status unconfirmed.
- The owner's Mac has Xcode 26.3; **local** SDK 57 builds need ≥ 26.4. EAS is
  unaffected, so this blocks nothing.

**Not started:** Group Zero. Production has 2 test Groups, 3 users. Recruiting as
of 2026-09-25: the owner has a friend group they're part of (Group A) and "can
enlist another group easily" — **who organizes it is unconfirmed** (it must not be
the owner). **No family Group yet.**

## Dates that bind

| When | What | Why it's fixed |
| --- | --- | --- |
| **~2026-09-30** | 2–3 family Groups publishing | A family recruited later has too little to print for December (POSITIONING §5) |
| **Early October** | First production build uploaded + external TestFlight submitted for review | Apple's TestFlight App Review has lead time, and Group Zero week 3 (~mid-Oct) needs installs |
| Late November | The December test (hand-made volumes, Lulu by hand, Stripe link) | Q4 is 40–60% of gift revenue |
| Before App Store submission | Illustration rework landed (commissioned illustrator) | Owner, 2026-09-25: no store release with the current drawings |

## The dependency chain into TestFlight

```
owner: Sentry auth token (+ org/project slugs) ─→ EAS env (token via dashboard, Secret)
                                                   │
owner at keyboard (Apple sign-in) ─────────────────┼─→ eas build --profile production
                                                   │     (creates cert + APNs key)
                                                   ├─→ eas submit → App Store Connect record,
                                                   │     bundle ID locks (already confirmed)
agent: review account WITH a password + a demo  ───┼─→ External group + Test Information
  Group with a published edition                   │     (Beta App Description required)
                                                   └─→ TestFlight App Review → public link
                                                         → Group Zero installs (week 3)
```

The illustration rework is **not** on this chain: the SVGs reach an installed
build by OTA (`fingerprint` runtime policy); the icon/splash change needs one more
build, which is cheap by then.

## Workstreams

**A. Group Zero — owner-led, tools ready.** Per Group: `create-group` (Group B:
organizer as moderator — decided 2026-09-24), `add-member` for each person,
`post-for` for entries sent by text in editions 1–2, `readout.sql` for results.
Reading is measured by asking each member at week 4 (decided 2026-09-24; open
tracking stays off). The owner may prefer to run the commands in their own
terminal to keep friends' emails out of the session — offer it.

**B. Production correctness — agent, owner approves each prod change.** Next: the
late-slot migration push (plan in its PR). Redeploy functions after **every**
future function change; verify by download-and-diff (LAUNCH → Deploying edge
functions).

**C. Dev work:**
1. **Late-slot fix** — PR from `fix-late-publish-slot`; review it hard (it
   redefines the compile and manual-publish functions), then the owner approves
   `db push`, then verify with `pg_get_functiondef` and the next cron tick.
2. **After (1) is live:** drop the ≥ 23:40 refusal from `scripts/group-zero/`
   (`neverAutoPublishes` in `schedule.ts`, its uses in `create-group` and the
   Group summaries) and the "SLOT NEVER FIRES" flag in `readout.sql` q0.
3. **TestFlight review account** — a password account (the operator script
   creates only code accounts; use `auth.admin.createUser` with a password, or
   the dashboard), plus a demo Group with a published edition so every screen
   has content. Not a real person's account. LAUNCH step 8.
4. **Illustration support, if the owner wants it** (the illustrator draws; these
   help them and the merge): stroke-scale tokens in `constants/`, a review
   screen showing all 8 assets + both loader variants + Reduce Motion, and a
   script that regenerates `icon.png` / `splash-icon.png` from `paperboy-mark`
   geometry. Scope and export contracts: `design/ILLUSTRATION_REWORK.md`.
5. **bugs.md L3** — lower priority now: the operator script pre-creates every
   Group Zero account with its profile.
6. **bugs.md M1** — a decision, not a fix (recommended: accept for Group Zero).

**D. Owner-only — hand these over one at a time:**
- Recruiting — the deadline item. Protect the owner's time for it: a family Group
  this week (their own counts), and a named Group B organizer.
- Sign in on the simulator build and check: the tab bar, Editions → an edition →
  a story, the compose sheet (open and close, **don't post** — it's production),
  and the loading animation.
- Sentry: create an auth token (*Settings → Auth Tokens*, `project:releases`),
  put it in the expo.dev dashboard as a Secret; tell the agent the org and
  project slugs.
- The production build session (Apple sign-in at the keyboard).
- DMARC TXT at `_dmarc.catchupcolumn.com` (value in LAUNCH step 4).
- Resend dashboard: domain `verified`? plan's daily cap? Open/click tracking
  **off** (the decision above depends on it)?
- Supabase dashboard reads: minimum password length (LAUNCH and bugs.md
  disagree), per-address email interval.
- Lulu pricing calculator at a real trim size and page count.
- Not recorded from the 2026-09-22 sign-up test: the email's subject, sender,
  and inbox-vs-spam placement. Ask once.
- Optional: update Xcode to ≥ 26.4 for local builds.

**E. Gated — do not start** (POSITIONING §8): the nudge, thin-edition design,
write-by-web, store screenshots, App Store submission (after Group Zero **and**
the illustration rework), the house ad (after the December test), the print
renderer / Lulu API.

## Decisions the owner owes

| Decision | Needed by | Where |
| --- | --- | --- |
| Who organizes Group B | Before recruiting it | POSITIONING §6 |
| Publish-day default: app says Sunday 09:00, the playbook recommends Monday (minor) | Any time | `app/group/create.tsx`, playbook |
| M1: accept no per-recipient email retry for Group Zero? | Before edition 1 | bugs.md M1 |

Decided this session (2026-09-24/25): reading measured by asking at week 4;
Group B set up by the owner with the organizer as moderator; bundle ID final;
"shipping" means the App Store, and it waits for the commissioned illustration
rework. Still open, deliberately left until after Group Zero: passwords for
code-only accounts, weekly vs biweekly, classifieds, volume size and whether
friend-group volumes sell (POSITIONING §9).

## How to verify without Docker

- **DB, read-only:** `npx supabase db query --linked "<SQL>"`. Its stdout starts
  with `Initialising login role...`, so don't pipe it into `jq`; grep/sed the
  rows. Never run LAUNCH's Vault query 2 unless the cron's HTTP responses fail —
  it prints secrets.
- **Operator script / service-role calls:** derive the key inline so it's never
  printed or written:
  `SUPABASE_SERVICE_ROLE_KEY="$(npx supabase projects api-keys --project-ref wvaxfyhihcfilewygtzp -o json | jq -r '.[] | select(.name=="service_role") | .api_key')"`.
  Dry runs are free; every `--apply` is a production write — ask first.
- **Hashed secrets:** `supabase secrets list` digests are SHA-256 of the value;
  compare with `printf '%s' '<expected>' | shasum -a 256`.
- **What code production runs:** download-and-diff (LAUNCH → Deploying edge functions).
- **Cron:** `net._http_response` status codes, not `cron.job_run_details`.
- **EAS env:** `npx eas-cli env:list --environment production` (pipe through
  `sed -E 's/=.*/=<redacted>/'`); a plaintext value reads back with
  `env:get --variable-name … --variable-environment …`.
- **EAS builds:** `npx eas-cli build:view <id> --json`; install a simulator build
  with `npx eas-cli build:run -p ios --id <id>`; screenshot with
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
  `functions deploy`, `db push`, `--apply`, writes via SQL — and show the exact
  command. Read-only checks need no ask.
- Merging anything under `web/` publishes it (privacy, terms, AASA). Treat it
  as outward-facing.
- Record outcomes as they are: a simulator build doesn't tick PRESUBMISSION
  Gate 7 (device release build); say what wasn't checked.
- CLAUDE.md's Non-features are permanent — no engagement mechanics, ever.

## Traps already paid for

- Two auth templates: Magic Link (sign-in), Confirm signup (sign-up). A failed
  sign-up **creates the user**, so a re-test needs a fresh address. OTP length
  must stay 6 (`CODE_LENGTH`).
- **`auth.admin.createUser` with no password still stores a password hash** — of a
  random password nobody knows. Script-made accounts are code-only in practice;
  `encrypted_password` is never empty, so don't test "no password" that way.
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

## First moves for the next session

1. Re-verify the live-state block (five minutes, all read-only). Anything that
   changed, update here.
2. The late-slot fix: if its PR is open, review it; once merged, get the owner's
   OK for `db push` per the PR's plan, verify, then do C2.
3. Recruiting at the top of the check-in until ~09-30: a family Group, the
   Group B organizer's name, Group A's member list.
4. Get the Sentry token set, then schedule the production-build session with the
   owner; prepare the review account (C3) before it.
5. Ask for the simulator sign-in results if they haven't come in.
