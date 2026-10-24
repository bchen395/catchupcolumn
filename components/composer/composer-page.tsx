import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import type { BlockEditor } from '@/hooks/use-block-editor';
import { placeholderKey, type ComposerBlock } from '@/lib/composer-blocks';

import { ComposerPhotoView } from './composer-photo';
import { ComposerTextPiece } from './composer-text-piece';

type Props = {
  title: string;
  onChangeTitle: (text: string) => void;
  blocks: ComposerBlock[];
  editable: boolean;
  editor: BlockEditor;
  onRetryPhoto: (key: string) => void;
};

// The page on the desk (BRAND §9): an optional headline over a rule, then one
// flow of writing with photos set into it. The pieces are separate fields
// underneath, drawn without seams so the sheet reads as one page; tapping
// blank paper puts the cursor at the end of the writing.
export const ComposerPage = ({ title, onChangeTitle, blocks, editable, editor, onRetryPhoto }: Props) => {
  const placeholder = placeholderKey(blocks);
  const total = blocks.filter((b) => b.kind === 'photo').length;
  const lastKey = blocks[blocks.length - 1]?.key;
  const photosBefore = (index: number) =>
    blocks.slice(0, index).filter((b) => b.kind === 'photo').length;

  return (
    <Pressable accessible={false} onPress={editor.focusEnd} style={styles.page}>
      {/* Optional — it becomes the story's headline on the front page and in
          the email; left blank, the story runs under your name. */}
      <TextInput
        value={title}
        onChangeText={(text) => onChangeTitle(text.replace(/\s*\n\s*/g, ' '))}
        placeholder={Strings.compose.headlinePlaceholder}
        placeholderTextColor={Colors.inkMuted}
        selectionColor={Colors.vermilion}
        editable={editable}
        maxLength={80}
        multiline
        scrollEnabled={false}
        submitBehavior="submit"
        returnKeyType="next"
        onSubmitEditing={editor.focusStart}
        accessibilityLabel={Strings.compose.headlinePlaceholder}
        style={styles.headline}
      />
      <View style={styles.rule} />
      <View style={styles.flow}>
        {blocks.map((block, index) =>
          block.kind === 'photo' ? (
            <ComposerPhotoView
              key={block.key}
              photo={block}
              number={photosBefore(index) + 1}
              total={total}
              selected={editor.selectedPhoto === block.key}
              disabled={!editable}
              onPress={editor.onPressPhoto}
              onRemove={editor.removePhoto}
              onRetry={onRetryPhoto}
            />
          ) : (
            <ComposerTextPiece
              key={block.key}
              piece={block}
              accessibilityLabel={
                index === 0 ? Strings.compose.a11yStory : Strings.compose.a11yStoryAfterPhoto(photosBefore(index))
              }
              placeholder={block.key === placeholder ? Strings.compose.bodyPlaceholder : null}
              grow={block.key === lastKey}
              editable={editable}
              registerInput={editor.registerInput}
              onChangeText={editor.onChangeText}
              onFocus={editor.onFocus}
              onBlur={editor.onBlur}
              onSelectionChange={editor.onSelectionChange}
              onKeyPress={editor.onKeyPress}
              onContentSizeChange={editor.onContentSizeChange}
            />
          ),
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // A white sheet laid on the warm desk — the one content surface that keeps
  // its lift: the page IS the writing metaphor, and it behaves like a true
  // overlay. Matches ComposerSkeleton's card.
  page: {
    ...Layout.shadow.paper,
    backgroundColor: Colors.paper,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
    minHeight: 360,
    padding: Layout.padding.lg,
  },
  // Lora Bold between body and a real headline, so it reads as a title
  // without dwarfing the writing.
  headline: {
    color: Colors.ink,
    fontFamily: Typography.families.serifBold,
    fontSize: Typography.sizes.xl,
    lineHeight: 28,
    paddingHorizontal: 0,
    paddingVertical: Layout.padding.xs,
  },
  rule: {
    height: Layout.rule.hairline,
    backgroundColor: Colors.hairline,
    marginTop: Layout.padding.xs,
    marginBottom: Layout.padding.md,
  },
  flow: {
    flexGrow: 1,
  },
});
