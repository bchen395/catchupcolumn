import type { ReactNode } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';

type AuthScreenShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  // Persistent context above the header — the pending-invite "Joining {name}"
  // strip, so an invitee never loses sight of why they're filling in forms.
  banner?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

// Shared chrome for auth/onboarding: the wordmark set as a small masthead
// (BRAND §12 — Lora Bold ink on paper, no container; the v1 box-and-bag
// brandmark is retired), a rule, then the screen's headline and deck. Form
// fields sit directly on the page as ruled lines (§9) — no card box.
export const AuthScreenShell = ({
  title,
  subtitle,
  children,
  footer,
  banner,
  contentContainerStyle,
}: AuthScreenShellProps) => {
  return (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
        >
          {banner}
          <View style={styles.header}>
            <ThemedText variant="title">{Strings.brand.name}</ThemedText>
            <View style={styles.mastheadRule} />
            <ThemedText variant="headline">{title}</ThemedText>
            <ThemedText variant="deck">{subtitle}</ThemedText>
          </View>

          <View style={styles.form}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.xl,
    gap: Layout.padding.lg,
  },
  header: {
    gap: Layout.padding.sm,
  },
  mastheadRule: {
    height: Layout.rule.heavy,
    backgroundColor: Colors.ink,
    marginBottom: Layout.padding.sm,
  },
  form: {
    gap: Layout.padding.md,
  },
  footer: {
    alignItems: 'center',
    gap: Layout.padding.xs,
  },
});
