// Account + membership steps shared by add-member and create-group.

import type { User } from 'https://esm.sh/@supabase/supabase-js@2';

import type { GroupRow } from '../../types/database.ts';
import type { Db } from './client.ts';
import { fetchProfile } from './lookup.ts';
import { type Step, show } from './plan.ts';
import {
  describeSchedule,
  formatSlot,
  publishSlots,
} from './schedule.ts';

/** The one-line Group summary every command prints before its plan. */
export const groupSummary = (group: GroupRow): string => {
  let next = '';
  try {
    next = ` · next edition ${formatSlot(publishSlots(group).next)}`;
  } catch {
    next = ' · schedule cannot be evaluated (see post-for)';
  }
  return `${group.name} (${group.id}) · ${describeSchedule(group)}${next}`;
};

/**
 * Create a confirmed, passwordless auth user. "Passwordless" in practice: given
 * no password, GoTrue's admin create stores the bcrypt hash of a random one
 * (seen on production 2026-09-25), so `encrypted_password` is never empty and
 * nobody knows the password. `user_metadata.display_name` is
 * what on_auth_user_created (001_initial_schema.sql) copies into
 * public.users.display_name — without it the byline is the email's local part.
 * No `needs_onboarding` flag: they already have a name and a Group, so their
 * first code sign-in lands on Home, not the onboarding screen.
 */
export const createAccountStep = (
  db: Db,
  email: string,
  displayName: string,
  onCreated: (userId: string) => void,
): Step => ({
  title: 'Create a confirmed auth user (auth.admin.createUser)',
  lines: [
    `email          ${email}`,
    'email_confirm  true — no confirmation email is sent; no password they know (GoTrue stores a random one)',
    `user_metadata  { display_name: ${show(displayName)} }`,
    `then           on_auth_user_created inserts public.users with display_name ${show(displayName)}`,
  ],
  run: async () => {
    const { data, error } = await db.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (error) throw error;
    const user: User = data.user;
    onCreated(user.id);

    // Read back what the trigger wrote — the byline is the whole point.
    const profile = await fetchProfile(db, user.id);
    if (!profile) throw new Error(`auth user ${user.id} was created but has no public.users row`);
    return [`user id ${user.id}`, `public.users.display_name ${show(profile.display_name)}`];
  },
});

/**
 * Repair an auth user with no public.users row, exactly as the app does on
 * every sign-in (ensureUserProfile in lib/auth.ts): insert, never overwrite.
 */
export const ensureProfileStep = (db: Db, user: User): Step => {
  const email = user.email ?? '';
  const displayName =
    (user.user_metadata?.display_name as string | undefined) ?? email.split('@')[0];
  return {
    title: 'Insert the missing public.users row (as ensureUserProfile does on sign-in)',
    lines: [`id            ${user.id}`, `email         ${email}`, `display_name  ${show(displayName)}`],
    run: async () => {
      const { error } = await db
        .from('users')
        .upsert({ id: user.id, email, display_name: displayName }, {
          onConflict: 'id',
          ignoreDuplicates: true,
        });
      if (error) throw error;
    },
  };
};

/**
 * Insert a contributor row, on conflict do nothing — the same statement
 * join_group_by_invite_code runs, minus the caller-scoped auth.uid(). The
 * email/push opt-in columns keep their defaults (subscribed).
 */
export const addContributorStep = (
  db: Db,
  group: GroupRow,
  userId: () => string | null,
): Step => ({
  title: 'Insert public.group_members (on conflict (group_id, user_id) do nothing)',
  lines: [
    `group_id  ${group.id}`,
    `user_id   ${userId() ?? '<the new user id from step 1>'}`,
    'role      contributor',
    'email_subscribed / push_subscribed keep their defaults (true): the next edition email reaches them',
  ],
  run: async () => {
    const id = userId();
    if (!id) throw new Error('no user id to add');
    const { error } = await db
      .from('group_members')
      .upsert({ group_id: group.id, user_id: id, role: 'contributor' }, {
        onConflict: 'group_id,user_id',
        ignoreDuplicates: true,
      });
    if (error) throw error;

    const { data, error: readError } = await db
      .from('group_members')
      .select('role, joined_at')
      .eq('group_id', group.id)
      .eq('user_id', id)
      .single();
    if (readError) throw readError;
    return [`member as ${data.role} since ${data.joined_at}`];
  },
});
