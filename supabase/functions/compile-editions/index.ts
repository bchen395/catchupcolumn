// compile-editions/index.ts
//
// Supabase Edge Function that compiles unassigned posts into a new Edition
// for every Group whose publish window falls within the current 15-minute
// rolling window.
//
// Invocation:
//   • Automatic — Supabase Cron invokes this HTTP endpoint every 15 minutes.
//   • Manual    — HTTP POST with `Authorization: Bearer <CRON_SECRET>` header.
//
// Required environment variables (set via `supabase secrets set`):
//   SUPABASE_URL           — injected automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — injected automatically by Supabase
//   CRON_SECRET            — shared secret for authenticating manual HTTP calls

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type CompileResult = {
  compiled: number;
  skipped_no_posts: number;
  details: Array<{ group_id: string; group_name: string; edition_number: number; post_count: number } |
                  { group_id: string; group_name: string; skipped: true; reason: string }>;
};

// ---------------------------------------------------------------------------
// Core compilation logic
// ---------------------------------------------------------------------------

async function compileEditions(supabaseUrl: string, serviceKey: string): Promise<CompileResult> {
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await adminClient.rpc('compile_due_editions', {
    p_tolerance_minutes: 15,
  });

  if (error) {
    throw new Error(`Failed to compile due editions: ${error.message}`);
  }

  return (data ?? { compiled: 0, skipped_no_posts: 0, details: [] }) as CompileResult;
}

// ---------------------------------------------------------------------------
// CORS headers (needed for manual HTTP invocations from browsers/Postman)
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ---------------------------------------------------------------------------
// HTTP handler — for manual triggering and local development testing.
//
// Usage:
//   curl -X POST <FUNCTION_URL> \
//     -H "Authorization: Bearer <CRON_SECRET>"
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Authenticate the manual trigger using CRON_SECRET.
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret) {
    return new Response(JSON.stringify({ error: 'CRON_SECRET is not configured on this function.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || token !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env vars.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await compileEditions(supabaseUrl, serviceKey);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('HTTP trigger failed:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
