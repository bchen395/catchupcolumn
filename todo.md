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

- [ ] **[owner] Apple Developer enrollment** — waiting-time with a multi-day tail.
      Blocks TestFlight, which blocks Group Zero editions 3–4 (Expo Go dropped
      remote push in SDK 53). [docs/LAUNCH.md](docs/LAUNCH.md) step 7
- [ ] **[owner] Group Zero** — four consecutive editions across Groups A, B and the
      family Groups, before submitting anything.
      [docs/POSITIONING.md](docs/POSITIONING.md) §6
- [ ] **[owner] Settle the December arithmetic** — the extra-copies question and how
      many family Groups to recruit. The only item whose window closes in weeks.
      [docs/POSITIONING.md](docs/POSITIONING.md) §5
- [ ] **Friends-first copy pass** — [docs/COPY_PASS.md](docs/COPY_PASS.md)
- [ ] **[owner] Sentry DSN** — the code is wired and inert until it's set.
      [docs/LAUNCH.md](docs/LAUNCH.md) step 10
- [ ] **Passwordless (email OTP) sign-in** alongside the password flow, before
      Group Zero's edition 3. [docs/POSITIONING.md](docs/POSITIONING.md) §6
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
