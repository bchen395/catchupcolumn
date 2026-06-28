import AsyncStorage from '@react-native-async-storage/async-storage';

// Tracks which editions this device has opened, so Home can flag a fresh
// edition as NEW. Deliberately local (no schema change): "have I read this
// week's paper" is a per-device feeling, not synced account state, and a
// false "already read" after a reinstall costs nothing.

const key = (editionId: string) => `edition-opened:${editionId}`;

export const hasOpenedEdition = async (editionId: string): Promise<boolean> => {
  try {
    return (await AsyncStorage.getItem(key(editionId))) !== null;
  } catch {
    // Storage hiccup → claim "opened" so a stale NEW flag never sticks.
    return true;
  }
};

export const markEditionOpened = async (editionId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key(editionId), '1');
  } catch {
    // Best-effort; the flag will clear on the next successful open.
  }
};
