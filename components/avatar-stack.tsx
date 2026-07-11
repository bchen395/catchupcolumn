import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import type { InvitePreviewMember } from '@/types';

import { Avatar } from './avatar';

const MAX_FACES = 5;
const SIZE = 36;
const OVERLAP = -10;

type Props = {
  members: InvitePreviewMember[];
};

// A short overlapping row of member faces — the invitation's "you know these
// people" moment. Purely decorative: the names line beside it carries the
// meaning, so the stack is hidden from screen readers and never shows a
// "+N" chip (the copy already says "and 4 others").
export const AvatarStack = ({ members }: Props) => {
  const faces = members.slice(0, MAX_FACES);
  if (faces.length === 0) return null;

  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {faces.map((member, index) => (
        <Avatar
          key={`${member.display_name}-${index}`}
          uri={member.avatar_url}
          name={member.display_name}
          size={SIZE}
          // A paper ring separates overlapping faces the way white borders
          // separate photos laid on top of each other.
          style={[styles.face, index > 0 && styles.overlapping]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  face: {
    borderWidth: 2,
    borderColor: Colors.paperWarm,
  },
  overlapping: {
    marginLeft: OVERLAP,
  },
});
