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
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.backgroundWarm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
