# CLAUDE.md — Catch Up Column

## Project Overview

Catch Up Column is a mobile app where a friend group or a family collaborates on a private weekly newsletter — like a digital Sunday newspaper made by your own people. Members contribute short written entries (with optional photos) throughout the week, and at a set time the app compiles everything into a single "edition" delivered to the whole group.

## Target Audience

**Direction set 2026-09-14.** Full reasoning, and the work it implies, in
[`docs/POSITIONING.md`](docs/POSITIONING.md).

**Primary: post-grad friend groups.** Six to ten people who were close in one place and now live in five states. The pain isn't that they stopped caring — it's that there's no occasion. The group text is dead or it's memes; social media reports that their friends exist, not how they are. Catch Up Column manufactures the occasion.

**The community behind it** is people consciously leaving the attention economy who don't want to lose their friends in the process — the digital-minimalism / r/nosurf / Light Phone world. They supply the *organizer*: the one member who starts a Group and brings in six friends who have never heard of any of that and don't need to.

**Secondary, and still first-class: families.** Grandparents, parents, scattered siblings. Every feature must keep working for a family Group, and "The Williams Family Weekly" must still feel native. This is a generalization of the audience, not a replacement — do not strip family framing out, just stop assuming it.

What this means for the work:

- **The absence of engagement mechanics is the product, not a gap.** There are no likes, reactions, comments, or follower counts anywhere in the schema or migrations, and there is no feed. Never add them and never propose them as an improvement — they are precisely what this audience is leaving. See Non-features below.
- **The accessibility floor is not negotiable, and it isn't "the grandparent feature."** Minimum 16px body, ≥48px touch targets (rows ≥56px), high contrast, tested at larger system font sizes. Family Groups contain grandparents, and large readable type is good editorial design for everyone.
- **Simplicity over capability.** Think "family group text" ease of use, not "SaaS onboarding." A 26-year-old and their grandmother must both get through onboarding without asking anyone for help.

## Tech Stack

- **Frontend:** React Native with Expo (managed workflow) — **SDK 57** (upgraded from 54 on 2026-09-10)
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
│                           # NB: (tabs)/_layout.tsx imports Tabs from
│                           # 'expo-router/js-tabs' — the plain `expo-router`
│                           # export is deprecated as of SDK 57.
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
`compile_due_editions` (cron compilation, slot-scoped duplicate guard), `publish_edition_now` (moderator-only immediate publish, shares the compile lock), `join_group_by_invite_code`, `get_invite_preview` (anon-callable minimal invite preview: name/description/cover/member count), `get_invite_preview_details` (authenticated: adds cadence, is_member, member sample), `delete_group_as_moderator`, `remove_group_member` (moderator-only eject; also deletes the removed member's uncompiled posts), `prepare_account_deletion`, `get_edition_email_payload` (service-role; feeds the email renderer). Full definitions in `supabase/migrations/`.

## Key Terminology

Use this language consistently in code, UI, and comments:
- **Group** — a group newsletter (not "column" or "channel")
- **Edition** — a compiled weekly issue of a Group
- **Contributor** — a member of a Group who writes posts
- **Moderator** — the Group creator/admin
- **Post** — a single written entry by one contributor for one edition

**Audience vocabulary.** The app serves friend groups and families equally, so
user-facing copy must not assume either:
- **"your people"** — the default. Warm, true for both, and already the house phrase
  (`web/index.html`, the edition-email footer).
- **"family and friends"** — when you need to be explicit.
- **"family"** — only when the sentence is literally about a family.
- **Never "loved ones"** — greeting-card register, wrong for someone writing to
  college friends.

Existing copy is mid-migration: every site still saying "family" is listed in
[`docs/COPY_PASS.md`](docs/COPY_PASS.md). Match the convention above in new copy
rather than the surrounding code.

## MVP Features (in priority order)

1. **Auth** — Email/password signup and login via Supabase Auth. Keep onboarding to 3 screens max: create account → set display name & avatar → create or join a Group.
2. **Group creation & invites** — Moderator creates a Group, gets a shareable invite link/code. Others join via that link.
3. **Post composer** — Simple text editor with optional single photo upload. No rich text formatting in v1. Posts are tied to the current (unpublished) edition window.
4. **Weekly compilation** — A Supabase Edge Function runs on a cron schedule, groups all uncompiled posts for each Group into an Edition, and triggers delivery.
5. **Inbox / reading view** — Newspaper-styled layout showing the latest Edition. Each contributor's post is a "section." Prioritize readability and warmth.
6. **Email delivery** — When an Edition publishes, send an email to all Group members (via Resend). The email is a first-class design surface: full content including photos (signed URLs, 1-year TTL), brand-styled newspaper layout, content-led subject, and https links to `WEB_BASE_URL` (catchupcolumn.com). See `supabase/functions/_shared/edition-email.ts` and the `edge-functions` skill.

## Non-features

Two lists that are often confused. The first is permanent; the second is sequencing.

**Deliberately never.** Proposing these is a misread of the product:

- Likes, reactions, comments, follower/view counts, streaks, or any other engagement metric
- A feed, an algorithm, or any reading surface that isn't a compiled Edition
- Public posts, discovery, stranger pairing, public Groups
- Ads, data sale, or engagement-based monetization — third-party advertising was
  costed and rejected on 2026-09-15 (it needs ~10x the users of the print path for
  the same money, and requires per-recipient tracking the privacy policy promises
  does not exist). The arithmetic is in [`docs/POSITIONING.md`](docs/POSITIONING.md)
  §5 so it doesn't get relitigated. The Volume offer in the edition email is a
  house ad for our own object, not an exception to this.
- Writing prompts and timed exercises — Home's rotating `deckLines` are flavor copy in the paper's own voice, *not* prompts (see the comment in `constants/strings.ts`)
- AI "write for you" — the writing being yours is the entire point

**Not yet, but planned:**

- Physical print — **the primary revenue path as of 2026-09-14**, after research. A bound volume of ~12 editions, sold as an object for $89–99, never as access. Print-on-demand (Lulu's API: no setup fees, no inventory, dropship) removes the operational objection that briefly got this deferred. Nothing is ever withheld from a Group that doesn't buy. See [`docs/POSITIONING.md`](docs/POSITIONING.md) §5.
- **Friends distribute, families pay.** The revenue evidence in this category (Storyworth, Remento) is all family/gift purchase; no friend-group social app was found with meaningful direct revenue. This does **not** reverse the friends-first audience decision — friend groups are how users arrive, families are who buys the artifact, and the product already serves both first-class. POSITIONING.md §5.
- Subscriptions of any kind — ruled out, not deferred. Freemium converts at 2–5%, and reaching the same revenue that way needs ~25x the user base. See POSITIONING.md §5.
- Web composer — write without installing the app, via magic link from the weekly email. Gated on evidence; §4.
- Templates for post layouts
- Personalized reading recommendations

## Design & UX Guidelines

The full visual system lives in `design/BRAND.md` (source of truth for design decisions — update it as decisions evolve), with token values in `constants/`. The `frontend-design` skill (`.claude/skills/frontend-design/`) catches a session up before UI work. Headlines:

- **Accessibility first.** Minimum 16px body text, 48px touch targets (rows ≥56px), high contrast. Vermilion text only in bold small-caps kicker/stamp roles, never body copy. Test with larger system font sizes.
- **Editorial aesthetic (v2, 2026-07-17).** "NYT structure, HeyTea charm": near-monochrome ink-on-paper, hairline rules, no cards or pills for content. Serif: Lora; UI sans: Jost (same on every platform). Warmth comes from a hand-drawn monoline illustration world (the paperboy and his dog) that lives in app chrome only — never inside editions.
- **Near-monochrome palette.** Ink `#1A1A1A` on warm paper `paperWarm`, structure drawn with `hairline` rules, one scarce vermilion `#E8442E` accent (kickers, stamps, live moments — never fills or surfaces). Always use tokens from `constants/colors.ts` — never raw hex in components.
- **Minimal navigation.** 5-slot bottom bar: Home, Editions, raised ink-black "+" (opens the compose sheet), Groups, Profile. The Group create/join/detail flow lives off-tab under `app/group/`, reached from the Groups tab and Home. No hamburger menus or deep nesting.
- **Language tone.** Friendly, clear, non-technical. "Your Group is ready!" not "Edition #4 has been published." Say "Write something for this week" not "Create a new post." Never assume the Group is a family — see Audience vocabulary under Key Terminology.

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

# Lint the app (eslint-config-expo; does not cover supabase/functions)
npm run lint

# Type-check the edge functions (Deno; not covered by npm run typecheck)
find supabase/functions -name '*.ts' -print0 | xargs -0 deno check

# Render the edition-email fixtures (fails if one would hit Gmail's clip limit)
deno run --allow-write=preview-out supabase/functions/_shared/preview/render-email-fixtures.ts preview-out
```

All of the above run automatically in CI (`.github/workflows/ci.yml`) on every
PR, alongside a two-platform Metro bundle and — when SQL changes — a from-scratch
migration apply. See the `verify-changes` skill for what CI does and does not
cover.

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