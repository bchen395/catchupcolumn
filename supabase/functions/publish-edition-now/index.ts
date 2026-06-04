// publish-edition-now/index.ts
//
// Moderator-triggered immediate publish. Authenticated by the caller's
// Supabase JWT (NOT the CRON_SECRET) — the underlying RPC enforces that
// the caller is a moderator of the target group.
//
// Flow:
//   1. Verify the caller has a valid Supabase auth session.
//   2. Call publish_edition_now(p_group_id) as the caller (moderator check
//      runs inside the RPC via auth.uid()).
//   3. With service-role credentials, immediately email + push the new
//      edition. Reuses the same claim/lease helpers as the cron sweep so
//      a concurrent cron run can't double-send.
//   4. Return { edition_id, edition_number, post_count } on success.
//
// Required environment variables:
//   SUPABASE_URL
//   SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY
//   FUNCTIONS_PUBLIC_URL (optional; derived from SUPABASE_URL if absent)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { dispatchSingleEdition } from '../_shared/edition-dispatch.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

type PublishResult = {
  edition_id: string;
  edition_number: number;
  post_count: number;
  group_id: string;
};

// Map well-known Postgres exceptions raised by publish_edition_now to a
// stable error code the client can switch on for user-facing copy.
const mapRpcError = (message: string): { code: string; status: number } => {
  if (message.includes('not_moderator')) return { code: 'not_moderator', status: 403 };
  if (message.includes('not_authenticated')) return { code: 'not_authenticated', status: 401 };
  if (message.includes('no_posts_to_publish')) return { code: 'no_posts_to_publish', status: 409 };
  if (message.includes('publish_in_progress')) return { code: 'publish_in_progress', status: 409 };
  return { code: 'publish_failed', status: 500 };
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json(401, { error: 'not_authenticated' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const functionsBaseUrl =
    Deno.env.get('FUNCTIONS_PUBLIC_URL') ?? (supabaseUrl ? `${supabaseUrl}/functions/v1` : null);

  if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
    return json(500, { error: 'Missing Supabase env vars.' });
  }
  if (!resendApiKey) {
    return json(500, { error: 'RESEND_API_KEY is not configured on this function.' });
  }
  if (!functionsBaseUrl) {
    return json(500, { error: 'Could not derive functions base URL.' });
  }

  let body: { group_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const groupId = typeof body.group_id === 'string' ? body.group_id : null;
  if (!groupId) {
    return json(400, { error: 'group_id is required' });
  }

  // Caller-scoped client. publish_edition_now runs as security definer but
  // reads auth.uid() to enforce the moderator check.
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

  const { data: rpcData, error: rpcError } = await callerClient.rpc(
    'publish_edition_now',
    { p_group_id: groupId },
  );

  if (rpcError) {
    const { code, status } = mapRpcError(rpcError.message);
    if (code === 'publish_failed') {
      console.error(`publish_edition_now failed for group=${groupId} user=${user.id}: ${rpcError.message}`);
    }
    return json(status, { error: code });
  }

  const result = rpcData as PublishResult | null;
  if (!result?.edition_id) {
    return json(500, { error: 'publish_failed' });
  }

  // Email + push as service role so the dispatch helpers can call the
  // RPCs granted only to service_role.
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let dispatchResult;
  try {
    dispatchResult = await dispatchSingleEdition(
      adminClient,
      resendApiKey,
      functionsBaseUrl,
      result.edition_id,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`dispatchSingleEdition threw for ${result.edition_id}: ${message}`);
    // The edition was created successfully; the cron sweep will pick up
    // the unsent email/push on its next run. Surface success to the client.
    return json(200, {
      edition_id: result.edition_id,
      edition_number: result.edition_number,
      post_count: result.post_count,
      group_id: result.group_id,
      dispatch: { deferred: true },
    });
  }

  return json(200, {
    edition_id: result.edition_id,
    edition_number: result.edition_number,
    post_count: result.post_count,
    group_id: result.group_id,
    dispatch: dispatchResult,
  });
});
