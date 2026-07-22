// Builds the subject, HTML body, and plain-text body for an Edition email.
//
// This is the most-seen surface in the product: every member gets it weekly,
// including readers who never open the app — so the email carries the full
// edition (every post, full body, photos) styled as the group's own
// newspaper. Photos come from the private `post-images` bucket; the dispatch
// worker signs them (`image_signed_url`) before rendering, and a post whose
// photo can't be signed simply renders without it.
//
// Visual system: v2 editorial (design/BRAND.md) — "NYT structure, HeyTea
// charm". Near-monochrome ink on warm paper, hairline rules, Lora serif over
// Jost sans, one scarce vermilion accent (the masthead kicker + links; never
// a button fill, never a surface tint). The v1 dress — orange, peach wash,
// Roboto Slab, the taped polaroid — is fully retired; photos print flat and
// square with a hairline edge, exactly as they do on the edition front page.
//
// Email-client ground rules baked in here:
//   • Table layout + inline styles; the <style> block is progressive
//     enhancement only (webfonts + color-scheme) — Gmail strips it.
//   • All links are https (Gmail blocks custom-scheme deep links); the web
//     targets come from the dispatch layer via `edition_web_url` /
//     `start_your_own_url`.
//   • Light scheme declared explicitly so Apple Mail keeps the warm paper.
//   • Total HTML must stay well under ~102KB or Gmail clips the message.

export type EditionEmailPost = {
  id: string;
  title: string | null;
  body: string;
  // Raw value from `posts.image_url` (storage path or legacy public URL).
  image_url: string | null;
  // Signed, directly-renderable URL attached by the dispatch worker.
  image_signed_url?: string | null;
  author_name: string;
  author_avatar_url: string | null;
  created_at: string;
};

export type EditionEmailPayload = {
  edition_id: string;
  edition_number: number;
  published_at: string;
  group_id: string;
  group_name: string;
  posts: EditionEmailPost[];
  recipient_display_name: string;
  unsubscribe_url: string;
  // Web (https) link targets — see WEB_BASE_URL in edition-dispatch.ts.
  edition_web_url: string;
  start_your_own_url: string;
};

// ---------------------------------------------------------------------------
// Brand tokens (mirrors design/BRAND.md §2 + constants/colors.ts — the email
// must read as the app. Values are flattened to solids: email needs opaque
// hex, so the ink-alpha tokens are pre-composited onto paperWarm.)
// ---------------------------------------------------------------------------

const INK = '#1A1A1A'; // soft black — matches Colors.ink
const INK_SOFT = '#706F6D'; // ink @ 62% on paperWarm — secondary text, decks, bylines (AA for body)
const INK_MUTED = '#A6A4A1'; // ink @ 38% on paperWarm — footer / unsubscribe
const VERMILION = '#E8442E'; // THE accent — kickers + links only, never a fill
const PAPER = '#FFFFFF';
const PAPER_WARM = '#FBF9F4'; // the sheet — same warm paper as the app background
const HAIRLINE = '#DCDAD5'; // ink @ 14% on paperWarm — rules, dividers, photo edges
const RULE = INK; // structural masthead/section rules (2–3px), full-strength ink

// Lora + Jost, the app's two families (BRAND §3), both embeddable via Google
// Fonts (@import for clients that honor <style>; Georgia/Arial otherwise).
const SERIF = `'Lora', Georgia, 'Times New Roman', serif`;
const SANS = `'Jost', 'Helvetica Neue', Arial, sans-serif`;

const escape = (s: string): string =>
  s.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatPublishedDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const firstName = (displayName: string): string =>
  displayName.trim().split(/\s+/)[0] || displayName;

// Unique contributor first names, in the order they first appear (posts are
// already chronological from the payload RPC).
const contributorFirstNames = (posts: EditionEmailPost[]): string[] => {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const post of posts) {
    const name = firstName(post.author_name);
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      names.push(name);
    }
  }
  return names;
};

// "Ruth", "Ruth and Sam", "Ruth, Sam, and Mae", "Ruth, Sam, and 2 others"
const namesPhrase = (names: string[]): string => {
  if (names.length === 0) return 'your group';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  if (names.length === 3) return `${names[0]}, ${names[1]}, and ${names[2]}`;
  return `${names[0]}, ${names[1]}, and ${names.length - 2} others`;
};

const truncateOnWord = (s: string, max: number): string => {
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).trimEnd()}…`;
};

// ---------------------------------------------------------------------------
// Subject + preheader
// ---------------------------------------------------------------------------

// Content-led subject with a designed fallback chain:
//   1. First titled post: “{title}” — and N more stories in {group}
//   2. No titles:          Stories from Ruth and Sam — {group}
//   3. Single untitled:    From Ruth — this week in {group}
export const renderEditionEmailSubject = (
  payload: Pick<EditionEmailPayload, 'group_name' | 'posts'>,
): string => {
  const titled = payload.posts.find((p) => p.title?.trim());
  if (titled?.title) {
    const hook = truncateOnWord(titled.title.trim(), 45);
    const others = payload.posts.length - 1;
    if (others === 0) return `“${hook}” — this week in ${payload.group_name}`;
    const stories = others === 1 ? '1 more story' : `${others} more stories`;
    return `“${hook}” — and ${stories} in ${payload.group_name}`;
  }

  const names = contributorFirstNames(payload.posts);
  if (payload.posts.length === 1 && names.length === 1) {
    return `From ${names[0]} — this week in ${payload.group_name}`;
  }
  return `Stories from ${namesPhrase(names)} — ${payload.group_name}`;
};

// Hidden inbox-preview line: "Edition No. 12 · Sunday, July 5, 2026 · stories
// from Ruth, Sam, and 2 others".
const renderPreheader = (payload: EditionEmailPayload): string => {
  const names = namesPhrase(contributorFirstNames(payload.posts));
  return `Edition No. ${payload.edition_number} · ${formatPublishedDate(payload.published_at)} · stories from ${names}`;
};

// ---------------------------------------------------------------------------
// HTML pieces
// ---------------------------------------------------------------------------

// Short hairline rules flanking centered text — the app masthead's folio band.
const flankedRow = (inner: string, ruleWidth = 56): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
    <tr>
      <td width="${ruleWidth}" style="border-top: 1px solid ${HAIRLINE}; font-size: 0; line-height: 0;">&nbsp;</td>
      <td style="padding: 0 12px;">${inner}</td>
      <td width="${ruleWidth}" style="border-top: 1px solid ${HAIRLINE}; font-size: 0; line-height: 0;">&nbsp;</td>
    </tr>
  </table>`;

const renderMasthead = (payload: EditionEmailPayload): string => {
  const storyCount = payload.posts.length;
  const writerCount = contributorFirstNames(payload.posts).length;
  const stories = storyCount === 1 ? '1 story' : `${storyCount} stories`;
  const writers = writerCount === 1 ? '1 writer' : `${writerCount} writers`;
  const dateline = `<span style="font-family: ${SERIF}; font-size: 14px; font-style: italic; color: ${INK_SOFT}; white-space: nowrap;">${escape(formatPublishedDate(payload.published_at))}</span>`;

  // The email's "new moment" — the app's DELIVERED stamp equivalent. A single
  // vermilion small-caps kicker (BRAND §8); the masthead's one accent.
  return `
    <td align="center" style="padding: 40px 36px 0 36px;">
      <p style="margin: 0 0 12px 0; font-family: ${SANS}; font-size: 12px; font-weight: 600; letter-spacing: 2.4px; text-transform: uppercase; color: ${VERMILION};">New Edition</p>
      <h1 style="margin: 0 0 12px 0; font-family: ${SERIF}; font-size: 36px; line-height: 1.14; font-weight: 700; letter-spacing: -0.5px; color: ${INK};">${escape(payload.group_name)}</h1>
      ${flankedRow(dateline)}
      <p style="margin: 12px 0 0 0; font-family: ${SANS}; font-size: 12px; font-weight: 600; letter-spacing: 1.8px; text-transform: uppercase; color: ${INK_SOFT};">Edition No. ${payload.edition_number} &nbsp;·&nbsp; ${stories} &nbsp;·&nbsp; ${writers}</p>
      <div style="margin: 18px 0 0 0; border-top: 3px solid ${RULE}; font-size: 0; line-height: 0;">&nbsp;</div>
    </td>`;
};

// Flat editorial photo (BRAND §5): square corners, no rotation, no frame, no
// shadow — just a hairline edge (newsprint photos have edges) and a Jost
// credit below, left-aligned, "Photo by Ruth". The taped polaroid is retired.
const renderPhoto = (src: string, authorName: string): string => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 4px 0 18px 0;">
    <tr>
      <td style="font-size: 0; line-height: 0;">
        <img src="${escape(src)}" alt="Photo by ${escape(authorName)}" width="100%" style="display: block; width: 100%; height: auto; border: 1px solid ${HAIRLINE};">
      </td>
    </tr>
    <tr>
      <td style="padding: 8px 0 0 0; font-family: ${SANS}; font-size: 12px; letter-spacing: 0.4px; color: ${INK_SOFT};">Photo by ${escape(firstName(authorName))}</td>
    </tr>
  </table>`;

const renderByline = (post: EditionEmailPost): string => {
  const hasTitle = Boolean(post.title?.trim());
  const avatar = post.author_avatar_url
    ? `<img src="${escape(post.author_avatar_url)}" alt="" width="40" height="40" style="display: block; border-radius: 20px; border: 1px solid ${HAIRLINE};">`
    : '';
  const name = hasTitle
    ? `<span style="font-family: ${SERIF}; font-size: 15px; font-style: italic; color: ${INK_SOFT};">By ${escape(post.author_name)}</span>`
    : `<span style="font-family: ${SERIF}; font-size: 19px; font-weight: 600; color: ${INK};">${escape(post.author_name)}</span>`;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 14px 0;">
      <tr>
        ${avatar ? `<td style="padding-right: 10px;" valign="middle">${avatar}</td>` : ''}
        <td valign="middle">${name}</td>
      </tr>
    </table>`;
};

const renderPost = (post: EditionEmailPost, isLast: boolean): string => {
  const title = post.title?.trim();
  const headline = title
    ? `<h2 style="margin: 0 0 8px 0; font-family: ${SERIF}; font-size: 26px; line-height: 1.25; font-weight: 700; color: ${INK};">${escape(title)}</h2>`
    : '';

  const photo = post.image_signed_url
    ? renderPhoto(post.image_signed_url, post.author_name)
    : '';

  const paragraphs = post.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin: 0 0 16px 0; font-family: ${SERIF}; font-size: 17px; line-height: 26px; color: ${INK};">${escape(p).replace(/\n/g, '<br>')}</p>`)
    .join('');

  const divider = isLast ? '' : `border-bottom: 1px solid ${HAIRLINE};`;

  return `
    <tr>
      <td style="padding: 28px 36px 20px 36px; ${divider}">
        ${headline}
        ${renderByline(post)}
        ${photo}
        ${paragraphs}
      </td>
    </tr>`;
};

// Primary button (BRAND §9): ink fill, paper label, full-round pill. Vermilion
// never fills a button — the accent lives in the masthead kicker and links.
const renderCta = (payload: EditionEmailPayload): string => `
  <tr>
    <td align="center" style="padding: 16px 36px 8px 36px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="background-color: ${INK}; border-radius: 28px;">
            <a href="${escape(payload.edition_web_url)}" style="display: inline-block; padding: 16px 34px; font-family: ${SANS}; font-size: 17px; font-weight: 600; color: ${PAPER}; text-decoration: none; border-radius: 28px; white-space: nowrap;">Open in Catch Up Column</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

// The printer's mark: reads as a colophon to members, as an invitation to a
// forwarded reader. Deliberately quiet — it must never shout over the family.
const renderColophon = (payload: EditionEmailPayload): string => {
  const ornament = `<span style="font-family: ${SERIF}; font-size: 16px; color: ${INK_SOFT};">&#10086;</span>`;
  return `
  <tr>
    <td align="center" style="padding: 28px 36px 34px 36px;">
      ${flankedRow(ornament, 72)}
      <p style="margin: 12px 0 0 0; font-family: ${SANS}; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: ${INK_SOFT};">Catch Up Column &nbsp;·&nbsp; No. ${payload.edition_number}</p>
      <p style="margin: 14px 0 0 0; font-family: ${SERIF}; font-size: 14px; line-height: 22px; font-style: italic; color: ${INK_SOFT};">This newspaper was written by ${escape(payload.group_name)}<br>and printed by Catch Up Column.</p>
      <p style="margin: 10px 0 0 0; font-family: ${SANS}; font-size: 16px; font-weight: 600;"><a href="${escape(payload.start_your_own_url)}" style="color: ${VERMILION}; text-decoration: none;">Start one for your people &rarr;</a></p>
    </td>
  </tr>`;
};

export const renderEditionEmailHtml = (payload: EditionEmailPayload): string => {
  const postsHtml = payload.posts
    .map((post, i) => renderPost(post, i === payload.posts.length - 1))
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${escape(payload.group_name)} — Edition No. ${payload.edition_number}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@400;500;600&display=swap');
      :root { color-scheme: light; supported-color-schemes: light; }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${PAPER_WARM};">
    <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${escape(renderPreheader(payload))}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${PAPER_WARM};">
      <tr>
        <td align="center" style="padding: 28px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px; background-color: ${PAPER_WARM}; border: 1px solid ${HAIRLINE};">
            <tr>
              ${renderMasthead(payload)}
            </tr>
            <tr>
              <td style="padding: 22px 36px 0 36px;">
                <p style="margin: 0; font-family: ${SERIF}; font-size: 16px; line-height: 24px; font-style: italic; color: ${INK_SOFT};">Hello ${escape(payload.recipient_display_name)} — here&#39;s what your group wrote this week.</p>
              </td>
            </tr>
            ${postsHtml}
            ${renderCta(payload)}
            ${renderColophon(payload)}
          </table>
          <p style="margin: 18px 0 0 0; font-family: ${SANS}; font-size: 12px; line-height: 19px; color: ${INK_MUTED};">
            You&#39;re receiving this because you&#39;re a member of ${escape(payload.group_name)}.<br>
            <a href="${escape(payload.unsubscribe_url)}" style="color: ${INK_MUTED}; text-decoration: underline;">Unsubscribe from this group&#39;s emails</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

// ---------------------------------------------------------------------------
// Plain-text alternative (deliverability + screen-reader/text-client fallback)
// ---------------------------------------------------------------------------

export const renderEditionEmailText = (payload: EditionEmailPayload): string => {
  const rule = '─'.repeat(40);
  const sections = payload.posts.map((post) => {
    const title = post.title?.trim();
    const heading = title ? `${title}\nBy ${post.author_name}` : post.author_name;
    const photoNote = post.image_signed_url ? '[Photo — view it in the app or the web edition]\n\n' : '';
    return `${heading}\n\n${photoNote}${post.body.trim()}`;
  });

  return [
    payload.group_name.toUpperCase(),
    `Edition No. ${payload.edition_number} · ${formatPublishedDate(payload.published_at)}`,
    rule,
    `Hello ${payload.recipient_display_name} — here's what your group wrote this week.`,
    '',
    sections.join(`\n\n${rule}\n\n`),
    '',
    rule,
    `Open this edition: ${payload.edition_web_url}`,
    '',
    `This newspaper was written by ${payload.group_name} and printed by Catch Up Column.`,
    `Start one for your people: ${payload.start_your_own_url}`,
    '',
    `Unsubscribe from this group's emails: ${payload.unsubscribe_url}`,
  ].join('\n');
};
