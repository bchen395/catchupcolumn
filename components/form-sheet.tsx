import { useRef, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useKeyboardInset } from '@/hooks/use-keyboard-inset';

import { ThemedText } from './themed-text';

// The footer is chrome pinned over the form, so — like the composer's action
// bar — its labels stop growing at 1.6× (still ≥ 25px for a 16px label).
// Uncapped, the largest Dynamic Type sizes would leave the form no room above
// the keyboard. The body scrolls and is never capped.
export const SHEET_ACTION_TEXT_CAP = 1.6;

type FormSheetProps = {
  visible: boolean;
  title: string;
  /** The scrim, Android's back button and VoiceOver's escape gesture call it. */
  onClose: () => void;
  /** False while work is in flight, so nothing but its own result ends it. */
  dismissible?: boolean;
  /** The form. Scrolls when it doesn't fit — large text, a raised keyboard. */
  children: ReactNode;
  /** The form's actions, pinned to the sheet's foot and riding the keyboard. */
  footer: ReactNode;
};

// A short form on a bottom sheet (BRAND §9: `paper`, top-rounded, hairline
// header rule). The footer stays on screen above the keyboard, so the button
// that finishes the form is never covered by it. No grab handle, because the
// sheet doesn't drag: a swipe shouldn't be able to throw away what someone is
// writing. It fades in with the scrim, as the time picker does, which also
// keeps it still under Reduce Motion.
export const FormSheet = ({
  visible,
  title,
  onClose,
  dismissible = true,
  children,
  footer,
}: FormSheetProps) => {
  const close = () => {
    if (dismissible) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <Sheet title={title} onClose={close} footer={footer}>
        {children}
      </Sheet>
    </Modal>
  );
};

type SheetProps = Pick<FormSheetProps, 'title' | 'onClose' | 'children' | 'footer'>;

// Mounted only while the Modal is open, so the keyboard listeners are too.
const Sheet = ({ title, onClose, children, footer }: SheetProps) => {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<View>(null);
  const keyboard = useKeyboardInset(sheetRef);
  const bottom = (keyboard.inset > 0 ? keyboard.inset : insets.bottom) + Layout.padding.md;

  return (
    <View style={styles.root}>
      {/* Tap above the sheet to close. Hidden from screen readers, which get
          the form's own Cancel and the escape gesture instead, so the title
          is the first thing they hear. */}
      <Pressable
        style={[StyleSheet.absoluteFill, styles.scrim]}
        onPress={onClose}
        accessible={false}
        importantForAccessibility="no"
      />
      <View
        ref={sheetRef}
        onLayout={keyboard.onLayout}
        onAccessibilityEscape={onClose}
        style={[styles.sheet, { marginTop: insets.top + Layout.padding.lg, paddingBottom: bottom }]}
      >
        <View style={styles.header}>
          <ThemedText variant="uiStrong" accessibilityRole="header">
            {title}
          </ThemedText>
        </View>
        {/* A tap on the form's text (not a control) lowers the keyboard. */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        <View style={styles.footer}>{footer}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: Colors.scrim,
  },
  // A true overlay: `paper`, top-rounded like the compose sheet. Its top
  // margin keeps it below the status bar; past that it shrinks and the body
  // scrolls.
  sheet: {
    flexShrink: 1,
    backgroundColor: Colors.paper,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    paddingHorizontal: Layout.padding.lg,
  },
  header: {
    paddingTop: Layout.padding.lg,
    paddingBottom: Layout.padding.md,
    borderBottomWidth: Layout.rule.hairline,
    borderBottomColor: Colors.hairline,
  },
  body: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyContent: {
    paddingTop: Layout.padding.md,
    paddingBottom: Layout.padding.lg,
    gap: Layout.padding.md,
  },
  footer: {
    gap: Layout.padding.sm,
  },
});
