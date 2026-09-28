import type { User } from '@supabase/supabase-js';
import { isAuthApiError, isAuthWeakPasswordError } from '@supabase/supabase-js';

import { COMMON_PASSWORDS } from '@/lib/common-passwords';
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

/**
 * The password rules, in one place so the field's check, its helper text, and
 * the server's error all say the same number.
 *
 * The minimum must equal Dashboard → Authentication → Providers → Email →
 * "Minimum password length" (docs/LAUNCH.md step 5). 8 is OWASP ASVS 5.0's
 * floor (6.2.1), chosen 2026-09-25 alongside a blocklist — a common or reused
 * password is the real threat, and length doesn't catch it. Supabase's
 * leaked-password check needs Pro and this project is on Free, so the
 * blocklist is COMMON_PASSWORDS, checked here (decided 2026-09-28). NIST
 * 800-63B-4 asks 15 of a single-factor password; we don't, because every
 * account can also sign in by emailed code, so the inbox is the security floor
 * whatever the password is. No composition rules: NIST forbids them.
 *
 * The maximum is GoTrue's own: bcrypt reads only 72 bytes, so it refuses more.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Password sign-in — the optional second way in, for anyone who set a password
 * from Profile (or had one before the code flow existed). There is
 * deliberately no password *signup*: a new account is created by
 * `sendEmailCode`, and a password is only ever added afterwards (`setPassword`).
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
 * stock template the email carries a link instead, and a tapped link opens
 * Safari: it points at the Supabase auth domain, which the app cannot claim
 * (universal links cover only `www.catchupcolumn.com/edition/*`).
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

/**
 * Set or replace the signed-in account's password.
 *
 * There is no "add" versus "change": every account already has a password
 * hash. GoTrue stores a random one for accounts created by code
 * (`magic_link.go`) and by `admin.createUser`, so `encrypted_password` is never
 * empty. For the same reason this never asks for the current password — a
 * code-only person can't know theirs.
 *
 * An emailed code proves it's them instead. With "Secure password change" on
 * (docs/LAUNCH.md step 5), GoTrue refuses a session more than 24 hours old
 * with `reauthentication_needed`; the caller then sends a code with
 * `sendReauthenticationCode` and retries with it as `nonce`. A session under a
 * day old — including the one a "Forgot your password?" code sign-in just
 * created — needs no code.
 */
export const setPassword = async ({ password, nonce }: { password: string; nonce?: string }) => {
  const { error } = await supabase.auth.updateUser({ password, ...(nonce ? { nonce } : {}) });

  if (error) {
    throw error;
  }

  // Display-only: lets Profile say "Change" instead of "Set". Never gate
  // anything on it — user_metadata is user-writable, and accounts that had a
  // password before 2026-09-16 don't carry it. The password is already saved,
  // so a failure here must not surface as "we couldn't save your password".
  // No refreshSession: updateUser writes the new user into the local session
  // and nothing reads this flag from the JWT.
  const { error: flagError } = await supabase.auth.updateUser({ data: { has_password: true } });
  if (flagError && __DEV__) {
    console.warn('setPassword: password saved, but has_password was not recorded', flagError);
  }
};

/**
 * Email a 6-digit code that proves it's them, for `setPassword`'s `nonce`.
 * Renders from the **Reauthentication** template
 * (`supabase/templates/reauthentication.html`).
 */
export const sendReauthenticationCode = async () => {
  const { error } = await supabase.auth.reauthenticate();

  if (error) {
    throw error;
  }
};

export const isReauthenticationNeeded = (error: unknown) =>
  isAuthApiError(error) && error.code === 'reauthentication_needed';

export const hasSetPassword = (user: User | null | undefined) =>
  Boolean(user?.user_metadata?.has_password);

export const validateNewPassword = (password: string) => {
  if (!password) {
    return 'Choose a password.';
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Keep it to ${PASSWORD_MAX_LENGTH} characters or fewer.`;
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return 'That’s one of the most common passwords, so it’s easy to guess. Choose a different one.';
  }

  return undefined;
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
 * Sign out of this device, and tear down the per-session state that outlives
 * the JWT.
 *
 * Both of these matter for the next account signing in on this device: a push
 * token left registered keeps delivering the previous user's editions, and a
 * cached signed URL was minted under the previous session's credentials.
 *
 * `scope: 'local'` because supabase-js defaults to 'global', which would also
 * sign out the person's other phones and iPads — and leave those devices' push
 * tokens registered, since only this device's is removed here. This session's
 * refresh token is still revoked server-side.
 */
export const signOut = async (userId?: string | null) => {
  if (userId) {
    await unregisterPushAsync(userId);
  }
  clearPostImageUrlCache();

  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) {
    throw error;
  }
};

/**
 * `functions.invoke` rejects with only "Edge Function returned a non-2xx status
 * code" — the function's own JSON body hangs off `error.context` as a Response,
 * and that body is the part that says which branch failed. Clone before reading
 * so the caller's copy stays unconsumed.
 *
 * Note the delete-account function returns the same "Failed to delete account"
 * for both of its 500s (the prepare RPC and the admin delete), so this narrows
 * to a branch but not past it — the dashboard's function logs tell those two
 * apart. See docs/LAUNCH.md.
 */
type ResponseLike = {
  status?: number;
  clone?: () => ResponseLike;
  text?: () => Promise<string>;
  // whatwg-fetch (React Native's polyfill) keeps an already-decoded copy here.
  _bodyText?: string;
};

const describeFunctionError = async (error: unknown) => {
  const context = (error as { context?: unknown })?.context;

  if (!context || typeof context !== 'object') {
    return `no response attached; error keys: ${Object.keys(error ?? {}).join(', ') || 'none'}`;
  }

  // Duck-type rather than `instanceof Response`: React Native's fetch polyfill
  // hands back a Response-shaped object that is not an instance of the global
  // Response, so narrowing by constructor silently misses every time.
  const response = context as ResponseLike;
  const status = response.status ?? '???';

  if (typeof response._bodyText === 'string') {
    return `${status} ${response._bodyText}`;
  }

  const readable = typeof response.clone === 'function' ? response.clone() : response;
  if (typeof readable.text === 'function') {
    try {
      return `${status} ${await readable.text()}`;
    } catch {
      // fall through to the shape dump below
    }
  }

  return `${status} <body unreadable>; context keys: ${Object.keys(response).join(', ')}`;
};

export const deleteAccount = async (userId?: string | null) => {
  // `functions.invoke` attaches the session JWT automatically; passing a
  // manual Authorization header collides with the SDK's own.
  const { error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
  });

  if (error) {
    if (__DEV__) {
      console.error('delete-account failed:', await describeFunctionError(error), error);
    }
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
  const code = isAuthApiError(error) ? error.code : undefined;

  if (message.includes('invalid login credentials')) {
    // Most accounts have no password their owner knows (see setPassword), so
    // the likeliest cause is someone who signs in by code trying this form.
    return 'That email and password did not match. If you usually sign in with a code, use that instead.';
  }

  if (isAuthWeakPasswordError(error)) {
    if (error.reasons.includes('pwned')) {
      return 'That password has turned up in a data breach elsewhere, so it isn’t safe to use. Choose a different one.';
    }
    if (error.reasons.includes('length')) {
      return passwordLengthMessage(message);
    }
    // 'characters' — composition rules are deliberately off (NIST forbids
    // them), so this only appears if the dashboard setting drifts.
    return 'Choose a different password.';
  }

  if (code === 'same_password') {
    return 'That is already your password.';
  }

  if (code === 'reauthentication_not_valid') {
    return 'That code did not work. Check it, or send a new one.';
  }

  if (message.includes('auth session missing')) {
    return 'Your sign-in has ended. Sign in again, then set your password.';
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
    return passwordLengthMessage(message);
  }

  if (message.includes('cannot be longer than')) {
    return `Keep your password to ${PASSWORD_MAX_LENGTH} characters or fewer.`;
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

// Read the number out of GoTrue's "Password should be at least N characters",
// so the copy follows the dashboard even if it drifts from PASSWORD_MIN_LENGTH.
const passwordLengthMessage = (message: string) => {
  const minimum = message.match(/at least (\d+) characters/)?.[1] ?? String(PASSWORD_MIN_LENGTH);
  return `Choose a password with at least ${minimum} characters.`;
};

