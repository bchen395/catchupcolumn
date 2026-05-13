import { Text, TextProps, StyleSheet } from 'react-native';

import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

type Variant = 'headline' | 'subheadline' | 'body' | 'serifBody' | 'caption' | 'label';

interface ThemedTextProps extends TextProps {
  variant?: Variant;
}

export const ThemedText = ({ variant = 'body', style, ...props }: ThemedTextProps) => {
  return <Text style={[styles.base, variantStyles[variant], style]} {...props} />;
};

const styles = StyleSheet.create({
  base: {
    color: Colors.ink,
  },
});

const variantStyles = StyleSheet.create({
  headline: {
    fontFamily: Typography.families.serifBlack,
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
  serifBody: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.lg,
    lineHeight: 28,
  },
  // 16px floor satisfies the older-adult readability target in CLAUDE.md.
  caption: {
    fontFamily: Typography.families.sans,
    fontSize: Typography.sizes.body,
    lineHeight: 22,
    color: Colors.inkSoft,
  },
  label: {
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.body,
    lineHeight: 22,
  },
});
