// report-story/index.ts
//
// "Report this story", sent from inside the app (App Review Guideline 1.2).
// The reader's report sheet calls this; it emails support@ one plain-text
// message per report, with reply_to set to the reporter so support can answer
// them. There is no reports table — the support inbox is the record, for the
// reasons in lib/report.ts. The app keeps a mailto draft as its fallback.
//
// Authenticated by the caller's Supabase JWT (verify_jwt on, the default).
// Every read runs as the caller, so RLS does the access check: posts are only
// visible to members of the post's Group, so a row back proves the reporter
// can read the story they're reporting. No service-role client is needed.
//
// Flow:
//   1. Verify the caller (getUser on a caller-scoped client).
//   2. Validate { post_id: uuid, note?: string }; trim the note, cap at 1000.
//   3. Load the post (with its author's display name) and its Group's name as
//      the caller. No row → 404 post_not_found.
//   4. Send one email through Resend. Return { ok: true }.
//
// Errors are { error: code }: not_authenticated (401), invalid_request (400),
// post_not_found (404), lookup_failed / misconfigured (500), send_failed (502).
// Logs carry ids and the note's length, never the note itself.
//
// Required environment variables:
//   SUPABASE_URL, SUPABASE_ANON_KEY (auto-injected)
//   RESEND_API_KEY
//   EMAIL_FROM    (optional; same secret and default as _shared/edition-dispatch.ts)
//   SUPPORT_EMAIL (optional; default support@catchupcolumn.com)
//
// Self-contained on purpose, like unsubscribe and delete-account: importing
// _shared/edition-dispatch.ts for one constant would put this function on the
// list of importers to redeploy after every edition-delivery change.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Catch Up Column <onboarding@resend.dev>';
const SUPPORT_EMAIL = Deno.env.get('SUPPORT_EMAIL') ?? 'support@catchupcolumn.com';

// Matches the app's TextInput maxLength. Counted in code points so a cut
// never splits an emoji.
const MAX_NOTE_LENGTH = 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ReportedPost = {
  id: string;
  group_id: string;
  author_id: string;
  edition_id: string | null;
  author: { display_name: string } | null;
};

type ReportInput = { postId: string; note: string };

const parseInput = (body: unknown): ReportInput | null => {
  if (!body || typeof body !== 'object') return null;
  const { post_id, note } = body as { post_id?: unknown; note?: unknown };
  if (typeof post_id !== 'string' || !UUID_RE.test(post_id)) return null;
  if (note !== undefined && note !== null && typeof note !== 'string') return null;
  const trimmed = typeof note === 'string' ? note.trim() : '';
  return { postId: post_id, note: Array.from(trimmed).slice(0, MAX_NOTE_LENGTH).join('').trim() };
};

// One line, so a Group name can't fold the subject header.
const oneLine = (value: string): string => value.replace(/\s+/g, ' ').trim();

// The same details block the app's mailto fallback carries (lib/report.ts),
// plus the reporter's email. Plain `key: value` lines so they survive every
// mail client's quoting when support replies.
const reportText = (
  note: string,
  post: ReportedPost,
  groupName: string,
  reporter: { id: string; email: string | null },
): string =>
  [
    note || '(No note. The reporter sent the story without one.)',
    '',
    '---',
    'Details for our team:',
    `Story: ${post.id}`,
    `Group: ${oneLine(groupName)} (${post.group_id})`,
    `Edition: ${post.edition_id ?? 'not yet published'}`,
    `Written by: ${oneLine(post.author?.display_name ?? 'unknown')} (${post.author_id})`,
    `Reported by: ${reporter.email ?? 'no email on file'} (${reporter.id})`,
    '',
  ].join('\n');

// The fetch pattern of _shared/edition-dispatch.ts's sendOneEmail: a non-2xx
// from Resend is a hard fail, and its body is kept (trimmed) for the log.
const sendReportEmail = async (
  apiKey: string,
  subject: string,
  text: string,
  replyTo: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [SUPPORT_EMAIL],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
  }
  return { ok: true };
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json(401, { error: 'not_authenticated' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !resendApiKey) {
    console.error('report-story: missing SUPABASE_URL, SUPABASE_ANON_KEY or RESEND_API_KEY');
    return json(500, { error: 'misconfigured' });
  }

  let input: ReportInput | null;
  try {
    input = parseInput(await req.json());
  } catch {
    input = null;
  }
  if (!input) {
    return json(400, { error: 'invalid_request' });
  }

  // Caller-scoped: auth.uid() is the reporter, so RLS decides what they see.
  const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();

  if (userError || !user) {
    return json(401, { error: 'not_authenticated' });
  }

  const { postId, note } = input;
  const context = `post=${postId} reporter=${user.id}`;

  // Members only: the posts SELECT policy is is_group_member(group_id). The
  // author's display_name is readable by any signed-in user (column grant).
  const { data: postData, error: postError } = await callerClient
    .from('posts')
    .select('id, group_id, author_id, edition_id, author:users(display_name)')
    .eq('id', postId)
    .maybeSingle();

  if (postError) {
    console.error(`report-story: post lookup failed ${context}: ${postError.message}`);
    return json(500, { error: 'lookup_failed' });
  }
  if (!postData) {
    console.warn(`report-story: post not visible ${context}`);
    return json(404, { error: 'post_not_found' });
  }
  const post = postData as unknown as ReportedPost;

  // Readable for the same reason the post was: the caller is a member.
  const { data: group, error: groupError } = await callerClient
    .from('groups')
    .select('name')
    .eq('id', post.group_id)
    .maybeSingle();

  if (groupError) {
    console.error(`report-story: group lookup failed ${context}: ${groupError.message}`);
    return json(500, { error: 'lookup_failed' });
  }

  const groupName = (group as { name: string } | null)?.name ?? 'a Group';
  const reporterEmail = user.email ?? null;
  const subject = `Story report — ${oneLine(groupName)}`.slice(0, 200);
  const text = reportText(note, post, groupName, { id: user.id, email: reporterEmail });

  let sent: Awaited<ReturnType<typeof sendReportEmail>>;
  try {
    sent = await sendReportEmail(resendApiKey, subject, text, reporterEmail);
  } catch (err) {
    sent = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  if (!sent.ok) {
    console.error(`report-story: send failed ${context}: ${sent.error}`);
    return json(502, { error: 'send_failed' });
  }

  console.log(
    `report-story: sent ${context} group=${post.group_id} edition=${post.edition_id ?? 'none'} note_chars=${note.length}`,
  );
  return json(200, { ok: true });
});
