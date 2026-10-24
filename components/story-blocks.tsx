import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { displayRatioFor, useImageOrientation } from '@/hooks/use-image-orientation';
import { photoDisplayPath } from '@/lib/post-blocks';
import type { PostBlock, PostPhotoBlock } from '@/types';

import { EditorialPhoto } from './editorial-photo';
import { ThemedText } from './themed-text';

type Props = {
  // The post's pieces in reading order — from postBlocksOf(), never raw.
  blocks: PostBlock[];
  // "Photo by Ruth". Set once per post, under its first photo: every photo in
  // a post is its author's, so repeating the line under each would be noise.
  credit: string;
};

// Spacing above one block — a plain margin, so it works on a photo or a line
// of text alike.
type Space = { marginTop: number };

// Characters a lettrine never raises — the story would open on a lone mark.
const NO_LETTRINE = /[\s"'“”‘’(){}[\].,!?;:—–-]/;

// Air above a block, from what it follows (BRAND §6's 4px grid). Into the
// flow, a photo sits a hair below the byline and text sits on the article's
// own gap. A photo set into the text gets a full section gap on both sides,
// a little more than a paragraph break, so it reads as part of the story but
// not as part of a sentence. A run of photos closes ranks to one gutter so
// the run reads as one set. Two text pieces never touch in a stored post; if
// they did, they'd sit a blank line apart, as if merged.
const spaceAbove = (prev: PostBlock | undefined, block: PostBlock): number => {
  if (!prev) return block.type === 'photo' ? Layout.padding.xs : 0;
  if (prev.type === 'photo') return block.type === 'photo' ? Layout.padding.md : Layout.padding.xl;
  return block.type === 'photo' ? Layout.padding.xl : Typography.lineHeights.read;
};

// One post's writing and photos in the order they were set, for the story
// reader. Photos are flat editorial plates (BRAND §5) in their orientation
// bucket; a portrait comes in to a narrower centered measure so it doesn't
// tower over the page. Each text piece is set in the 17/26 reading voice, and
// the first one opens on the raised initial, wherever it falls.
export const StoryBlocks = ({ blocks, credit }: Props) => {
  const firstText = blocks.findIndex((b) => b.type === 'text');
  const firstPhoto = blocks.findIndex((b) => b.type === 'photo');

  return (
    <View>
      {blocks.map((block, i) => {
        const space: Space = { marginTop: spaceAbove(blocks[i - 1], block) };
        if (block.type === 'text') {
          return (
            <StoryText key={`text-${i}`} text={block.text} lettrine={i === firstText} style={space} />
          );
        }
        return (
          <StoryPhoto
            key={`photo-${i}-${block.path}`}
            photo={block}
            credit={i === firstPhoto ? credit : undefined}
            style={space}
          />
        );
      })}
    </View>
  );
};

const StoryPhoto = ({
  photo,
  credit,
  style,
}: {
  photo: PostPhotoBlock;
  credit?: string;
  style: Space;
}) => {
  // The ~1280px display copy; the 2600px master is for print. A photo that
  // carries its size reserves its exact plate from the first frame.
  const path = photoDisplayPath(photo);
  const { orientation, onNaturalSize } = useImageOrientation(path, photo);
  return (
    <EditorialPhoto
      imageUrl={path}
      credit={credit}
      photoAspectRatio={displayRatioFor(orientation ?? 'landscape')}
      onNaturalSize={onNaturalSize}
      style={[style, orientation === 'portrait' && styles.photoPortrait]}
    />
  );
};

// The raised initial is an inline "lettrine", not a true CSS-float drop cap
// (React Native has no float). It reads as the same flourish without risking a
// clipped glyph. Skipped when the text opens on punctuation/whitespace.
const StoryText = ({
  text,
  lettrine,
  style,
}: {
  text: string;
  lettrine: boolean;
  style: Space;
}) => {
  const trimmed = text.trimStart();
  // By code point, so an opening emoji is never split into half a glyph.
  const initial = Array.from(trimmed)[0] ?? '';
  const raise = lettrine && initial !== '' && !NO_LETTRINE.test(initial);

  return (
    <ThemedText style={[styles.read, style]}>
      {raise ? <ThemedText style={styles.dropCap}>{initial}</ThemedText> : null}
      {raise ? trimmed.slice(initial.length) : text}
    </ThemedText>
  );
};

const styles = StyleSheet.create({
  // A tall photo at full width would tower over the page — bring it in to a
  // narrower centered measure instead, like a portrait plate in a paper.
  photoPortrait: {
    width: '78%',
    alignSelf: 'center',
  },
  read: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.read,
    lineHeight: Typography.lineHeights.read,
    color: Colors.ink,
  },
  // The lettrine is set in ink — vermilion never decorates reading copy
  // (BRAND §2), and the reader page spends no accent at all.
  dropCap: {
    fontFamily: Typography.families.serifBold,
    fontSize: 36,
    lineHeight: 40,
    color: Colors.ink,
  },
});
