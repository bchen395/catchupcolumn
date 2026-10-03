import { useCallback } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { WRITING_LINE_HEIGHT } from '@/hooks/use-block-editor';
import type { ComposerTextPiece as Piece } from '@/lib/composer-blocks';

type Props = {
  piece: Piece;
  accessibilityLabel: string;
  // Shown (in the italic voice) only on the one piece that carries it.
  placeholder: string | null;
  // The last piece stretches to the foot of the page, so tapping the blank
  // paper below your words lands the cursor at their end.
  grow: boolean;
  editable: boolean;
  registerInput: (key: string, input: TextInput | null) => void;
  onChangeText: (key: string, text: string) => void;
  onFocus: (key: string) => void;
  onBlur: (key: string) => void;
  onSelectionChange: (key: string, selection: { start: number; end: number }) => void;
  onKeyPress: (key: string, keyName: string) => void;
  onContentSizeChange: (key: string) => void;
};

// One stretch of the writing between photos: a borderless field in the
// reading serif, so the page reads as one continuous sheet rather than a
// stack of boxes. No caption belongs to a photo — this is just the story,
// carrying on.
export const ComposerTextPiece = ({
  piece,
  accessibilityLabel,
  placeholder,
  grow,
  editable,
  registerInput,
  onChangeText,
  onFocus,
  onBlur,
  onSelectionChange,
  onKeyPress,
  onContentSizeChange,
}: Props) => {
  const { key } = piece;
  const setRef = useCallback((input: TextInput | null) => registerInput(key, input), [key, registerInput]);

  return (
    <View style={[styles.wrap, grow && styles.grow]}>
      <TextInput
        ref={setRef}
        value={piece.text}
        onChangeText={(text) => onChangeText(key, text)}
        onFocus={() => onFocus(key)}
        onBlur={() => onBlur(key)}
        onSelectionChange={(e) => onSelectionChange(key, e.nativeEvent.selection)}
        onKeyPress={(e) => onKeyPress(key, e.nativeEvent.key)}
        onContentSizeChange={() => onContentSizeChange(key)}
        multiline
        // Grows with its text; the page's ScrollView does the scrolling.
        scrollEnabled={false}
        editable={editable}
        selectionColor={Colors.vermilion}
        textAlignVertical="top"
        accessibilityLabel={accessibilityLabel}
        style={[styles.input, grow && styles.grow]}
      />
      {/* An overlaid placeholder keeps the warm italic voice without
          italicizing the upright serif you type. */}
      {placeholder && piece.text === '' ? (
        <View style={styles.placeholderWrap} pointerEvents="none">
          <ThemedText style={styles.placeholder}>{placeholder}</ThemedText>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  grow: {
    flexGrow: 1,
  },
  // Lora at the composer's writing size — a notch above the reader's 17 for
  // comfort while composing; the same face, so what you write is what runs.
  input: {
    minHeight: WRITING_LINE_HEIGHT,
    padding: 0,
    color: Colors.ink,
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.lg,
    lineHeight: WRITING_LINE_HEIGHT,
  },
  placeholderWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  placeholder: {
    fontFamily: Typography.families.serifItalic,
    fontSize: Typography.sizes.lg,
    lineHeight: WRITING_LINE_HEIGHT,
    color: Colors.inkSoft,
  },
});
