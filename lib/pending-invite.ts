import AsyncStorage from '@react-native-async-storage/async-storage';

// A pending invite carries an invitee's code (and the group name for the
// "Joining {name}" banner) across signup: saved when a logged-out person
// accepts an invitation, consumed by use-auto-join-invite once they're
// signed in and onboarded. Deliberately local — it's a device-level
// "finish what I started" note, not account state.

const KEY = 'pending-invite';

// An invite tapped weeks ago shouldn't silently join a Group on some
// far-future sign-in; a week comfortably covers "installed the app,
// finished signup a few days later".
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type PendingInvite = {
  code: string;
  groupName: string;
  savedAt: number;
};

export const savePendingInvite = async (
  invite: Pick<PendingInvite, 'code' | 'groupName'>,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ ...invite, savedAt: Date.now() }));
  } catch {
    // Best-effort; worst case the invitee re-enters the code after signup.
  }
};

export const getPendingInvite = async (): Promise<PendingInvite | null> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingInvite>;
    if (
      typeof parsed.code !== 'string' ||
      typeof parsed.groupName !== 'string' ||
      typeof parsed.savedAt !== 'number' ||
      Date.now() - parsed.savedAt > MAX_AGE_MS
    ) {
      await AsyncStorage.removeItem(KEY);
      return null;
    }
    return { code: parsed.code, groupName: parsed.groupName, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
};

export const clearPendingInvite = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // Best-effort; getPendingInvite's TTL retires a stuck entry.
  }
};
