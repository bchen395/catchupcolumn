import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { Colors } from '@/constants/colors';

// Hidden corner doodle (BRAND §11): the dog asleep under the final hairline
// of the editions list. Below the fold of function, small, never animated.

const VIEWBOX = { w: 96, h: 44 };

type Props = {
  // Width in px (≤96 per the §11 size rule); height follows the viewBox.
  width?: number;
};

export const SleepingDogDoodle = ({ width = 96 }: Props) => {
  const height = (width * VIEWBOX.h) / VIEWBOX.w;
  // aria-hidden lives on a wrapping View — cross-platform in RN core, and
  // react-native-svg would leak a11y props into the web DOM.
  return (
    <View aria-hidden>
      <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
      fill="none"
    >
      <G
        stroke={Colors.illustrationInk}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Curled body, head resting */}
        <Path d="M20 36 Q14 24 26 18 Q40 12 54 16 Q70 20 70 30 Q70 36 62 36 Z" fill={Colors.paper} />
        <Circle cx="66" cy="27" r="10" fill={Colors.paper} />
        <Path
          d="M58 20 C55 21 54 27 56 31 C57 34 60 33 60 30 C61 26 60 22 59 21 Z"
          fill={Colors.illustrationInk}
          strokeWidth={1.2}
        />
        {/* Closed eye, tucked tail, a small z */}
        <Path d="M68 26 Q70 28 72 26" strokeWidth={1.8} />
        <Path d="M20 34 Q12 34 12 28" />
        <Path d="M82 12 L88 12 L82 18 L88 18" strokeWidth={1.8} />
      </G>
      </Svg>
    </View>
  );
};
