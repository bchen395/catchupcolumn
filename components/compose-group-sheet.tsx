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
            <ThemedText variant="label" style={styles.title}>
              Write for…
            </ThemedText>
          </View>

          {loading && groups.length === 0 ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator color={Colors.orange} />
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.stateWrap}>
              <View style={styles.iconBubble}>
                <Icon icon={Icons.emptyGroups} size={32} color={Colors.orange} />
              </View>
              <ThemedText variant="subheadline" style={styles.emptyTitle}>
                You&apos;re not in a Group yet
              </ThemedText>
              <ThemedText variant="caption" style={styles.emptyBody}>
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
                      <ThemedText variant="label" style={styles.rowName} numberOfLines={1}>
                        {g.name}
                      </ThemedText>
                      <ThemedText variant="caption" style={styles.rowMeta}>
                        {count} {count === 1 ? 'member' : 'members'}
                      </ThemedText>
                    </View>
                    <Icon icon={Icons.chevronRight} size={18} color={Colors.inkMuted} />
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
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '80%',
    backgroundColor: Colors.paperWarm,
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
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.inkMuted,
  },
  title: {
    alignSelf: 'flex-start',
    color: Colors.orange,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: Layout.padding.sm,
    gap: Layout.padding.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingVertical: Layout.padding.sm,
    paddingHorizontal: Layout.padding.md,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    gap: Layout.padding.md,
  },
  rowPressed: {
    backgroundColor: Colors.peachWash,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    color: Colors.ink,
  },
  rowMeta: {
    color: Colors.inkSoft,
  },
  stateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.padding.xl,
    gap: Layout.padding.sm,
  },
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.peachWash,
    marginBottom: Layout.padding.xs,
  },
  emptyTitle: {
    color: Colors.ink,
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyCta: {
    minHeight: Layout.touchTargetMin,
    paddingHorizontal: Layout.padding.lg,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.orange,
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
    backgroundColor: Colors.orange + 'CC',
  },
});
