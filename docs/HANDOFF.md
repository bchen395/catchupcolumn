# Launch handoff — orchestration brief

**Rewritten 2026-09-28** (first written 2026-09-24). A living brief for whichever
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

## Live state (verified 2026-09-25 and 2026-09-28 — re-check before relying on it)

**Working:**
- **Server:** v2 edition email live; cron firing every 15 min; **32 migrations
  applied**, all matching `main`:
  - the late-slot fix (`20260925212248`, bugs.md H1, pushed 2026-09-25) — slots
    at 23:40 or later publish;
  - compile robustness (`20260928155710`, H2 + H3, pushed 2026-09-28 16:45 UTC) —
    pg_net waits 150 s instead of 5 s; one invalid Group timezone is skipped and
    reported instead of failing every Group; a trigger rejects unknown zones on
    write;
  - `compile-editions` **v19** (2026-09-28): a 30-minute compile window, so every
    slot gets two ticks. Download-and-diff clean.
  `WEB_BASE_URL` = `www`; `EMAIL_FROM` correct; Vercel in sync with `main`.
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
- **Auth hardening on `main`** (#44, merged 2026-09-28): optional password from
  Profile, "Forgot your password?" as a code sign-in, 8-character minimum plus a
  bundled common-password list, sign-out on this device only, 10-minute code
  copy. Dashboard half done 2026-09-28 (LAUNCH step 5 → "Passwords and code
  lifetime", items 1–4: min length 8, secure password change, the
  Reauthentication template, password- and email-changed notices). The AASA
  serves `webcredentials` (200, read back 2026-09-28).
- **Docs match production** after #46 (cron-robustness record) and #47 (what
  #44 left for the next build). #47 also updated the public privacy policy —
  live at `/privacy`, "Last updated September 28, 2026" (read back 2026-09-28).

**Wrong or open right now:**
- **Confirm the timeout fix held:** before 2026-09-28 16:45 UTC about 1 in 4
  ticks timed out at 5 s. Since the fix, **3 of 3 ticks returned `200`, none
  timed out** (16:45, 17:00, 17:15 UTC) — too small a sample to close. Re-count
  `timed_out` in `net._http_response` once several hours have passed (it keeps
  ~6 h); expect 0. Whether the old timed-out runs finished server-side was never
  read from the dashboard — moot now, unless timeouts continue.
- **Every production EAS build fails at the Sentry step** until `SENTRY_ORG`,
  `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` exist (LAUNCH 10.4). Deliberate:
  `preview` skips the upload, `production` doesn't.
- Nothing behind sign-in has been checked on a release build (owner's simulator
  pass pending). Nothing has run on a phone as a signed binary.
- **#44's app half is on no build yet.** It changes `app.json`
  (`webcredentials`), which moves the `fingerprint` runtime version, so it can't
  reach the 2026-09-24 simulator build by OTA — that build still has the old
  reset-link flow. The first production build carries it; its auth checks are
  PRESUBMISSION Gate 5 (Keychain prompt) and Gate 7.
- **Two auth dashboard steps wait for that build to be what people run**
  (LAUNCH step 5 items 5 and 7): OTP expiry 3600 → 600 with the updated
  `magic-link.html` / `confirm-signup.html` pasted in the same sitting, then
  removing the `reset-password` redirect URL. Until then codes really last an
  hour while the new copy says 10 minutes — the harmless direction.
- No DMARC record. Resend domain status unconfirmed.
- The owner's Mac has Xcode 26.3; **local** SDK 57 builds need ≥ 26.4. EAS is
  unaffected, so this blocks nothing.

**Not started:** Group Zero. Production has 2 test Groups, 3 users. Recruiting as
of 2026-09-25: the owner has a friend group they're part of (Group A) and "can
enlist another group easily" — **who organizes it is unconfirmed** (it must not be
the owner). **No family Group yet.** As of 2026-09-28 nothing has moved: Group A's
member list, the Group B organizer, and whether a family Group can start this
week are all still owed (Next steps §1).

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
  Group with a published edition (on the new      │     (Beta App Description required)
  build: code sign-in → Profile → Set a password)  └─→ TestFlight App Review → public link
                                                         → Group Zero installs (week 3)
                                                         → LAUNCH step 5 items 5 + 7
                                                           (OTP expiry, redirect URL)
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

**B. Production correctness — agent, owner approves each prod change.** Nothing
is pending to push or deploy: the late-slot fix (#42) and cron robustness (#45)
are both live and verified. What's left is watching — the cron re-count in Next
steps §2. Redeploy functions after **every** future function change; verify by
download-and-diff (LAUNCH → Deploying edge functions).

**C, D** (dev work, owner-only steps) are folded into **Next steps** below, in
order, as of 2026-09-28.

**E. Gated — do not start** (POSITIONING §8): the nudge, thin-edition design,
write-by-web, store screenshots, App Store submission (after Group Zero **and**
the illustration rework), the house ad (after the December test), the print
renderer / Lulu API.

## Next steps — consolidated 2026-09-28

Everything open, in the order it binds. **[owner]** = only the owner can do it —
hand these over one at a time with exact clicks or commands. **[agent]** = the
session does it. Each item says where its detail lives; record outcomes there,
dated, then update this file.

**§1. This week — the family-Group deadline (~2026-09-30)**

1. **[owner] Three answers, so the operator script can set up Groups** (asked
   2026-09-28, not yet answered):
   - Group A's member list (names and emails). Offer to have the owner run
     `add-member` in their own terminal, keeping friends' emails out of the
     session.
   - Who organizes Group B — not the owner.
   - Whether a family Group can start this week — the owner's own family counts.
2. **[agent]** With those answers: `create-group`, `add-member`, and `post-for`
   per Workstream A. Dry run first; ask before every `--apply`.
3. **[owner] Decide bugs.md M1** before edition 1: accept no per-recipient email
   retry for Group Zero (recommended).

**§2. Keep production honest**

4. **[agent] Re-count cron timeouts** since 2026-09-28 16:45 UTC — 3 of 3 clean
   at last look (Live state). Expect 0. If any remain, read that invocation in
   the dashboard before anything else.

**§3. The production build → TestFlight (early October)** — the chain above

5. **[owner] Sentry auth token** (*Settings → Auth Tokens*, `project:releases`)
   into the expo.dev dashboard as a Secret, plus the org and project slugs;
   **[agent]** then sets `SENTRY_ORG` / `SENTRY_PROJECT` (LAUNCH 10.4). Until
   then every production build fails at the Sentry step.
6. **[owner] Simulator sign-in pass** on build `cf9f70ee`: the tab bar, Editions
   → an edition → a story, the compose sheet (open and close — **don't post**,
   it's production), the loading animation. It predates #44, so it shows the old
   reset-link flow; that's expected.
7. **[owner at the keyboard, agent driving] Production build session:**
   `npx eas-cli build --platform ios --profile production` (Apple sign-in;
   creates the cert and the APNs key), then `npx eas-cli submit --platform ios
   --latest`. The bundle ID locks on this upload. The build carries #44, the UTC
   fallback from #45, and the `webcredentials` entitlement. LAUNCH step 8.
8. **[agent] Review account on that build:** code sign-in → Profile → *Set a
   password* (8+ characters, not a common one), plus a demo Group with a
   published edition so every screen has content. Not a real person's account.
   Then the external group, the Beta App Description, and the sign-in details
   under Test Information. LAUNCH step 8.
9. **[owner] Device checks on the signed build:** PRESUBMISSION Gate 5 (including
   the Keychain save prompt) and Gate 7 (including the eight #44 auth checks).
10. TestFlight App Review → public link → Group Zero installs (week 3,
    ~mid-October).

**§4. Once Group Zero is on that build**

11. **[owner] Code expiry → 600 s** (LAUNCH step 5 item 5): Email OTP Expiration
    = 600, and paste the updated `magic-link.html` and `confirm-signup.html` in
    the same sitting (`sed -n '/<!doctype html>/,$p' <file> | pbcopy`).
    **[agent]** then deletes the PENDING notes in those two template headers,
    `reauthentication.html`, `hooks/use-email-code.ts`, and CLAUDE.md's Auth
    line.
12. **[owner] Remove `catchupcolumn://(auth)/reset-password`** from Redirect URLs
    (LAUNCH step 5 item 7).

**§5. Owner, any time — one at a time**

- DMARC TXT at `_dmarc.catchupcolumn.com` (value in LAUNCH step 4).
- Resend dashboard: is the domain `verified`? What's the plan's daily cap — auth
  and edition email share it, and a Sunday-09:00 burst plus onboarding can
  collide (LAUNCH step 5)? Is open/click tracking **off**?
- Publish-day default: the app says Sunday 09:00, the playbook recommends Monday
  (minor; Decisions table).
- Lulu pricing calculator at a real trim size and page count.
- From the 2026-09-22 sign-up test, never recorded: the email's subject, sender,
  and inbox-vs-spam placement. Ask once.
- Optional: Xcode ≥ 26.4 for local builds.

**§6. Agent, when there's slack**

- Illustration support, if the owner wants it (the illustrator draws; these help
  them and the merge): stroke-scale tokens in `constants/`, a review screen
  showing all 8 assets + both loader variants + Reduce Motion, and a script that
  regenerates `icon.png` / `splash-icon.png` from `paperboy-mark` geometry.
  Scope and export contracts: `design/ILLUSTRATION_REWORK.md`.
- bugs.md L3 — low priority: the operator script pre-creates every Group Zero
  account with its profile.
- Not started, deliberately: an email-change flow (the address *is* the account;
  school addresses lapse), and passkeys once Supabase's leave experimental
  (POSITIONING §9).

**First move for the next session:** re-verify the Live-state block (five
minutes, read-only), then §1 — the three answers — before anything else.

## Decisions the owner owes

| Decision | Needed by | Where |
| --- | --- | --- |
| Group A's member list | ~2026-09-30 (to set the Group up with the script) | Workstream A |
| Who organizes Group B | Before recruiting it | POSITIONING §6 |
| Can a family Group start this week? | ~2026-09-30 | POSITIONING §5 |
| Publish-day default: app says Sunday 09:00, the playbook recommends Monday (minor) | Any time | `app/group/create.tsx`, playbook |
| M1: accept no per-recipient email retry for Group Zero? | Before edition 1 | bugs.md M1 |

Decided this session (2026-09-24/25): reading measured by asking at week 4;
Group B set up by the owner with the organizer as moderator; bundle ID final;
"shipping" means the App Store, and it waits for the commissioned illustration
rework. Decided 2026-09-25 (#44), ahead of Group Zero: code-only accounts can
set an optional password from Profile (POSITIONING §9); the numbers — 8
characters, a bundled common-password list (Supabase Free has no leaked-password
check), 10-minute codes — on 2026-09-25/28. Still open,
deliberately left until after Group Zero: weekly vs biweekly, classifieds,
volume size and whether friend-group volumes sell (POSITIONING §9).

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

- Three code templates: Magic Link (sign-in, and "Forgot your password?"),
  Confirm signup (sign-up), Reauthentication (confirm-it's-you before setting
  a password). A failed sign-up **creates the user**, so a re-test needs a fresh
  address. OTP length must stay 6 (`CODE_LENGTH`), and OTP expiry must match
  `CODE_EXPIRY_MINUTES`.
- **Every account stores a password hash** — of a random password nobody knows,
  for code sign-ups (GoTrue's `magic_link.go`) as much as for
  `auth.admin.createUser` with no password. `encrypted_password` is never empty,
  so don't test "no password" that way, and never build a "current password"
  check — a code-only person can't pass it (`setPassword` in `lib/auth.ts`).
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
