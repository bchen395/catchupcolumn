import * as Linking from 'expo-linking';

import { Strings } from '@/constants/strings';
import { supabase } from '@/lib/supabase';
import type { PostWithAuthor } from '@/types';

/**
 * Reporting objectionable content.
 *
 * A report is sent from inside the app: the `report-story` edge function
 * emails support with the reporter's note, the story's details and the
 * reporter's address as reply-to (App Review Guideline 1.2 — a reviewer's
 * device may have no Mail account, so the report can't depend on one).
 *
 * Still deliberately no `reports` table: Groups are private and invite-only,
 * so the expected volume is near zero, and a hand-read inbox is both faster to
 * ship and better at the judgement calls this needs. The support inbox is the
 * record. If report volume ever justifies more, this module and the function
 * are the seam — nothing else in the app knows how a report is delivered.
 *
 * The mailto draft below is the fallback ("Email us instead") for when the
 * function can't be reached — offline, or before it was deployed.
 */

/** Longest note the function keeps; the input stops here too. */
export const REPORT_NOTE_MAX_LENGTH = 1000;

/** A send that didn't go through. `code` is the function's error code. */
export class StoryReportError extends Error {
  constructor(readonly code: string) {
    super(`Story report failed: ${code}`);
    this.name = 'StoryReportError';
  }
}

// invoke wraps a non-2xx in a FunctionsHttpError whose `context` is the raw
// Response; the function answers failures with `{ error: code }`. Anything
// else (offline, not deployed yet) is a plain send failure.
const reportErrorCode = async (err: unknown): Promise<string> => {
  try {
    const context = (err as { context?: { json?: () => Promise<{ error?: unknown }> } }).context;
    const body = await context?.json?.();
    if (typeof body?.error === 'string') return body.error;
  } catch {
    // Not the function's JSON.
  }
  return 'send_failed';
};

/** Send a report on `postId` to our team. Throws `StoryReportError`. */
export const sendStoryReport = async (postId: string, note: string): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('report-story', {
    body: { post_id: postId, note: note.trim() },
  });
  if (error) throw new StoryReportError(await reportErrorCode(error));
  if (!(data as { ok?: boolean } | null)?.ok) throw new StoryReportError('send_failed');
};

// The identifiers support needs to find the story, appended below whatever the
// reporter writes. Plain `key: value` lines so they survive every mail client's
// quoting and reply mangling. The function sends the same block, plus the
// reporter's email — keep the two in step.
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
  note = '',
): string => {
  const opening = note.trim() || Strings.report.emailIntro;
  const body = `${opening}\n\n\n\n${detailsBlock(post, reporterId)}\n`;
  return (
    `mailto:${Strings.legal.supportEmail}` +
    `?subject=${encodeURIComponent(Strings.report.emailSubject)}` +
    `&body=${encodeURIComponent(body)}`
  );
};

/**
 * Hand the drafted report, with any note already written, to the device's
 * mail app. Returns false when there isn't one — the caller shows the support
 * address instead so the reporter is never left with a dead end.
 */
export const openPostReport = async (
  post: PostWithAuthor,
  reporterId: string | null,
  note = '',
): Promise<boolean> => {
  try {
    await Linking.openURL(buildReportMailto(post, reporterId, note));
    return true;
  } catch {
    return false;
  }
};
