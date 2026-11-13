# Launch handoff — orchestration brief

**Rewritten 2026-11-03, updated 2026-11-04 and 2026-11-05** (first written 2026-09-24). This is a living brief for
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
| Sequence and why; open questions | `docs/POSITIONING.md` §8, §9 (Group Zero, §6, was skipped 2026-10-24) |
| Runbook narrative, commands, live-ops checks | `docs/LAUNCH.md` |
| Submission-day gates (authoritative over LAUNCH) | `docs/PRESUBMISSION_CHECKLIST.md` |
| Every App Store Connect value, the review account, the Review Notes | `docs/STORE_LISTING.md` §13 (§9.1 age rating, §7 privacy labels, §5 screenshots) |
| Acting on a report: take down, remove, ban (internal) | `docs/MODERATION.md` |
| Guideline 1.2: what Apple asks, what ships | `docs/STORE_LISTING.md` §9.3; `docs/LAUNCH.md` step 9 |
| Code-side residue and accepted trade-offs | `bugs.md` (M1, G1–G4, L6) |
| Illustration commission: spec, contracts, integration | `design/ILLUSTRATION_REWORK.md` |
| The artist-facing brief (a shareable doc) | <https://claude.ai/code/artifact/c729acda-f9d2-4fd5-a929-04382415acaa> |
| How to work on each surface | `.claude/skills/*` (auto-load) |
| Dormant since Group Zero was skipped | `scripts/group-zero/`, `docs/ORGANIZER_PLAYBOOK.md`, STORE_LISTING §12 (TestFlight external) |

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

## Live state — 2026-11-05, re-check before relying on it

**Code:** `main` at `343eca7` (#77), plus the 2026-11-05 records PR. CI is
green. Since build 10, the merged changes are JS or config only:
- #74, the keyboard fix
- #76, which records the checks; it also adds the security notifications to
  `supabase/config.toml` (local-stack config)
- #78, Expo patch drift: 8 packages listed in `expo.install.exclude`, so
  expo-doctor stops failing every PR without moving the fingerprint (Traps)
- #77, a read-only Email field on Set a password, as a username so iOS
  offers Strong Password (bugs.md L6)

None of them should move the fingerprint. The worktree comparison was done
for #78; re-check `dd742296…` in the owner's checkout before the OTA anyway.

**Production:**
- **Database:** all 38 migrations applied (CLI v3: `migration list --remote` matches).
- **Functions:**

  | Function | Version | Notes |
  | --- | --- | --- |
  | `compile-editions` | v21 | downloaded and diffed clean against `main`, 2026-11-02 |
  | `publish-edition-now` | v10 | same |
  | `report-story` | v1 | same |
  | `delete-account` | v11 | unchanged |
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

It has every PR up to #72. **#74 and #77 are merged but not published as an
OTA:** the owner chose to send them together with the fixes from the phone
checks and the UI pass (§5). `main`'s fingerprint still equals the build's (checked after
#74 merged).

**The owner's local checkout:**
- `package.json` has an **uncommitted** change: the `ios`/`android` scripts say
  `expo run:*`, from running `npx expo run:ios`. It doesn't affect the
  fingerprint.
- There's a gitignored `ios/` folder from the same command.
- **Never `git commit -a`/`-am` in that checkout.** Stage files by name. When
  switching branches, stash and pop.

**Test accounts:** T1 = `bchen395+t1@gmail.com` (moderator of a test Group).
T2 and T3 will be `bchen395+t2@`/`+t3@gmail.com`, not created yet.

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
- the review sign-in and Notes (§6 step 11)
- screenshots and the build

## Decisions since 2026-10-24 (all the owner's)

| Date | Decision |
| --- | --- |
| 10-24 | **Skip Group Zero.** No external TestFlight, no beta review; submit once the art lands and the checks pass. Multi-photo ships in v1 |
| 10-30 | Age rating **18+** override; Terms §1 stays at 18. Messaging & Chat: Yes. Content rights: Yes (the art contract must grant the rights). EU **trader**. Every region except mainland China. **Manual** release. Reports answered **within 24 hours, every day** |
| 10-30 | Guideline 1.2 closed in code before the final build: one-way block, "Let back in", **no word filter**, report sent from the app, email and push switches for each Group. Existing accounts aren't asked to re-agree to the Terms. bugs.md M1 accepted |
| 10-31 – 11-02 | Accepted for 1.0: report spam can use up the shared Resend cap (G1); push isn't filtered by blocks (G2); a moderator's block hides stories in their own Group too (G3); deleting an account removes that person's stories (G4) |
| 11-01 | Take-downs are silent: the author isn't told. The invite card keeps "Anyone with this code can join" (standard, short) |
| 11-02 | Privacy label declares Customer Support; support inbox disclosed; **Supabase CLI v3 now** (rather than pinning 2.x) |
| 11-03 | Short multi-line fields (Group description, bio): Return reads **Done** and closes the keyboard. **Batch the OTA:** #74 waits for the phone-check fixes |
| 11-04 | ~~**Accept**~~ (fixed instead on 11-05) the missing strong-password suggestion on Set a password for 1.0 (bugs.md L6). **Copyright** names the owner's legal name; the App Review contact is the owner's personal phone and email. **DSA trader declaration deferred**: which address to publish is still open |
| 11-05 | **Drop the EU for 1.0** rather than publish a trader address, phone and email on EU product pages: 147 of 175 regions (UK, Norway, Iceland, Liechtenstein and Switzerland stay). When the EU comes back, the email is support@. **Fix the Keychain gap after all** (#77, rides the OTA). **Hold Expo patch drift** in `expo.install.exclude` until the final build (#78) |

## Next steps

**[owner]** means only the owner can do it: one step at a time, with exact
clicks or commands. **[agent]** means the session does it.

**§1. Finish batch 1: done 2026-11-04.** Steps 1 to 4 are done.

**§2. Phone check batch 2: done 2026-11-04.** See Live state. The over-a-day-old
session was checked 2026-11-05. One Gate 7 Auth item moves to §3: signed in on
two devices, then sign out on one.

**§3. Phone check batch 3: needs two or three accounts at once**

This is the rest of Gate 7: #64, #65, #66, #68, #69 and #70's device scripts
(`gh pr view <n>`), plus join, publish, email, push and unsubscribe.

5. **[owner] Choose the second device.** Options:
   - Another iPhone or iPad on the same Apple ID, installed from TestFlight.
   - Someone added to App Store Connect as a user, then as an internal tester.
     External testers would need Apple's beta review.
   - **Fallback:** switch accounts on one phone (sign out and in). That covers
     everything except push arriving while another account is active, since
     push goes to whoever is signed in on the phone.
   - **Not the simulator:** local Xcode 26.3 can't build SDK 57.
6. **[owner + agent] Run the batch in this order.** Setup is T1 moderator, T2
   and T3 contributors.
   - T2 joins by code.
   - A post with 2 photos → Publish now. The email arrives from the verified
     domain, its "read the edition" link opens the app (not a 404), and push
     fires.
   - Report (#64). The email reaches `support@`.
   - Block and Unblock (#70).
   - Delivery switches, and the unsubscribe link flipping the switch (#68).
   - Take down a published 2-photo story (#69). This is **the production
     take-down test**: see #69's "After merging" item 3 for the before/after
     file counts. The **[agent]** hands the owner the read-only queries.
   - Remove, the removed member refused at the join screen, then Let back in
     (#66).
   - Delete a *creator's* account while their Group has a member (#65): the
     deletion completes and the Group passes on. Read-only checks are in #65.
   - Profile → Delete my account.
   - Clean up the test Groups afterwards.

**§4. Sentry smoke test** (LAUNCH step 10; its 10.3 is owed)

7. **[owner + agent]** Follow LAUNCH 10.3/10.5 on the TestFlight build.

**§5. The owner's UI pass, then one OTA**

8. **[owner + agent]** The owner walks the app and reports in a `/qa` session
   (it files GitHub issues). Agents fix them in PRs.
9. **[agent → owner] Publish the batch as one OTA:**
   - **Ask first.**
   - Before publishing, confirm `npx expo-updates runtimeversion:resolve
     --platform ios` in the owner's checkout prints `dd742296…`.
   - Then `npx eas-cli update --channel production --environment production
     --message "…"`.
   - The owner cold-launches twice to apply it.
   - It includes #74, #77 and every other JS fix since `4392385`.
   - After it: re-check Set a password's Keychain behaviour (bugs.md L6).

**§6. App Store Connect (items 19–22): no second device needed**

10. **[owner, agent dictates] Done 2026-11-04 and 11-05** (Live state). The
    EU is out for 1.0, so there's no DSA declaration. Bringing it back after
    launch is a todo.md item.
11. **[agent + owner] Review account and demo Group** (STORE_LISTING §13.2;
    production writes, so ask first):
    - A review account with a password.
    - A demo Group with a second member who has written a story, because
      Report, Block and Take down only appear on other people's stories.
    - One published edition.
    - Then fill the Review Notes placeholders `{{DEMO GROUP NAME}}` and the two
      `{{SECOND MEMBER NAME}}` (§13.3) and re-measure them under 4,000 bytes.

**§7. Illustration commission** (`design/ILLUSTRATION_REWORK.md`)

12. **[owner]** The artist's timeline: sketches were proposed for about 10-17
    and finals for about 11-07. Confirm where it stands.
13. **[agent], when the art lands:**
    - Integrate it per ILLUSTRATION_REWORK → Integration.
    - Regenerate the icon, splash and derived assets. That moves the
      fingerprint, so it needs a new build.

**§8. Final build and submit**

14. **[owner]**
    - First remove `expo.install.exclude` from `package.json` and run
      `npx expo install --fix` (Traps → Expo patch drift).
    - A new production build, the same command as before. Its runtime is new,
      so older builds stop getting OTAs.
    - Submit it with `npx eas-cli submit --platform ios --id <id>`.
    - Add it to the version page.
15. **[owner]** Screenshots:
    - Check the required size slots in Media Manager first (STORE_LISTING §5;
      Apple's page named the 6.3-inch class, 2026-11-02).
    - Use the demo Group's invented content.
16. **[owner + agent]** The final PRESUBMISSION pass (all gates), then **Submit
    for Review**. Release is manual.

**§9. Release day and after**

17. **[agent → owner]** `npx supabase functions deploy unsubscribe --use-api
    --remote`. It asks first; default is No.
18. **[agent]** After approval, set `appStoreUrl` in `web/config.js` (PR; this
    publishes the site).

**Not blocking:**
- Make CI's schema lint able to fail (todo.md).
- Authors can delete their own *published* post through the API without its
  photos (`001_initial_schema.sql:201`).
- Members can read each other's delivery flags through the API.

**First move for the next session:** ask the owner which comes next:
- §6 step 11, the review account and demo Group (production writes, so ask
  first). It also gives §3 a ready second account.
- §3, once the second device is chosen (step 5)
- §7, where the art stands: the finals were due around 11-07
- §5, the `/qa` UI pass, then the OTA

## Decisions the owner owes

| Decision | Needed by | Where |
| --- | --- | --- |
| Second device or tester for batch 3 | §3 | above |
| Screenshot size slots (Media Manager) | §8 | STORE_LISTING §5 |
| Artist: fee, rights (they must cover content rights), dates | §7 | ILLUSTRATION_REWORK |
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
