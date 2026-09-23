# TODO.md — Catch Up Column

What's left. The spec is [CLAUDE.md](CLAUDE.md); the *why* and the order of work
are [docs/POSITIONING.md](docs/POSITIONING.md) §8.

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

- [x] **[owner] Apple Developer enrollment** — done 2026-09-22. Unblocks three
      things that were all waiting on it: the Apple Team ID (→ universal links,
      [docs/LAUNCH.md](docs/LAUNCH.md) step 2), the APNs push key (step 3), and
      the first TestFlight build for Group Zero editions 3–4 (step 8).
- [ ] **[owner] Paste the Apple Team ID into the universal-link files** — replaces
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
- [ ] **[owner] Recruit two to three family Groups this month** — a family Group
      not publishing by roughly the end of September cannot be a December buyer.
      (The extra-copies question that set this number was settled 2026-09-16:
      printed copies sell per person at $89.)
      [docs/POSITIONING.md](docs/POSITIONING.md) §5
- [x] **Friends-first copy pass** — landed 2026-09-16.
      [docs/POSITIONING.md](docs/POSITIONING.md) §2
- [ ] **[owner] Sentry DSN** — the code is wired and inert until it's set. It goes
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
- [ ] **[owner] Verify sign-up with a never-used email address** — sign-in is
      verified; **sign-up is not**, and it is the half that was broken. A prior
      failed attempt creates the user, so reusing that address tests sign-in
      instead — use a fresh `+alias`. Group Zero is almost entirely first-time
      sign-ups. [docs/LAUNCH.md](docs/LAUNCH.md) step 5
- [ ] **[owner] Verify account deletion completes** — the fix for Supabase's new
      `storage.protect_delete` trigger is live in production (migration
      `20260923003208`, applied 2026-09-22), but no delete has ever succeeded
      against the real project. Exercise the moderator-removes-a-member path too:
      the same trigger broke it whenever that member had draft posts, and it had
      never been tested. `docs/PRESUBMISSION_CHECKLIST.md` Gate 7
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
- [ ] **Illustration rework** — no longer a launch gate; Group Zero's four weeks are
      the natural window. [design/ILLUSTRATION_REWORK.md](design/ILLUSTRATION_REWORK.md)
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
