# CLAUDE.md — Catch Up Column

## Project Overview

Catch Up Column is a mobile app where families and friends collaborate on a private weekly newsletter — like a digital Sunday newspaper made by your own family/friend group. Members contribute short written entries (with optional photos) throughout the week, and at a set time the app compiles everything into a single "edition" delivered to the whole group.

## Target Audience (MVP)

The primary audience is older adults (grandparents, older parents) who want to stay connected with younger family members and Gen Z friend groups who want to have more meaningful digital interactions. The app must be extremely simple and accessible — large tap targets, readable fonts, minimal navigation, warm familiar language. Think "family group text" ease of use, not "SaaS onboarding."

## Tech Stack

- **Frontend:** React Native with Expo (managed workflow)
- **Backend:** Supabase (Postgres DB, Auth, Storage, Edge Functions)
- **Email Delivery:** Resend (for sending weekly edition emails)
- **Language:** TypeScript throughout

## Project Structure

```
catch-up-column/
├── app/                    # Expo Router file-based routing
│   ├── (auth)/             # Auth screens (login, signup, onboarding)
│   ├── (tabs)/             # Main tab navigator (5 slots, raised center "+")
│   │   ├── home.tsx        # Home — brandmark, latest edition, entry to Groups
│   │   ├── inbox.tsx       # "Editions" tab — weekly editions list
│   │   ├── post.tsx        # Compose — reached via the center "+" sheet
│   │   ├── groups.tsx      # "Groups" tab — list of Groups you belong to
│   │   └── profile.tsx     # User profile and settings
│   ├── edition/[id]/       # Edition reading screens (front page + story reader)
│   ├── group/              # Group create/join/detail screens
│   └── _layout.tsx         # Root layout
├── components/             # Reusable UI components
├── lib/                    # Utilities, Supabase client, helpers
├── hooks/                  # Custom React hooks
├── constants/              # Design tokens: colors, typography, layout, icons, strings
├── design/                 # BRAND.md — visual system source of truth
├── supabase/
│   ├── migrations/         # SQL migration files
│   └── functions/          # Supabase Edge Functions
├── assets/                 # Fonts, images, icons
└── types/                  # Shared TypeScript types
```

## Database Schema

Summary of the live schema. Sources of truth: `supabase/migrations/` (full DDL, RLS, RPCs) and `types/database.ts` (client-visible TS mirror — server-only delivery columns are intentionally absent there).

### users
- `id` (uuid, PK, matches Supabase auth.users.id)
- `display_name` (text, not null)
- `avatar_url` (text, nullable)
- `bio` (text, nullable, max 200 chars)
- `email` (text, not null)
- `created_at` (timestamptz)

### groups (group newsletters)
- `id` (uuid, PK)
- `name` (text, not null) — e.g. "The Williams Family Weekly"
- `description` (text, nullable)
- `cover_image_url` (text, nullable)
- `publish_day` (int, 0=Sunday..6=Saturday, default 0)
- `publish_time` (time, default '09:00')
- `timezone` (text, not null, default 'UTC') — IANA name; publish_day/time are evaluated in this zone
- `created_by` (uuid, FK → users.id)
- `invite_code` (text, unique) — short code for invite links
- `created_at` (timestamptz)

### group_members
- `group_id` (uuid, FK → groups.id)
- `user_id` (uuid, FK → users.id)
- `role` (text, 'moderator' | 'contributor')
- `email_subscribed` (boolean, default true) — per-Group edition-email opt-out
- `unsubscribe_token` (uuid, unique) — sole identifier in unsubscribe links
- `push_subscribed` (boolean, default true) — per-Group push opt-out
- `joined_at` (timestamptz)
- PK: (group_id, user_id)

### posts
- `id` (uuid, PK)
- `group_id` (uuid, FK → groups.id)
- `author_id` (uuid, FK → users.id)
- `title` (text, nullable, max 80 chars) — optional headline; UI falls back to a "From {first name}" byline
- `body` (text, not null)
- `image_url` (text, nullable)
- `edition_id` (uuid, nullable, FK → editions.id) — null until compiled
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### editions (compiled weekly newsletters)
- `id` (uuid, PK)
- `group_id` (uuid, FK → groups.id)
- `edition_number` (int, not null)
- `published_at` (timestamptz)
- `created_at` (timestamptz)
- Delivery tracking (server-only, not in `types/database.ts`): `emailed_at`, `email_attempts`, `email_claim_at` and `pushed_at`, `push_attempts`, `push_claim_at` — sent-marker, retry count, and worker-claim timestamp for email and push respectively

### push_tokens
- `user_id` (uuid, FK → users.id, cascade delete)
- `token` (text, not null) — device push token
- `platform` (text, 'ios' | 'android' | 'web')
- `created_at` (timestamptz)
- PK: (user_id, token)

### Notable RPCs
`compile_due_editions` (cron compilation, slot-scoped duplicate guard), `publish_edition_now` (moderator-only immediate publish, shares the compile lock), `join_group_by_invite_code`, `get_invite_preview` (anon-callable minimal invite preview: name/description/cover/member count), `get_invite_preview_details` (authenticated: adds cadence, is_member, member sample), `delete_group_as_moderator`, `prepare_account_deletion`, `get_edition_email_payload` (service-role; feeds the email renderer). Full definitions in `supabase/migrations/`.

## Key Terminology

Use this language consistently in code, UI, and comments:
- **Group** — a group newsletter (not "column" or "channel")
- **Edition** — a compiled weekly issue of a Group
- **Contributor** — a member of a Group who writes posts
- **Moderator** — the Group creator/admin
- **Post** — a single written entry by one contributor for one edition

## MVP Features (in priority order)

1. **Auth** — Email/password signup and login via Supabase Auth. Keep onboarding to 3 screens max: create account → set display name & avatar → create or join a Group.
2. **Group creation & invites** — Moderator creates a Group, gets a shareable invite link/code. Others join via that link.
3. **Post composer** — Simple text editor with optional single photo upload. No rich text formatting in v1. Posts are tied to the current (unpublished) edition window.
4. **Weekly compilation** — A Supabase Edge Function runs on a cron schedule, groups all uncompiled posts for each Group into an Edition, and triggers delivery.
5. **Inbox / reading view** — Newspaper-styled layout showing the latest Edition. Each contributor's post is a "section." Prioritize readability and warmth.
6. **Email delivery** — When an Edition publishes, send an email to all Group members (via Resend). The email is a first-class design surface: full content including photos (signed URLs, 1-year TTL), brand-styled newspaper layout, content-led subject, and https links to `WEB_BASE_URL` (catchupcolumn.com). See `supabase/functions/_shared/edition-email.ts` and the `edge-functions` skill.

## NOT in MVP (future phases)

- Public posts / discovery feed
- Writing prompts and timed exercises
- AI "write for you" feature
- Physical print/mail delivery
- Templates
- Pairing strangers / public groups
- Personalized recommendation engine

## Design & UX Guidelines

The full visual system lives in `design/BRAND.md` (source of truth for design decisions — update it as decisions evolve), with token values in `constants/`. The `frontend-design` skill (`.claude/skills/frontend-design/`) catches a session up before UI work. Headlines:

- **Accessibility first.** Minimum 16px body text, 48px touch targets, high contrast. Never set body copy in orange (fails AA below 18px). Test with larger system font sizes.
- **Newspaper aesthetic.** Display slab serif: Superclarendon (iOS) / Roboto Slab (Android, web). UI sans: Futura (iOS) / Jost (Android, web). Taped polaroid photos, paper-grain texture, warm paper shadows.
- **Warm color palette.** Orange `#FF7237` primary, peach + yellow accents, warm off-white (`paperWarm`) app background, black ink text. Always use tokens from `constants/colors.ts` — never raw hex in components.
- **Minimal navigation.** 5-slot bottom bar: Home, Editions, raised orange "+" (opens the compose sheet), Groups, Profile. The Group create/join/detail flow lives off-tab under `app/group/`, reached from the Groups tab and Home. No hamburger menus or deep nesting.
- **Language tone.** Friendly, clear, non-technical. "Your Group is ready!" not "Edition #4 has been published." Say "Write something for this week" not "Create a new post."

## Supabase Setup Notes

- Enable Row Level Security (RLS) on all tables.
- RLS policies: users can only read/write posts in Groups they belong to. Only moderators can edit Group settings. Users can only edit their own posts and profile.
- Use Supabase Storage for avatar and post images. Create two buckets: `avatars` (public) and `post-images` (authenticated access scoped to Group members).
- Use Supabase Edge Functions for the weekly cron compilation job.

## Commands

```bash
# Start dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Create a new Supabase migration
npx supabase migration new <name>

# Apply migrations
npx supabase db push

# Deploy edge functions
npx supabase functions deploy <function-name>

# Type-check the app (strict, no emit; does not cover supabase/functions)
npm run typecheck
```

## Code Style

- Functional components with hooks only (no class components).
- Prefer `const` arrow functions for components: `const MyComponent = () => { ... }`
- Use TypeScript strict mode. Define types in `types/` and import them — avoid inline `any`.
- Colocate styles using StyleSheet.create() at the bottom of component files.
- Name files in kebab-case (`post-composer.tsx`), components in PascalCase (`PostComposer`).
- Keep components small. If a component exceeds ~150 lines, break it up.

## Agent Skills

Reusable Claude Code skills live in `.claude/skills/`. Each auto-loads when a session touches its surface (via the skill's `description`) — read the matching `SKILL.md` before working in that area.

| Skill | Read it before touching… |
| --- | --- |
| `frontend-design` | Any UI: `components/`, `constants/`, screens in `app/`, styling, copy, icons, animation. |
| `data-layer` | App-side Supabase access: `lib/` data functions, queries, mutations, storage uploads, `types/database.ts`. |
| `db-migrations` | `supabase/migrations/` — tables, RLS, SECURITY DEFINER functions/RPCs, triggers, storage policies, cron. |
| `edge-functions` | `supabase/functions/` — the Deno cron compiler, manual publish, unsubscribe, delete-account, shared email/push dispatch. |
| `verify-changes` | Before declaring a change done — the typecheck + manual-QA checklist (there is no automated test suite yet). |

Skills are self-maintaining: when a convention changes, update the relevant `SKILL.md` and its source of truth (`design/BRAND.md`, `types/database.ts`, or this file) in the same change.