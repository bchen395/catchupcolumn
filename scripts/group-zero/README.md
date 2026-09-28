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
| `post-for --group G --email E [--body TEXT\|@file\|@-] [--title T] [--photo path.jpg \| --remove-photo]` | Writes the member's post under their own `author_id`. If they already have an uncompiled post, it **updates** it, the way the composer does (`fetchCurrentPost`). There's no DB constraint, so a second insert would print as a second story. `edition_id` stays null. The title limit is 80 characters (`posts_title_length`), and `--title ""` clears it. |

A typical Group B setup, dry run first each time:

```sh
G=scripts/group-zero/group-zero.ts
deno run ... $G create-group --name "The Tuesday Paper" --moderator organizer@example.com \
  --moderator-name "Sam Rivera" --timezone America/Chicago --publish-day monday --publish-time 09:00
deno run ... $G add-member --group <invite code> --email friend@example.com --name "Jo Park"
deno run ... $G post-for --group <invite code> --email friend@example.com --body @jo.txt --title "Moving day" --photo jo.jpg
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

- **The photo is processed by jimp, not `expo-image-manipulator`.** It gets the
  same bounds: longest edge 2600px, never upscaled, one JPEG encode at quality
  0.9, always stored as `post-images/<user_id>/posts/<post_id>/image.jpg` with
  `image_url` set to that path. The script applies EXIF orientation, keeps the
  source's ICC colour profile, and refuses to upload if any EXIF, GPS, XMP or
  IPTC metadata survives. There is no crop step. HEIC isn't decoded; convert it
  first with `sips -s format jpeg in.heic --out in.jpg`.
- **The storage object has no owner.** It's uploaded with the service role, so
  `storage.objects.owner` is null rather than the member. None of the
  `post-images` policies read `owner`; they all gate on the path.
- **A new post's id is generated by the script, not the database**, so the
  photo path is known before the insert. The order is still insert → upload →
  set `image_url`, as in the composer.
- **Removing a photo** (`--remove-photo`) clears `image_url` and leaves the
  file in storage, the same as the app.
- Display names are capped at 60 characters, as onboarding does. The schema
  itself has no limit.
