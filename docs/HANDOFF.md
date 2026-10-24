# Launch handoff — orchestration brief

**Rewritten 2026-10-03, evening** (first written 2026-09-24). A living brief for
whichever session is orchestrating the launch. It holds what the lists don't:
current live state, the dependency order, who does what, and how to verify.
**Rewrite it at the end of every orchestration session** (state, dates, first
moves). Delete it at launch.

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
| Multi-photo posts: decisions, contract, shipping order, test lane | `design/MULTI_PHOTO_POSTS.md` |
| Illustration commission: spec, contracts, round 1/2 | `design/ILLUSTRATION_REWORK.md` |
| The artist-facing brief (a shareable doc) | <https://claude.ai/code/artifact/c729acda-f9d2-4fd5-a929-04382415acaa> |
| TestFlight Test Information, ready to paste | `docs/STORE_LISTING.md` §12 |
| How to work on each surface | `.claude/skills/*` (auto-load) |

When something gets done, record it **there**, dated — then update this file.

---

## Your role

Run the rest of the launch with the owner. Keep the critical path moving; do the
dev work in parallel worktree subagents that open PRs (decided 2026-10-03) and
review each against the plan; hand the owner the owner-only steps **one at a
time, with exact clicks/commands**; verify every claim against production
(read-only) before recording it. The owner merges PRs — or tells you to, per PR.

## Live state — re-check before relying on it

Server rows verified 2026-09-25/28; EAS, CI and the merges verified 2026-10-03.

**Working:**
- **Server:** v2 edition email live; cron every 15 min; **32 of the repo's 33
  migrations applied** — `20261003154759_multi_photo_posts.sql` (merged in #55)
  is **not pushed**. `compile-editions` **v19** (2026-09-28) is live, but
  `main`'s `_shared/` has moved on (#55: emails render `blocks`, photo-folder
  re-check before signing) — **not deployed**. Both are §2 below.
  `WEB_BASE_URL` = `www`; `EMAIL_FROM` correct; Vercel in sync with `main`.
- **Merged 2026-10-03 (owner-approved), all in tomorrow's build:**
  - **#54** — one shared `BackButton` (48pt, centered — on iOS 26 the system's
    glass circle centers on the header view's frame, so the old margins showed
    as an off-center arrow); skeletons for invite-link arrival and the compose
    sheet; bugs.md **L3 fixed** (retry screen when a new account's profile
    can't be created).
  - **#55** — the multi-photo **data layer**: `posts.blocks`, the block
    helpers (`lib/post-blocks.ts`), photo upload with a ~1280px display copy
    beside each 2600px print master, the email rendering blocks, `AppImage`
    cache keys by storage path, repeatable `post-for --photo`. Backward
    compatible: the current composer never writes `blocks`.
  - **#53** — the illustration commission decisions (BRAND §1/§4/§11,
    `design/ILLUSTRATION_REWORK.md`). **#51** — TestFlight Test Information.
- **Open and gated — do not merge before the 2026-10-08 go:** **#52**
  (reading surfaces) and **#56** (the block composer + the July redesign).
  Merge order on go: #52, then #56 (rebase first — a docs-only conflict in
  `.claude/skills/frontend-design/SKILL.md`). Both CI-green.
- **CI green** on `main` after the merges (2026-10-03).
- **EAS env** (`production` + `preview`, read back 2026-10-03): the Supabase
  vars, `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (Secret),
  `SENTRY_ORG=catch-up-column`, `SENTRY_PROJECT=catchupcolumn`. The first
  production build proves them (LAUNCH 10.4).
- **EAS profiles:** `production` (channel `production`) and — new, in the PR
  with this rewrite — `staging`: extends production, channel `staging`,
  production env vars (resolved with `eas-cli config`, 2026-10-03). It exists
  so gated JS reaches **only the owner's phone** (§1, §3).
- **Pre-flight for the production build:** `app.json` bundle ID
  `com.catchupcolumn.app` (final), `ITSAppUsesNonExemptEncryption: false`,
  `applinks:` + `webcredentials:` for `www`; remote build numbers +
  `autoIncrement`; EAS login `bchen395`. The app icon is fully opaque (checked
  2026-10-03; Expo flattens iOS icons anyway).
- **Universal links, server half:** AASA serves
  `6RDS3S724Z.com.catchupcolumn.app` (`applinks` + `webcredentials`).
- **Auth on `main`** (#44): code sign-in, optional password, 8+ chars.
  Dashboard items 1–4 done 2026-09-28 (LAUNCH step 5).

**Wrong or open right now:**
- **`support@catchupcolumn.com` can't receive mail — no MX record** on the apex
  (verified with `dig`, 2026-10-03). It's where *Report this story* sends
  (`lib/report.ts`, the Guideline 1.2 report path), the privacy policy's
  deletion route, the support page, the TestFlight feedback address and the
  DMARC `rua`. Owner fix: Cloudflare Email Routing (§1, first item). No apex
  TXT exists, so Cloudflare's SPF won't clash with Resend (`send.` subdomain).
- **No production build yet.** Nothing has run on a phone as a signed binary.
- **#44's app half is on no build yet** (fingerprint moved). Checks:
  PRESUBMISSION Gates 5 and 7.
- **Two auth dashboard steps wait** until Group Zero runs that build (§6).
  Until then codes last an hour while the copy says 10 minutes — harmless.
- **Cron timeout re-count never done** (§5).
- No DMARC record. Resend domain status unconfirmed. Both before edition 1.
- **The first-ever OTA hasn't run.** The first `staging` update is the
  rehearsal; the first `production` one is the go.
- Local Xcode 26.3 can't build SDK 57 (needs ≥ 26.4). EAS is unaffected.

**Group Zero: not started.** Production has 2 test Groups, 3 users. Runs on the
app from edition 1 via a TestFlight public link (2026-09-29). **Edition 1 is
the week of 2026-10-11** (owner, 2026-10-03), so Group A's publish day falls
that week. Still owed: Group A's settings, the Group B organizer, the family
Group, Android (§4).

## What the 2026-10-03 session decided

The owner's asks: replace the illustrations with a commissioned artist's work;
a UI pass; loaders; multi-photo posts with a sensible limit; less HeyTea. All
decided by the owner, recommended options unless noted:

| Area | Decision |
| --- | --- |
| Timing | Build 10-04 as planned. Multi-photo ships **before edition 1, else after edition 4 — never mid-run** (the write-by-web call compares editions 1–2 with 3–4). **Go/no-go Wed 10-08**, verified on the owner's phone |
| Post shape | **One writing area**, photos inserted at the cursor, no text tied to a photo — like Substack/Docs (owner's own words). Plain text only |
| Editor | Native blocks (pure JS, OTA-able) — not a WebView editor |
| Photo limit | **4 per post**, enforced in the DB; display copies + path-keyed cache for egress (Free plan: 1 GB storage, 5 GB egress) |
| Composer | Rewritten once with the July redesign folded in (`COMPOSER_REDESIGN.md` → BRAND §9 in #56) |
| Loaders | Invite-link arrival and compose sheet → skeletons; rider stays for cold boot + auto-join; press stays for publish-now |
| UI pass | The owner walks the **phone build**, reports in a `/qa` session that files issues; agents fix; ship by OTA |
| Illustrations | A commissioned artist; style in our own terms, **HeyTea only as a "don't"**; vector SVG + sources; **line weight is the artist's call** (sketch round); round 1 = redraw the set + the **press pass** (replaces the invite ticket) + icon; round 2 after Group Zero. Rights, fee and dates **out of the brief** — the owner negotiates |
| HeyTea elsewhere | Nothing else changes (stamps, small caps, raised "+" stay) |
| Test lane | A `staging` build for the owner only; gated JS by `eas update --channel staging` |
| Edition 1 | Week of 10-11 (the owner chose this over the recommended 10-18) |
| Orchestration | Worktree subagents → PRs → orchestrator review → owner merges |

## Dates that bind

| When | What | Why it's fixed |
| --- | --- | --- |
| **2026-10-04** | Production build + **staging build**, both submitted; owner's phone via internal testing; external TestFlight submitted for review | Edition 1 needs installs; Apple's beta review is the wait |
| **2026-10-05/06** | `db push` + function deploys (§2); first `staging` OTA with #52 + #56 (§3) | The composer test needs the migration; the go needs test days |
| **Wed 2026-10-08** | **Multi-photo go/no-go** on the owner's phone | Edition 1's week starts 10-11 |
| **Week of 2026-10-11** | Group Zero edition 1 | Owner's call, 2026-10-03 |
| **Before the external link goes out** | `support@` receives mail (Cloudflare Email Routing) | The report path and the review contact must work |
| Overdue | A family Group publishing | Each week later is one fewer edition in a December volume (POSITIONING §5) |
| ~2026-10-17 / ~11-07 | Artist sketches / finals (proposed in the brief; owner confirms with the artist) | Art must land before App Store submission |
| Late November | The December test (hand-made volumes, Lulu by hand, Stripe link) | Q4 is 40–60% of gift revenue |

## Workstreams

- **A. Group Zero — owner-led** (§4; POSITIONING §6). `readout.sql` for results.
- **B. Production correctness — agent, the owner approves each prod change**
  (§2, §5). Redeploy functions after **every** function change; verify by
  download-and-diff.
- **C. Build, multi-photo, UI pass** (§1, §3, §7).
- **D. Illustration commission — owner + artist**; agents integrate the art
  when it lands (§8).
- **E. Gated — do not start** (POSITIONING §8): the nudge, thin-edition design,
  write-by-web, store screenshots, App Store submission (after Group Zero
  **and** the illustration rework), the house ad, the print renderer / Lulu API.

## Next steps — rewritten 2026-10-03 evening

**[owner]** = only the owner can do it — one at a time, exact clicks or
commands. **[agent]** = the session does it.

**§1. Build day (2026-10-04)** (LAUNCH step 8)

0. **[owner] First, if not done tonight: Cloudflare Email Routing** for
   `support@`. dash.cloudflare.com → catchupcolumn.com → **Email** → **Email
   Routing** → Get started/Enable → **Add records and enable** → **Routing
   rules** → Create address `support` → Send to an email → the inbox the owner
   reads → click Cloudflare's verification email → send a test from another
   account. **[agent]** then `dig +short MX catchupcolumn.com` (expect
   `route1/2/3.mx.cloudflare.net`). Same sitting, optional: the DMARC TXT
   (`_dmarc` = `v=DMARC1; p=none; rua=mailto:support@catchupcolumn.com`).
1. **[owner, own Terminal]** — interactive, not via `!`, from an up-to-date
   `main`: `npx eas-cli build --platform ios --profile production --no-wait`.
   Yes to Apple login (Apple ID, password, 2FA), distribution certificate,
   provisioning profile, **push key (APNs)**. Team ID `6RDS3S724Z`. Agreement
   prompt → accept at developer.apple.com → Account, re-run.
2. **[owner, own Terminal]** right after:
   `npx eas-cli build --platform ios --profile staging --no-wait` (credentials
   are reused; the build number auto-increments).
3. **[agent] Watch both:** `npx eas-cli build:list --platform ios --limit 2`,
   then `build:view <id> --json`. First Sentry upload — read the log before
   any retry.
4. **[owner]** `npx eas-cli submit --platform ios --id <production build id>`
   (App Store Connect API key → Yes; create the app → "Catch Up Column",
   English (U.S.); **the bundle ID locks here**), then the same with the
   staging build's id.
5. **[owner] Own phone:** App Store Connect → TestFlight → Internal Testing →
   new group, add yourself → add **both** builds → install the **staging**
   one (the higher build number, so TestFlight's default). It gets `staging`
   OTAs, not `production` ones. TestFlight → the app → *Previous Builds*
   switches the phone to the production build and back whenever a check needs
   what Group Zero runs. The production build also goes to the external group
   (item 7).
   Device checks: PRESUBMISSION Gate 5 (incl. the Keychain prompt) and Gate 7
   (incl. the eight #44 auth checks). Create Group A here once its settings
   are known (§4).
6. **[agent + owner]** The review account (code sign-in → Profile → Set a
   password) **and a second member** who joins the demo Group and writes —
   *Report* and *Remove* only show on other people's stories (STORE_LISTING
   §12.4). Production writes — ask first.
7. **[owner] External testing:** new group → the **production** build → Test
   Information from STORE_LISTING §12 (fill its placeholders: review contact,
   account, demo Group name) → public link → submit for review.
8. Apple's beta review → public link → each Group Zero yes gets the link and
   the invite code (ORGANIZER_PLAYBOOK step 4). Supabase's auth email limit is
   100/hour; Resend's daily cap is unknown (§4 item 13).

**§2. Monday 2026-10-05 — ship the data layer's server half** (each a
production change; show the exact command; one approval each)

9. **[agent → owner]** `npx supabase db push --dry-run` — expect only
   `20261003154759_multi_photo_posts.sql` — then `npx supabase db push`, then
   confirm `posts_blocks_valid` exists (hand the owner the `!` query; auto mode
   blocks `db query --linked`).
10. **[agent → owner]** Just after a cron tick:
    `npx supabase functions deploy compile-editions --use-api` and
    `... publish-edition-now --use-api`; verify each by download-and-diff
    (LAUNCH → Deploying edge functions). #55's PR body has the detail.

**§3. Multi-photo test lane and the go** (`design/MULTI_PHOTO_POSTS.md`)

11. **[agent]** After §2: a throwaway branch = `main` + #52 + #56 (rebase #56;
    resolve the skill-doc conflict), typecheck, then **ask** and run
    `npx eas-cli update --channel staging --message "multi-photo test"`.
    Only the owner's staging build receives it (two cold launches to apply).
12. **[owner]** Test on the phone with #56's device script and #52's checklist
    — the biggest risk is iOS backspace at the start of an empty field
    (tap → *Remove photo* is the fallback). Fixes go into the PRs, then
    another `staging` update.
13. **[owner] Go/no-go by Wed 10-08.** Go → **[agent]** merge #52 then #56,
    CI green, then ask and run
    `npx eas-cli update --channel production --message "…"` (the first
    production OTA — confirm it by switching the owner's phone to the
    production build via *Previous Builds*). No-go → both wait
    until after edition 4; nothing multi-photo goes to `production`.

**§4. Group Zero — settle before the link goes out**

14. **[owner] Answers still owed:** Group A's name, publish day (in the week
    of 10-11), time and zone; who organizes Group B (not the owner); the
    family Group (start by email with `create-group` now, or wait for the
    app?); anyone on Android? (the build is iPhone-only).
15. **[owner] Recruit now, 1:1** (playbook step 1).
16. **[agent] Holdouts:** `add-member` anyone not in by edition 1;
    `post-for` their texted entries in editions 1–2 (`--photo` now repeats, up
    to 4). Dry run first; ask before every `--apply`.
17. **[owner] Decide bugs.md M1** (recommended: accept, check each publish for
    failed recipients and forward by hand).
18. **[owner] Before edition 1:** DMARC (if not done in §1), Resend — domain
    `verified`? daily cap? open/click tracking **off**?

**§5. Keep production honest**

19. **[agent → owner] Re-count cron timeouts:**
    `! npx supabase db query --linked "select status_code, timed_out, count(*) from net._http_response group by 1, 2 order by 3 desc"`.
    Expect no `timed_out = true`.

**§6. Once Group Zero is on the production build**

20. **[owner] Code expiry → 600 s** + paste the updated `magic-link.html` and
    `confirm-signup.html` (LAUNCH step 5 item 5); **[agent]** then deletes the
    PENDING notes (both templates, `reauthentication.html`,
    `hooks/use-email-code.ts`, CLAUDE.md's Auth line).
21. **[owner] Remove `catchupcolumn://(auth)/reset-password`** from Redirect
    URLs (LAUNCH step 5 item 7).

**§7. The owner's UI pass (from 10-05, on the phone)**

22. **[owner + agent]** Walk the app; report in a `/qa` session (it files
    GitHub issues); agents fix in batches; ship via `staging` first, then
    `production`. Already known, check these first:
    - The Group page's back button after auto-join lands there directly — it
      uses `router.back()` with no fallback (may have nothing to go back to).
    - The invite skeleton assumes a cover photo; a Group without one shifts up
      when the page lands.
    - The invite code on the ticket ignores Dynamic Type — a 12-character code
      can clip at large sizes (fix with the press pass, or sooner).
    - Week one, Home shows two paperboys (mailbox hero + the strip's rider).
    - #56: the composer's action-bar labels stop scaling at 1.6× Dynamic Type
      (BRAND §3/§13 exception) — confirm it reads right.

**§8. Illustration commission**

23. **[owner]** Send the brief (link above) to the artist; agree fee, rights
    and dates (proposed: sketches ~10-17, finals ~11-07 — the brief carries a
    comment asking to confirm).
24. **[agent], when the art lands:** integrate per `ILLUSTRATION_REWORK.md` →
    Integration (convert SVGs keeping the export contracts, re-measure the
    animated groups, build the all-assets review screen, regenerate icon,
    splash and derived assets — the icon/splash need one more build).

**§9. Owner, any time**

- Publish-day default: the app says Sunday 09:00, the playbook Monday (minor).
- Lulu pricing calculator at a real trim size and page count.
- From the 2026-09-22 sign-up test: the email's subject, sender, and
  inbox-vs-spam placement. Ask once.

**First move for the next session (build day):** §1 item 0 if the MX record
isn't there yet (`dig +short MX catchupcolumn.com`), then the two builds. Skim
Live state first.

## Decisions the owner owes

| Decision | Needed by | Where |
| --- | --- | --- |
| Group A's name, publish day (week of 10-11), time and zone | Before creating it in the app (§1 item 5) | Workstream A |
| Who organizes Group B | Before recruiting it | POSITIONING §6 |
| The family Group: start by email now, or wait for the app? | Overdue | POSITIONING §5, §6 |
| Anyone in Group A or B on Android? | Before the link goes out | POSITIONING §6 |
| Multi-photo go/no-go | Wed 10-08 | §3 |
| M1: accept no per-recipient email retry? | Before edition 1 | bugs.md M1 |
| Artist: fee, rights, dates | Before the artist starts | §8 |
| Publish-day default (minor) | Any time | `app/group/create.tsx`, playbook |

Decided: 2026-10-03 — the table under "What the 2026-10-03 session decided";
merge #51/#53/#54/#55 (owner told the session to); Sentry slugs as set; skip the
simulator pass; build 2026-10-04. 2026-09-29 (#49) — the Group Zero re-plan.
2026-09-24/25 — reading measured by asking; bundle ID final; "shipping" means
the App Store, after the illustration rework; #44's password rules. Left until
after Group Zero: weekly vs biweekly, classifieds, volume size, whether
friend-group volumes sell (POSITIONING §9).

## How to verify without Docker

- **DB, read-only:** `npx supabase db query --linked "<SQL>"` — auto mode
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
- **EAS env / profiles:** `npx eas-cli env:list --environment production | sed -E 's/=.*/=<redacted>/'`;
  `npx eas-cli config --platform ios --profile <name> --non-interactive`
  prints the resolved profile and which environment it loads.
- **EAS builds:** `npx eas-cli build:list --platform ios --limit 3`,
  `build:view <id> --json`; simulator builds install with
  `npx eas-cli build:run -p ios --id <id>`.
- **EAS updates:** `npx eas-cli update:list --branch <channel>`; an update
  applies on the second cold launch after it's published.
- **Site / DNS / AASA:** the curls in LAUNCH step 2 and PRESUBMISSION Gate 4;
  `dig +short MX catchupcolumn.com`; `dig +short TXT _dmarc.catchupcolumn.com`.
- **Merging several PRs:** test-merge them in order in a scratch worktree off
  `origin/main` and typecheck the result before merging any.
- **Flows that touch auth/storage:** a throwaway account and before/after
  snapshots of the rows and storage objects involved. Clean up afterwards.
- Edge function logs: dashboard only.

## Guardrails

- No Docker (owner preference). Everything above is Docker-free.
- **Subagents: no system installs without asking** — say so in every prompt
  that might need a toolchain.
- Branch → PR → CI green → the owner merges (or says to). Commit and PR
  attribution per the session's instructions.
- **Ask before any production change** — `secrets set`, `env:set`,
  `functions deploy`, `db push`, `eas update` (either channel), `--apply`,
  writes via SQL — and show the exact command. Read-only checks need no ask.
- Merging anything under `web/` publishes it. Treat it as outward-facing.
- Record outcomes as they are: a simulator build doesn't tick PRESUBMISSION
  Gate 7 (device release build); say what wasn't checked.
- CLAUDE.md's Non-features are permanent — no engagement mechanics, ever.

## Traps already paid for

- **`posts.blocks` must exist before any JS that touches it ships.** #52's
  queries select it and #56's saves write it; without the migration, Home,
  the Editions list and every edition stop loading. `db push` first, always.
- **An OTA goes to every build on its channel.** `production` = Group Zero;
  `staging` = the owner's phone only. Never test gated code on `production`.
- **Expo patch drift fails CI on any PR** ("Expo config and native-module
  checks"). Fix in its own commit with `npx expo install --fix`. Native
  packages move the `fingerprint` runtime.
- **The Sentry slugs can't be checked from outside** — only the owner's
  Settings page, or the build, proves them.
- **Read long docs in full, never as a summary.** The `shunt` plugin's limit is
  raised to 5000 lines here (`.claude/settings.local.json`); if a read is still
  blocked, read in chunks — never delegate it.
- Three code templates: Magic Link (sign-in, "Forgot your password?"), Confirm
  signup (sign-up), Reauthentication. A failed sign-up **creates the user**, so
  a re-test needs a fresh address. OTP length 6 (`CODE_LENGTH`), expiry =
  `CODE_EXPIRY_MINUTES`.
- **Every account stores a password hash** (a random one for code sign-ups) —
  never build a "current password" check (`setPassword` in `lib/auth.ts`).
- `storage.protect_delete` is statement-level; direct deletes from
  `storage.objects` need `set_config('storage.allow_delete_query','true',true)`
  — and remove only the row; delete files through the Storage API. Deleting a
  Group by SQL also needs `app.deleting_group`.
- `errcode = 'PGRST301'` is invalid in old migrations; use `P0001`.
- `time + interval` wraps at midnight — use timestamps.
- **Merging deploys nothing to Supabase**; a `_shared/` change needs every
  importer redeployed. CI never runs auth, email, or storage against the real
  project.
- `.env.local` never reaches an EAS build; `EXPO_PUBLIC_*` is inlined at build
  time. A custom profile needs `"environment"` set — `staging` sets
  `production` explicitly (Expo's docs don't state the default).
- **SDK 57 needs Xcode ≥ 26.4** locally; EAS's image is fine.
- The bundle ID locks on the first TestFlight upload, not at submission.
- External TestFlight needs Apple's review and a demo account the reviewer can
  sign in to — an emailed code won't reach them — **plus a second member**, or
  the reviewer sees neither *Report* nor *Remove*.
- `supabase functions download` writes every function into one `_shared/`
  folder — re-download the one you care about alone before diffing.
- Profile photo: the app shows the preview before **Save** uploads it. Weak
  evidence it confused anyone — watch it in Group Zero rather than fix it.
