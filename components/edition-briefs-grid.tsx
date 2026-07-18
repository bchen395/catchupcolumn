import { Fragment, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import type { PostWithAuthor } from '@/types';

import { EditionBriefColumn } from './edition-brief-column';
import type { SectionFrame } from './story-reader-overlay';
import { ThemedText } from './themed-text';

type Props = {
  briefs: PostWithAuthor[];
  // Receives the tapped cell's on-screen frame so the host can grow the
  // story out of it; null when the cell couldn't be measured.
  onOpen: (postId: string, frame: SectionFrame | null) => void;
};

// The "in brief" section below the lead and secondary stories: a centered
// label flanked by rules, then text-only briefs paired into two-column rows
// with a vertical hairline between them — classic below-the-fold newsprint.
// An odd final brief runs the full measure rather than leaving a dangling
// half-column.
//
// The "IN BRIEF" label + grid only read as a section with two or more briefs.
// A lone brief (the 3-post edition's third story) runs the full measure with
// NO label — a section head over a single item reads thin. The host adds a
// hairline rule above in that case so it still separates from the secondary.
export const EditionBriefsGrid = ({ briefs, onOpen }: Props) => {
  const cellRefs = useRef(new Map<string, View | null>()).current;

  if (briefs.length === 0) return null;

  const open = (postId: string) => {
    const node = cellRefs.get(postId);
    if (!node) {
      onOpen(postId, null);
      return;
    }
    node.measureInWindow((x, y, width, height) => onOpen(postId, { x, y, width, height }));
  };

  const cell = (post: PostWithAuthor, style: object) => (
    <View
      ref={(node) => {
        cellRefs.set(post.id, node);
      }}
      collapsable={false}
      style={style}
    >
      <EditionBriefColumn post={post} onPress={() => open(post.id)} />
    </View>
  );

  const pairCount = Math.floor(briefs.length / 2);
  const rows: PostWithAuthor[][] = [];
  for (let i = 0; i < pairCount; i += 1) {
    rows.push([briefs[i * 2], briefs[i * 2 + 1]]);
  }
  const lastOdd = briefs.length % 2 === 1 ? briefs[briefs.length - 1] : null;

  return (
    <View style={styles.section}>
      {briefs.length >= 2 ? (
        <View style={styles.header}>
          <View style={styles.headerRule} />
          {/* Section label in the ink kicker voice — the cover's vermilion is
              already spent on the lead's kicker (BRAND §2). */}
          <ThemedText variant="kicker">In Brief</ThemedText>
          <View style={styles.headerRule} />
        </View>
      ) : null}

      {rows.map(([left, right], idx) => (
        <Fragment key={left.id}>
          {idx > 0 ? <View style={styles.rowDivider} /> : null}
          <View style={styles.row}>
            {cell(left, styles.column)}
            <View style={styles.columnRule} />
            {cell(right, styles.column)}
          </View>
        </Fragment>
      ))}

      {lastOdd ? (
        <Fragment key={lastOdd.id}>
          {rows.length > 0 ? <View style={styles.rowDivider} /> : null}
          <View style={styles.row}>{cell(lastOdd, styles.fullWidth)}</View>
        </Fragment>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingTop: Layout.padding.sm,
  },
  // Centered "in brief" label flanked by short rules — a section head, not a
  // card boundary.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.md,
    paddingBottom: Layout.padding.sm,
  },
  headerRule: {
    flex: 1,
    height: Layout.rule.hairline,
    backgroundColor: Colors.hairline,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: Layout.padding.lg,
  },
  column: {
    flex: 1,
    flexShrink: 1,
  },
  // The last odd brief runs the full measure, like a newspaper's final short
  // item — no dangling half-column or lonely vertical rule.
  fullWidth: {
    flex: 1,
  },
  // Vertical hairline between the two columns, spanning the taller cell.
  columnRule: {
    width: Layout.rule.hairline,
    backgroundColor: Colors.hairline,
    alignSelf: 'stretch',
    marginHorizontal: Layout.padding.md,
  },
  rowDivider: {
    height: Layout.rule.hairline,
    backgroundColor: Colors.hairline,
    marginHorizontal: Layout.padding.lg,
  },
});
