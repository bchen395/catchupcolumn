# Multi-photo posts — working scope

**Status:** decided 2026-10-03 (owner, orchestration session), in build. A working
document like `ILLUSTRATION_REWORK.md`: when it lands, fold the outcomes into
CLAUDE.md (schema, MVP feature 3), `design/BRAND.md` (§5, §9) and the skills,
then delete this file.

## The decisions

| Decision | Chosen | Why |
| --- | --- | --- |
| When | **Before Group Zero's edition 1, else after edition 4 — never mid-run** | The write-by-web call compares editions 1–2 with 3–4 (POSITIONING §4); changing the composer mid-run muddies it |
| Go/no-go | **Wed 2026-10-08, verified on the owner's phone** | Edition 1 is the week of 10-11 |
| Shape | **One writing area, photos set into it** — like Substack or Google Docs. A photo goes in at the cursor and you keep typing below it. No caption or text box belongs to a photo | Owner's call: "one text area that is filled with text and photos" |
| Text | **Plain text only** | CLAUDE.md MVP: no rich text in v1 |
| Editor | **Native blocks** — borderless text fields and photos stacked to read as one page; pure JS, ships by OTA | A WebView editor needed a native dependency before the 10-04 build, plus hand-bridged fonts and Dynamic Type |
| Limit | **4 photos per post** | Free-plan storage (1 GB), email length, printed page count; raising it later is one constant, lowering it takes something away |
| Display copies | **Every photo also gets a ~1280px display copy**; app and email show it, print keeps the 2600px master | Without it each view downloads the ~1.5 MB master; Group Zero alone would pass the Free plan's 5 GB/month egress |
| App image cache | **Keyed by storage path, not signed URL** | Signed URLs change every session, so expo-image re-downloaded every photo every session |
| Composer | **Rewritten once, with the July redesign folded in** (now BRAND §9 → "The composer") | The photo button has to ride above the keyboard anyway — that's the redesign's central idea |
| Upload timing | **Each photo uploads when it's inserted** (once the draft exists); removing one deletes its files after the save that drops it | Filing never waits on four uploads |

## The contract (on branch `multi-photo/contract`)

Everything below builds against these; change them here first.

- **Types** — `types/database.ts`: `PostTextBlock`, `PostPhotoBlock`, `PostBlock`,
  and `PostRow.blocks: PostBlock[] | null`.
- **Helpers** — `lib/post-blocks.ts`: `MAX_POST_PHOTOS`, `postBlocksOf(post)`
  (the only way to read a post's pieces; legacy posts become `[photo?, text]`,
  the order they always rendered), `photoBlocksOf`, `photoDisplayPath`,
  `normalizeBlocks`, `toPostFields(blocks)` → `{ blocks, body, image_url }`,
  `postPhotoPaths`, `newPhotoId`.
- **Storage** — `lib/posts.ts`: `uploadPostPhoto(authorId, postId, photoId, uri)`
  → `PostPhotoBlock` (master + display copy), `deletePostPhotoFiles(photos)`.

**Stored invariants** (the composer holds looser state while someone writes;
`toPostFields` produces this on every save):

- `blocks` is an array of `{type:'text', text}` and `{type:'photo', id, path,
  display_path, width, height}` in reading order; no empty text pieces, no two
  text pieces adjacent; at most 4 photos.
- `body` = the text pieces joined by a blank line. Still required non-empty to
  file — a post is writing first.
- `image_url` = the first photo's master path, or null.
- Photo files: `<author_id>/posts/<post_id>/<photo_id>.jpg` (master, 2600px,
  q0.9) and `<photo_id>-display.jpg` (1280px, q0.8). Storage RLS, the read
  policy, member removal and account deletion already find files by that
  folder, so none of them change.
- Legacy posts (`blocks` null) keep working everywhere through `postBlocksOf`.
  No backfill.

**Compatibility.** The 10-04 binary carries the old composer until the OTA
applies. It writes `body` and `image_url` only, which is still valid. Accepted
risk: someone editing the same multi-photo draft from a second device still on
old JS would leave `blocks` stale. That needs two devices and a stale one, in a
window of days.

## Work split

- **B — data and delivery.** Migration: `posts.blocks jsonb`, checks for shape,
  photo count ≤ 4, and every photo path inside the author's own post folder
  (the email worker signs with the service role, so a path pointing at another
  post must be impossible). Email payload RPC returns `blocks`. Edition email
  renders the blocks with display copies (and a fixture at 8 posts × 4 photos
  under Gmail's clip). `AppImage` cache keys. `post-for --photo` repeatable.
  CLAUDE.md schema and the data-layer / edge-functions skills. Backward
  compatible, so it merges on its own, before the go.
- **C — composer.** The block editor and the redesign. Unmerged until the go.
- **D — reading surfaces.** Story reader, edition front page, Home hero,
  thumbnails, through `postBlocksOf` and `photoDisplayPath`. Unmerged until the
  go.

## Shipping order (each a production change — the owner approves each)

1. `supabase db push` (B's migration).
2. Deploy every function that imports `_shared/` (`compile-editions`,
   `publish-edition-now`); verify by download-and-diff.
3. On go: merge C and D, then `npx eas-cli update --channel production` — the
   project's first OTA, so check it on the owner's phone.

No go by 10-08: steps 1–2 still ship (they cost nothing and fix egress); C and D
wait until after edition 4.

## Verification

- `npm run typecheck`, `npm run lint`, `deno check`, the email fixtures, CI's
  from-scratch migration apply.
- On the owner's phone: insert at the start, middle and end of the text;
  backspace under a photo; four-photo limit; multi-select in the picker;
  autosave, then file, then edit again; remove a photo, then confirm its files
  are gone; the reader, front page and email of an edition with a 4-photo post
  and a legacy post; Dynamic Type at the largest size; VoiceOver on a photo.
