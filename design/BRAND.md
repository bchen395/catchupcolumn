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

## 6. Edition reader: continuous newspaper layout

The reader is one continuous newspaper page, not a stack of discrete cards.

1. **Masthead** at top of page: group name in Superclarendon Heavy all-caps, thin `ink` rule, italic "Week of …" line in Superclarendon Italic, edition number in Futura `xs` small caps.
2. **Posts render as stacked sections** in a single scroll, but visually fused:
   - No card background, no border between posts. One continuous `paperWarm` surface.
   - Each post = serif **byline headline** (`From {author}` styled as a sub-headline in Superclarendon Bold) → optional inline photo (full-width, no rounded corners, thin `ink` hairline) → body in Superclarendon Regular at 17/26.
   - Posts separated only by a centered ornamental rule (e.g. `* * *` in Superclarendon) or a 1px `borderSoft` hairline.
3. **Single column** with generous side padding (~24px), readable on phone. True two-column flow requires custom layout work and is deferred.
4. **Drop cap** on the first post: oversized Superclarendon Heavy first letter in `orange`, ~3 lines tall, floated left. Nice-to-have on subsequent posts but not required.

Future iteration paths: drop caps on every post, true two-column flow with photos that span columns, "jump to author" anchor nav, printable PDF export.

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