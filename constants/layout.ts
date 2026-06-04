export const Layout = {
  touchTargetMin: 48,
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
  // Warm-tinted elevation. Shadows carry a soft warm-brown hue (not pure black)
  // so lifted surfaces read as a sheet of paper resting on a warm desk, per the
  // brand's warmth. `paper` is the resting state; `paperRaised` deepens it while
  // the surface is focused/active.
  shadow: {
    paper: {
      shadowColor: '#5A3A28',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 3,
    },
    paperRaised: {
      shadowColor: '#5A3A28',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 28,
      elevation: 8,
    },
  },
};
