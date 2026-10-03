import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';

type Props = {
  onPress: () => void;
  // Say where "back" goes when it isn't obvious — the story reader's
  // "Back to the front page". Defaults to "Go back".
  accessibilityLabel?: string;
};

// The one back button (2026-10-03). Six screens used to hand-roll their own,
// at three glyph sizes, and none of them kept the arrow centered in its button.
// On iOS 26 the system draws a Liquid Glass circle around a header's custom
// left view and centers that view's frame inside it, so every stray margin or
// stretched text box showed up as an arrow sitting off-center in its button.
//
// So the button is a fixed square at the touch floor, with nothing around it
// that could pad the frame unevenly, and the chevron is drawn here rather than
// set from the Ionicons font. A font glyph sits wherever the platform's line
// metrics put its baseline, which differs between iOS and Android and from
// size to size. A path is exactly where we draw it.
const GLYPH = 24;

// Ionicons' chevron-back — M328 112 L184 256 L328 400, round 48-unit stroke on
// a 512 grid — rescaled to a 24-unit box, so the arrow looks just like it did.
// With its round caps the ink spans x 7.5–16.5 and y 4.125–19.875, so it is
// centered on both axes: (7.5 + 16.5) / 2 = 12 = 24 / 2.
const CHEVRON = 'M15.375 5.25 L8.625 12 L15.375 18.75';
const STROKE = 2.25;

// Centering the ink box is not quite enough. The eye reads a chevron as the
// triangle it outlines, and that triangle's weight sits toward its open side —
// its centroid is about 1.1 units right of the ink box's center here. Pulling
// the arrow 1 unit toward its point puts that perceived center in the middle,
// the same correction a play triangle gets (nudged toward its point).
const OPTICAL_NUDGE_X = -1;

export const BackButton = ({ onPress, accessibilityLabel = Strings.nav.back }: Props) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    style={({ pressed }) => [styles.button, pressed && styles.pressed]}
  >
    <Svg
      width={GLYPH}
      height={GLYPH}
      viewBox={`0 0 ${GLYPH} ${GLYPH}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d={CHEVRON}
        transform={`translate(${OPTICAL_NUDGE_X} 0)`}
        stroke={Colors.ink}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  </Pressable>
);

const styles = StyleSheet.create({
  // Square at the touch floor (Layout.touchTargetMin, 48) and no margins: on
  // iOS 26 the glass circle is drawn around exactly this frame.
  button: {
    width: Layout.touchTargetMin,
    height: Layout.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A bare glyph has no fill, so BRAND §9's 92% dip for filled buttons would
  // be invisible here. It takes the ~0.7 dip that unfilled targets use: opacity
  // only, no new color, no motion.
  pressed: {
    opacity: 0.7,
  },
});
