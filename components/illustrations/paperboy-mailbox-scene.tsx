import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { Colors } from '@/constants/colors';

// Empty-editions doodle (BRAND §4): the paperboy waiting at a mailbox whose
// flag is down — nothing delivered yet, and that's the whole story. Monoline
// #000, one vermilion spot (his cap), decorative only.

const VIEWBOX = { w: 220, h: 160 };

type Props = {
  // Width in px; height follows the 220:160 viewBox.
  width?: number;
};

export const PaperboyMailboxScene = ({ width = 200 }: Props) => {
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
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Ground */}
        <Path d="M18 142 Q80 139 120 142 T204 142" />
        {/* Mailbox on its post, flag down */}
        <Path d="M156 142 L156 100" />
        <Path
          d="M134 100 L134 82 Q134 72 144 72 L170 72 Q180 72 180 82 L180 100 Z"
          fill={Colors.paper}
        />
        <Path d="M140 100 L140 76" />
        <Circle cx="180" cy="83" r="2.2" fill={Colors.illustrationInk} stroke="none" />
        <Path d="M180 83 L191 95" />
        {/* Canvas bag with a rolled paper */}
        <Path
          d="M40 84 Q34 84 34 90 L34 108 Q34 114 40 114 L58 114 Q64 114 64 108 L64 90 Q64 84 58 84 Z"
          fill={Colors.paper}
        />
        <Circle cx="44" cy="77" r="5.5" fill={Colors.paper} />
        <Path d="M48 73 L61 69 M49 81 L62 78" />
        {/* The boy: legs, torso, strap, reaching arm */}
        <Path d="M58 104 L54 140 M50 141 L61 140" />
        <Path d="M66 104 L70 140 M66 141 L77 140" />
        <Path d="M62 104 L62 64" />
        <Path d="M67 62 L44 86" />
        <Path d="M62 68 Q86 70 104 86" />
        {/* Head, hair, cap (the one vermilion spot), face */}
        <Circle cx="66" cy="40" r="20" fill={Colors.paper} />
        <Path
          d="M48 34 C45 42 47 52 53 57 C49 47 49 39 51 35 Z"
          fill={Colors.illustrationInk}
          strokeWidth={2}
        />
        <Path
          d="M47 36 C47 18 58 11 69 13 C80 15 86 23 86 31 L101 33 C104 34 104 38 100 38 L52 40 C47 40 46 38 47 36 Z"
          fill={Colors.vermilion}
        />
        <Circle cx="76" cy="43" r="2.4" fill={Colors.illustrationInk} stroke="none" />
        <Path d="M84 47 L88 51 L83 53" strokeWidth={3.4} />
      </G>
      </Svg>
    </View>
  );
};
