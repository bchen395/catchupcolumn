import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';

import { ThemedText } from '../themed-text';

// The invite ticket (BRAND §11): the invite code as a hand-drawn perforated
// ticket — wobbly outline, dotted tear line, the dog on the stub. The code is
// live text (Jost, tracked, vermilion — the scene's one vermilion spot), not
// the baked hand-lettering §11 originally sketched, because codes are
// per-Group dynamic. The drawing is decorative; the code text is real.

// The tear line sits at x=244 of the 340-wide viewBox; the code area is the
// main (left) panel.
const VIEWBOX = { w: 340, h: 120 };
const TEAR_X = 244;

type Props = {
  code: string;
};

export const InviteTicket = ({ code }: Props) => {
  const [ticketWidth, setTicketWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => setTicketWidth(e.nativeEvent.layout.width);

  // Codes run 6–12 characters, so the size is computed from the measured
  // panel width rather than trusting adjustsFontSizeToFit (a no-op on web).
  // ~0.78em covers a wide-tracked Jost Bold character.
  const panelWidth = ticketWidth * (TEAR_X / VIEWBOX.w) - 2 * Layout.padding.md;
  const fontSize = ticketWidth
    ? Math.min(Typography.sizes.xl, Math.max(14, panelWidth / (0.78 * code.length)))
    : Typography.sizes.xl;
  const letterSpacing = fontSize >= 22 ? 4 : 2;

  return (
    <View style={styles.ticket} onLayout={handleLayout}>
      {/* aria-hidden on the wrapping View — cross-platform in RN core;
          react-native-svg would leak a11y props into the web DOM. */}
      <View
        style={StyleSheet.absoluteFill}
        aria-hidden
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} fill="none">
        <G stroke={Colors.illustrationInk} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          {/* Wobbly ticket outline */}
          <Path
            d="M20 12 Q90 9 170 11 T322 12 Q330 12 329 22 Q331 40 329 60 T330 98 Q330 108 320 107 Q240 110 160 108 T20 108 Q11 108 12 98 Q10 80 11 60 T11 22 Q11 12 20 12 Z"
            fill={Colors.paper}
          />
          {/* Perforation notches + tear line */}
          <Circle cx={TEAR_X} cy="11" r="7" fill={Colors.paper} />
          <Circle cx={TEAR_X} cy="109" r="7" fill={Colors.paper} />
          <Path d={`M${TEAR_X} 26 L${TEAR_X} 94`} strokeDasharray="1 11" strokeWidth={3.4} />
          {/* The dog on the stub */}
          <Circle cx="288" cy="56" r="16" fill={Colors.paper} />
          <Path
            d="M275 46 C271 47 270 55 272 61 C273 65 276 65 277 61 C278 56 277 49 277 47 Z"
            fill={Colors.illustrationInk}
            strokeWidth={1.4}
          />
          <Path
            d="M301 46 C305 47 306 55 304 61 C303 65 300 65 299 61 C298 56 299 49 299 47 Z"
            fill={Colors.illustrationInk}
            strokeWidth={1.4}
          />
          <Circle cx="283" cy="54" r="1.6" fill={Colors.illustrationInk} stroke="none" />
          <Circle cx="293" cy="54" r="1.6" fill={Colors.illustrationInk} stroke="none" />
          <Path d="M286 60 L290 60 L288 63 Z" fill={Colors.illustrationInk} strokeWidth={1.4} />
          <Path d="M284 66 Q288 69 292 66" strokeWidth={1.8} />
        </G>
        </Svg>
      </View>
      <View style={styles.codeArea}>
        <ThemedText variant="meta">{Strings.inviteCard.ticketLabel}</ThemedText>
        <ThemedText style={[styles.code, { fontSize, letterSpacing }]} numberOfLines={1}>
          {code}
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ticket: {
    width: '100%',
    aspectRatio: VIEWBOX.w / VIEWBOX.h,
  },
  codeArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: `${(TEAR_X / VIEWBOX.w) * 100}%`,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.padding.xs,
    paddingHorizontal: Layout.padding.md,
  },
  // The §11 vermilion code — the ticket's one accent. Same set-type dress as
  // the retired code chip (sansBold, wide-tracked); size computed per layout.
  code: {
    fontFamily: Typography.families.sansBold,
    color: Colors.vermilion,
  },
});
