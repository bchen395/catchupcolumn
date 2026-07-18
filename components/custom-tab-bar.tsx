import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Haptics } from '@/lib/haptics';

import { useComposeSheet } from './compose-sheet-provider';
import { ThemedText } from './themed-text';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// One outline glyph per tab (BRAND §7): the icon set stays outline in both
// states — active is told by ink color + SemiBold label, not a filled glyph —
// so the bar keeps a consistent stroke weight with the illustration world.
const TAB_META: Record<string, { label: string; icon: IconName }> = {
  home: { label: 'Home', icon: 'home-outline' },
  inbox: { label: 'Editions', icon: 'newspaper-variant-outline' },
  groups: { label: 'Groups', icon: 'account-group-outline' },
  profile: { label: 'Profile', icon: 'account-outline' },
};

export const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { openComposeSheet } = useComposeSheet();

  return (
    <View style={[styles.barWrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, idx) => {
          const focused = state.index === idx;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (route.name === 'post') {
            // The center button opens the "write for…" sheet instead of
            // navigating to the tab; the sheet routes to Compose once a Group
            // is chosen.
            return (
              <View key={route.key} style={styles.centerSlot}>
                <Pressable
                  onPress={() => {
                    Haptics.tap();
                    openComposeSheet();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Write a post"
                  style={({ pressed }) => [styles.raised, pressed && styles.raisedPressed]}
                >
                  <MaterialCommunityIcons name="plus" size={32} color={Colors.paper} />
                </Pressable>
              </View>
            );
          }

          const meta = TAB_META[route.name];
          if (!meta) return null;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={meta.label}
              accessibilityState={focused ? { selected: true } : undefined}
              style={styles.slot}
            >
              <MaterialCommunityIcons
                name={meta.icon}
                size={26}
                color={focused ? Colors.ink : Colors.inkSoft}
              />
              <ThemedText style={[styles.label, focused && styles.labelFocused]}>
                {meta.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const RAISED_DIAMETER = 64;
const RAISED_LIFT = 24;
const BAR_HEIGHT = 60;

const styles = StyleSheet.create({
  // Wrapper carries the safe-area inset and the soft top hairline. Background
  // extends below the bar to avoid a visible seam on devices with home bars.
  barWrap: {
    backgroundColor: Colors.paper,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_HEIGHT,
    overflow: 'visible',
  },
  slot: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontFamily: Typography.families.sansMedium,
    fontSize: Typography.sizes.xs,
    color: Colors.inkSoft,
  },
  labelFocused: {
    color: Colors.ink,
    fontFamily: Typography.families.sansSemiBold,
  },
  // The center cell takes a slot's width but renders the raised circle that
  // overlaps the bar's top edge. Aligned to the top of the slot so the lift
  // doesn't push it below the icons.
  centerSlot: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  // The ink-black raised circle — the only black-filled object on most
  // screens: THE button (BRAND §7). Vermilion stays out of the bar.
  raised: {
    width: RAISED_DIAMETER,
    height: RAISED_DIAMETER,
    borderRadius: RAISED_DIAMETER / 2,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -RAISED_LIFT,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  raisedPressed: {
    // Filled controls press at 92% opacity, no motion (BRAND §9).
    opacity: 0.92,
  },
});
