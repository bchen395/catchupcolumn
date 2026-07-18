import { Colors } from './colors';

export const Layout = {
  touchTargetMin: 48,
  // List rows are whole-row targets and sit one notch above the 48px floor
  // (BRAND §6, the grandparent clause).
  rowMinHeight: 56,
  // Primary/secondary pill buttons (BRAND §9).
  buttonMinHeight: 52,
  // Rule weights (BRAND §2): `hairline` (with Colors.hairline) draws list
  // dividers, outlines, and photo edges; `heavy` (with Colors.ink) draws
  // masthead and section-opening rules — structural, not decorative.
  rule: {
    hairline: 1,
    heavy: 2,
  },
  padding: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  // Shape Consistency Lock: pills/chips/icon-bubbles use `full`; inputs, cards,
  // images, and buttons use `md`; modals use `xl`. Avatars stay circular via
  // width/2. Don't hardcode `999` — reach for `full`.
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    full: 999,
  },
  // Text input metrics shared by FormField and the multiline composer/forms,
  // so the comfortable tap height and tall multiline minimum stay consistent.
  input: {
    paddingV: 14,
    multilineMinHeight: 88,
  },
  // Elevation exists only for true overlays — sheets and modals (BRAND §6);
  // content never floats. Neutral ink shadows (decided 2026-07-17): v1's
  // warm-brown tint retired with the rest of the warm palette — warmth is the
  // illustration world's job now. `paper` is the resting state; `paperRaised`
  // deepens it while the surface is focused/active.
  shadow: {
    paper: {
      shadowColor: Colors.ink,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 3,
    },
    paperRaised: {
      shadowColor: Colors.ink,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 28,
      elevation: 8,
    },
  },
};
