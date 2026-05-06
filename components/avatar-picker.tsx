import { StyleSheet, View } from 'react-native';

import { AppImage } from '@/components/app-image';
import { FormButton } from '@/components/form-button';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';

type AvatarPickerProps = {
  label: string;
  imageUrl?: string | null;
  displayName?: string | null;
  onPickImage: () => void;
  onClearImage?: () => void;
  loading?: boolean;
  helperText?: string;
  error?: string | null;
};

export const AvatarPicker = ({
  label,
  imageUrl,
  displayName,
  onPickImage,
  onClearImage,
  loading = false,
  helperText,
  error,
}: AvatarPickerProps) => {
  const initials = getInitials(displayName);

  return (
    <View style={styles.wrapper}>
      <ThemedText variant="label" style={styles.label}>
        {label}
      </ThemedText>
      <View style={styles.row}>
        {imageUrl ? (
          <AppImage source={{ uri: imageUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.fallbackAvatar]}>
            <ThemedText variant="subheadline" style={styles.initials}>
              {initials}
            </ThemedText>
          </View>
        )}
        <View style={styles.actions}>
          <FormButton
            title={imageUrl ? 'Choose a different photo' : 'Choose a photo'}
            variant="secondary"
            loading={loading}
            onPress={onPickImage}
          />
          {imageUrl && onClearImage ? (
            <FormButton title="Remove photo" variant="ghost" onPress={onClearImage} />
          ) : null}
        </View>
      </View>
      {error ? (
        <ThemedText variant="caption" style={styles.errorText}>
          {error}
        </ThemedText>
      ) : helperText ? (
        <ThemedText variant="caption" style={styles.helperText}>
          {helperText}
        </ThemedText>
      ) : null}
    </View>
  );
};

const getInitials = (displayName?: string | null) => {
  if (!displayName) {
    return 'CU';
  }

  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'CU';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
};

const styles = StyleSheet.create({
  wrapper: {
    gap: Layout.padding.sm,
  },
  label: {
    color: Colors.accentNavy,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: Colors.backgroundWarm,
  },
  fallbackAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  initials: {
    color: Colors.accentNavy,
    fontFamily: Typography.families.sansBold,
  },
  actions: {
    flex: 1,
    gap: Layout.padding.sm,
  },
  helperText: {
    color: Colors.textMuted,
  },
  errorText: {
    color: Colors.error,
  },
});