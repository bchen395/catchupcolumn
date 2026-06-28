// compile-editions/index.ts
//
// Supabase Edge Function that:
//   1. Compiles unassigned posts into a new Edition for every Group whose
//      publish window falls within the current rolling window.
//   2. Emails the resulting Edition (and any prior Editions whose send
//      failed and still have retry budget) to all subscribed members.
//   3. Sends Expo push notifications for any Edition still pending push.
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

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  dispatchPendingEmails,
  dispatchPendingPushes,
} from '../_shared/edition-dispatch.ts';

type CompileResult = {
  compiled: number;
  skipped_no_posts: number;
  details: Array<
    | { group_id: string; group_name: string; edition_number: number; post_count: number; edition_id?: string }
    | { group_id: string; group_name: string; skipped: true; reason: string }
  >;
};

async function compileEditions(client: SupabaseClient): Promise<CompileResult> {
  const { data, error } = await client.rpc('compile_due_editions', {
    // Tolerance is wider than the 15-minute cron interval so a late/cold-start
    // tick still lands inside a group's publish window. Re-compiling the same
    // slot is prevented by compile_due_editions' per-group advisory lock plus
    // its 22-hour duplicate-edition guard, so the overlap is safe.
    p_tolerance_minutes: 20,
  });

  if (error) {
    throw new Error(`Failed to compile due editions: ${error.message}`);
  }

  return (data ?? { compiled: 0, skipped_no_posts: 0, details: [] }) as CompileResult;
}

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
