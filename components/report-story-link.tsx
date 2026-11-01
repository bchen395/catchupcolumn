import { useState } from 'react';

import { Strings } from '@/constants/strings';
import { useAuth } from '@/hooks/use-auth';
import { Haptics } from '@/lib/haptics';
import type { PostWithAuthor } from '@/types';

import { ReportStorySheet } from './report-story-sheet';
import { StoryFootLink } from './story-foot-link';

type Props = {
  post: PostWithAuthor;
};

// The report affordance, one of the lines at the foot of a story
// (story-foot-actions draws the rule above them), like a paper's correction
// notice. It opens the report sheet, which sends from inside the app.
export const ReportStoryLink = ({ post }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Nothing to report on your own writing — offering it there reads as an
  // invitation to flag yourself.
  if (user?.id === post.author_id) return null;

  const handlePress = () => {
    Haptics.tap();
    setOpen(true);
  };

  return (
    <>
      <StoryFootLink
        label={Strings.report.link}
        accessibilityHint={Strings.report.linkHint}
        onPress={handlePress}
      />
      <ReportStorySheet post={post} visible={open} onClose={() => setOpen(false)} />
    </>
  );
};
