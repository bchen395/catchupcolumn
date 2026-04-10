# CLAUDE.md — Catch Up Column

## Project Overview

Catch Up Column is a mobile app where families collaborate on a private weekly newsletter — like a digital Sunday newspaper made by your own family. Members contribute short written entries (with optional photos) throughout the week, and at a set time the app compiles everything into a single "edition" delivered to the whole group.

## Target Audience (MVP)

The primary audience is older adults (grandparents, older parents) who want to stay connected with younger family members. The app must be extremely simple and accessible — large tap targets, readable fonts, minimal navigation, warm familiar language. Think "family group text" ease of use, not "SaaS onboarding."

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
│   ├── (tabs)/             # Main tab navigator
│   │   ├── inbox.tsx       # Weekly editions reading view
│   │   ├── compose.tsx     # Write/edit a post for the week
│   │   ├── groups.tsx      # View and manage Columns (groups)
│   │   └── profile.tsx     # User profile and settings
│   └── _layout.tsx         # Root layout
├── components/             # Reusable UI components
├── lib/                    # Utilities, Supabase client, helpers
├── hooks/                  # Custom React hooks
├── constants/              # Colors, typography, layout values
├── supabase/
│   ├── migrations/         # SQL migration files
│   └── functions/          # Supabase Edge Functions
├── assets/                 # Fonts, images, icons
└── types/                  # Shared TypeScript types
```

## Database Schema

### users
- `id` (uuid, PK, matches Supabase auth.users.id)
- `display_name` (text, not null)
- `avatar_url` (text, nullable)
- `bio` (text, nullable, max 200 chars)
- `email` (text, not null)
- `created_at` (timestamptz)

### columns (groups/newsletters)
- `id` (uuid, PK)
- `name` (text, not null) — e.g. "The Williams Family Weekly"
- `description` (text, nullable)
- `cover_image_url` (text, nullable)
- `publish_day` (int, 0=Sunday..6=Saturday, default 0)
- `publish_time` (time, default '09:00')
- `created_by` (uuid, FK → users.id)
- `invite_code` (text, unique) — short code for invite links
- `created_at` (timestamptz)

### column_members
- `column_id` (uuid, FK → columns.id)
- `user_id` (uuid, FK → users.id)
- `role` (text, 'moderator' | 'contributor')
- `joined_at` (timestamptz)
- PK: (column_id, user_id)

### posts
- `id` (uuid, PK)
- `column_id` (uuid, FK → columns.id)
- `author_id` (uuid, FK → users.id)
- `body` (text, not null)
- `image_url` (text, nullable)
- `edition_id` (uuid, nullable, FK → editions.id) — null until compiled
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### editions (compiled weekly newsletters)
- `id` (uuid, PK)
- `column_id` (uuid, FK → columns.id)
- `edition_number` (int, not null)
- `published_at` (timestamptz)
- `created_at` (timestamptz)

## Key Terminology

Use this language consistently in code, UI, and comments:
- **Column** — a group newsletter (not "group" or "channel")
- **Edition** — a compiled weekly issue of a Column
- **Contributor** — a member of a Column who writes posts
- **Moderator** — the Column creator/admin
- **Post** — a single written entry by one contributor for one edition

## MVP Features (in priority order)

1. **Auth** — Email/password signup and login via Supabase Auth. Keep onboarding to 3 screens max: create account → set display name & avatar → create or join a Column.
2. **Column creation & invites** — Moderator creates a Column, gets a shareable invite link/code. Others join via that link.
3. **Post composer** — Simple text editor with optional single photo upload. No rich text formatting in v1. Posts are tied to the current (unpublished) edition window.
4. **Weekly compilation** — A Supabase Edge Function runs on a cron schedule, groups all uncompiled posts for each Column into an Edition, and triggers delivery.
5. **Inbox / reading view** — Newspaper-styled layout showing the latest Edition. Each contributor's post is a "section." Prioritize readability and warmth.
6. **Email delivery** — When an Edition publishes, send an email to all Column members with the content (via Resend).

## NOT in MVP (future phases)

- Public posts / discovery feed
- Writing prompts and timed exercises
- AI "write for you" feature
- Physical print/mail delivery
- Templates
- Pairing strangers / public groups
- Personalized recommendation engine

## Design & UX Guidelines

- **Accessibility first.** Minimum 16px body text, 48px touch targets, high contrast. Test with larger system font sizes.
- **Newspaper aesthetic.** Use serif fonts for edition headlines and reading view (e.g. Playfair Display or Lora). Sans-serif for UI chrome (e.g. Inter or system default).
- **Warm color palette.** Cream/warm white backgrounds, deep charcoal text, muted accent color (e.g. warm navy or burgundy). Avoid sterile whites and bright blues.
- **Minimal navigation.** 4 bottom tabs: Inbox, Compose, My Columns, Profile. No hamburger menus or deep nesting.
- **Language tone.** Friendly, clear, non-technical. "Your Column is ready!" not "Edition #4 has been published." Say "Write something for this week" not "Create a new post."

## Supabase Setup Notes

- Enable Row Level Security (RLS) on all tables.
- RLS policies: users can only read/write posts in Columns they belong to. Only moderators can edit Column settings. Users can only edit their own posts and profile.
- Use Supabase Storage for avatar and post images. Create two buckets: `avatars` (public) and `post-images` (authenticated access scoped to Column members).
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
```

## Code Style

- Functional components with hooks only (no class components).
- Prefer `const` arrow functions for components: `const MyComponent = () => { ... }`
- Use TypeScript strict mode. Define types in `types/` and import them — avoid inline `any`.
- Colocate styles using StyleSheet.create() at the bottom of component files.
- Name files in kebab-case (`post-composer.tsx`), components in PascalCase (`PostComposer`).
- Keep components small. If a component exceeds ~150 lines, break it up.