import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

/**
 * Push notification client helper.
 *
 * Registers the device for Expo push, requests permission, and upserts the
 * resulting token into Supabase scoped to the signed-in user.
 *
 * The actual push is sent server-side from the `compile-editions` edge
 * function after a new Edition is created.
 */

// Foreground presentation: show the alert + play sound when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PLATFORM = (): 'ios' | 'android' | 'web' => {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
};

const getEasProjectId = (): string | undefined => {
  const fromExpoConfig = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof fromExpoConfig === 'string' && fromExpoConfig.length > 0) {
    return fromExpoConfig;
  }
  // Fallback for production runtime where expoConfig is unavailable.
  const fromManifest = (Constants as unknown as { easConfig?: { projectId?: string } })
    .easConfig?.projectId;
  return typeof fromManifest === 'string' && fromManifest.length > 0 ? fromManifest : undefined;
};

// Memoised result of the last successful registration. Keeps repeat calls
// (e.g. TOKEN_REFRESHED auth events) from re-hitting Expo + the DB.
let cached: { userId: string; token: string } | null = null;

/**
 * Asks for push permission, fetches an Expo push token, and stores it.
 *
 * Safe to call multiple times — duplicate (user_id, token) inserts are
 * idempotent thanks to the table's composite primary key.
 *
 * Returns the token, or null if the device can't receive push (simulator,
 * permission denied, web).
 */
export const registerForPushAsync = async (userId: string): Promise<string | null> => {
  // Push notifications don't work in the iOS simulator / web. Silently no-op.
  if (!Device.isDevice || Platform.OS === 'web') {
    return null;
  }

  if (cached && cached.userId === userId) {
    return cached.token;
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const { status: requested } = await Notifications.requestPermissionsAsync();
      status = requested;
    }
    if (status !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const projectId = getEasProjectId();
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse.data;
    if (!token) return null;

    if (cached?.userId === userId && cached.token === token) {
      return token;
    }

    await supabase
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, platform: PLATFORM() },
        { onConflict: 'user_id,token', ignoreDuplicates: false },
      );

    cached = { userId, token };
    return token;
  } catch (err) {
    console.warn('registerForPushAsync failed', err);
    return null;
  }
};

/**
 * Removes the current device's token for this user. Call on sign-out so the
 * user stops getting pushes for an account they're no longer signed into.
 */
export const unregisterPushAsync = async (userId: string): Promise<void> => {
  if (!Device.isDevice || Platform.OS === 'web') return;
  try {
    const projectId = getEasProjectId();
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse.data;
    if (!token) return;
    await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);
    if (cached?.userId === userId) {
      cached = null;
    }
  } catch (err) {
    console.warn('unregisterPushAsync failed', err);
  }
};
