---
name: frontend-design
description: Use when making any UI, visual, or frontend change in the Catch Up Column app — new screens or components, restyling, typography, color, spacing, icons, animations, user-facing copy, or anything touching components/, constants/, or screen files in app/. Catches the session up on the design system and where it lives.
---

# Frontend design — Catch Up Column

You're working on the UI of a family-newsletter app built for older adults and Gen Z friend groups. The identity (v2, 2026-07-17): *"The New York Times' structure with HeyTea's charm"* — a near-monochrome, hairline-ruled editorial frame (ink on warm paper, Lora + Jost, one scarce vermilion accent), warmed exclusively by a hand-drawn monoline illustration world (the paperboy and his dog) that lives in app chrome only. Warmth and accessibility beat polish and density every time.

**Migration state:** the v2 reskin has reached **every screen**, illustration phase included (BRAND §14 lists what landed). All v1 color tokens are deleted — there is no orange/peach/yellow/green anywhere. The monoline SVG set lives under `components/illustrations/` (one file per asset, `Colors.illustrationInk` strokes, `aria-hidden` wrapper Views); the splash/app-icon PNGs are generated from the same rider geometry as `paperboy-mark.tsx` — regenerate them together if the mark changes. The one remaining v2 loose end: redefining `caption` to the 12px spec once the last v1 caption usages migrate.

## Read first (sources of truth, in order)

1. **`design/BRAND.md`** — the design system: brand, palette, typography, component idioms, screen-level intent. *Decisions* live here. Read the section(s) relevant to the surface you're touching before changing it.
2. **`constants/`** — token *values* live in code, never in docs:
   - `colors.ts` — v2 palette (ink/vermilion/paper/hairline) — the v1 tokens are deleted. Never write a raw hex in a component.
   - `typography.ts` — Lora + Jost (identical on all platforms) and the v2 `scale` (exposed as ThemedText variants); legacy `sizes`/`lineHeights` linger where no scale token fits yet.
   - `layout.ts` — spacing, radii (read the Shape Consistency Lock comment), rule weights (`Layout.rule`), row/button heights, input metrics, shadows.
   - `icons.ts` — semantic icon registry. Add glyphs there, reference by key.
   - `strings.ts` — reusable, tone-sensitive user-facing copy (incl. `Strings.thisWeek`, the weekly-ritual voice).
   - `loading.ts` — printing-press loader knobs.
   - `motion.ts` — animation durations + easing, and the house motion style comment (BRAND §11).
3. **`lib/haptics.ts`** — the three haptic verbs (`tap`/`select`/`confirm`) and when each fires (BRAND §11).

**Conflict rule:** CLAUDE.md carries only a headline summary of the design system (synced 2026-07-17). If it ever disagrees with BRAND.md or `constants/`, those win — they're updated most often. Re-sync CLAUDE.md's summary when the drift is user-visible (fonts, palette, navigation).

## Hard rules

- All text renders through `ThemedText`; pick a v2 variant (`meta`, `kicker`, `ui`, `uiStrong`, `deck`, `read`, `rowTitle`, `title`, `headline`, `display`) before reaching for inline font styles. Legacy variants (`subheadline`, `body`, `serifBody`, `caption`, `label`) survive where no v2 token fits yet — shrink their use, don't grow it.
- Tokens only: no raw hex, no hardcoded radii (use `Layout.borderRadius` — `full`, not 999), no ad-hoc rules or shadows (`Layout.rule`, `Layout.shadow.*`; elevation only for true overlays — content never floats).
- **The vermilion budget (BRAND §2):** vermilion is for kickers, stamps, live/new moments, and links. It never fills a button, never tints a surface, never colors an icon set, never enters the tab bar; max ~2 appearances per screen. Body/UI text is `ink`/`inkSoft` only.
- Accessibility floors: 16px minimum body text, `Layout.touchTargetMin` (48px) tap targets and `Layout.rowMinHeight` (56px) rows.
- Surfaces: `paperWarm` app background everywhere; pure `paper` only for true overlays (sheets, modals) and the tab bar. No cards, pills, or tinted slabs for content — structure is drawn with hairlines.
- Photos are flat editorial (BRAND §5): square corners, no rotation, `hairline` edge on `paperWarm`; avatars are the only round photos. Illustration is chrome-only — never on edition surfaces, always decorative/hidden from screen readers.
- Pressed states: 92% opacity on filled controls, ~0.7 opacity on content blocks — never new colors.
- Styles in `StyleSheet.create()` at the bottom of the file; break up components past ~150 lines.
- Tone: warm and plain-spoken ("Write something for this week"), never technical or apologetic.
- Motion: durations from `Motion.duration`, never hardcoded ms; ease-out timing, no springs (sole exception: the compose sheet); every animation respects Reduce Motion. The loader's knobs stay in `loading.ts`.
- Haptics only through `lib/haptics.ts`'s three verbs — `tap` for key actions, `select` for value changes (never on re-selecting the same value), `confirm` reserved for save/publish moments. When in doubt, no haptic.
- Engagement = ritual devices (datelines, stamps, bylines), never gamification — no streaks, badges, counters, or confetti (BRAND §10, rejected on principle).

## Component inventory — check here before building anything new

| Component | Reach for it when |
| --- | --- |
| `themed-text` | Any text, anywhere. |
| `themed-view` | A `paperWarm` surface; `card` = paper + hairline edge, for boxed overlay content only. |
| `app-image` | Any image — expo-image wrapper with fade-in, caching, quiet ink-wash placeholder. |
| `icon` | Rendering an `IconDescriptor` from `constants/icons.ts`. |
| `editorial-photo` | Any user photo (BRAND §5): flat, square, hairline edge, optional "Photo by Ruth" credit. Replaces the deleted polaroid. |
| `illustrations/rolled-paper-glyph` | The colophon/masthead dingbat — the one sanctioned inked mark on editorial surfaces. |
| `illustrations/paperboy-mark` | The brand mark: paperboy on his bike (vermilion cap). Exports wheel geometry + `WheelSpokes` so the loader can spin the wheels. |
| `illustrations/paperboy-mailbox-scene` | Empty-editions doodle: the paperboy waiting at a flag-down mailbox. |
| `illustrations/dog-with-paper-scene` | No-groups doodle: the dog holding a rolled paper (vermilion wrap band). |
| `illustrations/printing-press-scene` | The long-wait scene (vermilion lever knob). Exports `FlywheelSpokes`/`PressSheet` for the loader's animation. |
| `illustrations/invite-ticket` | The §11 perforated ticket: drawn frame + dog stub, live-text code (Jost Bold, vermilion). Lives inside `invite-family-card`. |
| `illustrations/sketch-border` | The §11 wobbly announcement frame — special announcements only, never list content, never twice per screen. |
| `illustrations/sleeping-dog-doodle` / `mug-doodle` | §11 hidden corner doodles (editions-list end, profile footer). ≤48px tall, never animated. |
| `edition-lead` | The front-page lead story block (vermilion kicker — the cover's one accent, headline, byline, excerpt, read cue). |
| `edition-secondary` | The cover's second story — mid-weight: optional photo, `title` headline, excerpt, read cue. |
| `edition-brief-column` | One cell of the "IN BRIEF" grid (`rowTitle` headline, byline, 14px excerpt). |
| `edition-briefs-grid` | The "IN BRIEF" section: labeled rule header + two-column rows with hairline rules; odd last brief runs full-width. Reports tapped-cell frames for the enlarge overlay. |
| `story-article` | One full post in the reader: headline, avatar byline, credited photo, lettrine body. |
| `story-reader` | Host-agnostic reader body + Next/Previous paging; rendered by both the `[postId]` route and the enlarge overlay. |
| `story-reader-overlay` | The enlarge transition: tapped cover section grows into the full-screen reader (Modal + reanimated); reverse-shrinks on close. |
| `custom-tab-bar` | The 5-slot bar with the raised ink-black "+". |
| `compose-sheet-provider` / `compose-group-sheet` | The "write for…" group-picker sheet the "+" opens. |
| `empty-state` / `error-state` | Lora Bold headline + Jost body + ink-pill CTA. `EmptyState` takes a §4 doodle `scene` (falls back to a plain ink icon); error states keep the quiet `error`-color icon. Copy from `Strings`. |
| `status-banner` | Text-first hairline band (BRAND §9): kicker voice + one Jost line. Success wears the info dress. |
| `ink-stamp` | The §11 stamp system — one recipe, faces by props: FILED (tilt −4, 'moment'), JOINED (tilt +3, 'record'). Never two stamps on one screen. |
| `printing-press-loading` | Branded loading screen: `ride` (paperboy, wheels spin — default) and `press` (flywheel + sheets, for compile/publish waits). Static under Reduce Motion; retune via `constants/loading.ts`, not the component. |
| `form-field` / `form-button` | Inputs and buttons in auth, group, and settings forms. |
| `auth-screen-shell` | Shared chrome for auth/onboarding screens. |
| `group-card` | A Group row/card in lists. |
| `avatar-picker` | Profile avatar selection. |
| `day-selector` | The 7-day publish-day picker (create-group and settings share it). |
| `time-picker-modal` / `snap-column` | Scroll-wheel time picker (`snap-column` is its internal wheel). |
| `this-week-strip` | Home's rule-framed dateline: next publish moment + who's written (never who hasn't). |
| `invite-hero` | The invitation as a one-page special edition (vermilion kicker, `display` masthead, flat cover photo, member byline, cadence dateline). |
| `avatar-stack` | Overlapping member faces for the invitation byline; decorative (hidden from screen readers). |
| `pending-invite-banner` | The hairline-band "Joining {name}" strip on auth screens while an invite is pending. |
| `invite-family-card` | The group screen's sender-side invite card: tap-to-copy code, code-first share, QR on a hard-white paper card. |

## Decisions newer than BRAND.md (drift notes)

The implementation has evolved past `design/BRAND.md` in these places. **Treat the code as correct**; fold a note into BRAND.md when you touch its section, then delete it here.

- **The center "+" opens a sheet, not a tab.** It opens `compose-group-sheet` to pick a Group first, then routes to Compose. Evolves BRAND §7.
- **Tab icons bypass `constants/icons.ts`.** `custom-tab-bar.tsx` keeps its own outline glyphs in a local `TAB_META`. Known inconsistency with the registry — if you consolidate, registry wins.
- **The Inbox tab is labeled "Editions."**
- **`caption` is still the v1 16px variant.** Most v1 caption usages become `meta` under v2; once they've migrated, redefine `caption` to `Typography.scale.caption` (Jost 12) per BRAND §3.

## Workflow for a UI change

1. Read the relevant BRAND.md section(s) and check the drift notes above.
2. Find precedent: an existing screen or component solving a similar problem; match its idiom.
3. Compose from the inventory before writing new primitives.
4. New reusable copy → `constants/strings.ts`. New glyphs → `constants/icons.ts`. New tokens → the right `constants/` file, with a comment explaining the *why* (this codebase documents rationale in token comments — keep that up).
5. Sanity-check at larger system font sizes; dynamic type must keep the 16px floor.

## Keep this skill alive (self-maintenance)

Before finishing any session that established, reversed, or refined a design decision — without being asked:

- Put the **decision and its rationale** in `design/BRAND.md`, in the relevant section.
- Update **this file** only if the inventory, hard rules, or drift notes changed.
- **Clear a drift note** once it's folded into BRAND.md.
- If a direction was tried and rejected, record that in BRAND.md too — rejected paths are decisions.
