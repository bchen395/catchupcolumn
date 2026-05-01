import type { User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

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
  const { error } = await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email ?? '',
      display_name:
        user.user_metadata?.display_name ??
        (user.email ? user.email.split('@')[0] : 'Member'),
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (error) {
    console.warn('ensureUserProfile failed:', error);
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
    .single();

  if (error) {
    throw error;
  }

  return data satisfies UserRow;
};

export const uploadUserAvatar = async ({ userId, imageUri, mimeType }: UploadAvatarInput) => {
  const imageResponse = await fetch(imageUri);
  const imageBuffer = await imageResponse.arrayBuffer();
  const fileExtension = getFileExtension(imageUri, mimeType);
  const contentType = mimeType ?? extensionToMimeType[fileExtension] ?? 'image/jpeg';
  const storagePath = `${userId}/avatar-${Date.now()}.${fileExtension}`;

  const { error } = await supabase.storage.from('avatars').upload(storagePath, imageBuffer, {
    contentType,
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

  return data;
};

export const deleteAccount = async () => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session?.access_token) {
    throw new Error('No active session');
  }

  const { error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
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

const extensionToMimeType: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  webp: 'image/webp',
};

const getFileExtension = (imageUri: string, mimeType?: string | null) => {
  const mimeExtension = mimeType?.split('/')[1]?.toLowerCase();
  if (mimeExtension) {
    return mimeExtension === 'jpeg' ? 'jpg' : mimeExtension;
  }

  const uriMatch = imageUri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const uriExtension = uriMatch?.[1]?.toLowerCase();

  if (uriExtension) {
    return uriExtension === 'jpeg' ? 'jpg' : uriExtension;
  }

  return 'jpg';
};
