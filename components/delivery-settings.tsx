import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, View } from 'react-native';

import { StatusBanner } from '@/components/status-banner';
import { SwitchRow } from '@/components/switch-row';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import type { DeliveryChange } from '@/hooks/use-delivery-settings';
import type { DeliveryPreferences } from '@/types';

type DeliverySettingsProps = {
  delivery: DeliveryPreferences;
  onChange: (change: DeliveryChange) => void;
  saving: boolean;
  // The failed-save line; '' when there's nothing to say.
  error: string;
  // Notifications are on here but this phone blocks them.
  pushBlocked: boolean;
};

const openSettings = () => {
  Linking.openSettings().catch(() => {});
};

// "Your delivery" on the Group page, for every member: whether this Group's
// edition comes by email and by notification. Each Group has its own pair, and
// nothing else depends on them — the edition is in the app either way, which
// the footnote says so neither switch reads as a way to miss out. State and
// saving live in useDeliverySettings; this only draws them.
export const DeliverySettings = ({
  delivery,
  onChange,
  saving,
  error,
  pushBlocked,
}: DeliverySettingsProps) => (
  <View style={styles.section}>
    <ThemedText variant="label" style={styles.title}>
      {Strings.delivery.title}
    </ThemedText>
    <SwitchRow
      label={Strings.delivery.emailLabel}
      helper={Strings.delivery.emailHelp}
      value={delivery.email_subscribed}
      onValueChange={(email) => onChange({ email })}
      busy={saving}
    />
    <SwitchRow
      label={Strings.delivery.pushLabel}
      helper={Strings.delivery.pushHelp}
      value={delivery.push_subscribed}
      onValueChange={(push) => onChange({ push })}
      busy={saving}
    />
    {pushBlocked ? (
      <View>
        <ThemedText variant="ui" style={styles.quiet}>
          {Strings.delivery.pushBlocked}
        </ThemedText>
        <Pressable
          onPress={openSettings}
          accessibilityRole="link"
          accessibilityHint={Strings.delivery.openSettingsHint}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        >
          <ThemedText variant="uiStrong">{Strings.delivery.openSettings}</ThemedText>
        </Pressable>
      </View>
    ) : null}
    {error ? <StatusBanner variant="error" message={error} /> : null}
    <ThemedText variant="ui" style={styles.quiet}>
      {Strings.delivery.footnote}
    </ThemedText>
  </View>
);

// The same band as the Group page's other sections (app/group/[id].tsx).
const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.md,
    borderBottomWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
    gap: Layout.padding.sm,
  },
  title: {
    color: Colors.ink,
    marginBottom: Layout.padding.xs,
  },
  quiet: {
    color: Colors.inkSoft,
  },
  // Tertiary: bare ink text, SemiBold (BRAND §9). The 48px box is the target.
  link: {
    alignSelf: 'flex-start',
    minHeight: Layout.touchTargetMin,
    justifyContent: 'center',
  },
  // A bare text control: a 92% dip would be invisible without a fill.
  pressed: {
    opacity: 0.7,
  },
});
