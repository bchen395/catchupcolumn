# TODO.md — Catch Up Column

What's left. The spec is [CLAUDE.md](CLAUDE.md); the *why* and the order of work
are [docs/POSITIONING.md](docs/POSITIONING.md) §8. Orchestrating the launch from
a fresh session? Start at [docs/HANDOFF.md](docs/HANDOFF.md).

**Phases 1–7 are complete** — project skeleton, auth & onboarding, Group creation
and invites, the post composer, weekly edition compilation, the inbox and reading
view, and email delivery all shipped. Their per-phase checklists were deleted
2026-09-16; the features are described in [README.md](README.md) → Status and
specified in CLAUDE.md. Git history has the detail if you need it.

---

## Phase 8: Polish & launch prep

- [x] Loading screen with newspaper-themed animation
- [x] Push notifications: "Your Group is ready!" on edition publish
- [x] Error states and empty states for every screen
- [x] App icon and splash screen
- [x] Performance pass: image optimization, lazy loading
- [x] Crash reporting (Sentry) + OTA updates (expo-updates) + print-resolution fix
      — landed 2026-09-14, [docs/POSITIONING.md](docs/POSITIONING.md) §11
- [~] Store metadata — drafted in [docs/STORE_LISTING.md](docs/STORE_LISTING.md).
      Still needs screenshots and the store-console fields; the copy pass rewrites
      it first.
- [ ] Onboarding tested with a real non-technical user (folded into Group Zero)

---

## In front of launch, in order

POSITIONING §8 is the authoritative sequence. The short version:

- [x] **Redeployed `compile-editions` and `publish-edition-now`** — 2026-09-24.
      They had been on a 2026-07-11 build sending the retired **v1 edition
      email**; the v2 email is now live. Merging deploys nothing to Supabase —
      redeploy after every function change.
      [docs/LAUNCH.md](docs/LAUNCH.md) → Deploying edge functions
- [x] **[owner] Apple Developer enrollment** — done 2026-09-22. Unblocks three
      things that were all waiting on it: the Apple Team ID (→ universal links,
      [docs/LAUNCH.md](docs/LAUNCH.md) step 2), the APNs push key (step 3), and
      the first TestFlight build for Group Zero editions 3–4 (step 8).
- [x] **Apple Team ID pasted and bundle ID confirmed** — 2026-09-24. AASA appID
      `6RDS3S724Z.com.catchupcolumn.app`; `app.json` declares
      `applinks:www.catchupcolumn.com`; bundle ID `com.catchupcolumn.app` kept.
      Takes effect with the first native build. The original item, for context:
      replaces
      the literal `TEAMID` in `web/.well-known/apple-app-site-association` and adds
      `associatedDomains` to `app.json`. Until then every edition email's CTA opens
      Safari instead of the app. Cheapest of the three unblocked items, and the only
      one that fixes something already in front of users. **Confirm the bundle ID
      at the same time** — it is half of the AASA appID, and it locks for good on
      the first TestFlight upload, not at submission. (`WEB_BASE_URL`, the server
      half of this fix, was moved from the apex to `www` 2026-09-22.)
      [docs/LAUNCH.md](docs/LAUNCH.md) steps 2 and 7
- [ ] **[owner] Group Zero** — four consecutive editions across Groups A, B and the
      family Groups, before submitting anything.
      [docs/POSITIONING.md](docs/POSITIONING.md) §6
- [x] **Group Zero tooling** — 2026-09-25. The operator script
      (`scripts/group-zero/`: `create-group`, `add-member`, `post-for`, `list`)
      is on `main` and was verified end to end against production with a
      throwaway Group, then cleaned up; the read-only readout queries are
      `scripts/group-zero/readout.sql`. Both Group Zero decisions are made
      (read by asking at week 4; Group B set up by the owner with the organizer
      as moderator). [docs/POSITIONING.md](docs/POSITIONING.md) §6
- [ ] **First production build + TestFlight external testing** — well before
      Group Zero week 3 (~mid-October): external testers need Apple's TestFlight
      App Review, which needs a demo account with a password and a Beta App
      Description; the production build needs the Sentry source-map variables
      first. [docs/LAUNCH.md](docs/LAUNCH.md) steps 8 and 10.4
- [x] **First EAS build** — 2026-09-24, `preview` (simulator). SDK 57 runs;
      post-sign-in screens and anything needing a phone are still unchecked.
      [docs/LAUNCH.md](docs/LAUNCH.md) step 8
- [ ] **[owner] Recruit two to three family Groups this month** — a family Group
      not publishing by roughly the end of September cannot be a December buyer.
      (The extra-copies question that set this number was settled 2026-09-16:
      printed copies sell per person at $89.)
      [docs/POSITIONING.md](docs/POSITIONING.md) §5
- [x] **Friends-first copy pass** — landed 2026-09-16.
      [docs/POSITIONING.md](docs/POSITIONING.md) §2
- [x] **Sentry DSN in the EAS environment** — 2026-09-24, `production` and
      `preview`. Still open: the source-map variables (without them the
      production EAS build *fails* — LAUNCH step 10.4) and the smoke test
      (10.3). The original item: the code is wired and inert until it's set. It goes
      in the **EAS environment**, not `.env.local`: that file is gitignored, so an
      EAS build never sees it and the TestFlight build would ship with Sentry off.
      [docs/LAUNCH.md](docs/LAUNCH.md) step 10
- [x] **Passwordless (email OTP) sign-in** — landed 2026-09-16; the default for
      both sign-in and sign-up. The Magic Link template carrying `{{ .Token }}`
      was pasted into the dashboard 2026-09-22, so codes now send.
- [x] **Email sign-in made to actually work** — 2026-09-22, three dashboard fixes,
      not one: `confirm-signup.html` pasted into the **Confirm signup** template
      (there are *two* templates — sign-in renders from Magic Link, sign-up from
      Confirm signup), OTP length corrected from 8 to **6** (the app hard-codes
      `CODE_LENGTH = 6` and silently truncates, so an 8-digit code could not be
      entered at all), and a plain subject line set on both.
      [docs/LAUNCH.md](docs/LAUNCH.md) step 5
- [x] **Sign-up verified with a never-used email address** — 2026-09-22. Sign-in
      and sign-up both work, and the account came out right in `auth.users`.
      [docs/LAUNCH.md](docs/LAUNCH.md) step 5
- [x] **Account deletion and moderator removal verified** — 2026-09-22, against
      production. Both go through the fix for Supabase's `storage.protect_delete`
      trigger (migration `20260923003208`), and neither had ever succeeded
      before. The removal took a member's unpublished post and its photo with it;
      the deletion left no auth user, profile or avatar. The release-build rerun
      is still `docs/PRESUBMISSION_CHECKLIST.md` Gate 7
- [x] **Auth email onto Resend SMTP** — done 2026-09-22. Auth email (the sign-in
      code, password reset) ran on Supabase's built-in sender, which is a testing
      facility with a low per-hour cap; edition email was always on the Resend
      API and was never affected. Sending limit set to **100/hour** — sized off
      peak concurrent onboarding, not total users, and re-derive it at launch.
      Two open sub-checks (per-address interval, Resend's daily cap) in
      [docs/LAUNCH.md](docs/LAUNCH.md) step 5.
- [ ] **Pre-publish nudge** — after Group Zero, and only if the run showed people
      forgetting rather than declining. [docs/NUDGE_SPEC.md](docs/NUDGE_SPEC.md)
- [ ] **Thin-edition design** — a one-story edition must read as a letter, not a
      failure. [docs/NUDGE_SPEC.md](docs/NUDGE_SPEC.md)
- [ ] **Decide on write-by-web** from the editions 1–2 vs. 3–4 delta.
      [docs/POSITIONING.md](docs/POSITIONING.md) §4
- [ ] **Illustration rework — required before App Store submission** (owner,
      2026-09-25), by a commissioned illustrator. Not a gate on the TestFlight
      build: the 8 drawings are SVG code and reach testers by OTA; only the app
      icon and splash (native files) need a new build. Group Zero's four weeks
      are the window. [design/ILLUSTRATION_REWORK.md](design/ILLUSTRATION_REWORK.md)
- [ ] **App Store submission** — [docs/PRESUBMISSION_CHECKLIST.md](docs/PRESUBMISSION_CHECKLIST.md)

---

## Revenue — the one item with a real deadline

- [ ] **[owner] Run Lulu's pricing calculator** against a real trim size and page
      count. Nothing in the pricing ladder is costed until this happens.
- [ ] **[owner] The December test** — hand-made volumes, uploaded to Lulu by hand,
      sold by Stripe Payment Link. No renderer, no API, no code. Q4 is 40–60% of
      annual revenue for gift products. [docs/POSITIONING.md](docs/POSITIONING.md) §5

---

## Not planned

CLAUDE.md → **Non-features** is the list, and it distinguishes *deliberately never*
(likes, reactions, comments, feeds, ads, prompts, AI writing) from *not yet*
(physical print, web composer, post templates). Don't keep a second copy here.

Ads specifically were costed and rejected on 2026-09-15 — the arithmetic is in
[docs/POSITIONING.md](docs/POSITIONING.md) §5 so it doesn't get relitigated.
