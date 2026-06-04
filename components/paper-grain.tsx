import { Image, StyleSheet, View } from 'react-native';

// A faint, fixed grain overlay that gives flat paper surfaces a printed,
// tactile feel. The tile is a 128px warm-noise PNG repeated across the screen.
//
// Uses react-native's core <Image resizeMode="repeat"> on purpose — expo-image
// has no tiling mode. pointerEvents="none" so it never intercepts touches, and
// it's absolutely filled so callers just drop it in as the last child of a
// relatively-positioned surface.

const TILE = require('@/assets/textures/paper-grain.png');

type Props = {
  // Overall strength of the grain. Default is deliberately subtle.
  opacity?: number;
};

export const PaperGrain = ({ opacity = 0.5 }: Props) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Image
      source={TILE}
      resizeMode="repeat"
      style={[StyleSheet.absoluteFill, { opacity }]}
    />
  </View>
);
