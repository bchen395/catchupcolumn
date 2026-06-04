// edition-dispatch.ts
//
// Shared helpers for sending an Edition's email + push to all subscribed
// members. Used by:
//   • compile-editions   — sweeps every unsent/unpushed edition on a cron
//   • publish-edition-now — moderator-triggered immediate publish for one
//     specific edition.
//
// All helpers require a service-role Supabase client because they call
// RPCs (claim_edition_for_email, mark_edition_pushed, …) that are granted
// only to service_role.

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  EditionEmailPayload,
  EditionEmailPost,
  renderEditionEmailHtml,
  renderEditionEmailSubject,
} from './edition-email.ts';

export const MAX_PUSH_ATTEMPTS = 3;
export const EMAIL_FROM =
  Deno.env.get('EMAIL_FROM') ?? 'Catch Up Column <onboarding@resend.dev>';
const APP_SCHEME = 'catchupcolumn';

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

export type EmailResult = {
  attempted_editions: number;
  fully_sent: number;
  partial_or_failed: number;
  recipients_sent: number;
  recipients_failed: number;
};

export type PushResult = {
  attempted_editions: number;
  pushes_sent: number;
  pushes_failed: number;
};

// ---------------------------------------------------------------------------
// Email — single edition
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
    body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
  }
  return { ok: true };
}

export async function sendEditionEmail(
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

  if (payload.emailed_at) {
    return { recipientsSent: 0, recipientsFailed: 0, allSucceeded: true };
  }

  if (payload.recipients.length === 0) {
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

  // An Edition is emailed at most once. Mark after the first attempt;
  // per-recipient failures are logged for visibility but not retried.
  await client.rpc('mark_edition_emailed', { p_edition_id: editionId });

  if (failed > 0) {
    console.error(
      `Edition ${editionId}: ${failed} of ${payload.recipients.length} recipient(s) failed; not retrying to avoid duplicate sends.`,
    );
  }

  return { recipientsSent: sent, recipientsFailed: failed, allSucceeded: failed === 0 };
}

// ---------------------------------------------------------------------------
// Email — sweep unsent editions
// ---------------------------------------------------------------------------

export async function dispatchPendingEmails(
  client: SupabaseClient,
  resendApiKey: string,
  functionsBaseUrl: string,
): Promise<EmailResult> {
  const { data: pending, error } = await client
    .from('editions')
    .select('id')
    .is('emailed_at', null)
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
    const { data: claimed, error: claimErr } = await client.rpc(
      'claim_edition_for_email',
      { p_edition_id: row.id },
    );
    if (claimErr) {
      console.error(`claim_edition_for_email failed for ${row.id}: ${claimErr.message}`);
      continue;
    }
    if (!claimed) continue;

    try {
      const r = await sendEditionEmail(client, resendApiKey, functionsBaseUrl, row.id);
      recipientsSent += r.recipientsSent;
      recipientsFailed += r.recipientsFailed;
      if (r.allSucceeded) fullySent++;
      else partialOrFailed++;
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
// Push — single edition
// ---------------------------------------------------------------------------

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const EXPO_PUSH_BATCH_SIZE = 100;

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

export async function pushEdition(
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

// ---------------------------------------------------------------------------
// Push — sweep pending editions
// ---------------------------------------------------------------------------

export async function dispatchPendingPushes(client: SupabaseClient): Promise<PushResult> {
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
// Single-edition dispatch (used by manual publish)
// ---------------------------------------------------------------------------

export type SingleEditionDispatchResult = {
  email: { attempted: boolean; sent: number; failed: number; allSucceeded: boolean };
  push: { attempted: boolean; sent: number; failed: number; allSucceeded: boolean };
};

// Email + push one specific edition, using the same claim/lease pattern as
// the sweep so a concurrent cron run can't double-send.
export async function dispatchSingleEdition(
  client: SupabaseClient,
  resendApiKey: string,
  functionsBaseUrl: string,
  editionId: string,
): Promise<SingleEditionDispatchResult> {
  const result: SingleEditionDispatchResult = {
    email: { attempted: false, sent: 0, failed: 0, allSucceeded: true },
    push: { attempted: false, sent: 0, failed: 0, allSucceeded: true },
  };

  // Email
  const { data: emailClaim, error: emailClaimErr } = await client.rpc(
    'claim_edition_for_email',
    { p_edition_id: editionId },
  );
  if (emailClaimErr) {
    console.error(`claim_edition_for_email failed for ${editionId}: ${emailClaimErr.message}`);
  } else if (emailClaim) {
    result.email.attempted = true;
    try {
      const r = await sendEditionEmail(client, resendApiKey, functionsBaseUrl, editionId);
      result.email.sent = r.recipientsSent;
      result.email.failed = r.recipientsFailed;
      result.email.allSucceeded = r.allSucceeded;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`sendEditionEmail threw for ${editionId}: ${message}`);
      await client.rpc('release_edition_email_claim', { p_edition_id: editionId });
      result.email.allSucceeded = false;
    }
  }

  // Push
  const { data: pushClaim, error: pushClaimErr } = await client.rpc(
    'claim_edition_for_push',
    { p_edition_id: editionId },
  );
  if (pushClaimErr) {
    console.error(`claim_edition_for_push failed for ${editionId}: ${pushClaimErr.message}`);
  } else if (pushClaim) {
    result.push.attempted = true;
    try {
      const r = await pushEdition(client, editionId);
      result.push.sent = r.sent;
      result.push.failed = r.failed;
      result.push.allSucceeded = r.allSucceeded;
      if (!r.allSucceeded) {
        await client.rpc('release_edition_push_claim', { p_edition_id: editionId });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`pushEdition threw for ${editionId}: ${message}`);
      await client.rpc('release_edition_push_claim', { p_edition_id: editionId });
      result.push.allSucceeded = false;
    }
  }

  return result;
}
