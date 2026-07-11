import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Layout } from '@/constants/layout';

import { Icon } from './icon';
import { ThemedText } from './themed-text';

type Props = {
  /** Full line, e.g. Strings.invite.joiningBannerSignup(groupName). */
  message: string;
};

// The slim "Joining {name}" strip on the auth screens while an invite is
// pending — keeps the goal visible through signup's forms. Persistent
// context, not an alert: not pressable, not dismissible, no live region.
export const PendingInviteBanner = ({ message }: Props) => (
  <View style={styles.banner} accessibilityRole="text">
    <Icon icon={Icons.invite} size={20} color={Colors.ink} />
    <ThemedText variant="label" style={styles.text} numberOfLines={2}>
      {message}
    </ThemedText>
  </View>
);

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
    minHeight: Layout.touchTargetMin,
    paddingHorizontal: Layout.padding.md,
    paddingVertical: Layout.padding.sm,
    backgroundColor: Colors.peach,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Layout.borderRadius.md,
  },
  text: {
    flex: 1,
  },
});
