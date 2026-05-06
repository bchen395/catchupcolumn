// unsubscribe/index.ts
//
// Public (unauthenticated) endpoint hit from a per-recipient link in an
// Edition email. Identifies the group_members row by an opaque uuid token
// and flips email_subscribed=false. Returns a small HTML confirmation page.
//
// Deploy with:
//   npx supabase functions deploy unsubscribe --no-verify-jwt
//
// Required env vars:
//   SUPABASE_URL              — injected automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — injected automatically by Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const escape = (s: string): string =>
  s.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const page = (title: string, body: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escape(title)}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #faf6ee; font-family: Georgia, 'Times New Roman', serif; color: #2b2620;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding: 64px 16px;">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; background-color: #fffaf0; border: 1px solid #e6e0d4;">
            <tr>
              <td style="padding: 40px;">
                ${body}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const html = (status: number, title: string, body: string): Response =>
  new Response(page(title, body), {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });

Deno.serve(async (req: Request) => {
  if (req.method !== 'GET') {
    return html(405, 'Method Not Allowed', '<h1>Method Not Allowed</h1>');
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('token')?.trim();

  if (!token || !UUID_REGEX.test(token)) {
    return html(
      400,
      'Invalid Link',
      `
        <h1 style="margin: 0 0 16px 0; font-size: 28px;">Invalid unsubscribe link</h1>
        <p style="margin: 0; font-size: 16px; line-height: 1.6;">This link is malformed. If you keep getting unwanted emails, please reply to one of them and let us know.</p>
      `,
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return html(
      500,
      'Service Unavailable',
      '<h1 style="margin:0 0 16px 0; font-size: 28px;">Something went wrong</h1><p>Please try again in a few minutes.</p>',
    );
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await adminClient.rpc('unsubscribe_by_token', { p_token: token });

  if (error) {
    console.error('unsubscribe_by_token failed:', error.message);
    return html(
      500,
      'Something went wrong',
      '<h1 style="margin:0 0 16px 0; font-size: 28px;">Something went wrong</h1><p>Please try again in a few minutes.</p>',
    );
  }

  const result = data as { ok: boolean; reason?: string; group_name?: string; already_unsubscribed?: boolean };

  if (!result?.ok) {
    return html(
      404,
      'Link Not Found',
      `
        <h1 style="margin: 0 0 16px 0; font-size: 28px;">We couldn't find that subscription</h1>
        <p style="margin: 0; font-size: 16px; line-height: 1.6;">This link may have expired or already been used.</p>
      `,
    );
  }

  const groupName = result.group_name ?? 'this group';
  const heading = result.already_unsubscribed ? 'You were already unsubscribed' : 'You have been unsubscribed';

  return html(
    200,
    heading,
    `
      <h1 style="margin: 0 0 16px 0; font-size: 28px;">${escape(heading)}</h1>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">You will no longer receive weekly editions from <strong>${escape(groupName)}</strong>.</p>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b5d49;">You're still a member of the group inside the app, and you can re-enable email anytime from the group's settings.</p>
    `,
  );
});
