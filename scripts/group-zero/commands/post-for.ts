// post-for --group <id|code> --email <e> [--body <text|@file|@->] [--title <t>]
//          [--photo <path> | --remove-photo] [--apply]
//
// Writes a member's post under *their* author_id, so the edition bylines it to
// them. Mirrors the composer in app/(tabs)/post.tsx: one uncompiled post per
// member per edition — if they already have one, it is updated, never
// duplicated (there is no DB constraint; a second insert is a second story).

import type { PostRow, PostUpdate } from '../../../types/database.ts';
import { parseFlags, Refusal, UsageError } from '../args.ts';
import { connect, type Db } from '../client.ts';
import { fetchMembership, fetchUncompiledPosts, requireExistingPerson, resolveGroup, validateEmail } from '../lookup.ts';
import { groupSummary } from '../people.ts';
import { describePhoto, preparePostPhoto, type PreparedPhoto } from '../photo.ts';
import { banner, block, executePlan, field, show, type Step } from '../plan.ts';
import { assertOutsidePublishWindow, formatMinutes, formatSlot } from '../schedule.ts';

const POST_IMAGE_BUCKET = 'post-images';
/** posts_title_length (20260603000000_add_post_title.sql): char_length(title) <= 80. */
const TITLE_MAX = 80;

const readBody = async (arg: string): Promise<string> => {
  let text = arg;
  if (arg === '@-') {
    text = await new Response(Deno.stdin.readable).text();
  } else if (arg.startsWith('@')) {
    try {
      text = await Deno.readTextFile(arg.slice(1));
    } catch (err) {
      throw new UsageError(`can't read --body file ${arg.slice(1)}: ${err instanceof Error ? err.message : err}`);
    }
  }
  // The composer trims before every save; CRLF only arrives via pasted files.
  const body = text.replace(/\r\n?/g, '\n').trim();
  if (body === '') throw new UsageError('--body is empty');
  return body;
};

/** undefined = leave as is; null = no headline (the app stores '' as null). */
const readTitle = (raw: string | undefined): string | null | undefined => {
  if (raw === undefined) return undefined;
  const title = raw.trim();
  if (title === '') return null;
  if (/[\r\n]/.test(title)) throw new UsageError('--title must be a single line');
  // char_length counts characters, not UTF-16 units — so does [...title].
  const length = [...title].length;
  if (length > TITLE_MAX) {
    throw new UsageError(`--title is ${length} characters; the limit is ${TITLE_MAX}`);
  }
  return title;
};

const imagePath = (userId: string, postId: string) => `${userId}/posts/${postId}/image.jpg`;

const uploadStep = (db: Db, path: string, photo: PreparedPhoto, postId: string, isNew: boolean): Step => ({
  title: `Upload storage ${POST_IMAGE_BUCKET}/${path}`,
  lines: [
    describePhoto(photo),
    'contentType image/jpeg, upsert true' + (isNew ? '' : ' — replaces any photo already on this post'),
  ],
  run: async () => {
    // Last look before overwriting: never touch the photo of a published post.
    const { data, error } = await db.from('posts').select('edition_id').eq('id', postId).single();
    if (error) throw error;
    if (data.edition_id !== null) throw new Error(`post ${postId} was compiled into an edition; photo not uploaded`);

    const { error: uploadError } = await db.storage
      .from(POST_IMAGE_BUCKET)
      .upload(path, photo.bytes, { contentType: 'image/jpeg', upsert: true });
    if (uploadError) throw uploadError;
  },
});

/**
 * Service role bypasses RLS, so the policy that keeps members from editing a
 * compiled post (edition_id is null, 20260703000000) is restated as a filter.
 */
const updateStep = (db: Db, postId: string, changes: PostUpdate, lines: string[]): Step => ({
  title: `Update public.posts ${postId} (only while edition_id is null)`,
  lines,
  run: async () => {
    const { data, error } = await db
      .from('posts')
      .update(changes)
      .eq('id', postId)
      .is('edition_id', null)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error(`post ${postId} was compiled into an edition before the update landed; posts unchanged`);
    }
  },
});

export const postFor = async (args: string[]): Promise<void> => {
  const flags = parseFlags(args, {
    group: 'string',
    email: 'string',
    body: 'string',
    title: 'string',
    photo: 'string',
    'remove-photo': 'boolean',
    apply: 'boolean',
  });
  const groupInput = flags.required('group', 'a Group id or invite code');
  const email = validateEmail(flags.required('email'));
  const bodyArg = flags.optional('body');
  const title = readTitle(flags.optional('title'));
  const photoPath = flags.optional('photo');
  const removePhoto = flags.bool('remove-photo');
  const apply = flags.bool('apply');

  if (photoPath !== undefined && removePhoto) throw new UsageError('--photo and --remove-photo contradict each other');
  if (bodyArg === undefined && title === undefined && photoPath === undefined && !removePhoto) {
    throw new UsageError('nothing to write — give --body, --title, --photo or --remove-photo');
  }
  const body = bodyArg === undefined ? undefined : await readBody(bodyArg);

  const { db, projectRef } = connect();
  banner('post-for', projectRef, apply);

  const group = await resolveGroup(db, groupInput);
  field('Group', groupSummary(group));

  const { user, profile } = await requireExistingPerson(db, email);
  field('Author', `${profile.display_name} <${email}> (${user.id})`);
  const membership = await fetchMembership(db, group.id, user.id);
  if (!membership) {
    throw new Refusal(`${email} is not a member of "${group.name}" — add them with add-member first`);
  }
  field('', `member as ${membership.role}`);

  const slots = assertOutsidePublishWindow(group);
  field('Edition', `publishes ${formatSlot(slots.next)}, in ${formatMinutes(slots.minutesToNext)}`);

  const drafts = await fetchUncompiledPosts(db, group.id, user.id);
  const existing: PostRow | null = drafts[0] ?? null;
  if (drafts.length > 1) {
    field(
      'WARNING',
      `${profile.display_name} already has ${drafts.length} uncompiled posts, and each will print as ` +
        `its own story. Updating the newest (${existing?.id}), as the composer would; ` +
        `the others: ${drafts.slice(1).map((p) => p.id).join(', ')}.`,
    );
  }

  // Processed in the dry run too, so a bad photo fails before --apply.
  const photo = photoPath === undefined ? null : await preparePostPhoto(photoPath);

  const steps: Step[] = [];
  let postId: string;

  if (!existing) {
    if (body === undefined) {
      throw new UsageError(`${profile.display_name} has no post for this edition yet, so --body is required`);
    }
    if (removePhoto) field('', 'note: --remove-photo ignored — there is no post yet');
    // Generated here rather than by the database so the photo path is known
    // before the insert. A dry run can't know it (a fresh one is drawn on
    // --apply), so it shows a placeholder instead of a misleading real id.
    postId = apply ? crypto.randomUUID() : '<new post id>';
    const id = postId;
    field('Post', `none yet this edition — a new one will be created`);

    steps.push({
      title: 'Insert public.posts',
      lines: [
        `id          ${id}`,
        `group_id    ${group.id}`,
        `author_id   ${user.id}  (bylined ${show(profile.display_name)})`,
        `title       ${show(title ?? null)}`,
        'edition_id  null — compiled into the next edition',
        `body        ${[...body].length} characters:`,
        ...block(body),
      ],
      run: async () => {
        const { data, error } = await db
          .from('posts')
          .insert({ id, group_id: group.id, author_id: user.id, title: title ?? null, body })
          .select('created_at')
          .single();
        if (error) throw error;
        return [`created_at ${data.created_at}`];
      },
    });

    if (photo) {
      const path = imagePath(user.id, id);
      steps.push(uploadStep(db, path, photo, id, true));
      steps.push(updateStep(db, id, { image_url: path }, [`image_url  null → ${show(path)}`]));
    }
  } else {
    postId = existing.id;
    field('Post', `${existing.id} — created ${existing.created_at}, updated ${existing.updated_at}`);

    const changes: PostUpdate = {};
    const lines: string[] = [];
    if (body !== undefined && body !== existing.body) {
      changes.body = body;
      lines.push(
        `body   REPLACES their current draft (${[...existing.body].length} characters):`,
        ...block(existing.body),
        `       with (${[...body].length} characters):`,
        ...block(body),
      );
    }
    if (title !== undefined && title !== existing.title) {
      changes.title = title;
      lines.push(`title  ${show(existing.title)} → ${show(title)}`);
    }
    if (photo) {
      const path = imagePath(user.id, existing.id);
      changes.image_url = path;
      lines.push(
        existing.image_url === path
          ? `image_url  ${show(path)} (same path — the file itself is replaced)`
          : `image_url  ${show(existing.image_url)} → ${show(path)}`,
      );
      steps.push(uploadStep(db, path, photo, existing.id, false));
    }
    if (removePhoto) {
      if (existing.image_url) {
        changes.image_url = null;
        lines.push(
          `image_url  ${show(existing.image_url)} → null (the stored file stays, as when the app removes a photo)`,
        );
      } else {
        field('', 'note: --remove-photo ignored — this post has no photo');
      }
    }

    if (Object.keys(changes).length > 0) {
      steps.push(updateStep(db, existing.id, changes, lines));
    }
  }

  const wrote = await executePlan(steps, apply);
  if (!wrote) return;

  const { data, error } = await db.from('posts').select('*').eq('id', postId).single();
  if (error) throw error;
  const post = data as PostRow;
  console.log(
    `\nSaved post ${post.id}: title ${show(post.title)}, ${[...post.body].length} characters, ` +
      `image_url ${show(post.image_url)}, edition_id ${show(post.edition_id)}.`,
  );
  console.log(`It publishes with ${group.name}'s next edition, ${formatSlot(slots.next)}.`);
};
