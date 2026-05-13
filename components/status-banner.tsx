import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';

type StatusVariant = 'error' | 'success' | 'info';

type StatusBannerProps = {
  message: string;
  variant?: StatusVariant;
  style?: ViewStyle;
};

const ICON_BY_VARIANT: Record<
  StatusVariant,
  React.ComponentProps<typeof MaterialCommunityIcons>['name']
> = {
  error: 'alert-circle-outline',
  success: 'check-circle-outline',
  info: 'information-outline',
};

const ICON_COLOR: Record<StatusVariant, string> = {
  error: Colors.error,
  success: Colors.success,
  info: Colors.navy,
};

const TEXT_COLOR: Record<StatusVariant, string> = {
  error: Colors.error,
  success: Colors.success,
  info: Colors.navy,
};

// Banner sits inside `paperCream` containers throughout the app, so we use
// `paper` (white) for the surface to keep it readable, with a 1px tone-tinted
// hairline border that picks up the variant's intent. This avoids the bright
// red/green block fills the old banner used.
export const StatusBanner = ({ message, variant = 'info', style }: StatusBannerProps) => {
  return (
    <View style={[styles.container, variantStyles[variant], style]}>
      <MaterialCommunityIcons
        name={ICON_BY_VARIANT[variant]}
        size={20}
        color={ICON_COLOR[variant]}
      />
      <ThemedText style={[styles.message, { color: TEXT_COLOR[variant] }]}>{message}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Layout.padding.md,
    paddingVertical: Layout.padding.md,
    backgroundColor: Colors.paper,
  },
  message: {
    flex: 1,
    fontFamily: Typography.families.sansMedium,
    fontSize: Typography.sizes.body,
    lineHeight: Typography.lineHeights.body,
  },
});

const variantStyles = StyleSheet.create({
  error: {
    borderColor: Colors.error,
  },
  success: {
    borderColor: Colors.success,
  },
  info: {
    borderColor: Colors.navySoft,
  },
});
