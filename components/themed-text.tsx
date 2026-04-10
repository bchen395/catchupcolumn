import { Text, TextProps, StyleSheet } from 'react-native';

import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

type Variant = 'headline' | 'subheadline' | 'body' | 'caption' | 'label';

interface ThemedTextProps extends TextProps {
  variant?: Variant;
}

export const ThemedText = ({ variant = 'body', style, ...props }: ThemedTextProps) => {
  return <Text style={[styles.base, variantStyles[variant], style]} {...props} />;
};

const styles = StyleSheet.create({
  base: {
    color: Colors.text,
  },
});

const variantStyles = StyleSheet.create({
  headline: {
    fontFamily: Typography.families.serifBold,
    fontSize: Typography.sizes.headline,
    lineHeight: Typography.lineHeights.headline,
  },
  subheadline: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.xl,
    lineHeight: 30,
  },
  body: {
    fontFamily: Typography.families.sans,
    fontSize: Typography.sizes.body,
    lineHeight: Typography.lineHeights.body,
  },
  caption: {
    fontFamily: Typography.families.sans,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    color: Colors.textMuted,
  },
  label: {
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
  },
});
