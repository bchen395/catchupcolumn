# Group Zero operator script

Sets up and writes for Group Zero members who haven't installed the app yet.
It replaces the dashboard-and-SQL routine in `docs/POSITIONING.md` §6. Each
member gets a real account with their own byline, so their stories print under
their name and the edition email reaches them from week 1. When they install,
they sign in with an emailed code. They never need a password, and nobody has
to sign in as them.

## Running it

Deno 2.x. Run it from the repo root:

```sh
export SUPABASE_URL=https://<project-ref>.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...   # service_role key: shell env only, never a file in the repo

deno run --allow-env --allow-net=<project-ref>.supabase.co --allow-read \
  scripts/group-zero/group-zero.ts <command> [flags]
```

- **Credentials** come from those two variables and nowhere else. There is no
  `.env` lookup and no default. The script never prints the key; it prints
  only the project ref, so each run shows which project it is using. It
  refuses a key that isn't `service_role`, and a legacy (JWT) key issued for
  a different project than `SUPABASE_URL`.
- **`--allow-net`** is limited to the project's own host. `--allow-env` has to
  be unrestricted, because jimp's `debug` dependency enumerates the
  environment when it decodes a photo.
- **Every command is a dry run** unless you add `--apply`. The dry run prints
  every row and file it would write. With `--apply` it prints the same plan,
  runs it, and then reads back what landed. If a step fails, it says which
  earlier steps have already been written. Nothing is rolled back.
- `--group` takes a Group id or its invite code. Unknown or misspelled flags
  are errors, never ignored.

## Commands

| Command | What it does |
| --- | --- |
| `list [--group G]` | Read-only. Without `--group`, every Group with its invite code. With `--group`, that Group's members (name, email, role, email opt-in, whether the app is installed) and the posts waiting for the next edition. |
| `create-group --name N --moderator E [--moderator-name "Name"] [--description D] [--publish-day 0-6\|sunday] [--publish-time HH:MM] [--timezone Area/City]` | Makes the Group the way the app does: the same insert, the app's defaults (Sunday 09:00), and the invite code left to the database. The `on_group_created` trigger makes `--moderator` both `created_by` and the moderator. If they have no account yet, it creates one first, and `--moderator-name` becomes their byline. `--timezone` defaults to **this machine's** zone, so pass the organizer's. |
| `add-member --group G --email E --name "Display Name"` | Creates a confirmed account with no password anyone knows (`auth.admin.createUser`, `email_confirm: true`; GoTrue stores a random one), so no email is sent, and `--name` becomes the byline. Then adds them as a contributor, `on conflict do nothing`. It reuses an account that already exists and never renames it. Re-running it is safe. |
| `post-for --group G --email E [--body TEXT\|@file\|@-] [--title T] [--photo path.jpg]... [--remove-photo]` | Writes the member's post under their own `author_id`. If they already have an uncompiled post, it **updates** it, the way the composer does (`fetchCurrentPost`). There's no DB constraint, so a second insert would print as a second story. `edition_id` stays null. The title limit is 80 characters (`posts_title_length`), and `--title ""` clears it. `--photo` repeats, up to 4 (`MAX_POST_PHOTOS`): the post becomes the text, then the photos in the order given. On an existing post, `--photo` replaces all its photos and `--remove-photo` removes them; `--body` alone keeps the photos it has. |

A full setup, for a Group that has to start before its organizer has the app
(since 2026-09-29, Groups A and B are created in the app instead and the script
covers their holdouts — `docs/POSITIONING.md` §6). Dry run first each time:

```sh
G=scripts/group-zero/group-zero.ts
deno run ... $G create-group --name "The Tuesday Paper" --moderator organizer@example.com \
  --moderator-name "Sam Rivera" --timezone America/Chicago --publish-day monday --publish-time 09:00
deno run ... $G add-member --group <invite code> --email friend@example.com --name "Jo Park"
deno run ... $G post-for --group <invite code> --email friend@example.com --body @jo.txt --title "Moving day" \
  --photo boxes.jpg --photo new-kitchen.jpg
deno run ... $G list --group <invite code>
```

## Safety rules

- post-for refuses anyone who isn't a member of the Group.
- post-for refuses within **30 minutes either side** of the Group's publish
  slot. The slot is evaluated in the Group's IANA `timezone`, DST included,
  as `compile_due_editions` does. This works across midnight: a Sunday 00:10
  slot refuses on Saturday at 23:50. Just after the slot, the edition may
  still be compiling or sending.
- Writes to a post are filtered on `edition_id is null`. The service role
  bypasses RLS, so this restates the policy that makes a compiled post
  immutable.

## Where it differs from the app

- **Photos are processed by jimp, not `expo-image-manipulator`.** Each gets the
  app's two files (`uploadPostPhoto`), both encoded once from the original: the
  print master, longest edge 2600px, never upscaled, JPEG quality 0.9, at
  `post-images/<user_id>/posts/<post_id>/<photo_id>.jpg`; and the display copy
  the app and the email show, longest edge 1280px, quality 0.8, at
  `<photo_id>-display.jpg`. The post's `blocks` name both, and `body` and
  `image_url` (the first photo's master) are derived from `blocks` as the app
  derives them (`toPostFields`, mirrored in `blocks.ts`). The script applies
  EXIF orientation, keeps the source's ICC colour profile, and refuses to
  upload if any EXIF, GPS, XMP or IPTC metadata survives. There is no crop
  step. HEIC isn't decoded; convert it first with
  `sips -s format jpeg in.heic --out in.jpg`.
- **Layout is always the text, then the photos.** The app's composer can set
  photos anywhere in the text. If a member has done that in the app and you
  then change their text or photos here, the dry run says so: the post is
  rewritten as the text, then the photos. `--title` alone never touches the
  layout. A post from before multi-photo (one photo above the text, no
  `blocks`) stays in that form when only `--body` or `--title` changes.
- **The storage object has no owner.** It's uploaded with the service role, so
  `storage.objects.owner` is null rather than the member. None of the
  `post-images` policies read `owner`; they all gate on the path.
- **A new post's id is generated by the script, not the database**, so the
  photo paths are known before the insert. The order is still insert (text
  only) → upload → set `blocks`, as in the composer, so the row never names a
  file that isn't there yet.
- **Replaced or removed photos are deleted from storage** (master and display
  copy) after the update that drops them succeeds, as the composer does
  (`deletePostPhotoFiles`). Only files in that post's own folder are touched.
- Display names are capped at 60 characters, as onboarding does. The schema
  itself has no limit.
