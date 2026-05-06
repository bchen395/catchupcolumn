import type { User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { resizeImageForUpload } from '@/lib/image';
import { supabase } from '@/lib/supabase';
import type { UserRow, UserUpdate } from '@/types';

type Credentials = {
  email: string;
  password: string;
};

type UploadAvatarInput = {
  userId: string;
  imageUri: string;
  mimeType?: string | null;
};

const AVATAR_MAX_EDGE = 512;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const signUpWithEmail = async ({ email, password }: Credentials) => {
  const { data, error } = await supabase.auth.signUp({
    email: normalizeEmail(email),
    password,
    options: {
      data: {
        needs_onboarding: true,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
};

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

export const resendConfirmationEmail = async (email: string) => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizeEmail(email),
  });

  if (error) {
    throw error;
  }
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

export const fetchCurrentUserProfile = async (userId: string) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const updateCurrentUserProfile = async (userId: string, updates: UserUpdate) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    // Update returned 0 rows. With RLS in front of the table this almost
    // always means the policy denied the write rather than the row missing.
    throw new Error('Profile update was not applied. Please sign in again.');
  }

  return data satisfies UserRow;
};

export const uploadUserAvatar = async ({ userId, imageUri }: UploadAvatarInput) => {
  // Avatars only render at 100–200px on screen, so 512px is plenty even on
  // very high-DPR devices and keeps storage tiny.
  const resizedUri = await resizeImageForUpload(imageUri, { maxEdge: AVATAR_MAX_EDGE });
  const imageResponse = await fetch(resizedUri);
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

export const deleteAccount = async () => {
  // `functions.invoke` attaches the session JWT automatically; passing a
  // manual Authorization header collides with the SDK's own.
  const { error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
  });

  if (error) {
    throw error;
  }

  await supabase.auth.signOut();
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

