# DESIGN.md — Catch Up Column visual system

This doc captures the target visual language for the app: brand, colors, typography, components, and screen-level intent. It is the source of truth for UI work — update as decisions evolve.

## 1. Brand

Catch Up Column's identity is built around a friendly, slightly hand-drawn brandmark: an open cardboard box with a paper bag inside, set on overlapping peach + yellow discs, with "Catch Up Column" in a heavy slab serif laid across the bag. The mood is warm, paperish, slightly nostalgic — newsprint reimagined as something you'd find on a kitchen counter.

Three approved logo variations (see `assets/brand/`):

- **Brandmark** — full illustrated lockup (box + bag + overlapping discs + serif title). Used on splash, hero, marketing surfaces, and as a small decorative anchor on Home and Edition headers. **Default app logo.**
- **Logotype** — "Catch Up Column" set in the heavy slab serif on yellow (`#F4E33A`), stacked on two lines, with a soft white outline/shadow. Used in headers where the illustration would be too busy.
- **Submark** — "Catch | Column" two-word lockup separated by a vertical rule, mixed weights. Used for favicon, app icon, tight navigation contexts, and any square crop.

**Assets to commit:**
- `assets/brand/brandmark.png` — ≥ 1024×1024, square, transparent background.
- `assets/brand/logotype.png` — wordmark on transparent, two-line stacked.
- `assets/brand/submark.png` — square, transparent, for icon use.
- `assets/brand/brandmark.svg` (optional, later) — once we install `react-native-svg`. For v1 stick to PNG; the existing illustration is raster-feel anyway and scaling artifacts read as intentional texture.

Don'ts: don't recolor the brandmark, don't separate the bag from the discs, don't set the wordmark in any font other than the approved slab serif (or its fallback — see §3).

These are not in the project repo yet, we can defer. 

## 2. Color palette

Four-color core palette pulled from the brand sheet, plus a small set of neutrals derived for UI surfaces. Names are semantic — pick a token, don't sprinkle raw hex through styles.

| Token            | Hex       | Use                                                            |
| ---------------- | --------- | -------------------------------------------------------------- |
| `orange`         | `#FF7237` | Primary action color, active tab tint, key accents             |
| `orangeSoft`     | `#FF7237` @ 80% | Pressed state on `orange` (apply as opacity, not a new token) |
| `peach`          | `#FFD3C2` | Soft surface, list-row backgrounds, brandmark disc, chips      |
| `peachWash`      | `#FFD3C2` @ 40% | Hover/secondary surface tint                              |
| `yellow`         | `#F4E33A` | Highlight accents, logotype background, sparing use            |
| `ink`            | `#000000` | Headlines, body text on light surfaces                         |
| `inkSoft`        | `#000000` @ 60% | Secondary text, metadata, inactive tab labels             |
| `inkMuted`       | `#000000` @ 38% | Disabled text, hairline borders on dark surfaces          |
| `paper`          | `#FFFFFF` | Pure white surface (cards, modals)                             |
| `paperWarm`      | `#FAF7F2` | App background — warm off-white that complements peach         |
| `borderSoft`     | `#000000` @ 12% | Standard hairline borders, dividers                       |

**Notes:**
- The previous burgundy/navy/blueChip palette is fully retired. Any usage of `accent`, `backgroundWarm`, `navy`, `blueChip`, `blueWash`, or `paperCream` in the codebase should be swept in a single rename pass.
- Represent opacity-based variants as `base color + alpha at point of use` (e.g. `rgba(0,0,0,0.6)` or `Colors.ink + '99'`), not as separate tokens — keeps the token list honest.
- `error` and `success` aren't in the brand palette — keep the existing semantic values, but if they clash with the orange-forward UI, prefer a deeper red for error (`#C7361B`) and reuse `orange` itself sparingly for success-adjacent confirmations.

## 3. Typography

- **Display serif: Superclarendon.** Heavy slab serif used for the logotype, edition headlines, group mastheads, and any "newspaper voice" moment. Superclarendon ships with macOS/iOS but is **not** a free webfont and not bundled with Android. Embed it natively on iOS where available; on Android and web, fall back to **Roboto Slab (700/900)** loaded via `@expo-google-fonts/roboto-slab`. Roboto Slab at 900 weight is the closest free analog and reads as the same family at a glance.
- **Body sans: Futura.** Geometric sans used for tab labels, buttons, body chrome, metadata. Futura is fully commercial; fall back to **Jost** (loaded via `@expo-google-fonts/jost`) — it's a near-exact open-source revival of Futura and renders cleanly at every size we use.
- **Reading body (newspaper columns):** Superclarendon Regular at 17px with 26px line-height, on `paperWarm`. Slab serifs hold up at body size where high-contrast didones don't — this is intentional.

Type scale:

| Token       | px  | Family              | Use                                              |
| ----------- | --- | ------------------- | ------------------------------------------------ |
| `xs`        | 12  | Futura              | Microcopy, timestamps, compose meta              |
| `sm`        | 14  | Futura              | Tab labels, captions                             |
| `body`      | 16  | Futura              | Default UI body                                  |
| `lg`        | 18  | Futura SemiBold     | Section headers, list row titles                 |
| `read`      | 17  | Superclarendon Reg  | Edition reader body                              |
| `xl`        | 22  | Superclarendon Bold | Group masthead subhead                           |
| `xxl`       | 28  | Superclarendon Bold | Card "Headline" in compose preview               |
| `headline`  | 36  | Superclarendon Heavy| Edition headline                                 |
| `wordmark`  | 32  | Superclarendon Heavy| "Catch Up Column" two-line wordmark              |

## 4. Layout & component idioms

- **App background:** `paperWarm` everywhere by default. Pure `paper` (white) is reserved for elevated cards and modals. Avoid stacking white-on-white surfaces — the warmth of the off-white is what makes the orange feel grounded.
- **Top bar (Home / Discover screens):** logotype or brandmark left-aligned (logotype on most screens, brandmark only on Home), no bottom border, generous vertical padding (~20px). No shadow.
- **Bottom tab bar:** flat `paper` background, hairline top border of `borderSoft`, **5 slots** with the center "+" raised in a ~64px `orange` circle that overlaps above the bar by ~24px. Hand-drawn-feel line icons; active tint = `orange`, inactive = `inkSoft`. Labels in Futura `sm`.
- **List rows (Groups, Drafts, Templates):** `peach` rounded pill containers (radius 16), ~56px tall, avatar/icon left + label in Futura `lg`, no chevron. Generous vertical gap (12–16px) between rows.
- **Cards (newspaper covers in Inbox grids):** raw image, ~3:4 aspect, no rounded corners on the paper itself, sometimes set on a `peachWash` mat. Thin `borderSoft` hairline on the image edge.
- **Buttons:**
  - Primary: `orange` fill, white Futura SemiBold, radius 12, no shadow.
  - Secondary: transparent fill, 1px `orange` border, `orange` Futura SemiBold label.
  - Tertiary / text: `ink` Futura SemiBold, no chrome.
- **Chips & tags:** `peach` fill, `ink` Futura `sm`, radius 999 (full pill), 8/12 vertical/horizontal padding.
- **Edition reader page:** masthead (group name in Superclarendon Heavy, thin rule, "Delivery date" small caps in Futura) → optional "Prompt for the week" italic line → flowing single-column body with inline images. See §6.
- **Compose card:** big `paper` rectangle with "Write…" placeholder in Superclarendon italic, sparkle icon bottom-right (future AI hook — decorative only for now), images grid below (3 slots), tags row below that. Card sits on `paperWarm`.
- **Profile:** avatar + 3-stat strip (Following / Followers / Posts) at top, then "Personal" / "Public" sections each rendering newspaper cover thumbnails in a horizontal row.
- **Settings:** flat list with section headings in Superclarendon Bold (Account, Support, About) and quiet underlined link rows in Futura.

## 5. Navigation mapping (current → target)

The redesign uses a 5-tab bar with home, newspaper, +, mail, profile. Current app has 4: Inbox, Post, Groups, Profile.

| Slot | Icon        | Maps to (MVP)                  | Notes                                                |
| ---- | ----------- | ------------------------------ | ---------------------------------------------------- |
| 1    | Home        | Home (new lightweight screen)  | Brandmark + most-recent edition card + "Drafts" stub. Uses Inbox data, no separate query. |
| 2    | Newspaper   | Inbox (`/(tabs)/inbox`)        | Existing list of editions, restyled.                 |
| 3    | + (raised)  | Compose (`/(tabs)/post`)       | Existing composer.                                   |
| 4    | Mail        | Mail (new stub screen)         | Empty-state screen for now ("No messages yet"). Wire to real content later. |
| 5    | Profile     | Profile (`/(tabs)/profile`)    | Existing profile, restyled.                          |

**My Groups** is promoted from a tab to a header button on Home + a row on Profile. Keep the `/(tabs)/groups` route alive but un-tabbed; navigate to it from those entry points.

All 5 tabs ship together with the raised center button. Mail is a stub empty-state until it has content.

## 6. Edition: front page + enlarge-to-read

The edition opens to a **classic newspaper front page** — a mixed-editorial cover where every story is visible at once — and tapping any section **enlarges it** into a full-screen single-story reader. This replaced the earlier continuous-scroll reader: the cover-then-enlarge model reads as "picking up a section of the Sunday paper" and gives older readers one big obvious tap target per story.

### 6.1 Front page (cover)

Top to bottom (`app/edition/[id]/index.tsx`):

1. **Masthead**: group name in Superclarendon Black all-caps, thin `ink` rule, italic "Week of …" line, edition number + story/writer counts in Futura `xs` small caps. 3px `ink` rule below.
2. **Lead story** (`edition-lead`): "LEAD STORY" kicker in `orange`, 36px Black headline, italic byline, then the photo (tilt −1.5°, no caption — the byline sits right above it) and a **newsprint teaser**: a short 14px excerpt dissolving into greeked lines (see below), with an orange `READ THE STORY →` cue. Headline-first, photo second — the inverse of the secondary's silhouette.
3. **Secondary story** (`edition-secondary`): hairline rule above; photo-first for landscape/square (tilt **+1.5°** — never matching the lead's angle); 28px Bold headline; italic 14px byline; a 2-line 14px excerpt + 2 greeked lines; orange read cue.
4. **"IN BRIEF" grid** (`edition-briefs-grid` + `edition-brief-column`): centered small-caps label flanked by rules, then briefs paired into **two columns** with a 1px `borderSoft` vertical rule between them and horizontal rules between rows. A brief with a photo opens with a **small square untaped thumb** (≤150px, deterministic tilt from the post id) — a third photo post is visible on the cover, not buried. 18px Bold headlines, 3-line 14px excerpts + 2 greeked lines. **An odd final brief runs the full measure** — no dangling half-column or lonely rule.

**Photo shapes are orientation-aware** (`use-image-orientation`): each photo's natural ratio is learned from the image as it loads (no extra fetch), cached by raw URL so the cover, the enlarge snapshot, and the reader always agree, and snapped to a newspaper crop bucket — landscape **4:3**, portrait **4:5**, square **1:1** (±15% of square reads as square). On the cover, landscape/square photos run the full measure with text below; a **portrait photo holds its own column with the teaser running beside it** (46% width on the lead, 42% on the secondary) — the classic text-wrap move, and the page's main source of asymmetry. Until the shape is known, blocks lay out as landscape (the common case) and adapt once, when the image reports its size.

**Greeked continuation lines** (`greeked-lines`): after each cover excerpt, 2–3 thin rounded ink bars (~16% black, 7px on the excerpt's 20px rhythm, irregular ragged-right widths from a fixed pattern table) fade out line by line — the printer's device for "the column continues below the fold." They are decoration, not content: hidden from screen readers (the real excerpt carries the meaning), stable across re-renders so the enlarge overlay's snapshot matches, and always *after* real text so they read as a dissolving column rather than a skeleton loader.

**Slot assignment is by rule, no human editor** (`lib/edition-layout.ts`): most-visual-wins picks the lead (photo posts first, longest body among them), then the same rule picks the secondary from the remainder. Everyone else is a brief in written order. The reader's Next/Previous follows this exact order, so cover and reader always agree.

**Posts have optional titles**; `headlineFor` falls back to a warm byline headline ("From Ruth" — first name only).

**The 14px excerpt decision**: cover excerpts — including the lead's — are set at `sizes.excerpt` (14/20), deliberately below the 16px reading floor. They are *teasers*, newsprint you tap to enlarge, not reading copy; the full story is always available at 17px in the reader. Excerpts use `inkSoft` and carry `maxFontSizeMultiplier={1.6}` (the codebase's only font-scale cap) so the largest accessibility sizes still grow them to ~22px without wrecking the column layouts — everything else on the page scales freely. (Earlier drafts kept the lead at 17px reading type; that made the cover read like a blog post rather than a dense front page, so the lead now sets newsprint like everything else and lets its 36px headline and photo do the selling.)

The `READ THE STORY →` cue is an affordance label (Futura SemiBold 12px, `orange`) inside the already-pressable block — orange is fine here because it is not body copy. Brief cells omit the cue; at half-column width it's clutter, and the whole cell is the tap target.

### 6.2 Enlarge transition (cover → reader)

Tapping a section makes it **grow from its spot on the page into the full-screen reader** (`story-reader-overlay`): a 260ms ease-out frame interpolation from the section's measured frame to full screen, cross-fading the re-rendered section markup into the reader. Rendered in a transparent `Modal` (the app's established overlay idiom) so it covers the native header; warm-brown shadow lifts the "page" mid-flight. Closing reverses the shrink back into the origin frame — front-page scroll position is preserved because nothing ever navigates.

- **Reduce Motion bypasses the overlay entirely**: the tap pushes the plain `/edition/[id]/[postId]` route instead. That route is kept as the deep-link/fallback path and renders the same shared `story-reader` component.
- No gestures — explicit buttons only (chevron, footer "Front page", Android hardware back via `onRequestClose`). Predictability over spectacle for the older-adult audience.

### 6.3 Story reader

One contributor's full post at a time (`story-reader` + `story-article`): 36px Black headline, avatar byline, taped polaroid, body in Superclarendon Regular at 17/26 with an **inline lettrine drop cap** (orange Black serif raised initial — RN has no float; skipped when the body opens on punctuation). Footer pages Next/Previous through the edition in cover order with a gentle 220ms slide+fade page turn (instant under Reduce Motion).

**Photos are polaroids everywhere** — the taped, tilted white-frame treatment (`polaroid-photo`) at every size, with rotation varied per slot so no two frames sit at the same angle. The earlier squared-off full-width inline photo treatment is retired. The reader's photo uses the same orientation buckets as the cover; a portrait photo renders tall at a **78% centered measure** (a full-width 4:5 would tower over the page).

Future iteration paths: drop caps on every post, "jump to author" anchor nav, printable PDF export.

## 7. Iconography

Line icons with a slightly hand-drawn feel — prefer Material Community Icons `*-outline` variants over FontAwesome for the tab bar and primary nav. Stroke weight should read as friendly, not technical. Icons inherit `orange` when active, `inkSoft` when inactive.

Recommended set:
- Home → `home-outline`
- Newspaper → `newspaper-variant-outline`
- Compose (+) → `plus` (white, on the raised orange circle)
- Mail → `email-outline`
- Profile → `account-outline`

## 8. Empty states & status

Empty states use a small illustrated motif (cropped from the brandmark — the bag, the box, the discs) on `paperWarm`, with a Superclarendon Bold headline and a Futura body line beneath. Tone is warm and slightly playful, never apologetic.

Status banners: `peach` background for info, `yellow` background for warnings, deeper red for errors. All use Futura SemiBold for the headline and Futura Regular for the body.

## 9. Accessibility

- Body text minimum 16px; reader body 17px.
- All Futura body text on `paperWarm` must clear WCAG AA (4.5:1) at `ink` — verified.
- `orange` on `paper` clears AA for large text (18px+) but **not** for body text — never set body copy in `orange` on white. Use `ink` for body, reserve `orange` for headings, links, and interactive elements at 18px+ or with sufficient weight.
- Dynamic type scaling must continue to satisfy the 16px floor.
- Hit targets: 44×44pt minimum, including the raised "+" button.