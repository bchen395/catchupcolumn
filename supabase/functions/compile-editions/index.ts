// compile-editions/index.ts
//
// Supabase Edge Function that:
//   1. Compiles unassigned posts into a new Edition for every Group whose
//      publish window falls within the current rolling window.
//   2. Emails the resulting Edition (and any prior Editions whose send
//      failed and still have retry budget) to all subscribed members.
//
// Invocation:
//   • Automatic — Supabase Cron invokes this HTTP endpoint every 15 minutes.
//   • Manual    — HTTP POST with `Authorization: Bearer <CRON_SECRET>` header.
//
// Required environment variables:
//   SUPABASE_URL              — injected automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — injected automatically by Supabase
//   CRON_SECRET               — shared secret for authenticating manual HTTP calls
//   RESEND_API_KEY            — Resend API key for transactional email
//   FUNCTIONS_PUBLIC_URL      — public base URL of the functions host
//                               (e.g. https://<ref>.supabase.co/functions/v1).
//                               Used to build unsubscribe links.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  EditionEmailPayload,
  EditionEmailPost,
  renderEditionEmailHtml,
  renderEditionEmailSubject,
} from '../_shared/edition-email.ts';

const MAX_EMAIL_ATTEMPTS = 3;
const MAX_PUSH_ATTEMPTS = 3;
// Override for production via `supabase secrets set EMAIL_FROM=...` once a
// verified Resend domain is in place. The fallback is the Resend sandbox
// sender — fine for dev, but tanks deliverability if it ships to prod.
const EMAIL_FROM =
  Deno.env.get('EMAIL_FROM') ?? 'Catch Up Column <onboarding@resend.dev>';
const APP_SCHEME = 'catchupcolumn';

type CompileResult = {
  compiled: number;
  skipped_no_posts: number;
  details: Array<
    | { group_id: string; group_name: string; edition_number: number; post_count: number; edition_id?: string }
    | { group_id: string; group_name: string; skipped: true; reason: string }
  >;
};

type EmailResult = {
  attempted_editions: number;
  fully_sent: number;
  partial_or_failed: number;
  recipients_sent: number;
  recipients_failed: number;
};

type EmailRecipient = {
  user_id: string;
  email: string;
  display_name: string;
  unsubscribe_token: string;
};

type EmailPayloadRow = {
  edition_id: string;
  edition_number: number;
  published_at: string;
  emailed_at: string | null;
  email_attempts: number;
  group_id: string;
  group_name: string;
  posts: EditionEmailPost[];
  recipients: EmailRecipient[];
};

type PushTarget = {
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  group_id: string;
  group_name: string;
  edition_id: string;
};

type PushResult = {
  attempted_editions: number;
  pushes_sent: number;
  pushes_failed: number;
};

// ---------------------------------------------------------------------------
// Compilation
// ---------------------------------------------------------------------------

async function compileEditions(client: SupabaseClient): Promise<CompileResult> {
  const { data, error } = await client.rpc('compile_due_editions', {
    p_tolerance_minutes: 15,
  });

  if (error) {
    throw new Error(`Failed to compile due editions: ${error.message}`);
  }

  return (data ?? { compiled: 0, skipped_no_posts: 0, details: [] }) as CompileResult;
}

// ---------------------------------------------------------------------------
// Email sending
// ---------------------------------------------------------------------------

async function sendOneEmail(
  apiKey: string,
  to: string,
  subject: string,
  html: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
  }
  return { ok: true };
}

async function sendEditionEmail(
  client: SupabaseClient,
  resendApiKey: string,
  functionsBaseUrl: string,
  editionId: string,
): Promise<{ recipientsSent: number; recipientsFailed: number; allSucceeded: boolean }> {
  const { data, error } = await client.rpc('get_edition_email_payload', {
    p_edition_id: editionId,
  });

  if (error) {
    throw new Error(`get_edition_email_payload failed for ${editionId}: ${error.message}`);
  }

  const payload = data as EmailPayloadRow | null;
  if (!payload) {
    return { recipientsSent: 0, recipientsFailed: 0, allSucceeded: true };
  }

  // Already sent — defensive guard, the SELECT in handler also filters this.
  if (payload.emailed_at) {
    return { recipientsSent: 0, recipientsFailed: 0, allSucceeded: true };
  }

  if (payload.recipients.length === 0) {
    // Nothing to send. Mark as emailed so we don't keep retrying.
    await client.rpc('mark_edition_emailed', { p_edition_id: editionId });
    return { recipientsSent: 0, recipientsFailed: 0, allSucceeded: true };
  }

  const subject = renderEditionEmailSubject(payload);
  const appDeepLink = `${APP_SCHEME}://edition/${payload.edition_id}`;

  let sent = 0;
  let failed = 0;

  for (const recipient of payload.recipients) {
    const unsubscribeUrl = `${functionsBaseUrl}/unsubscribe?token=${recipient.unsubscribe_token}`;
    const emailPayload: EditionEmailPayload = {
      edition_id: payload.edition_id,
      edition_number: payload.edition_number,
      published_at: payload.published_at,
      group_id: payload.group_id,
      group_name: payload.group_name,
      posts: payload.posts,
      recipient_display_name: recipient.display_name,
      unsubscribe_url: unsubscribeUrl,
      app_deep_link: appDeepLink,
    };
    const html = renderEditionEmailHtml(emailPayload);

    const result = await sendOneEmail(resendApiKey, recipient.email, subject, html);
    if (result.ok) {
      sent++;
    } else {
      failed++;
      console.error(`Email failed for edition=${editionId} recipient=${recipient.user_id}: ${result.error}`);
    }
  }

  if (failed === 0) {
    await client.rpc('mark_edition_emailed', { p_edition_id: editionId });
    return { recipientsSent: sent, recipientsFailed: 0, allSucceeded: true };
  }

  // Partial or total failure: bump attempt counter so we eventually give up.
  const { data: attemptsData, error: attemptsErr } = await client.rpc(
    'increment_edition_email_attempts',
    { p_edition_id: editionId },
  );
  if (attemptsErr) {
    console.error(`increment_edition_email_attempts failed for ${editionId}: ${attemptsErr.message}`);
  } else if (typeof attemptsData === 'number' && attemptsData >= MAX_EMAIL_ATTEMPTS) {
    // Cap reached — mark emailed so we stop retrying. Failures already logged.
    console.error(`Edition ${editionId} hit retry cap (${attemptsData}); marking emailed despite failures.`);
    await client.rpc('mark_edition_emailed', { p_edition_id: editionId });
  }

  return { recipientsSent: sent, recipientsFailed: failed, allSucceeded: false };
}

async function dispatchPendingEmails(
  client: SupabaseClient,
  resendApiKey: string,
  functionsBaseUrl: string,
): Promise<EmailResult> {
  // Pick up any unsent edition that still has retry budget — covers both the
  // editions we just compiled and any prior ticks that partially failed.
  const { data: pending, error } = await client
    .from('editions')
    .select('id')
    .is('emailed_at', null)
    .lt('email_attempts', MAX_EMAIL_ATTEMPTS)
    .order('published_at', { ascending: true })
    .limit(50);

  if (error) {
    throw new Error(`Failed to load pending editions: ${error.message}`);
  }

  let fullySent = 0;
  let partialOrFailed = 0;
  let recipientsSent = 0;
  let recipientsFailed = 0;

  for (const row of pending ?? []) {
    // Claim the edition so a concurrent worker (cron + manual trigger,
    // overlapping invocations) doesn't double-send. claim_edition_for_email
    // succeeds only if the edition is unclaimed (or stale).
    const { data: claimed, error: claimErr } = await client.rpc(
      'claim_edition_for_email',
      { p_edition_id: row.id },
    );
    if (claimErr) {
      console.error(`claim_edition_for_email failed for ${row.id}: ${claimErr.message}`);
      continue;
    }
    if (!claimed) {
      // Another worker is handling it (or it was just emailed). Move on.
      continue;
    }

    try {
      const r = await sendEditionEmail(client, resendApiKey, functionsBaseUrl, row.id);
      recipientsSent += r.recipientsSent;
      recipientsFailed += r.recipientsFailed;
      if (r.allSucceeded) fullySent++;
      else partialOrFailed++;
      // On partial failure, release the claim so the next tick can retry
      // promptly instead of waiting on the 5-minute lease.
      if (!r.allSucceeded) {
        await client.rpc('release_edition_email_claim', { p_edition_id: row.id });
      }
    } catch (err) {
      partialOrFailed++;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`sendEditionEmail threw for ${row.id}: ${message}`);
      await client.rpc('release_edition_email_claim', { p_edition_id: row.id });
    }
  }

  return {
    attempted_editions: pending?.length ?? 0,
    fully_sent: fullySent,
    partial_or_failed: partialOrFailed,
    recipients_sent: recipientsSent,
    recipients_failed: recipientsFailed,
  };
}

// ---------------------------------------------------------------------------
// Push notifications (Expo Push)
// ---------------------------------------------------------------------------

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const EXPO_PUSH_BATCH_SIZE = 100; // Expo's documented batch limit

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data: { edition_id: string; group_id: string };
  sound?: 'default';
  channelId?: string;
};

async function sendExpoPushBatch(messages: ExpoPushMessage[]): Promise<{
  sent: number;
  failed: number;
}> {
  if (messages.length === 0) return { sent: 0, failed: 0 };

  const res = await fetch(EXPO_PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`Expo push batch failed: ${res.status}: ${body.slice(0, 300)}`);
    return { sent: 0, failed: messages.length };
  }

  const json = (await res.json().catch(() => null)) as
    | { data?: Array<{ status: 'ok' | 'error'; message?: string }> }
    | null;

  if (!json?.data) {
    return { sent: 0, failed: messages.length };
  }

  let sent = 0;
  let failed = 0;
  for (const ticket of json.data) {
    if (ticket.status === 'ok') sent++;
    else failed++;
  }
  return { sent, failed };
}

async function pushEdition(
  client: SupabaseClient,
  editionId: string,
): Promise<{ sent: number; failed: number; allSucceeded: boolean }> {
  const { data, error } = await client.rpc('get_edition_push_targets', {
    p_edition_id: editionId,
  });
  if (error) {
    throw new Error(`get_edition_push_targets failed for ${editionId}: ${error.message}`);
  }

  const targets = (data ?? []) as PushTarget[];
  if (targets.length === 0) {
    // No subscribed targets; mark pushed so we don't keep retrying.
    await client.rpc('mark_edition_pushed', { p_edition_id: editionId });
    return { sent: 0, failed: 0, allSucceeded: true };
  }

  const messages: ExpoPushMessage[] = targets.map((t) => ({
    to: t.token,
    title: 'Your Group is ready!',
    body: `This week's ${t.group_name} edition just came off the press.`,
    data: { edition_id: t.edition_id, group_id: t.group_id },
    sound: 'default',
    channelId: 'default',
  }));

  let sent = 0;
  let failed = 0;
  for (let i = 0; i < messages.length; i += EXPO_PUSH_BATCH_SIZE) {
    const batch = messages.slice(i, i + EXPO_PUSH_BATCH_SIZE);
    const result = await sendExpoPushBatch(batch);
    sent += result.sent;
    failed += result.failed;
  }

  if (failed === 0) {
    await client.rpc('mark_edition_pushed', { p_edition_id: editionId });
    return { sent, failed: 0, allSucceeded: true };
  }

  // Partial/total failure: bump the attempt counter so we eventually give up
  // instead of permanently silencing the edition on a single Expo blip.
  const { data: attemptsData, error: attemptsErr } = await client.rpc(
    'increment_edition_push_attempts',
    { p_edition_id: editionId },
  );
  if (attemptsErr) {
    console.error(`increment_edition_push_attempts failed for ${editionId}: ${attemptsErr.message}`);
  } else if (typeof attemptsData === 'number' && attemptsData >= MAX_PUSH_ATTEMPTS) {
    console.error(`Edition ${editionId} hit push retry cap (${attemptsData}); marking pushed despite failures.`);
    await client.rpc('mark_edition_pushed', { p_edition_id: editionId });
  }

  return { sent, failed, allSucceeded: false };
}

async function dispatchPendingPushes(client: SupabaseClient): Promise<PushResult> {
  const { data: pending, error } = await client
    .from('editions')
    .select('id')
    .is('pushed_at', null)
    .lt('push_attempts', MAX_PUSH_ATTEMPTS)
    .order('published_at', { ascending: true })
    .limit(50);

  if (error) {
    throw new Error(`Failed to load editions pending push: ${error.message}`);
  }

  let pushesSent = 0;
  let pushesFailed = 0;

  for (const row of pending ?? []) {
    // Only one worker should be sending push for a given edition at a time.
    const { data: claimed, error: claimErr } = await client.rpc(
      'claim_edition_for_push',
      { p_edition_id: row.id },
    );
    if (claimErr) {
      console.error(`claim_edition_for_push failed for ${row.id}: ${claimErr.message}`);
      continue;
    }
    if (!claimed) continue;

    try {
      const r = await pushEdition(client, row.id);
      pushesSent += r.sent;
      pushesFailed += r.failed;
      if (!r.allSucceeded) {
        await client.rpc('release_edition_push_claim', { p_edition_id: row.id });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`pushEdition threw for ${row.id}: ${message}`);
      await client.rpc('release_edition_push_claim', { p_edition_id: row.id });
    }
  }

  return {
    attempted_editions: pending?.length ?? 0,
    pushes_sent: pushesSent,
    pushes_failed: pushesFailed,
  };
}

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret) {
    return json(500, { error: 'CRON_SECRET is not configured on this function.' });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || token !== cronSecret) {
    return json(401, { error: 'Unauthorized' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const functionsBaseUrl =
    Deno.env.get('FUNCTIONS_PUBLIC_URL') ?? (supabaseUrl ? `${supabaseUrl}/functions/v1` : null);

  if (!supabaseUrl || !serviceKey) {
    return json(500, { error: 'Missing Supabase env vars.' });
  }
  if (!resendApiKey) {
    return json(500, { error: 'RESEND_API_KEY is not configured on this function.' });
  }
  if (!functionsBaseUrl) {
    return json(500, { error: 'Could not derive functions base URL.' });
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const compileResult = await compileEditions(adminClient);
    const emailResult = await dispatchPendingEmails(adminClient, resendApiKey, functionsBaseUrl);
    const pushResult = await dispatchPendingPushes(adminClient);
    return json(200, { compile: compileResult, email: emailResult, push: pushResult });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('compile-editions failed:', message);
    return json(500, { error: message });
  }
});
