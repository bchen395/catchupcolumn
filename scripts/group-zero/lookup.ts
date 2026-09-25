// Read-only lookups shared by the commands. Nothing in this file writes.
//
// Row shapes come from the app's hand-written mirror (types/database.ts), so a
// schema change that forgets this script at least has one place to trip over.

import type { User } from 'https://esm.sh/@supabase/supabase-js@2';

import type { GroupMemberRow, GroupRow, PostRow, UserRow } from '../../types/database.ts';
import { Refusal, UsageError } from './args.ts';
import type { Db } from './client.ts';

/** Mirrors `normalizeEmail` in lib/auth.ts — the app lowercases before every auth call. */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const validateEmail = (raw: string): string => {
  const email = normalizeEmail(raw);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new UsageError(`"${raw}" doesn't look like an email address`);
  }
  return email;
};

/**
 * Same bound, counted the same way (UTF-16 length), as the onboarding and
 * profile screens (DISPLAY_NAME_MAX). The schema itself has no limit.
 */
export const DISPLAY_NAME_MAX = 60;

export const validateDisplayName = (raw: string): string => {
  const name = raw.trim();
  if (name === '') throw new UsageError('--name cannot be empty');
  if (name.length > DISPLAY_NAME_MAX) {
    throw new UsageError(`--name is longer than the app allows (${DISPLAY_NAME_MAX} characters)`);
  }
  return name;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `--group` takes a Group id or its invite code. Codes match the way
 * join_group_by_invite_code matches them: lower(code) = lower(trim(input)).
 */
export const resolveGroup = async (db: Db, input: string): Promise<GroupRow> => {
  const value = input.trim();
  let query = db.from('groups').select('*');
  if (UUID_RE.test(value)) {
    query = query.eq('id', value.toLowerCase());
  } else if (/^[A-Za-z0-9]{4,64}$/.test(value)) {
    // ilike with no wildcard characters (the regex above admits none) is a
    // case-insensitive equality.
    query = query.ilike('invite_code', value);
  } else {
    throw new UsageError(`--group "${input}" is neither a Group id nor an invite code`);
  }

  const { data, error } = await query.limit(2);
  if (error) throw error;
  const rows = (data ?? []) as GroupRow[];
  if (rows.length === 0) throw new Refusal(`no Group matches --group "${input}"`);
  if (rows.length > 1) throw new Refusal(`--group "${input}" matches more than one Group`);
  return rows[0];
};

/**
 * The auth user for an email, or null. Auth — not public.users — is the
 * source of truth for "does this account exist", so this scans the admin user
 * list (a handful of pages at Group Zero scale) and compares normalized emails.
 */
export const findAuthUserByEmail = async (db: Db, email: string): Promise<User | null> => {
  const perPage = 1000;
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => normalizeEmail(u.email ?? '') === email);
    if (match) return match;
    if (data.users.length < perPage) return null;
  }
  throw new Error('findAuthUserByEmail: gave up after 100 pages of users');
};

export const fetchProfile = async (db: Db, userId: string): Promise<UserRow | null> => {
  const { data, error } = await db.from('users').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as UserRow | null;
};

export const fetchMembership = async (
  db: Db,
  groupId: string,
  userId: string,
): Promise<GroupMemberRow | null> => {
  const { data, error } = await db
    .from('group_members')
    .select('group_id, user_id, role, joined_at')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as GroupMemberRow | null;
};

/**
 * Uncompiled posts (edition_id IS NULL), newest first — the same filter and
 * order as fetchCurrentPost in lib/posts.ts, which is what the composer opens.
 * Pass an author to scope to one member.
 */
export const fetchUncompiledPosts = async (
  db: Db,
  groupId: string,
  authorId?: string,
): Promise<PostRow[]> => {
  let query = db.from('posts').select('*').eq('group_id', groupId).is('edition_id', null);
  if (authorId) query = query.eq('author_id', authorId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PostRow[];
};

/** Resolve a person who must already have an account and a profile row. */
export const requireExistingPerson = async (
  db: Db,
  email: string,
): Promise<{ user: User; profile: UserRow }> => {
  const user = await findAuthUserByEmail(db, email);
  if (!user) {
    throw new Refusal(`no account exists for ${email} — run add-member first`);
  }
  const profile = await fetchProfile(db, user.id);
  if (!profile) {
    throw new Refusal(
      `${email} has an auth account but no public.users row — run add-member for them, ` +
        'which repairs it the way the app does on sign-in',
    );
  }
  return { user, profile };
};

/** First 70 characters on one line, for listings. */
export const preview = (text: string, max = 70): string => {
  const flat = text.replace(/\s+/g, ' ').trim();
  const chars = [...flat];
  return chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : flat;
};
