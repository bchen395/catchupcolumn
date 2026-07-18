import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Modal,
    PanResponder,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Motion } from '@/constants/motion';
import { Typography } from '@/constants/typography';
import { Haptics } from '@/lib/haptics';
import type { GroupWithMembers } from '@/types';

import { Icon } from './icon';
import { ThemedText } from './themed-text';

// How far off-screen the sheet sits when hidden, and the drag thresholds that
// count as a "dismiss" rather than a spring-back.
const SHEET_TRAVEL = 700;
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.6;

type ComposeGroupSheetProps = {
  visible: boolean;
  groups: GroupWithMembers[];
  loading: boolean;
  onSelect: (groupId: string) => void;
  onClose: () => void;
  onCreateOrJoin: () => void;
};

export const ComposeGroupSheet = ({
  visible,
  groups,
  loading,
  onSelect,
  onClose,
  onCreateOrJoin,
}: ComposeGroupSheetProps) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SHEET_TRAVEL)).current;
  // Keep the Modal mounted through the closing animation, then unmount.
  const [mounted, setMounted] = useState(false);

  // The PanResponder is created once, so it reads onClose through a ref to
  // always call the latest handler.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.setValue(SHEET_TRAVEL);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 3,
        speed: 14,
      }).start();
    } else {
      // Animates from wherever it is now (incl. a drag) down off-screen.
      Animated.timing(translateY, {
        toValue: SHEET_TRAVEL,
        duration: Motion.duration.exit,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, translateY]);

  // Drag the handle/header down to dismiss; release short of the threshold
  // springs it back. Pan lives on the header only so the list scrolls freely.
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
          // The drag "took" — a light tick confirms the release did something.
          Haptics.tap();
          onCloseRef.current();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, SHEET_TRAVEL],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}
        />
        {/* Tap anywhere above the sheet to close. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
              paddingBottom: Math.max(insets.bottom, Layout.padding.md) + Layout.padding.sm,
            },
          ]}
        >
          {/* Pan zone — the grab handle + title double as the drag target. */}
          <View {...pan.panHandlers} style={styles.header}>
            <View style={styles.grabber} />
            <ThemedText variant="uiStrong" style={styles.title}>
              Write for…
            </ThemedText>
          </View>

          {loading && groups.length === 0 ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator color={Colors.ink} />
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.stateWrap}>
              <Icon icon={Icons.emptyGroups} size={36} color={Colors.inkSoft} />
              <ThemedText variant="subheadline" style={styles.emptyTitle}>
                You&apos;re not in a Group yet
              </ThemedText>
              <ThemedText variant="ui" style={styles.emptyBody}>
                Join or create a Group, then come back to write your first post.
              </ThemedText>
              <Pressable
                onPress={onCreateOrJoin}
                accessibilityRole="button"
                style={({ pressed }) => [styles.emptyCta, pressed && styles.pressedDim]}
              >
                <ThemedText style={styles.emptyCtaText}>Go to Groups</ThemedText>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {groups.map((g) => {
                const count = g.members.length;
                return (
                  <Pressable
                    key={g.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Write for ${g.name}`}
                    onPress={() => onSelect(g.id)}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  >
                    <View style={styles.rowText}>
                      <ThemedText variant="uiStrong" numberOfLines={1}>
                        {g.name}
                      </ThemedText>
                      <ThemedText variant="meta">
                        {count} {count === 1 ? 'member' : 'members'}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: Colors.scrim,
  },
  // A true overlay (BRAND §9): `paper`, top-rounded, grab handle, hairline
  // header rule.
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '80%',
    backgroundColor: Colors.paper,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    paddingHorizontal: Layout.padding.lg,
  },
  // Column: grabber centers, title pulls to the left edge.
  header: {
    alignItems: 'center',
    paddingTop: Layout.padding.sm,
    paddingBottom: Layout.padding.md,
    gap: Layout.padding.md,
    borderBottomWidth: Layout.rule.hairline,
    borderBottomColor: Colors.hairline,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.inkMuted,
  },
  title: {
    alignSelf: 'flex-start',
    color: Colors.ink,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: Layout.padding.sm,
  },
  // Hairline-separated rows (BRAND §6): no boxes, no chevrons, the whole row
  // is the target.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: Layout.rowMinHeight,
    paddingVertical: Layout.padding.sm,
    borderBottomWidth: Layout.rule.hairline,
    borderBottomColor: Colors.hairline,
    gap: Layout.padding.md,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  stateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.padding.xl,
    gap: Layout.padding.sm,
  },
  emptyTitle: {
    color: Colors.ink,
    textAlign: 'center',
  },
  emptyBody: {
    color: Colors.inkSoft,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyCta: {
    minHeight: Layout.buttonMinHeight,
    paddingHorizontal: Layout.padding.lg,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.padding.sm,
  },
  emptyCtaText: {
    fontFamily: Typography.families.sansSemiBold,
    color: Colors.paper,
    fontSize: Typography.sizes.body,
  },
  pressedDim: {
    opacity: 0.92,
  },
});
