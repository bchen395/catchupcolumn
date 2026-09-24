# Launch handoff — orchestration brief

**Written 2026-09-24.** A living brief for whichever session is orchestrating the
launch. It holds what the lists don't: current live state, the dependency order,
who does what, and how to verify. **Rewrite it at the end of every orchestration
session** (state, dates, first moves). Delete it at launch.

It deliberately does **not** copy the lists — each has one home:

| What | Where |
| --- | --- |
| What's left, short form | `todo.md` |
| Sequence and why; open questions | `docs/POSITIONING.md` §8, §9 (§6 = Group Zero, §5 = revenue) |
| Runbook narrative, commands, live-ops checks | `docs/LAUNCH.md` |
| Submission-day gates (authoritative over LAUNCH) | `docs/PRESUBMISSION_CHECKLIST.md` |
| Code-side residue | `bugs.md` |
| What the Group B organizer gets | `docs/ORGANIZER_PLAYBOOK.md` |
| How to work on each surface | `.claude/skills/*` (auto-load) |

When something gets done, record it **there**, dated — then update this file.

---

## Your role

Run the rest of the launch with the owner. Keep the critical path moving; do the
dev work yourself or in parallel subagents (worktrees); hand the owner the
owner-only steps **one at a time, with exact clicks/commands**; verify every claim
against production (read-only) before recording it. The owner merges PRs.

## Live state (verified 2026-09-24 — re-check before relying on it)

**Working:** cron firing end to end (200s every 15 min); all 30 migrations
applied; `WEB_BASE_URL` = `www`; `EMAIL_FROM` correct; Vercel site in sync with
`main`; EAS env has the Supabase vars in `production` and `preview`; code
sign-in, sign-up, moderator removal and account deletion all verified against
production 2026-09-22 (dev build).

**Wrong right now:**
- **Production sends the retired v1 edition email.** `compile-editions` and
  `publish-edition-now` are on the 2026-07-11 build. Merging deploys nothing to
  Supabase. Fix = one command (first moves, below).
- Team ID not pasted (AASA still `TEAMID`, no `associatedDomains`) → email CTA
  opens Safari.
- No Sentry DSN anywhere. No DMARC record. Resend domain status unconfirmed.
- The live privacy policy lacks the Sentry disclosure until the 2026-09-24 docs
  PR merges (it publishes `web/privacy.html`).

**Not started:** Group Zero. Production has 2 test Groups, 3 users, no new user
since 2026-06-04. No release build has ever been made (`eas build:list` empty);
SDK 57 has never run on hardware.

## Dates that bind

| When | What | Why it's fixed |
| --- | --- | --- |
| **~2026-09-30** | 2–3 family Groups publishing | A family recruited later has too little to print for December (POSITIONING §5) |
| Before edition 1 | Function redeploy; the read-measurement decision | Otherwise edition 1 is v1-styled and the pass condition is unmeasurable |
| **Group Zero week 3** (~mid-Oct if edition 1 lands ~Oct 4) | First TestFlight build installed | Editions 3–4 require the app; Expo Go has no remote push |
| Late November | The December test (hand-made volumes, Lulu by hand, Stripe link) | Q4 is 40–60% of gift revenue |

## The dependency chain into the first build

```
owner: Team ID + confirm bundle ID ─┐  (bundle ID locks on first upload — irreversible)
owner: Sentry project → DSN ────────┼─→ agent: AASA + app.json associatedDomains; eas env:set DSN
docs PR merged (privacy discloses   │        (associatedDomains is native: can't ship by OTA)
  Sentry) ──────────────────────────┘
                                     ─→ local simulator Release build (smoke SDK 57)
                                     ─→ eas build --profile production (creates APNs key)
                                     ─→ TestFlight → Group Zero editions 3–4
```

Budget for the first EAS build failing once; that's why the local build goes first.

## Workstreams

**A. Group Zero — owner-led.** Recruit Group A (owner's friends), a Group B
organizer, and 2–3 families. Editions 1–2 accept entries by any channel; 3–4
require the app. Agent support: the operator script (C2), the readout queries
(C5), and turning each week's facts into dated notes in POSITIONING §6.

**B. Production correctness — agent, owner approves each prod change.**
Redeploy functions; verify by download-and-diff (LAUNCH → Deploying edge
functions). Then the owner's dashboard reads (below).

**C. Dev work ready to hand to subagents** (each in its own worktree; 2, 3 and 5
can run in parallel today):

1. **Redeploy** — `npx supabase functions deploy compile-editions
   publish-edition-now --use-api`, outside any Group's publish window. Ask first.
   Done when the download-and-diff shows no drift.
2. **Group Zero operator script** (`scripts/group-zero/`, Deno — 2.9 is
   installed). Replaces POSITIONING §6's dashboard-and-SQL routine and the
   "sign in as them" step, which code sign-in makes awkward. Service-role key
   from the shell env only — never a file in the repo. Commands:
   - `add-member` — `auth.admin.createUser({ email, email_confirm: true,
     user_metadata: { display_name } })` (sets the byline via
     `on_auth_user_created`; without it the byline is the email's local part),
     then insert the `group_members` row as contributor, `on conflict do
     nothing`. No password needed — they sign in later with a code.
   - `post-for` — write *their* post: **update their existing uncompiled post if
     one exists** (the app keeps one per member per edition by convention —
     `fetchCurrentPost` in `lib/posts.ts`; there is no DB constraint, so a second
     insert becomes a second story). `edition_id` stays null. Optional photo →
     `post-images/<user_id>/posts/<post_id>/image.jpg`, `image_url` = that path
     (mirror `lib/posts.ts`).
   - `list` — members and this week's posts for a Group.
   - Safety: dry-run unless `--apply`; refuse if the author isn't a member;
     refuse within 30 minutes of the Group's publish slot. Possibly
     `create-group --moderator <email>` too, if the owner decides to set Group B
     up by hand (see decisions).
   - Verify against production with a throwaway Group + before/after queries,
     then delete it. Update POSITIONING §6 to point at the script.
3. **Local simulator Release build** — `npx expo run:ios --configuration
   Release` (Xcode 26.3 installed; `ios/` is gitignored). Smoke the bugs.md #1
   risk spots: splash hides, Lora/Jost load, `js-tabs` tab bar, Reanimated 4.5
   animations. It reads `.env.local`, so it talks to **production** — don't
   create junk data. Memory note: rAF can freeze in a hidden preview pane; run a
   control before calling an animation broken.
4. **Universal links** — needs the Team ID + bundle-ID confirmation. AASA
   `appIDs` → `<TEAMID>.com.catchupcolumn.app`; `app.json` `ios.associatedDomains:
   ["applinks:www.catchupcolumn.com"]` (snippet in `web/README.md` — never the
   apex). After merge, curl the AASA (200, `application/json`, new ID) and re-run
   the permalink curl. Takes effect with the next native build.
5. **Group Zero readout queries** — read-only SQL, runnable with `npx supabase
   db query --linked`: per-member post counts across editions (pass: ≥5 of 8
   write ≥2); when in the week people write, relative to the publish slot (the
   nudge's 48h guess); first `push_tokens` row per member (install date — not
   `last_sign_in_at`, which the organizer's own actions move).
6. **bugs.md L3** — a brand-new user whose profile row fails twice lands on
   broken screens. Group Zero is the first real sign-ups. Small UI change.

**D. Owner-only — hand these over one at a time:**
- Recruiting (A). This is the item with the deadline; protect the owner's time for it.
- Apple Team ID (Membership details) + a yes/no on bundle ID `com.catchupcolumn.app`.
- Create the Sentry project; paste the DSN.
- DMARC TXT at `_dmarc.catchupcolumn.com` (value in LAUNCH step 4).
- Resend dashboard: domain `verified`? plan's daily cap? Open/click tracking
  on or off? (That last one feeds the measurement decision.)
- Supabase dashboard reads: minimum password length (LAUNCH and bugs.md
  disagree), per-address email interval.
- Lulu pricing calculator at a real trim size and page count.
- Not recorded from the 2026-09-22 sign-up test: the email's subject, sender, and
  inbox-vs-spam placement. Ask once.

**E. Gated — do not start** (POSITIONING §8): the nudge, thin-edition design,
write-by-web, illustration rework, store screenshots, App Store submission, the
house ad (after the December test), the print renderer / Lulu API.

## Decisions the owner owes, and by when

| Decision | Needed by | Where |
| --- | --- | --- |
| How "≥6 of 8 read it" is measured — Resend open tracking is a pixel, which §5 and the privacy policy promise the email doesn't carry | Before edition 1 | POSITIONING §9 |
| How Group B's organizer gets in with no build yet — playbook is silent. Options: owner creates the Group and hands over moderator; organizer waits for TestFlight; Expo Go (not for non-technical people) | Before recruiting Group B | ORGANIZER_PLAYBOOK, POSITIONING §6 |
| Bundle ID final | Before the first EAS build | LAUNCH step 7 |
| Publish day default: app says Sunday 09:00, the playbook recommends Monday (minor) | Any time | `app/group/create.tsx`, playbook |

Still open, and deliberately left until after Group Zero: passwords for code-only
accounts, weekly vs biweekly, classifieds, volume size and whether friend-group
volumes sell (POSITIONING §9).

## How to verify without Docker

- **DB, read-only:** `npx supabase db query --linked "<SQL>"`. Never run LAUNCH's
  Vault query 2 unless the cron's HTTP responses fail — it prints secrets.
- **Hashed secrets:** `supabase secrets list` digests are SHA-256 of the value;
  compare with `printf '%s' '<expected>' | shasum -a 256`.
- **What code production runs:** download-and-diff (LAUNCH → Deploying edge functions).
- **Cron:** `net._http_response` status codes, not `cron.job_run_details`.
- **EAS env:** `npx eas-cli env:list --environment production` (pipe through
  `sed -E 's/=.*/=<redacted>/'`).
- **Site / DNS:** the curls in LAUNCH step 2 and PRESUBMISSION Gate 4; `dig +short
  TXT _dmarc.catchupcolumn.com`.
- **Flows that touch auth/storage:** a throwaway account and before/after
  snapshots of the rows and storage objects involved — how sign-up, removal and
  deletion were proven on 2026-09-22. Clean up afterwards.
- Edge function logs: dashboard only (`supabase functions logs` doesn't exist in
  this CLI).

## Guardrails

- No Docker (owner preference). Everything above is Docker-free.
- Branch → PR → CI green → the owner merges. Commit and PR attribution per the session's instructions.
- **Ask before any production change** — `secrets set`, `functions deploy`,
  writes via SQL — and show the exact command. Read-only checks need no ask.
- Merging anything under `web/` publishes it (privacy, terms, AASA). Treat it
  as outward-facing.
- Record outcomes as they are: a dev-build pass doesn't tick PRESUBMISSION
  Gate 7 (release build); say what wasn't checked.
- CLAUDE.md's Non-features are permanent — no engagement mechanics, ever.

## Traps already paid for

- Two auth templates: Magic Link (sign-in), Confirm signup (sign-up). A failed
  sign-up **creates the user**, so a re-test needs a fresh address. OTP length
  must stay 6 (`CODE_LENGTH`).
- `storage.protect_delete` is statement-level; direct deletes from
  `storage.objects` need `set_config('storage.allow_delete_query','true',true)`
  (db-migrations skill).
- `errcode = 'PGRST301'` is invalid (8 chars) in old migrations; use `P0001`.
- **Merging deploys nothing to Supabase**; a `_shared/` change needs every
  importer redeployed. CI never runs auth, email, or storage against the real project.
- `.env.local` never reaches an EAS build; `EXPO_PUBLIC_*` is inlined at build time.
- The bundle ID locks on the first TestFlight upload, not at submission.
- `supabase functions download` writes every function into one `_shared/`
  folder — re-download the one you care about alone before diffing.
- The organizer can't receive a member's sign-in code; `display_name` falls back
  to the email's local part (C2 solves both).
- Profile photo: the app shows the preview before **Save** uploads it. Weak
  evidence it confused anyone — watch it in Group Zero rather than fix it.

## First moves for the next session

1. Re-verify the live-state block (five minutes, all read-only). Anything that
   changed, update here.
2. Get the owner's OK and **redeploy the two functions**; verify by diff.
3. Collect in one message: Team ID + bundle-ID yes/no, the Sentry DSN (or "not
   yet"), and the two Group Zero decisions (read measurement, Group B access).
4. Start C2 (operator script), C3 (local Release build) and C5 (readout queries)
   in parallel worktrees.
5. Keep recruiting at the top of every check-in until ~09-30.
