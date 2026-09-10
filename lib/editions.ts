import type { LeadPostLike } from '@/lib/edition-layout';
import { supabase } from '@/lib/supabase';
import type { EditionRow, EditionWithPosts, GroupRow, PostRow, UserRow } from '@/types';

export type EditionListItem = EditionRow & {
  group: Pick<GroupRow, 'id' | 'name' | 'cover_image_url' | 'timezone'>;
  // Trimmed posts (just what the front-page lead picker + headline need) so the
  // inbox and home can show each edition's lead story without a second query.
  posts: LeadPostLike[];
};

// Editions returned by default. This query is the app's heaviest — it embeds
// every post's full body so the front-page lead picker can rank by length —
// so it stays bounded rather than growing forever with a Group's history. A
// weekly Group produces ~52 a year, so this is roughly a year across a
// handful of Groups; add pagination to the Editions list before raising it.
const EDITIONS_PAGE_SIZE = 60;

/**
 * Editions across every Group the user belongs to, newest first.
 *
 * Pass `limit: 1` when you only need the latest (Home's hero does) — the
 * default page pulls every embedded post body, which is far more than a
 * single-edition caller needs.
 */
export const fetchEditionsForUser = async (
  userId: string,
  { limit = EDITIONS_PAGE_SIZE }: { limit?: number } = {},
): Promise<EditionListItem[]> => {
  // Filter explicitly by group membership rather than relying on RLS to hide
  // non-member rows. Two-step keeps the second query's plan simple.
  const { data: memberships, error: membershipError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);

  if (membershipError) {
    throw membershipError;
  }

  const groupIds = (memberships ?? []).map((m) => m.group_id);
  if (groupIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('editions')
    .select(
      `id, group_id, edition_number, published_at, created_at,
       group:groups!inner(id, name, cover_image_url, timezone),
       posts(title, body, image_url, author:users(display_name))`,
    )
    .in('group_id', groupIds)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as EditionListItem[];
};

// Hand-written shape for the editions+posts+author join. Drop in favor of
// generated relationships once `supabase gen types` is wired up (#29).
type EditionRowWithPosts = EditionRow & {
  posts: (PostRow & { author: UserRow })[];
};

export const fetchEditionWithPosts = async (editionId: string): Promise<EditionWithPosts> => {
  const { data, error } = await supabase
    .from('editions')
    .select(
      `id, group_id, edition_number, published_at, created_at,
       posts(
         id, group_id, author_id, title, body, image_url, edition_id, created_at, updated_at,
         author:users(id, display_name, avatar_url, bio, created_at)
       )`,
    )
    .eq('id', editionId)
    .single();

  if (error) {
    throw error;
  }

  const row = data as unknown as EditionRowWithPosts;
  // Compare as instants, not strings. Lexicographic order happens to match
  // chronological order for the ISO-8601 timestamps Postgres returns, but it
  // stops being true the moment the format shifts (a different offset, a
  // different fractional precision), and the failure would be a silently
  // mis-ordered edition.
  const sortedPosts = [...row.posts].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return { ...row, posts: sortedPosts };
};

export type PublishNowErrorCode =
  | 'no_posts_to_publish'
  | 'not_moderator'
  | 'not_authenticated'
  | 'publish_in_progress'
  | 'publish_failed';

export class PublishNowError extends Error {
  code: PublishNowErrorCode;
  constructor(code: PublishNowErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type PublishEditionNowResult = {
  editionId: string;
  editionNumber: number;
  postCount: number;
  groupId: string;
};

// Resolve `error` from supabase.functions.invoke into a known
// PublishNowErrorCode. invoke surfaces a FunctionsHttpError on non-2xx
// responses; we read the body to recover our structured `error` field.
const parsePublishError = async (err: unknown): Promise<PublishNowError> => {
  if (err && typeof err === 'object' && 'context' in err) {
    const ctx = (err as { context?: { json?: () => Promise<{ error?: string }>; text?: () => Promise<string> } }).context;
    try {
      const body = await ctx?.json?.();
      const code = body?.error;
      if (
        code === 'no_posts_to_publish' ||
        code === 'not_moderator' ||
        code === 'not_authenticated' ||
        code === 'publish_in_progress'
      ) {
        return new PublishNowError(code, code);
      }
    } catch {
      // Fall through to generic failure below.
    }
  }
  return new PublishNowError('publish_failed', err instanceof Error ? err.message : 'Publish failed');
};

export const publishEditionNow = async (groupId: string): Promise<PublishEditionNowResult> => {
  const { data, error } = await supabase.functions.invoke('publish-edition-now', {
    body: { group_id: groupId },
  });

  if (error) {
    throw await parsePublishError(error);
  }

  const result = data as {
    edition_id?: string;
    edition_number?: number;
    post_count?: number;
    group_id?: string;
  } | null;

  if (!result?.edition_id || typeof result.edition_number !== 'number') {
    throw new PublishNowError('publish_failed', 'Malformed response from publish-edition-now');
  }

  return {
    editionId: result.edition_id,
    editionNumber: result.edition_number,
    postCount: result.post_count ?? 0,
    groupId: result.group_id ?? groupId,
  };
};

// Includes publish_day/publish_time so the front page can compute the
// colophon's "next edition arrives …" line (nextPublishForGroup).
export const fetchGroupForEdition = async (
  groupId: string,
): Promise<
  Pick<GroupRow, 'id' | 'name' | 'cover_image_url' | 'timezone' | 'publish_day' | 'publish_time'>
> => {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, cover_image_url, timezone, publish_day, publish_time')
    .eq('id', groupId)
    .single();

  if (error) {
    throw error;
  }

  return data as Pick<
    GroupRow,
    'id' | 'name' | 'cover_image_url' | 'timezone' | 'publish_day' | 'publish_time'
  >;
};

// The highest edition_number for a Group. edition_number is monotonic (max + 1
// on each publish), so the *current* edition is the one whose number equals
// this — the front page uses it to gate the colophon's forward-looking line to
// the latest edition only (pointing ahead under an archived issue is wrong).
export const fetchLatestEditionNumber = async (groupId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('editions')
    .select('edition_number')
    .eq('group_id', groupId)
    .order('edition_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.edition_number ?? 0;
};
