# Catch Up Column

A private weekly newspaper you write together with your people. Members write
short updates (with optional photos) through the week, and on each Group's publish
day everything is compiled into one "edition" — delivered in-app, by push, and by
email.

**Audience (set 2026-09-14):** post-grad friend groups first, families second. Six
to ten people who were close in one place and now live in five states; the pain
isn't that they stopped caring, it's that there's no occasion. Families stay a
first-class use case — "The Williams Family Weekly" must still feel native. The
reasoning is [docs/POSITIONING.md](docs/POSITIONING.md); the binding version is
[CLAUDE.md](CLAUDE.md) → Target Audience.

**There are no likes, reactions, comments, follower counts, feed, or ads anywhere
in the schema.** That is the product, not a gap. See CLAUDE.md → Non-features
before proposing any of them — each one has a decision behind it, and advertising
in particular was costed and rejected rather than waved off.

## Status

Feature-complete through Phase 7 of [todo.md](todo.md) and into Phase 8 polish.
Working today: email/password auth and reset, 3-screen onboarding, Group creation
and invite codes, the post composer with photo upload, weekly compilation on a
15-minute cron scoped by each Group's `publish_day`/`publish_time`/`timezone`, the
newspaper-styled edition reader, Resend email with per-Group unsubscribe, push on
publish, and account deletion with moderator handoff.

**Not shipped, and gating launch:** the app has never been run on real users.
[docs/POSITIONING.md](docs/POSITIONING.md) §6 ("Group Zero") is the validation gate
in front of App Store submission — four consecutive editions of a real Group
before anything is submitted. The other open work is the friends-first copy pass
([docs/COPY_PASS.md](docs/COPY_PASS.md)) and the pre-publish nudge
([docs/NUDGE_SPEC.md](docs/NUDGE_SPEC.md)).

## Tech Stack

- **Mobile:** React Native 0.86 + Expo SDK 57 (managed workflow), Expo Router 7 with typed routes.
  `(tabs)/_layout.tsx` imports `Tabs` from `expo-router/js-tabs` — the plain
  `expo-router` export is deprecated as of SDK 57.
- **Language:** TypeScript (strict), path alias `@/*` → repo root
- **Backend:** Supabase — Postgres + RLS, Auth, Storage, Edge Functions (Deno)
- **Email:** Resend
- **Push:** Expo Notifications (token registered server‑side, pushes sent from the edge function)
- **Fonts:** Lora (serif) + Jost (UI sans) via `@expo-google-fonts`, identical on every platform
- **Crash reporting:** Sentry (crashes only — no tracing, no replay, no PII)
- **OTA:** `expo-updates` + EAS Update, `runtimeVersion.policy: "fingerprint"`

## Repo Layout

```
app/                       Expo Router file-based routes
  (auth)/                  login, signup, onboarding, reset-password
  (tabs)/                  home, inbox, post (compose), groups, profile
  group/                   create, join, [id] detail
  edition/[id]/            front page (index) + story reader ([postId])
components/                Reusable UI (themed-text, edition-post, tab bar, etc.)
constants/                 colors, typography, layout, motion, strings, icons, loading
hooks/                     use-auth, use-post-image-url, use-image-orientation,
                           use-reduce-motion
lib/                       supabase client + domain modules (auth, groups, posts,
                           editions, notifications, image, edition-layout,
                           edition-seen, haptics)
types/                     Shared DB + domain types
supabase/
  migrations/              29 SQL migrations (schema → security hardening)
  functions/
    compile-editions/      Cron-driven compile + email + push
    publish-edition-now/   Moderator-only immediate publish
    delete-account/        Auth-aware account deletion
    unsubscribe/           Token-based per-group unsubscribe endpoint
    _shared/               Shared HTML email rendering + email/push dispatch
design/                    BRAND.md, implementation plan, logo assets
assets/                    Brand logo, app icons, splash, fonts
```

## Getting Started

### Prerequisites

- Node 20.19.4+ (Node 22 recommended — run `nvm use` to pick up `.nvmrc`) and npm.
  Older Node fails at startup with `TypeError: configs.toReversed is not a function`,
  thrown from Metro's config loader.
- Expo CLI (`npx expo` is fine — no global install needed)
- A Supabase project (cloud or local via `supabase` CLI)
- A Resend account + API key (for email delivery)
- Xcode (iOS sim) and/or Android Studio (Android emulator) for native runs

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` → `.env.local` and fill in your Supabase project values:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

The Supabase client throws at load if either var is missing — fail loud beats silent 401s.

### 3. Apply database migrations

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

This creates all tables, RLS policies, storage buckets (`avatars`, `post-images`, `group-covers`), and the cron job that invokes the compile function every 15 minutes.

### 4. Deploy edge functions

```bash
npx supabase functions deploy compile-editions
npx supabase functions deploy publish-edition-now
npx supabase functions deploy delete-account
npx supabase functions deploy unsubscribe
```

Set the function secrets:

```bash
npx supabase secrets set \
  CRON_SECRET=<shared-secret-for-manual-invocations> \
  RESEND_API_KEY=<resend-api-key> \
  FUNCTIONS_PUBLIC_URL=https://<project-ref>.supabase.co/functions/v1 \
  WEB_BASE_URL=https://www.catchupcolumn.com \
  EMAIL_FROM='Catch Up Column <hello@your-verified-domain>'
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically. `EMAIL_FROM` defaults to the Resend sandbox sender, which is fine for dev but tanks deliverability in production — point it at a verified domain before shipping.

### 5. Run the app

```bash
npx expo start          # dev server
npx expo run:ios        # iOS simulator
npx expo run:android    # Android emulator
```

## Weekly Compilation

`supabase/functions/compile-editions` is the heart of the publishing pipeline. The cron job hits it every 15 minutes; on each run it:

1. Calls the `compile_due_editions` RPC, which finds every group whose publish window falls inside the current tolerance, claims all uncompiled posts for those groups, and inserts a new `editions` row linking them.
2. Fetches the email payload for each newly compiled edition (plus any earlier editions whose previous send failed and still have retry budget).
3. Renders the newspaper‑styled HTML email and sends to each subscribed recipient via Resend.
4. Fans out Expo push notifications to all registered devices for the group, with a deep link to `catchupcolumn://edition/<id>`.

Idempotency, per‑group timezone math, push retries with exponential backoff, and unsubscribe handling all live in dedicated migrations — see `supabase/migrations/20260426000007_*`, `20260430010000_*`, `20260505000030_*`, and `20260505000040_*`.

You can fire the function manually for testing:

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://<project-ref>.supabase.co/functions/v1/compile-editions
```

## Design System

The visual language is documented in [design/BRAND.md](design/BRAND.md). Quick reference:

The system is **v2 (2026-07-17), "NYT structure, HeyTea charm"** — the v1 orange /
peach / yellow palette is retired.

- **Palette:** near-monochrome. Ink `#1A1A1A` on warm paper `#FBF9F4`, structure drawn with `Colors.hairline` rules, and one scarce vermilion `#E8442E` accent confined to bold small-caps kicker/stamp roles — never body copy, fills, or surfaces.
- **Type:** Lora (every serif role) + Jost (all UI chrome), identical on every platform. Pick families from `Typography.families` in [constants/typography.ts](constants/typography.ts) — don't hardcode font names.
- **Tokens:** semantic only. Use `Colors.ink` / `Colors.paperWarm`, never raw hex; use `Layout.padding.*`, `Layout.borderRadius.*`, and `Layout.touchTargetMin` at component sites.
- **Accessibility floor, non-negotiable:** 16px minimum body, ≥48px touch targets (rows ≥56px), high contrast, tested at larger system font sizes.
- **Illustrations** (the paperboy and his dog) live in app chrome only — never inside editions.

## Conventions

- Functional components with hooks; arrow‑function `const` exports.
- Files in kebab‑case (`edition-post.tsx`), components in PascalCase.
- `StyleSheet.create()` colocated at the bottom of each component file.
- Keep components under ~150 lines; break out helpers into `components/` or `lib/`.
- TypeScript strict mode — no inline `any`. DB row/insert/update types live in [types/database.ts](types/database.ts).

## Useful Files

- [CLAUDE.md](CLAUDE.md) — the spec: schema, terminology, audience, non-features, code style. **Start here.**
- [design/BRAND.md](design/BRAND.md) — the visual system, source of truth
- [docs/POSITIONING.md](docs/POSITIONING.md) — strategy: audience, retention, monetization, and the order of work
- [docs/ORGANIZER_PLAYBOOK.md](docs/ORGANIZER_PLAYBOOK.md) — the one page handed to someone starting a Group
- [docs/LAUNCH.md](docs/LAUNCH.md) + [docs/PRESUBMISSION_CHECKLIST.md](docs/PRESUBMISSION_CHECKLIST.md) — the submission runbook and its tickable gates
- [todo.md](todo.md) — what's left
- [bugs.md](bugs.md) — the audit log
- `.claude/skills/` — per-surface conventions (`frontend-design`, `data-layer`, `db-migrations`, `edge-functions`, `verify-changes`); read the matching `SKILL.md` before working in that area
