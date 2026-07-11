---
name: frontend-design
description: Use when making any UI, visual, or frontend change in the Catch Up Column app — new screens or components, restyling, typography, color, spacing, icons, animations, user-facing copy, or anything touching components/, constants/, or screen files in app/. Catches the session up on the design system and where it lives.
---

# Frontend design — Catch Up Column

You're working on the UI of a warm, paperish family-newsletter app built for older adults and Gen Z friend groups. The identity: a digital Sunday newspaper that feels like newsprint on a kitchen counter — heavy slab serifs, warm off-white, orange/peach/yellow brand palette, taped polaroid photos, subtle paper grain. Warmth and accessibility beat polish and density every time.

## Read first (sources of truth, in order)

1. **`design/BRAND.md`** — the design system: brand, palette, typography, component idioms, screen-level intent. *Decisions* live here. Read the section(s) relevant to the surface you're touching before changing it.
2. **`constants/`** — token *values* live in code, never in docs:
   - `colors.ts` — palette. Never write a raw hex in a component.
   - `typography.ts` — platform-conditional families (iOS: Superclarendon/Futura; Android/web: Roboto Slab/Jost) + type scale.
   - `layout.ts` — spacing, radii (read the Shape Consistency Lock comment), input metrics, warm paper shadows.
   - `icons.ts` — semantic icon registry. Add glyphs there, reference by key.
   - `strings.ts` — reusable, tone-sensitive user-facing copy (incl. `Strings.thisWeek`, the weekly-ritual voice).
   - `loading.ts` — printing-press loader knobs.
   - `motion.ts` — animation durations + easing, and the house motion style comment (BRAND §11).
3. **`lib/haptics.ts`** — the three haptic verbs (`tap`/`select`/`confirm`) and when each fires (BRAND §11).

**Conflict rule:** CLAUDE.md carries only a headline summary of the design system (synced 2026-06-04). If it ever disagrees with BRAND.md or `constants/`, those win — they're updated most often. Re-sync CLAUDE.md's summary when the drift is user-visible (fonts, palette, navigation).

## Hard rules

- All text renders through `ThemedText`; pick a variant (`headline`, `subheadline`, `body`, `serifBody`, `caption`, `label`) before reaching for inline font styles.
- Tokens only: no raw hex, no hardcoded radii (use `Layout.borderRadius` — `full`, not 999), no ad-hoc shadows (use `Layout.shadow.paper` / `paperRaised` — shadows are warm brown, not black, on purpose).
- Accessibility floors: 16px minimum body text, `Layout.touchTargetMin` (48px) tap targets, and never set body copy in `orange` — it fails WCAG AA below 18px. `orange` is for headings, links, and interactive elements.
- Surfaces: `paperWarm` app background everywhere; pure `paper` only for elevated cards and modals. Don't stack white on white.
- Pressed states: `Colors.orange + 'CC'` on filled controls, or opacity ~0.7 on content blocks — not new colors.
- Styles in `StyleSheet.create()` at the bottom of the file; break up components past ~150 lines.
- Tone: warm and plain-spoken ("Write something for this week"), never technical or apologetic.
- Motion: durations from `Motion.duration`, never hardcoded ms; ease-out timing, no springs (sole exception: the compose sheet); every animation respects Reduce Motion. The loader's knobs stay in `loading.ts`.
- Haptics only through `lib/haptics.ts`'s three verbs — `tap` for key actions, `select` for value changes (never on re-selecting the same value), `confirm` reserved for save/publish moments. When in doubt, no haptic.
- Engagement = ritual devices (datelines, stamps, bylines), never gamification — no streaks, badges, counters, or confetti (BRAND §10, rejected on principle).

## Component inventory — check here before building anything new

| Component | Reach for it when |
| --- | --- |
| `themed-text` | Any text, anywhere. |
| `themed-view` | A `paperWarm` surface or `peach` card wrapper. |
| `app-image` | Any image — expo-image wrapper with fade-in, caching, peach placeholder. |
| `icon` | Rendering an `IconDescriptor` from `constants/icons.ts`. |
| `paper-grain` | Printed-paper texture; drop as last child of a relative surface. Never intercepts touches. |
| `polaroid-photo` | Any user photo: tape, tilt, chin, italic serif caption. Vary `rotate` per use so no two sit at the same angle. |
| `edition-lead` | The front-page lead story block (kicker, headline, byline, 17px excerpt, read cue). |
| `edition-secondary` | The cover's second story — mid-weight: optional polaroid, 28px headline, 14px excerpt, read cue. |
| `edition-brief-column` | One text-only cell of the "IN BRIEF" grid (18px headline, byline, 14px excerpt). |
| `edition-briefs-grid` | The "IN BRIEF" section: labeled rule header + two-column rows with hairline rules; odd last brief runs full-width. Reports tapped-cell frames for the enlarge overlay. |
| `story-article` | One full post in the reader: headline, avatar byline, polaroid, lettrine body. |
| `story-reader` | Host-agnostic reader body + Next/Previous paging; rendered by both the `[postId]` route and the enlarge overlay. |
| `story-reader-overlay` | The enlarge transition: tapped cover section grows into the full-screen reader (Modal + reanimated); reverse-shrinks on close. |
| `custom-tab-bar` | The 5-slot bar with the raised orange "+". |
| `compose-sheet-provider` / `compose-group-sheet` | The "write for…" group-picker sheet the "+" opens. |
| `empty-state` / `error-state` | Icon bubble + serif headline + sans body (+ CTA). Copy from `Strings`, icons from `Icons`. |
| `status-banner` | Inline info / warning / error banners. |
| `printing-press-loading` | Branded loading animation; restyle via `constants/loading.ts`, not the component. |
| `form-field` / `form-button` | Inputs and buttons in auth, group, and settings forms. |
| `auth-screen-shell` | Shared chrome for auth/onboarding screens. |
| `group-card` | A Group row/card in lists. |
| `avatar-picker` | Profile avatar selection. |
| `day-selector` | The 7-day publish-day picker (create-group and settings share it). |
| `time-picker-modal` / `snap-column` | Scroll-wheel time picker (`snap-column` is its internal wheel). |
| `this-week-strip` | Home's rule-framed dateline: next publish moment + who's written (never who hasn't). |
| `filed-stamp` | The rubber-stamp "Filed for Sunday's edition" confirmation on explicit post save. |
| `invite-hero` | The invitation as a one-page special edition (kicker, masthead, taped-polaroid cover, member byline, cadence dateline) — see BRAND §12. |
| `avatar-stack` | Overlapping member faces for the invitation byline; decorative (hidden from screen readers). |
| `pending-invite-banner` | The peach "Joining {name}" strip on auth screens while an invite is pending. |
| `joined-stamp` | The persistent "JOINED · {date}" stamp on the welcome screen (+3° tilt; FiledStamp owns −4°). |
| `invite-family-card` | The group screen's sender-side invite card: tap-to-copy code, code-first share, QR on a hard-white paper card. |

## Decisions newer than BRAND.md (drift notes)

The implementation has evolved past `design/BRAND.md` in these places. **Treat the code as correct**; fold a note into BRAND.md when you touch its section, then delete it here.

- **Paper grain texture.** A faint tiled warm-noise overlay (`paper-grain.tsx`) gives flat surfaces a printed feel. Not in BRAND.md at all.
- **The center "+" opens a sheet, not a tab.** It opens `compose-group-sheet` to pick a Group first, then routes to Compose. Evolves BRAND §5.
- **Tab icons bypass `constants/icons.ts`.** `custom-tab-bar.tsx` keeps its own filled/outline pairs (filled when active) in a local `TAB_META`. Known inconsistency with the registry — if you consolidate, registry wins.
- **The Inbox tab is labeled "Editions."**
- **Touch targets are 48px** (`Layout.touchTargetMin`), stricter than BRAND §9's 44pt. Follow 48.

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
