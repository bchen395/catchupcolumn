// post-for --group <id|code> --email <e> [--body <text|@file|@->] [--title <t>]
//          [--photo <path>]... [--remove-photo] [--apply]
//
// Writes a member's post under *their* author_id, so the edition bylines it to
// them. Mirrors the composer in app/(tabs)/post.tsx: one uncompiled post per
// member per edition — if they already have one, it is updated, never
// duplicated (there is no DB constraint; a second insert is a second story).
//
// A post is text with up to four photos (`posts.blocks`, scripts/group-zero/
// blocks.ts). This script lays one out as the text, then the photos in the
// order --photo gave them; body and image_url are derived from the blocks
// exactly as the app derives them (toPostFields).

import type { PostBlock, PostPhotoBlock, PostRow, PostUpdate } from '../../../types/database.ts';
import { parseFlags, Refusal, UsageError } from '../args.ts';
import {
  MAX_POST_PHOTOS,
  newPhotoId,
  photoBlocksOf,
  postBlocksOf,
  postPhotoPaths,
  toPostFields,
} from '../blocks.ts';
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

type NewPhoto = { block: PostPhotoBlock; displayPath: string; prepared: PreparedPhoto; file: string };

/**
 * Blocks for freshly prepared photos, ids unique within the post. A dry run
 * shows placeholder ids, as it does for a new post's id: real ones are drawn
 * on --apply, so printing one now would be misleading.
 */
const newPhotos = (
  authorId: string,
  postId: string,
  prepared: { file: string; photo: PreparedPhoto }[],
  apply: boolean,
): NewPhoto[] => {
  const ids = new Set<string>();
  return prepared.map(({ file, photo }, i) => {
    let id = apply ? newPhotoId() : `<photo ${i + 1} id>`;
    while (ids.has(id)) id = newPhotoId();
    ids.add(id);
    const { path, display_path } = postPhotoPaths(authorId, postId, id);
    return {
      file,
      prepared: photo,
      displayPath: display_path,
      block: {
        type: 'photo',
        id,
        path,
        display_path,
        width: photo.master.width,
        height: photo.master.height,
      },
    };
  });
};

const uploadStep = (db: Db, photo: NewPhoto, index: number, count: number, postId: string): Step => ({
  title: `Upload photo ${index + 1} of ${count} (${photo.file}) to storage ${POST_IMAGE_BUCKET}`,
  lines: [
    describePhoto(photo.prepared),
    `master   ${photo.block.path}`,
    `display  ${photo.displayPath}`,
    'contentType image/jpeg, upsert true',
  ],
  run: async () => {
    // Last look before writing: never add files to a published post.
    const { data, error } = await db.from('posts').select('edition_id').eq('id', postId).single();
    if (error) throw error;
    if (data.edition_id !== null) throw new Error(`post ${postId} was compiled into an edition; photo not uploaded`);

    const files: [string, Uint8Array][] = [
      [photo.block.path, photo.prepared.master.bytes],
      [photo.displayPath, photo.prepared.display.bytes],
    ];
    for (const [path, bytes] of files) {
      const { error: uploadError } = await db.storage
        .from(POST_IMAGE_BUCKET)
        .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;
    }
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

/**
 * The files of photos the update just dropped, as the composer removes them
 * after the save that drops them (deletePostPhotoFiles). Only files in this
 * post's own folder: a legacy image_url can be an old public URL, and
 * anything else isn't this post's to delete.
 */
const deleteFilesStep = (db: Db, folder: string, dropped: PostPhotoBlock[]): Step | null => {
  const paths = dropped
    .flatMap((p) => (p.display_path ? [p.path, p.display_path] : [p.path]))
    .filter((path) => path.startsWith(folder) && !path.slice(folder.length).includes('/'));
  if (paths.length === 0) return null;
  return {
    title: `Delete ${paths.length} file${paths.length === 1 ? '' : 's'} of the dropped photo${dropped.length === 1 ? '' : 's'} from storage ${POST_IMAGE_BUCKET}`,
    lines: paths,
    run: async () => {
      const { error } = await db.storage.from(POST_IMAGE_BUCKET).remove(paths);
      if (error) throw error;
    },
  };
};

/** "text, photo, photo" — a post's reading order, for the plan. */
const describeLayout = (blocks: PostBlock[]): string =>
  blocks.length === 0 ? '(empty)' : blocks.map((b) => b.type).join(', ');

/** True when the photos sit anywhere but after all the text. */
const isInterleaved = (blocks: PostBlock[]): boolean => {
  const firstPhoto = blocks.findIndex((b) => b.type === 'photo');
  return firstPhoto !== -1 && blocks.slice(firstPhoto).some((b) => b.type === 'text');
};

const blockLines = (fields: Pick<PostRow, 'blocks' | 'body' | 'image_url'>): string[] => [
  `blocks     ${describeLayout(fields.blocks ?? [])}`,
  ...photoBlocksOf(fields.blocks ?? []).map((p) => `             photo ${p.id}  ${p.path}`),
  `image_url  ${show(fields.image_url)}`,
];

export const postFor = async (args: string[]): Promise<void> => {
  const flags = parseFlags(args, {
    group: 'string',
    email: 'string',
    body: 'string',
    title: 'string',
    photo: 'strings',
    'remove-photo': 'boolean',
    apply: 'boolean',
  });
  const groupInput = flags.required('group', 'a Group id or invite code');
  const email = validateEmail(flags.required('email'));
  const bodyArg = flags.optional('body');
  const title = readTitle(flags.optional('title'));
  const photoFiles = flags.all('photo');
  const removePhoto = flags.bool('remove-photo');
  const apply = flags.bool('apply');

  if (photoFiles.length > 0 && removePhoto) throw new UsageError('--photo and --remove-photo contradict each other');
  if (photoFiles.length > MAX_POST_PHOTOS) {
    throw new UsageError(`--photo was given ${photoFiles.length} times; a post holds at most ${MAX_POST_PHOTOS} photos`);
  }
  if (bodyArg === undefined && title === undefined && photoFiles.length === 0 && !removePhoto) {
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
  const prepared: { file: string; photo: PreparedPhoto }[] = [];
  for (const file of photoFiles) prepared.push({ file, photo: await preparePostPhoto(file) });

  const steps: Step[] = [];
  let postId: string;

  if (!existing) {
    if (body === undefined) {
      throw new UsageError(`${profile.display_name} has no post for this edition yet, so --body is required`);
    }
    if (removePhoto) field('', 'note: --remove-photo ignored — there is no post yet');
    // Generated here rather than by the database so the photo paths are known
    // before the insert. A dry run can't know it (a fresh one is drawn on
    // --apply), so it shows a placeholder instead of a misleading real id.
    postId = apply ? crypto.randomUUID() : '<new post id>';
    const id = postId;
    field('Post', `none yet this edition — a new one will be created`);

    // The text goes in first; the photos follow once their files are up, as
    // in the composer, so the row never names a file that isn't there.
    const textOnly = toPostFields([{ type: 'text', text: body }]);
    steps.push({
      title: 'Insert public.posts',
      lines: [
        `id          ${id}`,
        `group_id    ${group.id}`,
        `author_id   ${user.id}  (bylined ${show(profile.display_name)})`,
        `title       ${show(title ?? null)}`,
        'edition_id  null — compiled into the next edition',
        `blocks      ${describeLayout(textOnly.blocks ?? [])}`,
        `body        ${[...body].length} characters:`,
        ...block(body),
      ],
      run: async () => {
        const { data, error } = await db
          .from('posts')
          .insert({ id, group_id: group.id, author_id: user.id, title: title ?? null, ...textOnly })
          .select('created_at')
          .single();
        if (error) throw error;
        return [`created_at ${data.created_at}`];
      },
    });

    if (prepared.length > 0) {
      const photos = newPhotos(user.id, id, prepared, apply);
      photos.forEach((photo, i) => steps.push(uploadStep(db, photo, i, photos.length, id)));
      const fields = toPostFields([{ type: 'text', text: body }, ...photos.map((p) => p.block)]);
      steps.push(updateStep(db, id, fields, blockLines(fields)));
    }
  } else {
    postId = existing.id;
    field('Post', `${existing.id} — created ${existing.created_at}, updated ${existing.updated_at}`);

    const existingBlocks = postBlocksOf(existing);
    const existingPhotos = photoBlocksOf(existingBlocks);
    field('', `now: ${describeLayout(existingBlocks)}${existing.blocks === null ? ' (written before multi-photo)' : ''}`);

    const changes: PostUpdate = {};
    const lines: string[] = [];

    const bodyChanges = body !== undefined && body !== existing.body;
    if (bodyChanges) {
      lines.push(
        `body       REPLACES their current text (${[...existing.body].length} characters):`,
        ...block(existing.body),
        `           with (${[...body].length} characters):`,
        ...block(body),
      );
    }

    let photos: NewPhoto[] = [];
    let dropped: PostPhotoBlock[] = [];
    let nextPhotos = existingPhotos;
    if (prepared.length > 0) {
      photos = newPhotos(user.id, existing.id, prepared, apply);
      nextPhotos = photos.map((p) => p.block);
      dropped = existingPhotos;
      if (existingPhotos.length > 0) {
        lines.push(`photos     REPLACES their ${existingPhotos.length} photo${existingPhotos.length === 1 ? '' : 's'} with ${photos.length}`);
      }
    } else if (removePhoto) {
      if (existingPhotos.length > 0) {
        nextPhotos = [];
        dropped = existingPhotos;
        lines.push(`photos     removes all ${existingPhotos.length}`);
      } else {
        field('', 'note: --remove-photo ignored — this post has no photo');
      }
    }
    const photosChange = dropped.length > 0 || photos.length > 0;

    if (bodyChanges && !photosChange && existing.blocks === null) {
      // A post from before multi-photo whose photo (if any) isn't changing:
      // leave it in that form, photo above the text, and change only body.
      changes.body = body;
    } else if (bodyChanges || photosChange) {
      const nextText = body ?? existing.body;
      const fields = toPostFields([{ type: 'text', text: nextText }, ...nextPhotos]);
      Object.assign(changes, fields);
      lines.push(...blockLines(fields));
      if (existing.blocks !== null && isInterleaved(existing.blocks)) {
        lines.push(
          'NOTE       their draft sets photos into the text (written in the app); it is rewritten',
          '           as the text, then the photos',
        );
      }
    }

    if (title !== undefined && title !== existing.title) {
      changes.title = title;
      lines.push(`title      ${show(existing.title)} → ${show(title)}`);
    }

    photos.forEach((photo, i) => steps.push(uploadStep(db, photo, i, photos.length, existing.id)));
    if (Object.keys(changes).length > 0) {
      steps.push(updateStep(db, existing.id, changes, lines));
      const cleanup = deleteFilesStep(db, `${user.id}/posts/${existing.id}/`, dropped);
      if (cleanup) steps.push(cleanup);
    }
  }

  const wrote = await executePlan(steps, apply);
  if (!wrote) return;

  const { data, error } = await db.from('posts').select('*').eq('id', postId).single();
  if (error) throw error;
  const post = data as PostRow;
  const saved = postBlocksOf(post);
  console.log(
    `\nSaved post ${post.id}: title ${show(post.title)}, ${[...post.body].length} characters, ` +
      `${photoBlocksOf(saved).length} photo(s) (${describeLayout(saved)}), edition_id ${show(post.edition_id)}.`,
  );
  console.log(`It publishes with ${group.name}'s next edition, ${formatSlot(slots.next)}.`);
};
