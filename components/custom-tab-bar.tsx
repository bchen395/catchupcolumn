import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

import { ThemedText } from './themed-text';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const TAB_META: Record<
  string,
  { label: string; iconActive: IconName; iconInactive: IconName }
> = {
  home: { label: 'Home', iconActive: 'home', iconInactive: 'home-outline' },
  inbox: {
    label: 'Editions',
    iconActive: 'newspaper-variant',
    iconInactive: 'newspaper-variant-outline',
  },
  mail: { label: 'Mail', iconActive: 'email', iconInactive: 'email-outline' },
  profile: {
    label: 'Profile',
    iconActive: 'account',
    iconInactive: 'account-outline',
  },
};

export const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

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
            return (
              <View key={route.key} style={styles.centerSlot}>
                <Pressable
                  onPress={onPress}
                  accessibilityRole="button"
                  accessibilityLabel="Compose"
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
                name={focused ? meta.iconActive : meta.iconInactive}
                size={26}
                color={focused ? Colors.navy : Colors.inkSoft}
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
    backgroundColor: Colors.blueChip,
    borderTopWidth: 1,
    borderTopColor: Colors.navySoft,
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
    color: Colors.navy,
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
  raised: {
    width: RAISED_DIAMETER,
    height: RAISED_DIAMETER,
    borderRadius: RAISED_DIAMETER / 2,
    backgroundColor: Colors.navy,
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
    backgroundColor: Colors.navySoft,
  },
});
