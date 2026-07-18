import { View, ViewProps, StyleSheet } from 'react-native';

import { Colors } from '@/constants/colors';

interface ThemedViewProps extends ViewProps {
  variant?: 'default' | 'card';
}

export const ThemedView = ({ variant = 'default', style, ...props }: ThemedViewProps) => {
  return <View style={[styles.base, variant === 'card' && styles.card, style]} {...props} />;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.paperWarm,
  },
  // v2: content never sits in tinted slabs — 'card' is a paper surface with
  // a hairline edge, for true overlays and boxed sheet content only.
  card: {
    backgroundColor: Colors.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
});
