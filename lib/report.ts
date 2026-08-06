import * as Linking from 'expo-linking';

import { Strings } from '@/constants/strings';
import type { PostWithAuthor } from '@/types';

/**
 * Reporting objectionable content.
 *
 * Deliberately a mailto rather than a `reports` table: Groups are private and
 * invite-only, so the expected volume is near zero, and a hand-read inbox is
 * both faster to ship and better at the judgement calls this needs. If report
 * volume ever justifies it, this module is the seam to swap for a real
 * endpoint — nothing else in the app knows how a report is delivered.
 */

// The identifiers support needs to find the story, appended below whatever the
// reporter writes. Plain `key: value` lines so they survive every mail client's
// quoting and reply mangling.
const detailsBlock = (post: PostWithAuthor, reporterId: string | null): string =>
  [
    '---',
    'Details for our team (please leave this in):',
    `Story: ${post.id}`,
    `Group: ${post.group_id}`,
    `Edition: ${post.edition_id ?? 'not yet published'}`,
    `Written by: ${post.author.display_name} (${post.author_id})`,
    `Reported by: ${reporterId ?? 'signed out'}`,
  ].join('\n');

export const buildReportMailto = (
  post: PostWithAuthor,
  reporterId: string | null,
): string => {
  const body = `${Strings.report.emailIntro}\n\n\n\n${detailsBlock(post, reporterId)}\n`;
  return (
    `mailto:${Strings.legal.supportEmail}` +
    `?subject=${encodeURIComponent(Strings.report.emailSubject)}` +
    `&body=${encodeURIComponent(body)}`
  );
};

/**
 * Hand the drafted report to the device's mail app. Returns false when there
 * isn't one — the caller shows the support address instead so the reporter is
 * never left with a dead end.
 */
export const openPostReport = async (
  post: PostWithAuthor,
  reporterId: string | null,
): Promise<boolean> => {
  try {
    await Linking.openURL(buildReportMailto(post, reporterId));
    return true;
  } catch {
    return false;
  }
};
