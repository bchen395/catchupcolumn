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

type AuthScreenShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export const AuthScreenShell = ({
  title,
  subtitle,
  children,
  footer,
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
          <View style={styles.header}>
            <ThemedText variant="headline">{title}</ThemedText>
            <ThemedText variant="body" style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          </View>

          <ThemedView variant="card" style={styles.card}>
            {children}
          </ThemedView>

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
  subtitle: {
    color: Colors.textMuted,
  },
  card: {
    padding: Layout.padding.lg,
    gap: Layout.padding.md,
  },
  footer: {
    alignItems: 'center',
    gap: Layout.padding.xs,
  },
});