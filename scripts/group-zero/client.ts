// Service-role Supabase client for the operator script.
//
// Credentials come from the shell environment and nowhere else: no .env file,
// no default, no config lookup. The key is never printed, logged, or put in an
// error message — only the project ref (not a secret) is shown, so every run
// says which project it is about to touch.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { UsageError } from './args.ts';

export type Db = SupabaseClient;

const base64UrlToText = (segment: string): string => {
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)));
};

// What kind of key is this? Legacy keys are JWTs carrying `role` and `ref`;
// the newer opaque keys announce themselves by prefix. Returns nothing that
// could reveal the key itself.
const inspectKey = (key: string): { role: string | null; ref: string | null } => {
  if (key.startsWith('sb_secret_')) return { role: 'service_role', ref: null };
  if (key.startsWith('sb_publishable_')) return { role: 'anon', ref: null };
  const parts = key.split('.');
  if (parts.length !== 3) return { role: null, ref: null };
  try {
    const claims = JSON.parse(base64UrlToText(parts[1])) as { role?: unknown; ref?: unknown };
    return {
      role: typeof claims.role === 'string' ? claims.role : null,
      ref: typeof claims.ref === 'string' ? claims.ref : null,
    };
  } catch {
    return { role: null, ref: null };
  }
};

export const connect = (): { db: Db; projectRef: string } => {
  const url = Deno.env.get('SUPABASE_URL')?.trim();
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();

  const missing = [!url && 'SUPABASE_URL', !key && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean);
  if (!url || !key) {
    throw new UsageError(
      `${missing.join(' and ')} must be set in the shell environment. ` +
        'This script reads credentials from nowhere else — see scripts/group-zero/README.md.',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UsageError('SUPABASE_URL is not a URL (expected https://<project-ref>.supabase.co)');
  }
  // http only for a local stack (`supabase start` serves http://127.0.0.1:54321).
  const local = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
  if (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) {
    throw new UsageError('SUPABASE_URL must be https (expected https://<project-ref>.supabase.co)');
  }
  const projectRef = parsed.hostname.endsWith('.supabase.co')
    ? parsed.hostname.split('.')[0]
    : `${parsed.host} (not a hosted project)`;

  const { role, ref } = inspectKey(key);
  if (role !== 'service_role') {
    throw new UsageError(
      role
        ? `SUPABASE_SERVICE_ROLE_KEY is the "${role}" key, not the service_role key`
        : 'SUPABASE_SERVICE_ROLE_KEY is not a recognisable Supabase key',
    );
  }
  if (ref && ref !== projectRef) {
    throw new UsageError(
      `SUPABASE_SERVICE_ROLE_KEY belongs to project ${ref}, but SUPABASE_URL points at ${projectRef}`,
    );
  }

  const db = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return { db, projectRef };
};

/**
 * One line for a Supabase/Postgres/Storage error. Only the fields the APIs
 * return for humans — never request details, which is where a key could live.
 */
export const describeError = (err: unknown): string => {
  if (err instanceof Error && !('code' in err) && !('details' in err)) return err.message;
  if (err && typeof err === 'object') {
    const e = err as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    return [
      typeof e.message === 'string' ? e.message : 'unknown error',
      typeof e.code === 'string' && e.code ? `code ${e.code}` : null,
      typeof e.details === 'string' && e.details ? `details: ${e.details}` : null,
      typeof e.hint === 'string' && e.hint ? `hint: ${e.hint}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
  }
  return String(err);
};
