# Moderation runbook

**Internal.** Not published: the site is `web/`, and nothing in `docs/` is
served. Written 2026-11-01 with the take-down work (App Store Guideline 1.2).
The decisions behind it are the owner's, 2026-10-30.

This is what to do when someone reports a story, or when something in a Group
has to go and the Group's own moderator can't or won't act.

**The promise:** every report is read and acted on **within 24 hours, every
day of the week**. The app says so after a report is sent, and so do the Terms
(§4), the Support page and the App Review notes. Don't shorten it, and change
it only together with all four.

**Take-downs are silent** (owner, 2026-11-01). Nothing tells the writer that
their story came down, whether the Group's moderator took it down or we did.
For a serious case you may email them yourself (step 7).

## What people can already do themselves

| Who | In the app | What it does | Undo |
| --- | --- | --- | --- |
| Any member | **Report this story**, at the foot of any story but their own | Sends us a report from inside the app (below) | — |
| Any member | **Block {name}**, at the foot of any story but their own | Hides all that person's stories from them, past editions included, and leaves them out of their edition emails from then on. One-way, and the blocked person isn't told | **Unblock**, on that person's row of the Group page |
| The Group's moderator | **Take down this story**, at the foot of any story in their Group | Deletes the story and its photos, in any edition, for everyone. The writer isn't told | None. The writer can write it again |
| The Group's moderator | **Remove**, on the Group page | Takes them out of the Group, deletes what they've written for the coming edition, and bans them: the invite code won't let them back in | **Let back in**, under "Removed" on the Group page |

Everything below is the same set of tools, run by us with the service role.

A moderator who blocks someone also stops seeing that person's stories in
their own Group, so they can't take those down from the app. That is by design
(bugs.md G3): they can **Unblock** first, or **Remove** the person. If a
moderator writes that they can't find a story to take down, ask whether they
blocked its writer.

## Where to run things

- **SQL:** the Supabase dashboard's **SQL editor** for the production project
  (`wvaxfyhihcfilewygtzp`). It runs as `postgres`, so RLS doesn't hide
  anything. The `operator_*` functions are granted to `service_role` only; the
  SQL editor can call them, and the app never can.
- **Auth admin API** (step 5 only) needs the service-role key:

  ```sh
  SERVICE_ROLE_KEY="$(npx supabase projects api-keys -o json --remote=wvaxfyhihcfilewygtzp | jq -r '.[] | select(.name=="service_role") | .api_key')"
  ```

  Keep it in your shell. Never paste it into a ticket, an email or a chat.
- **Record:** there's no reports table. The support inbox is the record, so
  reply in the report's own thread (step 7) and put what you ran, with its
  output, in a note on that thread.

## 1. A report arrives

Reports come to `support@catchupcolumn.com`, sent by the `report-story` edge
function (`supabase/functions/report-story`, live since 2026-10-31) through
Resend, one email per report:

- **Subject:** `Story report — {Group name}`.
- **Reply-To:** the reporter's address, so replying answers them.
- **Body:** their note, if they wrote one ("(No note. …)" if not), then:

  ```
  ---
  Details for our team:
  Story: <post id>
  Group: <Group name> (<group id>)
  Edition: <edition id, or "not yet published">
  Written by: <name> (<author id>)
  Reported by: <reporter email> (<reporter id>)
  ```

If sending fails, the app offers "Email us instead", which drafts an email
from the reporter with the same block (the Group as an id only). Some people
will simply write to support@ in their own words. Ask them which story, or
find it from the Group and the name.

The 24 hours start when the email arrives.

Each report is one send against Resend's 100-a-day cap, which sign-in codes and
edition email share. A run of reports from one account can use it up (bugs.md
G1, accepted for 1.0). If sign-in codes stop arriving on a day with a pile of
reports, that is why. The reporter's id is in each email.

## 2. Read the story

```sql
select p.id, p.title, p.body, p.blocks, p.image_url, p.edition_id, p.created_at,
       u.display_name as author, g.name as group_name
from public.posts p
join public.users u on u.id = p.author_id
join public.groups g on g.id = p.group_id
where p.id = '<post id>';
```

- No row: it's already gone. Its author deleted a draft, or the Group's
  moderator took it down. Go to step 7.
- **Photos:** dashboard → Storage → `post-images` → `<author id>/posts/<post id>/`.
  Look at the `-display.jpg` copies (a story from before multi-photo has just
  `image.jpg`). **If the report or the words suggest it might be illegal,
  stop here and go to step 6 before opening any photo.**

Check it against the Terms (`docs/TERMS.md` §4, Acceptable use). If it doesn't
break them, go to step 7 and say so.

## 3. Take the story down

```sql
select public.operator_take_down_post('<post id>');
```

It deletes the post and every file in `<author id>/posts/<post id>/`, whether
or not the story was published, and returns what it did:

```json
{"post_id": "…", "group_id": "…", "edition_id": "…", "author_id": "…", "photo_files_deleted": 4}
```

`photo_files_deleted` is 2 per photo (the print master and the display copy),
or 1 for a story from before multi-photo (`image.jpg`). Check the folder is
empty:

```sql
select count(*) from storage.objects
where bucket_id = 'post-images' and name like '<author id>/posts/<post id>/%';
```

If it fails:

- `post_not_found`: already gone (see step 2).
- `42501 Direct deletion from storage tables is not allowed`: Supabase's
  storage guard refused it. The whole call rolled back and nothing was
  deleted. That's a bug in the function's opt-in
  (`.claude/skills/db-migrations` → storage delete guard), not something to
  work around by hand. Escalate it, and in the meantime remove the writer
  (step 4) so they can't add more.

What it can't undo:

- **Edition emails already sent.** The words stay in people's inboxes. Their
  photos are signed links to the files just deleted, so they stop loading.
- The edition stays even if this was its only story. The app shows it as an
  empty page, and its number stays in the Group's run. If its email hadn't gone
  out yet, the next attempt sends nothing and marks it sent (#70).

## 4. Remove the writer from the Group

When the story breaks the Terms, the person who posted it leaves the Group:

```sql
select public.operator_remove_group_member('<group id>', '<author id>');
```

This takes them out, deletes their unpublished posts in that Group and those
posts' photos, and bans them, so the invite code won't let them back in. It
works even if they already left. Their other **published** stories stay. If
those break the rules too, list them and take each down (step 3):

```sql
select id, title, edition_id, created_at from public.posts
where group_id = '<group id>' and author_id = '<author id>'
order by created_at desc;
```

The Group's moderator sees them under "Removed" on the Group page and can
**Let back in**. If that would be wrong, say so when you write to the
moderator. To lift a ban yourself:
`delete from public.group_bans where group_id = '<group id>' and user_id = '<author id>';`

**If they're the Group's only moderator**, the call fails with "Cannot remove
the last moderator of a group" and changes nothing. Promote someone first. The
house rule (the one account deletion uses) is the earliest member to join who
isn't them:

```sql
select gm.user_id, u.display_name, gm.role, gm.joined_at
from public.group_members gm join public.users u on u.id = gm.user_id
where gm.group_id = '<group id>' order by gm.joined_at;

update public.group_members set role = 'moderator'
where group_id = '<group id>' and user_id = '<new moderator id>';
```

Then remove them, and write to the new moderator to say they now run the
Group. If the person you removed created the Group, they stay its
`created_by`, but since 2026-11-01 a removed creator can't read the Group at
all.

## 5. Serious cases: the account

For threats, sustained harassment, abuse across Groups, a second offence, or
anything in step 6, act on the account as well as the Group.

**a. Remove them from every Group.** Find where they're the only moderator
first, and promote someone there (step 4):

```sql
select gm.group_id, g.name, gm.role,
       (select count(*) from public.group_members m
        where m.group_id = gm.group_id and m.role = 'moderator') as moderators
from public.group_members gm join public.groups g on g.id = gm.group_id
where gm.user_id = '<author id>';
```

Then:

```sql
do $$
declare g uuid;
begin
  for g in select group_id from public.group_members where user_id = '<author id>' loop
    perform public.operator_remove_group_member(g, '<author id>');
  end loop;
end $$;
```

**b. Ban the account in Auth**, which stops every sign-in, the emailed code
included:

```sh
curl -sS -X PUT "https://wvaxfyhihcfilewygtzp.supabase.co/auth/v1/admin/users/<author id>" \
  -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"ban_duration": "876000h"}'
```

The response's `banned_until` should be about 100 years out. A session that
is already open lasts until its access token expires (an hour by default),
and then it can't be refreshed. To lift the ban, send
`{"ban_duration": "none"}`.

**c. Never use the dashboard's "Delete user" for moderation.** Deleting an
account deletes every story its owner wrote, in every Group (`posts.author_id`
cascades), which is the evidence you may need. It also frees their email
address to sign up again, and hands their Groups to someone else. A ban keeps
the record and keeps the address taken. Deletion is for people who ask for it
(`docs/DATA_DELETION.md`).

**d. If they might come back through a friend's invite** under a new
account, the Group's invite code can be changed. The app has no way to do it,
and every invite link and QR code already shared stops working, so only do it
when it's needed, and tell the moderator their new code is on the Group page:

```sql
update public.groups
set invite_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)
where id = '<group id>';
```

## 6. Anything that may be illegal

If someone's life or safety is in danger, contact emergency services (911 in
the US) first.

For anything that may be illegal, **preserve it and get legal advice the same
day**. Don't take it down first: step 3 deletes the photos, and the evidence
goes with them.

- **Don't download, screenshot, forward or attach it**, to counsel or anyone
  else. Describe it, and give the ids. For child sexual abuse material,
  holding a copy is itself a crime.
- **Preserve it inside Supabase.** Nothing leaves the project.
  - The row, into a schema the API doesn't expose:

    ```sql
    create schema if not exists moderation_hold;
    revoke all on schema moderation_hold from public, anon, authenticated;
    create table moderation_hold.post_<yyyymmdd>_<first 8 of post id> as
      select * from public.posts where id = '<post id>';
    ```

  - The files, into a private bucket called `moderation-hold` (dashboard →
    Storage → New bucket, private, no policies), copied on the server one
    file at a time. List them with the `storage.objects` query in step 3,
    then for each name:

    ```sh
    curl -sS -X POST "https://wvaxfyhihcfilewygtzp.supabase.co/storage/v1/object/copy" \
      -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -d '{"bucketId": "post-images", "sourceKey": "<object name>", "destinationBucket": "moderation-hold", "destinationKey": "<object name>"}'
    ```

    Check the copies are there before going on.
- **Child sexual abuse material carries a legal duty to report.** Under
  18 U.S.C. §2258A, a provider that learns of apparent CSAM on its service
  must report it to NCMEC's CyberTipline (<https://report.cybertip.org>) as
  soon as reasonably possible, and preserve what it reported. Report in
  parallel with getting advice, not after it. Look at no more than you need
  to make the report.
- Then take it down (step 3), and remove and ban the account (steps 4 and 5).
  Ask counsel how long to keep `moderation_hold` and the bucket, and delete
  them when they say.

## 7. Reply

Reply to the report's email (Reply-To is the reporter) within the 24 hours,
whatever you decided. Say what happened in their terms, and nothing about the
other person's account beyond what they can see in the app:

> Thanks for telling us. We've looked at the story you reported in {Group},
> and we've taken it down. {The person who posted it is no longer in the
> Group.} If anything else comes up, just reply to this email.

If you decided to leave it, say that you read it and why it doesn't break the
rules, and that the Group's moderator can still take a story down. If they'd
rather not see that person's stories, **Block** at the foot of the story hides
them, and only they will know.

**The writer isn't told** that their story came down (owner, 2026-11-01). For a
serious case, the kind in step 5, you may email them from `support@` to say
which story came down and which part of the Terms it broke. Keep it to that:
don't name the person who reported it, and don't argue the decision. For
anything in step 6, ask counsel before you write to them at all.

If you acted in someone else's Group, write to its moderator too: a story has
vanished from their edition, and someone may have appeared under "Removed".
