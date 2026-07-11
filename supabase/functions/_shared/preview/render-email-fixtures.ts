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

const PHOTO = (seed: number, w = 900, h = 675) =>
  `https://picsum.photos/seed/cuc-${seed}/${w}/${h}`;
const AVATAR = (n: number) => `https://i.pravatar.cc/80?img=${n}`;

let postSeq = 0;
const post = (overrides: Partial<EditionEmailPost>): EditionEmailPost => {
  postSeq += 1;
  return {
    id: `post-${postSeq}`,
    title: null,
    body: 'The tomatoes finally came in this week. Your grandfather says he grew them; the truth is the rain did.',
    image_url: null,
    image_signed_url: null,
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
    group_name: 'The Williams Family Weekly',
    posts,
    recipient_display_name: 'Ruth',
    unsubscribe_url: 'https://example.supabase.co/functions/v1/unsubscribe?token=00000000-0000-0000-0000-000000000000',
    edition_web_url: 'https://catchupcolumn.com/edition/00000000-0000-0000-0000-000000000000',
    start_your_own_url: 'https://catchupcolumn.com/start',
    ...overrides,
  },
];

const LONG_BODY = Array.from({ length: 8 }, (_, i) =>
  `Paragraph ${i + 1}. We drove up through the pass on Saturday morning and the fog sat in the valley like something poured there. Sam wanted to stop at every overlook, and we did, because that is the whole point of being retired. By the time we reached the cabin the coffee thermos was empty and the dog had opinions.`,
).join('\n\n');

const fixtures: Array<[string, EditionEmailPayload]> = [
  payload('1-post-no-photo', [
    post({ author_name: 'Sam Williams', author_avatar_url: null }),
  ]),
  payload('1-post-photo', [
    post({
      title: 'We finally moved!',
      body: 'Boxes everywhere, but the kitchen window looks out on a jacaranda tree and I have decided that is worth everything else.\n\nCome see us when the guest room stops being a box fort.',
      image_url: 'ruth/posts/p1/image.jpg',
      image_signed_url: PHOTO(1),
    }),
  ]),
  payload('3-post-mixed-titles', [
    post({
      title: 'We finally moved!',
      author_name: 'Maya Chen-Williams',
      author_avatar_url: AVATAR(32),
      image_url: 'maya/posts/p2/image.jpg',
      image_signed_url: PHOTO(2),
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
      image_signed_url: PHOTO(3, 800, 1000),
      created_at: '2026-07-04T11:15:00Z',
    }),
  ]),
  payload('6-post-full-week', [
    post({ title: 'We finally moved!', author_name: 'Maya Chen-Williams', author_avatar_url: AVATAR(32), image_url: 'a', image_signed_url: PHOTO(4) }),
    post({ author_name: 'Sam Williams', author_avatar_url: AVATAR(12) }),
    post({ title: 'Tomato report, week six', image_url: 'b', image_signed_url: PHOTO(5) }),
    post({ author_name: 'Dev Patel', author_avatar_url: null, body: 'First week at the new job. Nobody has figured out I have no idea what I am doing, which I am told is the entire experience of employment.' }),
    post({ title: 'Postcard from the lake', author_name: 'June Williams', author_avatar_url: AVATAR(5), image_url: 'c', image_signed_url: PHOTO(6, 900, 900) }),
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
      image_signed_url: PHOTO(7),
    }),
  ]),
];

const outDir = Deno.args[0] ?? 'preview-out';
await Deno.mkdir(outDir, { recursive: true });

const GMAIL_CLIP_BYTES = 102 * 1024;

for (const [name, p] of fixtures) {
  const html = renderEditionEmailHtml(p);
  const text = renderEditionEmailText(p);
  const subject = renderEditionEmailSubject(p);

  await Deno.writeTextFile(`${outDir}/${name}.html`, html);
  await Deno.writeTextFile(`${outDir}/${name}.txt`, text);

  const bytes = new TextEncoder().encode(html).length;
  const clipWarning = bytes > GMAIL_CLIP_BYTES ? '  ⚠ OVER GMAIL CLIP LIMIT' : '';
  console.log(`${name.padEnd(22)} ${String(bytes).padStart(6)} bytes${clipWarning}`);
  console.log(`${''.padEnd(22)} subject: ${subject}`);
}

console.log(`\nWrote ${fixtures.length} fixtures to ${outDir}/ — open the .html files in a browser.`);
