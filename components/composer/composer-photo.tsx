import { useEffect } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppImage } from '@/components/app-image';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { displayRatioFor, useImageOrientation } from '@/hooks/use-image-orientation';
import { usePostImageUrl } from '@/hooks/use-post-image-url';
import type { ComposerPhoto as Photo } from '@/lib/composer-blocks';
import { photoDisplayPath } from '@/lib/post-blocks';

type Props = {
  photo: Photo;
  number: number;
  total: number;
  selected: boolean;
  disabled: boolean;
  onPress: (key: string) => void;
  onRemove: (key: string) => void;
  onRetry: (key: string) => void;
};

// A photo set into the writing, run exactly as the page prints it: flat
// (BRAND §5 — square corners, hairline edge), full measure, cropped to its
// orientation bucket like the reader does. Tapping it selects it and offers
// an explicit "Remove photo" (no gesture-only path, BRAND §13).
export const ComposerPhotoView = ({
  photo,
  number,
  total,
  selected,
  disabled,
  onPress,
  onRemove,
  onRetry,
}: Props) => {
  const { key, localUri, width, height, stored, upload } = photo;
  // A just-picked photo shows its local file throughout, even once uploaded,
  // so it never flickers; a saved one shows its display copy, never the
  // 2600px print master.
  const displayPath = stored ? photoDisplayPath(stored) : null;
  const signedUri = usePostImageUrl(localUri ? null : displayPath);
  const uri = localUri ?? signedUri;
  const { orientation, onNaturalSize } = useImageOrientation(localUri ?? displayPath);

  // Known dimensions shape the frame before the image has even loaded.
  useEffect(() => {
    if (width && height) onNaturalSize(width, height);
  }, [width, height, onNaturalSize]);

  const pending = upload === 'waiting' || upload === 'uploading';
  const status =
    upload === 'uploading'
      ? `, ${Strings.compose.a11yPhotoUploading}`
      : upload === 'failed'
        ? `, ${Strings.compose.a11yPhotoFailed}`
        : '';

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onPress(key)}
        disabled={disabled}
        accessibilityRole="imagebutton"
        accessibilityLabel={`${Strings.compose.a11yPhoto(number, total)}${status}`}
        accessibilityHint={selected ? undefined : Strings.compose.a11yPhotoHint}
        accessibilityState={{ selected, disabled }}
        accessibilityActions={[{ name: 'remove', label: Strings.compose.removePhoto }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'remove') onRemove(key);
        }}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <AppImage
          // Cached by storage path, not by the signed URL, which changes
          // every session.
          source={uri ? { uri, cacheKey: localUri ? undefined : (displayPath ?? undefined) } : undefined}
          style={[
            styles.image,
            { aspectRatio: displayRatioFor(orientation ?? 'landscape') },
            pending && styles.quiet,
          ]}
          onLoad={(e) => onNaturalSize(e.source.width, e.source.height)}
          accessibilityIgnoresInvertColors
        />
        {selected ? <View pointerEvents="none" style={styles.selectedRing} /> : null}
      </Pressable>

      {selected ? (
        <PhotoAction
          label={Strings.compose.removePhoto}
          tone="error"
          onPress={() => onRemove(key)}
          style={styles.removeOnPhoto}
        />
      ) : null}

      {upload === 'failed' ? (
        <View style={styles.failedRow}>
          <ThemedText variant="ui" style={styles.failedText}>
            {Strings.compose.photoFailed}
          </ThemedText>
          <PhotoAction label={Strings.compose.retryPhoto} onPress={() => onRetry(key)} />
          <PhotoAction label={Strings.compose.removePhoto} tone="error" onPress={() => onRemove(key)} />
        </View>
      ) : null}
    </View>
  );
};

type ActionProps = {
  label: string;
  onPress: () => void;
  tone?: 'ink' | 'error';
  style?: StyleProp<ViewStyle>;
};

// A plain-text action at a full 48px target — danger told in words (`error`
// ink), never a slab (BRAND §9).
const PhotoAction = ({ label, onPress, tone = 'ink', style }: ActionProps) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    style={({ pressed }) => [styles.action, style, pressed && styles.pressed]}
  >
    <ThemedText variant="uiStrong" style={tone === 'error' && styles.errorText}>
      {label}
    </ThemedText>
  </Pressable>
);

const styles = StyleSheet.create({
  wrap: {
    marginVertical: Layout.padding.md,
  },
  image: {
    width: '100%',
    borderWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
  },
  // Not yet saved: quietly lighter until its upload lands.
  quiet: {
    opacity: 0.6,
  },
  // Selection is drawn in ink, over the photo's edge (no layout shift).
  selectedRing: {
    ...StyleSheet.absoluteFill,
    borderWidth: Layout.rule.heavy,
    borderColor: Colors.ink,
  },
  pressed: {
    opacity: 0.7,
  },
  action: {
    minHeight: Layout.touchTargetMin,
    justifyContent: 'center',
    paddingHorizontal: Layout.padding.sm,
  },
  // Sits on the photo's top-right corner on a paper chip, so it reads on any
  // picture.
  removeOnPhoto: {
    position: 'absolute',
    top: Layout.padding.sm,
    right: Layout.padding.sm,
    paddingHorizontal: Layout.padding.md,
    backgroundColor: Colors.paper,
    borderRadius: Layout.borderRadius.full,
    borderWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
  },
  failedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: Layout.padding.sm,
    marginTop: Layout.padding.xs,
  },
  failedText: {
    color: Colors.error,
    flexBasis: '100%',
  },
  errorText: {
    color: Colors.error,
  },
});
