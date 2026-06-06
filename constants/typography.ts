import { Platform } from 'react-native';

// Platform-conditional font families per BRAND.md §3.
// iOS uses bundled system fonts (Superclarendon, Futura) referenced by
// PostScript name — no loader needed. Android and web load Roboto Slab + Jost
// via @expo-google-fonts (see app/_layout.tsx).
//
// Note: Futura on iOS has no Regular or SemiBold weight — `Futura-Medium` is
// the canonical "regular" weight. We collapse `sans`, `sansMedium`, and
// `sansSemiBold` onto `Futura-Medium` on iOS, accepting a slight weight
// difference from Jost on Android/web. Acceptable for v1.
const pick = (ios: string, other: string) =>
  Platform.select({ ios, default: other }) as string;

export const Typography = {
  families: {
    serif: pick('Superclarendon-Regular', 'RobotoSlab_400Regular'),
    serifBold: pick('Superclarendon-Bold', 'RobotoSlab_700Bold'),
    serifBlack: pick('Superclarendon-Black', 'RobotoSlab_900Black'),
    sans: pick('Futura-Medium', 'Jost_400Regular'),
    sansMedium: pick('Futura-Medium', 'Jost_500Medium'),
    sansSemiBold: pick('Futura-Medium', 'Jost_600SemiBold'),
    sansBold: pick('Futura-Bold', 'Jost_700Bold'),
  },
  sizes: {
    xs: 12,
    sm: 14,
    body: 16,
    lg: 18,
    read: 17,
    xl: 22,
    xxl: 28,
    headline: 36,
    wordmark: 32,
    // Cover teaser text on the edition front page. Intentionally below the
    // 16px reading floor: excerpts are scannable newsprint that invites a tap
    // to enlarge — real reading always happens in the 17px story reader.
    excerpt: 14,
  },
  lineHeights: {
    body: 24,
    read: 26,
    headline: 44,
    wordmark: 36,
    // Tight leading for multi-line cover excerpts in narrow columns.
    excerpt: 20,
  },
};
