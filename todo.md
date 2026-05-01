# TODO.md — Catch Up Column Build Phases

Refer to CLAUDE.md for full spec, schema, design guidelines, and code style.
Mark phases as [x] when complete. Work through them in order.

---

## Phase 1: Project Skeleton
- [x] Scaffold Expo project with Router template (TypeScript)
- [x] Install dependencies, set up Supabase client with secure token storage
- [x] Write initial database migration (all 5 tables, RLS policies, storage buckets)
- [x] Set up root layout with font loading and auth state routing
- [x] Create tab navigator with placeholder screens
- [x] Define constants (colors, typography, layout) and shared TypeScript types

**Test:** App boots, shows placeholder tabs when logged out it redirects to auth stack.

---

## Phase 2: Auth & Onboarding
- [x] Sign up screen (email + password)
- [x] Log in screen
- [x] Onboarding screen: set display name + avatar (photo picker → upload to `avatars` bucket)
- [x] Auth error handling (clear, non-technical messages)
- [x] "Forgot password" flow via Supabase magic link

**Test:** Can sign up, set a name/avatar, land on the main tabs. Can log out and log back in.

---

## Phase 3: Group Creation & Invites
- [x] "Create a Group" flow: name, description, optional cover image, pick publish day/time
- [x] Generate invite code on creation, show shareable invite link
- [x] "Join a Group" screen: enter invite code or open a deep link
- [x] My Groups tab: list of Groups the user belongs to, tap to view details
- [x] Group detail screen: member list, settings (moderator only), leave group

**Test:** Can create a Group, invite another test account, both see the Group in their list.

---

## Phase 4: Post Composer
- [x] Compose tab: simple text input + optional photo upload to `post-images` bucket
- [x] Select which Group to post to (if member of multiple)
- [x] Show current draft / already-submitted post for this week's edition window
- [x] Edit and delete own posts before the edition publishes
- [x] Character guidance (not a hard limit, but a gentle nudge around 500 words)

**Test:** Can write a post with a photo, see it saved, edit it, delete it.

---

## Phase 5: Weekly Edition Compilation
- [x] Supabase Edge Function: compile all unassigned posts for a Group into a new Edition
- [x] Cron trigger based on each Group's `publish_day` and `publish_time`
- [x] Edition data structure: ordered list of posts with author info
- [x] Handle edge cases: no posts this week (send a "no edition" notice or skip), Group with one member

**Test:** Manually trigger the function, verify an Edition is created with the correct posts linked.

---

## Phase 6: Inbox & Reading View
- [x] Inbox tab: list of Editions, newest first, grouped by Group
- [x] Edition reading view: newspaper-styled layout with serif headlines, each post as a "section"
- [x] Show author name, avatar, and photo for each post section
- [x] Empty state: "No editions yet — write something for your Group this week!"
- [x] Pull-to-refresh

**Test:** Open the Inbox, see a compiled Edition, read through it. Feels like reading a family newspaper.

---

## Phase 7: Email Delivery
- [ ] Integrate Resend for transactional email
- [ ] When an Edition publishes, email all Group members with the content
- [ ] Email template: clean, readable, newspaper-styled HTML email
- [ ] Include a deep link back to the app to read the full edition
- [ ] Unsubscribe option per Group

**Test:** Edition publishes, all members receive a well-formatted email.

---

## Phase 8: Polish & Launch Prep
- [ ] Loading screen with newspaper-themed animation (as described in app screens doc)
- [ ] Push notifications: "Your Group is ready!" on edition publish
- [ ] Onboarding improvements based on testing with a real family member
- [ ] Error states and empty states for every screen
- [ ] App icon, splash screen, App Store / Play Store metadata
- [ ] Performance pass: image optimization, lazy loading

**Test:** Hand the app to a non-technical family member. Can they sign up, join a Column, write a post, and read an edition without asking you for help?

---

## Future (post-MVP, not yet planned in detail)
- Writing prompts (app-generated and moderator-created)
- Public Groups and discovery feed
- Physical print/mail editions
- Templates for post layouts
- AI "write for you" feature
- Stranger pairing and public groups
- Personalized reading recommendations