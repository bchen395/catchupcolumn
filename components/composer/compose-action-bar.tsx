import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { FormButton } from '@/components/form-button';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Motion } from '@/constants/motion';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';

// The bar is chrome pinned over the writing, so its labels stop growing at
// 1.6× (just past the largest non-accessibility size, still ≥ 25px for a 16px
// label). Uncapped, at the largest Dynamic Type sizes it would cover the page
// it serves — the reason iOS's own bars don't scale freely (BRAND §3).
const BAR_TEXT_CAP = 1.6;

type Props = {
  onAddPhoto: () => void;
  // The post has all its photos: the button stays, disabled, with the note.
  photoLimitNote: string | null;
  statusText: string;
  statusTone: 'quiet' | 'error';
  // Fade the status line in — the settle into "Filed for …" after filing.
  settleStatus: boolean;
  reduceMotion: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  primaryLoading: boolean;
  disabled: boolean;
  // Room kept at the foot while the bar rests on the tab bar, so the
  // raised "+" never sits on a button.
  clearance: number;
};

// The composer's pinned action bar (BRAND §9): "Add a photo", the quiet save
// line, and the one finishing action, never more than a thumb away. It rides
// the keyboard while you write and rests on the tab bar when you don't.
export const ComposeActionBar = ({
  onAddPhoto,
  photoLimitNote,
  statusText,
  statusTone,
  settleStatus,
  reduceMotion,
  primaryLabel,
  onPrimary,
  primaryLoading,
  disabled,
  clearance,
}: Props) => {
  const photoDisabled = disabled || photoLimitNote !== null;

  return (
    <View style={[styles.bar, { paddingBottom: Layout.padding.sm + clearance }]}>
      <View style={styles.statusRow}>
        <Animated.View
          key={statusText}
          entering={settleStatus && !reduceMotion ? FadeIn.duration(Motion.duration.settle) : undefined}
        >
          <ThemedText
            variant="meta"
            numberOfLines={2}
            maxFontSizeMultiplier={BAR_TEXT_CAP}
            accessibilityElementsHidden={statusText === ''}
            importantForAccessibility={statusText === '' ? 'no-hide-descendants' : 'auto'}
            style={[styles.status, statusTone === 'error' && styles.statusError]}
          >
            {/* A space keeps the line's height when there's nothing to say. */}
            {statusText || ' '}
          </ThemedText>
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onAddPhoto}
          disabled={photoDisabled}
          accessibilityRole="button"
          accessibilityLabel={Strings.compose.addPhoto}
          accessibilityHint={photoLimitNote ?? undefined}
          accessibilityState={{ disabled: photoDisabled }}
          style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}
        >
          <View style={[styles.photoLabel, photoDisabled && styles.inactive]}>
            <Icon icon={Icons.photo} size={22} color={Colors.ink} />
            <ThemedText variant="uiStrong" maxFontSizeMultiplier={BAR_TEXT_CAP}>
              {Strings.compose.addPhoto}
            </ThemedText>
          </View>
          {photoLimitNote ? (
            <ThemedText maxFontSizeMultiplier={BAR_TEXT_CAP} style={styles.limitNote}>
              {photoLimitNote}
            </ThemedText>
          ) : null}
        </Pressable>

        <FormButton
          title={primaryLabel}
          onPress={onPrimary}
          loading={primaryLoading}
          disabled={disabled}
          maxFontSizeMultiplier={BAR_TEXT_CAP}
          style={styles.primary}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Paper over a hairline top rule — the dress of the tab bar and sheets it
  // sits among.
  bar: {
    backgroundColor: Colors.paper,
    borderTopWidth: Layout.rule.hairline,
    borderTopColor: Colors.hairline,
    paddingHorizontal: Layout.padding.md,
    paddingTop: Layout.padding.sm,
    gap: Layout.padding.xs,
  },
  // Right-aligned, so the line reads as a note on the finishing action.
  statusRow: {
    alignItems: 'flex-end',
  },
  status: {
    textAlign: 'right',
  },
  statusError: {
    color: Colors.error,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    rowGap: Layout.padding.xs,
    columnGap: Layout.padding.md,
  },
  photoButton: {
    minHeight: Layout.buttonMinHeight,
    justifyContent: 'center',
    flexShrink: 1,
  },
  photoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  limitNote: {
    ...Typography.scale.caption,
    color: Colors.inkSoft,
  },
  inactive: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.7,
  },
  // Stays on the right even when large type wraps it onto its own line.
  primary: {
    marginLeft: 'auto',
  },
});
