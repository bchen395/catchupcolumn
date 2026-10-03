// Dev-only preview harness for the edition email (not a deployed function —
// underscore directories are skipped by `supabase functions deploy`).
//
// Renders fixture editions to HTML + plain-text files so the design can be
// eyeballed in a browser (375px and 600px widths, light + dark OS theme)
// and checked against Gmail's ~102KB clipping limit.
//
// Run from the repo root:
//   deno run --allow-write supabase/functions/_shared/preview/render-email-fixtures.ts [out-dir]
//
// Default output dir: ./preview-out (untracked).

import {
  EditionEmailPayload,
  EditionEmailPost,
  renderEditionEmailHtml,
  renderEditionEmailSubject,
  renderEditionEmailText,
} from '../edition-email.ts';

import type { PostBlock } from '../post-blocks.ts';

const PHOTO = (seed: number, w = 900, h = 675) =>
  `https://picsum.photos/seed/cuc-${seed}/${w}/${h}`;
const AVATAR = (n: number) => `https://i.pravatar.cc/80?img=${n}`;

// A real signed URL is ~440 characters — project host, bucket, a
// <uid>/posts/<post_id>/<photo_id>-display.jpg path, and a ~260-character
// token — against ~45 for a picsum one. The clip check is about bytes, so the
// multi-photo fixture pads picsum URLs (which ignore the extra parameter) to
// that length; the images still load in a browser.
const SIGNED_URL_LENGTH = 440;
const SIGNED_PHOTO = (seed: number, w = 1280, h = 960) => {
  const url = `${PHOTO(seed, w, h)}?token=`;
  return url + 'x'.repeat(Math.max(0, SIGNED_URL_LENGTH - url.length));
};

let postSeq = 0;
const post = (overrides: Partial<EditionEmailPost>): EditionEmailPost => {
  postSeq += 1;
  return {
    id: `post-${postSeq}`,
    author_id: '22222222-2222-2222-2222-222222222222',
    title: null,
    body: 'The tomatoes finally came in this week. Your grandfather says he grew them; the truth is the rain did.',
    image_url: null,
    blocks: null,
    signed_photo_urls: {},
    author_name: 'Ruth Williams',
    author_avatar_url: AVATAR(49),
    created_at: '2026-07-03T14:00:00Z',
    ...overrides,
  };
};

const payload = (
  name: string,
  posts: EditionEmailPost[],
  overrides: Partial<EditionEmailPayload> = {},
): [string, EditionEmailPayload] => [
  name,
  {
    edition_id: '00000000-0000-0000-0000-000000000000',
    edition_number: 12,
    published_at: '2026-07-05T13:00:00Z',
    group_id: '11111111-1111-1111-1111-111111111111',
    group_name: 'The Sunday Dispatch',
    posts,
    recipient_display_name: 'Ruth',
    unsubscribe_url: 'https://example.supabase.co/functions/v1/unsubscribe?token=00000000-0000-0000-0000-000000000000',
    edition_web_url: 'https://www.catchupcolumn.com/edition/00000000-0000-0000-0000-000000000000',
    start_your_own_url: 'https://www.catchupcolumn.com/start',
    ...overrides,
  },
];

const LONG_BODY = Array.from({ length: 8 }, (_, i) =>
  `Paragraph ${i + 1}. We drove up through the pass on Saturday morning and the fog sat in the valley like something poured there. Sam wanted to stop at every overlook, and we did, because that is the whole point of being retired. By the time we reached the cabin the coffee thermos was empty and the dog had opinions.`,
).join('\n\n');

// A multi-photo post built the way the composer stores one (toPostFields in
// lib/post-blocks.ts): `blocks` in reading order, `body` the text pieces
// joined by a blank line, `image_url` the first photo's master. `layout` is
// the reading order — 't' a text piece (taken from `texts` in turn), 'p' a
// photo. Photos whose 1-based positions are in `unsigned` get no signed URL,
// as if signing had failed, so the credit moves to the next photo.
let photoSeed = 100;
const multiPhotoPost = (
  layout: string,
  texts: string[],
  overrides: Partial<EditionEmailPost> & { unsigned?: number[] } = {},
): EditionEmailPost => {
  const { unsigned = [], ...rest } = overrides;
  const base = post(rest);
  const folder = `${base.author_id}/posts/${base.id}/`;
  const blocks: PostBlock[] = [];
  const signed: Record<string, string> = {};
  let textIndex = 0;
  let photoIndex = 0;
  for (const piece of layout) {
    if (piece === 't') {
      blocks.push({ type: 'text', text: texts[textIndex++] });
      continue;
    }
    if (piece !== 'p') throw new Error(`layout "${layout}": use only t and p`);
    photoIndex += 1;
    photoSeed += 1;
    const id = `mg${photoSeed.toString(36)}p${photoIndex}`;
    const portrait = photoSeed % 3 === 0;
    blocks.push({
      type: 'photo',
      id,
      path: `${folder}${id}.jpg`,
      display_path: `${folder}${id}-display.jpg`,
      width: portrait ? 1950 : 2600,
      height: portrait ? 2600 : 1950,
    });
    if (!unsigned.includes(photoIndex)) {
      signed[id] = portrait ? SIGNED_PHOTO(photoSeed, 960, 1280) : SIGNED_PHOTO(photoSeed);
    }
  }
  const firstPhoto = blocks.find((b) => b.type === 'photo');
  return {
    ...base,
    blocks,
    body: texts.join('\n\n'),
    image_url: firstPhoto?.type === 'photo' ? firstPhoto.path : null,
    signed_photo_urls: signed,
  };
};

// Eight people, four photos each, the photos set into the writing in
// different places — plus one post from a build before multi-photo (blocks
// null, one image_url photo above its text). A full Group Zero-sized week at
// the four-photo limit, with signed-URL-length sources; it must stay under
// Gmail's clip.
const FOUR_PHOTO_EDITION: EditionEmailPost[] = [
  multiPhotoPost('tpptpp', [
    'We finally did the coast drive we kept promising each other we would do "next summer" for four summers running. Left Friday after work, which was a mistake, and got to the motel at midnight, which was also a mistake, and it did not matter even a little.',
    'Saturday was fog until noon and then, all at once, not fog. The dog has never seen the ocean before. She barked at it for a full minute and then decided it was fine.',
  ], { title: 'The coast, finally', author_name: 'Maya Chen-Williams', author_avatar_url: AVATAR(32) }),
  multiPhotoPost('ppppt', [
    'Four photos and no words, because the garden said it better than I could. Okay, a few words: the tomatoes are done, the squash is not, and the squash would like you all to know that it is winning.',
  ], { author_name: 'Sam Williams', author_avatar_url: AVATAR(12) }),
  multiPhotoPost('tptptptp', [
    'First week at the new job. The office has a dog, which nobody told me about in the interview, and which I would have accepted the job for on its own.',
    'This is the view from my desk if I lean all the way back. I lean all the way back a lot.',
    'Lunch is from a truck that only does one thing (dumplings) and does it very well.',
    'And this is the train home, which is twenty-six minutes of nobody needing anything from me.',
  ], { title: 'New job, old me', author_name: 'Dev Patel', author_avatar_url: null }),
  multiPhotoPost('tppppt', [
    'Postcards from the lake. We rented the same cabin as last year, and the canoe still has a hole in it that the owner insists is "character".',
    'Next year: a new canoe, or at least a patch kit. Everyone is welcome; there is a pull-out couch and a hammock and a frankly unreasonable number of board games.',
  ], { title: 'Postcard from the lake', author_name: 'June Williams', author_avatar_url: AVATAR(5) }),
  multiPhotoPost('ptptpp', [
    'Moved the bookshelves for the third time this year. This is the final arrangement. I said that last time.',
    'Found a stack of letters from Grandma in the back of the closet while doing it, from when I was at school. She wrote every single week. I think that is partly why I like this thing so much.',
  ], { author_name: 'Ruth Williams', author_avatar_url: AVATAR(49) }),
  multiPhotoPost('tpppp', [
    'Marathon training update: I am now the kind of person who owns a running vest. I have also become the kind of person who talks about running vests, for which I apologize in advance to everyone at Thanksgiving. Long run was eighteen miles, the last four of which I do not remember, and the photos are all from the first two, when I still had opinions about the scenery.',
  ], { title: 'Eighteen miles', author_name: 'Priya Raman', author_avatar_url: AVATAR(44) }),
  multiPhotoPost('tptpptp', [
    'The baby has discovered her feet and is not taking questions at this time.',
    'Also discovered: the dog. They are, as of Tuesday, best friends, which mostly means she grabs his ears and he lets her.',
    'Nobody is sleeping. Everybody is fine. Send coffee.',
  ], { title: 'Feet, dog, no sleep', author_name: 'Tom Okafor', author_avatar_url: AVATAR(15), unsigned: [1] }),
  multiPhotoPost('pptpp', [
    'Two weeks of night shifts done and I celebrated by sleeping for fourteen hours and then going to the farmers market in yesterday\'s clothes. Bought too many peppers. Made the soup from the group trip two years ago, from memory, and it was nearly right. Someone send me the real recipe.',
  ], { author_name: 'Lena Fischer', author_avatar_url: AVATAR(25) }),
  post({
    title: 'Sent from the old app',
    author_name: 'Joe Williams',
    author_avatar_url: AVATAR(60),
    body: 'Still figuring out the new phone. Your grandmother took this one. The birds have found the feeder again and are eating us out of house and home.',
    image_url: '22222222-2222-2222-2222-222222222222/posts/legacy-post/image.jpg',
    signed_photo_urls: { legacy: SIGNED_PHOTO(7) },
  }),
];

const fixtures: Array<[string, EditionEmailPayload]> = [
  payload('1-post-no-photo', [
    post({ author_name: 'Sam Williams', author_avatar_url: null }),
  ]),
  payload('1-post-photo', [
    post({
      title: 'We finally moved!',
      body: 'Boxes everywhere, but the kitchen window looks out on a jacaranda tree and I have decided that is worth everything else.\n\nCome see us when the guest room stops being a box fort.',
      image_url: 'ruth/posts/p1/image.jpg',
      signed_photo_urls: { legacy: PHOTO(1) },
    }),
  ]),
  payload('3-post-mixed-titles', [
    post({
      title: 'We finally moved!',
      author_name: 'Maya Chen-Williams',
      author_avatar_url: AVATAR(32),
      image_url: 'maya/posts/p2/image.jpg',
      signed_photo_urls: { legacy: PHOTO(2) },
      created_at: '2026-07-01T09:00:00Z',
    }),
    post({
      author_name: 'Sam Williams',
      author_avatar_url: AVATAR(12),
      body: 'Short one from me this week: the hip is healing, the physical therapist is a tyrant, and I love her for it.',
      created_at: '2026-07-02T18:30:00Z',
    }),
    post({
      title: 'Tomato report, week six',
      image_url: 'ruth/posts/p3/image.jpg',
      signed_photo_urls: { legacy: PHOTO(3, 800, 1000) },
      created_at: '2026-07-04T11:15:00Z',
    }),
  ]),
  payload('6-post-full-week', [
    post({ title: 'We finally moved!', author_name: 'Maya Chen-Williams', author_avatar_url: AVATAR(32), image_url: 'a', signed_photo_urls: { legacy: PHOTO(4) } }),
    post({ author_name: 'Sam Williams', author_avatar_url: AVATAR(12) }),
    post({ title: 'Tomato report, week six', image_url: 'b', signed_photo_urls: { legacy: PHOTO(5) } }),
    post({ author_name: 'Dev Patel', author_avatar_url: null, body: 'First week at the new job. Nobody has figured out I have no idea what I am doing, which I am told is the entire experience of employment.' }),
    post({ title: 'Postcard from the lake', author_name: 'June Williams', author_avatar_url: AVATAR(5), image_url: 'c', signed_photo_urls: { legacy: PHOTO(6, 900, 900) } }),
    post({ author_name: 'Ruth Williams', body: 'A closing thought: the group text is fine, but I like this better. It feels like getting a letter.' }),
  ]),
  payload('all-untitled', [
    post({ author_name: 'Ruth Williams' }),
    post({ author_name: 'Sam Williams', author_avatar_url: AVATAR(12) }),
  ]),
  payload('very-long-body', [
    post({
      title: 'The long drive north, in eight parts',
      body: LONG_BODY,
      image_url: 'd',
      signed_photo_urls: { legacy: PHOTO(7) },
    }),
  ]),
  payload('8-posts-4-photos', FOUR_PHOTO_EDITION),
];

const outDir = Deno.args[0] ?? 'preview-out';
await Deno.mkdir(outDir, { recursive: true });

const GMAIL_CLIP_BYTES = 102 * 1024;

const overLimit: string[] = [];

for (const [name, p] of fixtures) {
  const html = renderEditionEmailHtml(p);
  const text = renderEditionEmailText(p);
  const subject = renderEditionEmailSubject(p);

  await Deno.writeTextFile(`${outDir}/${name}.html`, html);
  await Deno.writeTextFile(`${outDir}/${name}.txt`, text);

  const bytes = new TextEncoder().encode(html).length;
  const clipWarning = bytes > GMAIL_CLIP_BYTES ? '  ⚠ OVER GMAIL CLIP LIMIT' : '';
  if (bytes > GMAIL_CLIP_BYTES) overLimit.push(`${name} (${bytes} bytes)`);
  console.log(`${name.padEnd(22)} ${String(bytes).padStart(6)} bytes${clipWarning}`);
  console.log(`${''.padEnd(22)} subject: ${subject}`);
}

console.log(`\nWrote ${fixtures.length} fixtures to ${outDir}/ — open the .html files in a browser.`);

// Exit non-zero when a fixture would be clipped. CI runs this as its only
// behavioural check on the email, and a warning printed into a green build is
// a warning nobody reads. Gmail truncates past ~102KB and appends a "View
// entire message" link — which, for a member who only ever reads the email,
// silently cuts the edition in half.
if (overLimit.length > 0) {
  console.error(
    `\n✗ ${overLimit.length} fixture(s) exceed Gmail's ~102KB clip limit:\n  ${overLimit.join('\n  ')}`,
  );
  Deno.exit(1);
}
