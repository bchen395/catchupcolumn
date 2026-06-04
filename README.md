# Catch Up Column

A private weekly newsletter you write together with family and friends. Members write short updates (with optional photos) throughout the week, and on each group's publish day everything gets compiled into a single "edition" — delivered in‑app, by push, and by email.

The MVP is aimed at older adults and small friend groups who want something warmer and more deliberate than a group chat. Design priorities: large tap targets, readable serif type, minimal navigation, "newspaper on the kitchen counter" feel.

## Status

The app is feature‑complete through MVP Phase 7 of [todo.md](todo.md) and into Phase 8 polish. What's working today:

- Email + password auth, password reset, 3‑screen onboarding (account → name/avatar → create/join group)
- Group creation, invite codes, join‑by‑code, member list, leave/remove, moderator‑only settings
- Post composer with single‑photo upload, current‑draft surfacing, edit/delete before publish
- Weekly compilation via Supabase Edge Function on a 15‑minute cron, scoped by each group's `publish_day` / `publish_time` / `timezone`
- Inbox + newspaper‑styled edition reading view with pull‑to‑refresh
- Transactional email via Resend with per‑group unsubscribe tokens
- Push notifications on edition publish, deep‑linked to the edition view
- Account deletion (with moderator handoff) via RPC + edge function

Still open: store icons / splash polish, App Store and Play Store metadata, an end‑to‑end performance pass. See [todo.md](todo.md) for the full checklist and [bugs.md](bugs.md) for known issues.

## Tech Stack

- **Mobile:** React Native 0.81 + Expo SDK 54 (managed workflow), Expo Router 6 with typed routes
- **Language:** TypeScript (strict), path alias `@/*` → repo root
- **Backend:** Supabase — Postgres + RLS, Auth, Storage, Edge Functions (Deno)
- **Email:** Resend
- **Push:** Expo Notifications (token registered server‑side, pushes sent from the edge function)
- **Fonts:** Superclarendon + Futura on iOS (system); Roboto Slab + Jost on Android/web via `@expo-google-fonts`

## Repo Layout

```
app/                       Expo Router file-based routes
  (auth)/                  login, signup, onboarding, reset-password
  (tabs)/                  home, inbox, post (compose), mail, profile
  group/                   create, join, [id] detail
  edition/[id].tsx         newspaper-styled reading view
components/                Reusable UI (themed-text, edition-post, tab bar, etc.)
constants/                 colors, typography, layout, strings, icons, loading
hooks/                     use-auth, use-post-image-url
lib/                       supabase client + domain modules (auth, groups,
                           posts, editions, notifications, image)
types/                     Shared DB + domain types
supabase/
  migrations/              22 SQL migrations (schema → security hardening)
  functions/
    compile-editions/      Cron-driven compile + email + push
    delete-account/        Auth-aware account deletion
    unsubscribe/           Token-based per-group unsubscribe endpoint
    _shared/               Shared HTML email rendering
design/                    BRAND.md, implementation plan, logo assets
assets/                    Brand logo, app icons, splash, fonts
```

## Getting Started

### Prerequisites

- Node 18+ and npm
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
npx supabase functions deploy delete-account
npx supabase functions deploy unsubscribe
```

Set the function secrets:

```bash
npx supabase secrets set \
  CRON_SECRET=<shared-secret-for-manual-invocations> \
  RESEND_API_KEY=<resend-api-key> \
  FUNCTIONS_PUBLIC_URL=https://<project-ref>.supabase.co/functions/v1 \
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

- **Palette:** warm paper background (`#FAF7F2`), orange primary (`#FF7237`), peach surfaces (`#FFD3C2`), yellow accent (`#F4E33A`), high‑contrast ink text.
- **Type:** Superclarendon (display serif) + Futura (body sans) on iOS; Roboto Slab + Jost as the cross‑platform fallback. Pick families from `Typography.families` in [constants/typography.ts](constants/typography.ts) — don't hardcode font names.
- **Tokens:** semantic only. Use `Colors.ink` / `Colors.paperWarm`, never raw hex; use `Layout.padding.*`, `Layout.borderRadius.*`, and `Layout.touchTargetMin` (48 px floor) at component sites.

## Conventions

- Functional components with hooks; arrow‑function `const` exports.
- Files in kebab‑case (`edition-post.tsx`), components in PascalCase.
- `StyleSheet.create()` colocated at the bottom of each component file.
- Keep components under ~150 lines; break out helpers into `components/` or `lib/`.
- TypeScript strict mode — no inline `any`. DB row/insert/update types live in [types/database.ts](types/database.ts).

## Useful Files

- [CLAUDE.md](CLAUDE.md) — full project spec, schema, terminology, MVP scope
- [todo.md](todo.md) — build phases and what's left
- [bugs.md](bugs.md) — known issues
- [design/BRAND.md](design/BRAND.md) — colors, typography, and component intent
- [design/BRAND_IMPLEMENTATION_PLAN.md](design/BRAND_IMPLEMENTATION_PLAN.md) — branding migration tracker
