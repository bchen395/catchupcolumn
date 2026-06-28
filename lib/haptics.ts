import * as ExpoHaptics from 'expo-haptics';
import { Platform } from 'react-native';

// Semantic haptics for the app's tactile layer. Three verbs only — pick by
// meaning, not by how strong a buzz feels:
//
//   tap()     — a key action was pressed (primary buttons, the raised "+",
//               a page turn). Light impact; the paper equivalent of a fingertip
//               landing on the page.
//   select()  — a value changed while choosing (day picker, time wheel).
//               Selection tick; fires on change, never on re-pressing the
//               same value.
//   confirm() — something the user cares about completed (post filed,
//               edition published). Success notification; reserve it for
//               moments, not chrome.
//
// Keep it sparse: a haptic on everything is a haptic on nothing. Fire-and-
// forget — failures (web, simulators, disabled in system settings) are
// swallowed so the UI never waits on or throws from a buzz.
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

export const Haptics = {
  tap: () => {
    if (!supported) return;
    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  select: () => {
    if (!supported) return;
    ExpoHaptics.selectionAsync().catch(() => {});
  },
  confirm: () => {
    if (!supported) return;
    ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success).catch(() => {});
  },
};
