import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { Colors } from '@/constants/colors';

// No-groups doodle (BRAND §4): the paperboy's dog sitting with a rolled
// paper in his mouth, ready to deliver — "start your family's paper."
// Monoline #000, one vermilion spot (the wrap band on the roll).

const VIEWBOX = { w: 200, h: 160 };

type Props = {
  // Width in px; height follows the 200:160 viewBox.
  width?: number;
};

export const DogWithPaperScene = ({ width = 180 }: Props) => {
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
        <Path d="M28 148 Q100 145 172 148" />
        {/* Tail, body, front legs */}
        <Path d="M62 124 Q46 120 48 106" />
        <Path
          d="M78 90 C64 98 58 114 60 132 Q60 142 70 142 L126 142 Q134 142 134 132 L134 96"
          fill={Colors.paper}
        />
        <Path d="M108 104 L108 142 M122 104 L122 142" />
        {/* Head with floppy ears */}
        <Circle cx="100" cy="62" r="30" fill={Colors.paper} />
        <Path
          d="M76 44 C68 46 66 60 70 72 C72 78 78 78 80 71 C82 62 80 50 78 45 Z"
          fill={Colors.illustrationInk}
          strokeWidth={2}
        />
        <Path
          d="M124 44 C132 46 134 60 130 72 C128 78 122 78 120 71 C118 62 120 50 122 45 Z"
          fill={Colors.illustrationInk}
          strokeWidth={2}
        />
        {/* Face */}
        <Circle cx="90" cy="58" r="2.4" fill={Colors.illustrationInk} stroke="none" />
        <Circle cx="110" cy="58" r="2.4" fill={Colors.illustrationInk} stroke="none" />
        <Path d="M96 69 L104 69 L100 74 Z" fill={Colors.illustrationInk} strokeWidth={2} />
        {/* Rolled paper in his mouth, vermilion wrap band off to the side */}
        <Circle cx="64" cy="85" r="7" fill={Colors.paper} />
        <Path d="M64 85 A2.8 2.8 0 1 1 66.8 87.8" strokeWidth={2.8} />
        <Path d="M70 78.5 L136 81" />
        <Path d="M71 91.5 L138 89" />
        <Path d="M136 81 Q143 84 138 89" />
        <Path d="M121 79.4 L121 90.2" stroke={Colors.vermilion} strokeWidth={7} />
      </G>
      </Svg>
    </View>
  );
};
