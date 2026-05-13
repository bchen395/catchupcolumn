# DESIGN.md — Catch Up Column visual system

This doc captures the target visual language from the Figma redesign and the phased plan to migrate the existing app to it. Source of truth for colors, typography, components, and screen-level intent. Update as decisions evolve.

## 1. Brand

- **Wordmark:** "CATCH UP COLUMN" (set in the bold display serif, all caps, often stacked on two lines).
- **Logo:** "THE WORLD'S PAGE" — circular badge (cream/yellow tones, illustrated globe + serif lettering wrapping the disc). Used at top-right of headline screens (Home, Discover) and as a small decorative anchor on the Compose/Edition headers.
- **Asset needed:** clean PNG (≥ 512×512, square, transparent background) of the World's Page badge. Save as `assets/images/worlds-page-logo.png`. Avoid SVG for v1 — RN can't render SVG without `react-native-svg`, and the current Figma SVG is just a wrapped raster anyway.

## 2. Color palette

Hex values pulled from the Figma color frame. Names are semantic — pick one column, don't sprinkle raw hex through styles.

| Token              | Hex       | Use                                                  |
| ------------------ | --------- | ---------------------------------------------------- |
| `paper`            | `#FFFFFF` | Pure white card surface (rare; mostly newsprint zones)|
| `paperWarm`        | `#F5F5F5` | App background — soft off-white                      |
| `paperCream`       | `#E8E2DB` | Edition reader background, warmer paper feel        |
| `ink`              | `#1D1B20` | Primary text (M3 sys/light/on-surface)               |
| `inkSoft`          | `#49454F` | Secondary text (M3 sys/light/on-surface-variant)     |
| `inkBlack`         | `#000000` | Reserved for serif headlines on cream paper          |
| `navy`             | `#1A3263` | Primary accent — wordmark, headers, tab active       |
| `navySoft`         | `#547792` | Secondary navy — subdued borders, labels             |
| `blueChip`         | `#7EA4C2` | Tab bar background, primary chip fill                |
| `blueChipLight`    | `#9CBDD7` | Hover/pressed state on `blueChip`                    |
| `blueWash`         | `#D0E3F1` | Cards, list-row backgrounds in Groups view           |
| `borderSoft`       | `#CAC8C8` | Hairline borders                                     |
| `borderMid`        | `#CDCDCD` | Standard input/card borders                          |
| `divider`          | `#D9D9D9` | Section dividers, also at 31%/60%/63% opacity        |

Several entries use percentages (e.g. `#D9D9D9 31%`, `#E8E2DB 55%`) — represent these as base color + alpha at point of use, not as separate tokens.

**Notes:**
- Current `Colors` constant (`constants/colors.ts`) uses a burgundy accent (`#7A2E3B`) and a different navy (`#1B3A4B`). Both get retired. Burgundy is **gone** from the Figma; navy becomes `#1A3263`.
- `error` and `success` aren't in the Figma palette — keep the existing values.

## 3. Typography

- **Display serif (design intent): Salo.** Used for the wordmark, edition group name, and edition headlines. Heavy weight, condensed, high-contrast strokes. Salo is not freely available — until we license/embed it, **fall back to Playfair Display Black (900)** loaded via `@expo-google-fonts/playfair-display`. Already partially set up.
- **Body sans: Inter.** Already loaded (Regular/Medium/SemiBold/Bold). Continue using for tab labels, buttons, body chrome.
- **Reading body (newspaper columns):** also Playfair Display (Regular) at 16–18px with 24–28px line-height — slightly tightened from current to fit two-column layout in Phase 4.

Type scale (tweaks to existing `Typography.sizes`):

| Token       | px  | Use                                          |
| ----------- | --- | -------------------------------------------- |
| `xs`        | 12  | Microcopy (kept; only on Compose meta)       |
| `sm`        | 14  | Tab labels (kept)                            |
| `body`      | 16  | Default body (kept)                          |
| `lg`        | 18  | Section headers, list row titles             |
| `xl`        | 22  | Group masthead subhead                       |
| `xxl`       | 28  | Card "Headline" in compose preview           |
| `headline`  | 36  | Edition headline (bumped from 32)            |
| `wordmark`  | 32  | "CATCH UP COLUMN" two-line wordmark           |

## 4. Layout & component idioms

- **Top bar (Home / Discover screens):** wordmark left, World's Page badge top-right (≈48–56px diameter). No bottom border, generous vertical padding.
- **Bottom tab bar:** flat blueChip (`#7EA4C2`) background, hairline top border, **5 slots** with the center "+" raised in a ~64px circle that overlaps above the bar by ~24px. Hand-drawn-feel line icons; active tint = `navy`, inactive = `inkSoft`.
- **List rows (Groups, Drafts, Templates):** `blueWash` rounded pill containers, ~56px tall, avatar/icon left + label, no chevron. Generous vertical gap between rows.
- **Cards (newspaper covers in Discover/Inbox grids):** raw image, ~3:4 aspect, no rounded corners on the paper itself, sometimes set on a slightly darker mat.
- **Edition reader page:** masthead (group name in heavy serif, thin rule, "Delivery date" small caps) → optional "Prompt for the week" italic line → flowing two-column body with inline images. See §6.
- **Compose card:** big cream rectangle with "Write…" placeholder, sparkle icon bottom-right (future AI hook — keep as decorative only for now), images grid below (3 slots), tags row below that.
- **Profile:** avatar + 3-stat strip (Following / Followers / Posts) at top, then "Personal" / "Public" sections each rendering newspaper cover thumbnails in a horizontal row.
- **Settings:** flat list with section headings (Account, Support, About) and quiet underlined link rows.

## 5. Navigation mapping (current → target)

The Figma shows a 5-tab bar with home, newspaper, +, mail, profile. Current app has 4: Inbox, Post, Groups, Profile. Mapping for the redesign:

| Slot | Figma icon  | Maps to (MVP)                  | Notes                                                |
| ---- | ----------- | ------------------------------ | ---------------------------------------------------- |
| 1    | Home        | Home (new lightweight screen) | Wordmark + most-recent edition card + "Drafts" stub. Uses Inbox data, no separate query. |
| 2    | Newspaper   | Inbox (`/(tabs)/inbox`)        | Existing list of editions, restyled.                 |
| 3    | + (raised)  | Compose (`/(tabs)/post`)       | Existing composer.                                   |
| 4    | Mail        | Mail (new stub screen)         | Empty-state screen for now ("No messages yet"). Wire to real content later. |
| 5    | Profile     | Profile (`/(tabs)/profile`)    | Existing profile, restyled.                          |

Where does **My Groups** go? Promote it from a tab to a header button on Home + a row on Profile (matches the Figma's "Groups" pin in the top-right of the avatar screen). Keep `/(tabs)/groups` route alive but un-tabbed; navigate to it from those entry points.

**Decision for Phase 2:** ship all 5 tabs from day one (Home, Newspaper, +, Mail, Profile) with the raised center button. Mail is a stub empty-state until we give it content.

## 6. Edition reader: continuous newspaper layout (simple v1)

Current reader stacks each `EditionPost` as a discrete card with avatar + photo + body. Target is one continuous newspaper page.

**Phase 4 minimal implementation:**
1. Top of page = group masthead (already mostly there): group name in display serif all-caps, thin rule, italic "Week of …" line, edition number small.
2. Posts render as **stacked sections** in a single scroll, but visually fused:
   - No card background, no border between posts. One paper-cream surface.
   - Each post = serif **byline headline** (`From {author}` styled like a sub-headline in heavy serif) → optional inline photo (full-width, no rounded corners, thin black hairline) → body in serif at 17/26.
   - Posts separated only by a centered ornamental rule (e.g. `* * *`) or a 1px hairline of `borderSoft`.
3. **No** column flow in v1. Single column, generous side padding (~24px), readable on phone. True 2-column flow needs custom layout work — defer.
4. First post optionally gets a larger drop-cap (CSS-style first-letter via a separate `<Text>` span) — flag this as nice-to-have, not blocking.

Iteration paths for later: drop caps everywhere, true two-column flow with photos that span columns, "jump to author" anchor nav, printable PDF export.

## 7. Phased rollout

Each phase is independently shippable. Don't start the next until the previous is verified in the simulator.

### Phase 1 — Color & typography tokens (foundation, ~half day)
- Replace `constants/colors.ts` with the new token set from §2. Keep export name `Colors` for compatibility; rename keys (e.g. `accent` → `navy`, `backgroundWarm` → `paperWarm`). Sweep all usages with a single rename pass.
- Update `constants/typography.ts`: bump `headline` to 36, add `wordmark`. Switch `families.serifBold` to `PlayfairDisplay_900Black` (add the import in `app/_layout.tsx` and the `@expo-google-fonts/playfair-display` already exposes it).
- Drop the World's Page logo PNG into `assets/images/worlds-page-logo.png`.
- No screen-level changes yet. Verify the app still builds and existing screens just re-tint to the new palette.

### Phase 2 — Tab bar redesign (~1 day)
- Build a custom `<TabBar>` component (Expo Router supports `tabBar` prop). Five slots: Home, Newspaper, + (raised), Mail, Profile.
- Center "+" is a raised 64px navy circle, lifted ~24px above the tab bar, white plus glyph, mild shadow. Tap routes to `/(tabs)/post`.
- Tab bar background = `blueChip`, top border = 1px `navySoft`, label color = `navy` (active) / `inkSoft` (inactive).
- Add `app/(tabs)/home.tsx` (placeholder: wordmark + logo + "Recent editions" using existing inbox query) and `app/(tabs)/mail.tsx` (empty-state stub). Move `groups.tsx` out of the tabs group.

### Phase 3 — Top-level screen restyle (~1–2 days)
Apply the new palette + typography to existing screens, no structural changes:
- **Home** (new): wordmark top-left, logo top-right, one large "most recent edition" cover, smaller "Drafts" / "My Groups" pills below.
- **Inbox**: keep section list, swap row backgrounds to `blueWash` pills, headlines to display serif.
- **Compose**: convert to single cream card with "Write…" placeholder, image grid (3 slots), tags row at bottom. Sparkle icon bottom-right of card (decorative).
- **Profile**: avatar + stats strip, sections with horizontal scrolling cover thumbnails (use existing edition data).
- **Settings** (if reachable from profile): flat sectioned list per Figma.
- **Auth screens**: minimal — apply new colors, keep current structure.

### Phase 4 — Edition reader redesign (~1 day)
Implement the continuous newspaper layout from §6. This is mostly rewriting `app/edition/[id].tsx` and `components/edition-post.tsx` styles. No data layer changes.

### Phase 5 — Polish (~half day)
- Hand-drawn-feel icons (swap a few FontAwesome glyphs for Material Community equivalents that better match the wireframe sketches: `home-outline`, `newspaper-variant-outline`, `email-outline`, `account-outline`).
- Empty states: refresh copy + tint per Figma's warmer language.
- Status banners, error/empty illustrations: re-skin to new palette.
- Verify dynamic-type scaling still satisfies the 16px floor.

### Phase 6 (deferred / opt-in)
- Mail tab content (the slot ships empty in Phase 2).
- Side drawer (Genres / Favorites / Archives / Top Ten / Just In) — depends on public-feed features that aren't MVP.
- Templates / Prompts / Style packages screens — not MVP per CLAUDE.md.
- True two-column reader flow.
