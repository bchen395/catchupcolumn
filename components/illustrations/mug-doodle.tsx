import { View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { Colors } from '@/constants/colors';

// Hidden corner doodle (BRAND §11): a steaming mug by the settings footer.
// Below the fold of function, small, never animated.

const VIEWBOX = { w: 48, h: 48 };

type Props = {
  // Size in px (≤48 per the §11 size rule).
  size?: number;
};

// aria-hidden lives on a wrapping View — cross-platform in RN core, and
// react-native-svg would leak a11y props into the web DOM.
export const MugDoodle = ({ size = 40 }: Props) => (
  <View aria-hidden>
    <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} fill="none">
    <G stroke={Colors.illustrationInk} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 20 L14 40 Q14 42 17 42 L31 42 Q34 42 34 40 L36 20 Z" fill={Colors.paper} />
      <Path d="M36 24 Q44 24 42 31 Q41 36 34 35" />
      <Path d="M18 13 Q16 10 18 7 M26 13 Q24 10 26 7" />
    </G>
    </Svg>
  </View>
);
