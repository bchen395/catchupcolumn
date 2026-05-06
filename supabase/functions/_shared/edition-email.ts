// Builds the HTML body for an Edition email.
//
// Newspaper-styled, single recipient. Photos in posts are intentionally
// omitted — the email links back into the app for the full reading view.

export type EditionEmailPost = {
  id: string;
  body: string;
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
  app_deep_link: string;
};

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

const renderPost = (post: EditionEmailPost): string => {
  const paragraphs = post.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin: 0 0 16px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 17px; line-height: 1.7; color: #2b2620;">${escape(p).replace(/\n/g, '<br>')}</p>`)
    .join('');

  const avatar = post.author_avatar_url
    ? `<img src="${escape(post.author_avatar_url)}" alt="" width="40" height="40" style="border-radius: 20px; vertical-align: middle; margin-right: 10px;">`
    : '';

  return `
    <section style="margin: 0 0 36px 0; padding: 0 0 28px 0; border-bottom: 1px solid #e6e0d4;">
      <div style="margin: 0 0 14px 0;">
        ${avatar}
        <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 18px; font-weight: bold; color: #2b2620; vertical-align: middle;">${escape(post.author_name)}</span>
      </div>
      ${paragraphs}
    </section>
  `;
};

export const renderEditionEmailHtml = (payload: EditionEmailPayload): string => {
  const postsHtml = payload.posts.map(renderPost).join('');
  const dateLine = formatPublishedDate(payload.published_at);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escape(payload.group_name)} — Edition ${payload.edition_number}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #faf6ee;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #faf6ee;">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #fffaf0; border: 1px solid #e6e0d4;">
            <tr>
              <td style="padding: 40px 40px 24px 40px; border-bottom: 3px double #2b2620;">
                <p style="margin: 0 0 4px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #6b5d49;">Edition №${payload.edition_number} · ${escape(dateLine)}</p>
                <h1 style="margin: 8px 0 0 0; font-family: Georgia, 'Times New Roman', serif; font-size: 36px; line-height: 1.15; font-weight: bold; color: #2b2620;">${escape(payload.group_name)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 40px 8px 40px;">
                <p style="margin: 0 0 28px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; line-height: 1.6; color: #6b5d49; font-style: italic;">Hello ${escape(payload.recipient_display_name)} — here's what your group wrote this week.</p>
                ${postsHtml}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 40px 40px 40px;" align="center">
                <a href="${escape(payload.app_deep_link)}" style="display: inline-block; padding: 14px 28px; background-color: #2b2620; color: #faf6ee; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; text-decoration: none;">Open in Catch Up Column</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 40px 32px 40px; border-top: 1px solid #e6e0d4;" align="center">
                <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 13px; line-height: 1.6; color: #8a7d68;">
                  You're receiving this because you're a member of <strong>${escape(payload.group_name)}</strong>.<br>
                  <a href="${escape(payload.unsubscribe_url)}" style="color: #8a7d68;">Unsubscribe from this group</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export const renderEditionEmailSubject = (payload: Pick<EditionEmailPayload, 'group_name' | 'edition_number'>): string =>
  `${payload.group_name} — Edition №${payload.edition_number}`;
