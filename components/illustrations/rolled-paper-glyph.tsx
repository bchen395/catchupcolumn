import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/colors';

type Props = {
  // Height in px; width follows the glyph's 7:4 proportions.
  size?: number;
  color?: string;
};

// The rolled-newspaper glyph — the single sanctioned inked mark on editorial
// surfaces (BRAND §4): it replaces v1's ◆ in the edition colophon/masthead.
// A typographic dingbat, not an illustration scene, so it takes the muted
// text color of its context rather than illustration-black, and it scales
// with the folio type around it. Monoline, round caps, no fills.
export const RolledPaperGlyph = ({ size = 16, color = Colors.inkMuted }: Props) => {
  const width = (size * 28) / 16;
  // aria-hidden lives on a wrapping View — cross-platform in RN core, and
  // react-native-svg would leak a11y props into the web DOM.
  return (
    <View aria-hidden>
      <Svg width={width} height={size} viewBox="0 0 28 16" fill="none">
      {/* The roll's end: outer circle with an inner curl. */}
      <Circle cx="7" cy="8" r="5.2" stroke={color} strokeWidth="1.6" />
      <Path d="M7 8a2.1 2.1 0 1 1 2.1 2.1" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      {/* The rolled sheet, tapering to the folded tip. */}
      <Path d="M7.6 2.9 L22.5 4.6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M8 13.1 L24.6 11.4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path
        d="M22.5 4.6 Q26.6 7.4 24.6 11.4"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      </Svg>
    </View>
  );
};
