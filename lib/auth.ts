import type { User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { resizeImageForUpload } from '@/lib/image';
import { unregisterPushAsync } from '@/lib/notifications';
import { clearPostImageUrlCache } from '@/lib/posts';
import { supabase } from '@/lib/supabase';
import type { UserRow, UserUpdate } from '@/types';

type Credentials = {
  email: string;
  password: string;
};

type UploadAvatarInput = {
  userId: string;
  imageUri: string;
};

const AVATAR_MAX_EDGE = 512;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Password sign-in, kept for accounts created before the code flow existed.
 * There is deliberately no password *signup* any more — a new account is created
 * by `sendEmailCode`, and a passwordless user who wants a password can set one
 * through "Forgot your password?" → the reset screen.
 */
export const signInWithEmail = async ({ email, password }: Credentials) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Send a 6-digit sign-in code to `email`.
 *
 * **This only sends a CODE if the project's Magic Link email template uses
 * `{{ .Token }}`.** Magic links and OTPs are the same Supabase call — with the
 * stock template the email carries a link instead, and a link cannot hand back
 * to the app until universal links are configured (`app.json` declares no
 * `associatedDomains`, and the AASA file still holds a literal `TEAMID`).
 * See docs/LAUNCH.md step 5 for the dashboard change.
 *
 * `allowNewUser` is what separates the two entry points: the login screen passes
 * false so an unknown email is an error we can explain, and the signup screen
 * passes true so the code both creates and signs in.
 */
export const sendEmailCode = async (email: string, { allowNewUser }: { allowNewUser: boolean }) => {
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizeEmail(email),
    options: {
      shouldCreateUser: allowNewUser,
      // Applied by GoTrue when a user is actually created, which is the only
      // case we need it for. If it were ever applied to an existing account the
      // cost is one extra pass through onboarding — which pre-fills from the
      // saved profile and clears the flag on save, so the outcome is benign.
      ...(allowNewUser ? { data: { needs_onboarding: true } } : {}),
    },
  });

  if (error) {
    throw error;
  }
};

/**
 * Exchange a 6-digit code for a session. `type: 'email'` covers both the
 * new-user and returning-user cases of `sendEmailCode`.
 */
export const verifyEmailCode = async ({ email, code }: { email: string; code: string }) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizeEmail(email),
    token: code.trim(),
    type: 'email',
  });

  if (error) {
    throw error;
  }

  return data;
};

export const sendPasswordResetEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
    redirectTo: Linking.createURL('/(auth)/reset-password'),
  });

  if (error) {
    throw error;
  }
};

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    throw error;
  }
};

// Ensures a row exists in public.users for the given auth user.
// Safe to call repeatedly — uses INSERT ... ON CONFLICT DO NOTHING.
// Handles users created outside the normal signup flow (e.g. via dashboard).
export const ensureUserProfile = async (user: User) => {
  if (!user.email) {
    // public.users.email is NOT NULL/unique. An auth user without an email
    // (rare — phone-only or anonymous flow we don't use) can't get a profile
    // row, so surface the failure instead of inserting an empty string.
    throw new Error('ensureUserProfile: auth user is missing an email');
  }
  const { error } = await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email,
      display_name:
        user.user_metadata?.display_name ?? user.email.split('@')[0],
    },
    { onConflict: 'id', ignoreDuplicates: true },
  );
  if (error) {
    throw error;
  }
};

// Column list excludes `email`: authenticated has no column privilege on it
// (see 20260703000000_security_hardening.sql), and the app reads the signed-in
// user's email from the auth session, never from this table. Casting back to
// UserRow keeps callers' types stable — the absent email field is never read.
const PROFILE_SELECT = 'id, display_name, avatar_url, bio, created_at';

export const fetchCurrentUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select(PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as UserRow | null);
};

export const updateCurrentUserProfile = async (userId: string, updates: UserUpdate) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select(PROFILE_SELECT)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    // Update returned 0 rows. With RLS in front of the table this almost
    // always means the policy denied the write rather than the row missing.
    throw new Error('Profile update was not applied. Please sign in again.');
  }

  return data as UserRow;
};

export const uploadUserAvatar = async ({ userId, imageUri }: UploadAvatarInput) => {
  // Avatars only render at 100–200px on screen, so 512px is plenty even on
  // very high-DPR devices and keeps storage tiny.
  const resizedUri = await resizeImageForUpload(imageUri, { maxEdge: AVATAR_MAX_EDGE });
  const imageResponse = await fetch(resizedUri);
  if (!imageResponse.ok) {
    throw new Error(`Failed to read image for upload (${imageResponse.status})`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();
  const storagePath = `${userId}/avatar-${Date.now()}.jpg`;

  const { error } = await supabase.storage.from('avatars').upload(storagePath, imageBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return {
    publicUrl: getPublicAvatarUrl(storagePath),
    storagePath,
  };
};

export const getPublicAvatarUrl = (storagePath: string) => {
  return supabase.storage.from('avatars').getPublicUrl(storagePath).data.publicUrl;
};

export const clearNeedsOnboardingFlag = async () => {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      needs_onboarding: false,
    },
  });

  if (error) {
    throw error;
  }

  // updateUser writes the new metadata server-side, but the local cached
  // session JWT still carries the old metadata until the next refresh.
  // `needsOnboarding` reads from user_metadata, so without this refresh the
  // root layout would keep redirecting to onboarding until the next token
  // refresh tick.
  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    throw refreshError;
  }

  return data;
};

/**
 * Sign out, and tear down the per-session state that outlives the JWT.
 *
 * Both of these matter for the next account signing in on this device: a push
 * token left registered keeps delivering the previous user's editions, and a
 * cached signed URL was minted under the previous session's credentials.
 */
export const signOut = async (userId?: string | null) => {
  if (userId) {
    await unregisterPushAsync(userId);
  }
  clearPostImageUrlCache();

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

export const deleteAccount = async (userId?: string | null) => {
  // `functions.invoke` attaches the session JWT automatically; passing a
  // manual Authorization header collides with the SDK's own.
  const { error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
  });

  if (error) {
    throw error;
  }

  await signOut(userId);
};

export const needsOnboarding = (user: User | null | undefined) => {
  return Boolean(user?.user_metadata?.needs_onboarding);
};

export const mapAuthErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('invalid login credentials')) {
    return 'That email and password did not match. Please try again.';
  }

  // shouldCreateUser: false against an address with no account. Deliberately
  // explicit rather than vague: this is an invite-only product with no public
  // discovery, so the enumeration risk is slight and "your email is wrong" is
  // a dead end for a grandparent typing it in by hand.
  if (message.includes('signups not allowed') || message.includes('otp_disabled')) {
    return 'We could not find an account with that email. Create one instead?';
  }

  if (
    message.includes('token has expired or is invalid') ||
    message.includes('otp_expired') ||
    message.includes('invalid token')
  ) {
    return 'That code did not work. Check it, or send a new one.';
  }

  if (message.includes('email rate limit exceeded') || message.includes('over_email_send_rate_limit')) {
    return 'Too many codes requested. Please wait a minute and try again.';
  }

  if (message.includes('user already registered')) {
    return 'That email is already in use. Try signing in instead.';
  }

  if (message.includes('email not confirmed')) {
    return 'Check your email to confirm your account, then sign in.';
  }

  if (message.includes('password should be at least')) {
    return 'Choose a password with at least 6 characters.';
  }

  if (
    message.includes('email address is invalid') ||
    message.includes('unable to validate email address')
  ) {
    return 'Enter a valid email address.';
  }

  if (message.includes('network request failed') || message.includes('failed to fetch')) {
    return 'We could not reach the server. Check your connection and try again.';
  }

  if (message.includes('for security purposes')) {
    return 'Please wait a moment before trying again.';
  }

  return fallback;
};

