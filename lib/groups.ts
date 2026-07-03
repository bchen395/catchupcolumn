import { resizeImageForUpload } from '@/lib/image';
import { supabase } from '@/lib/supabase';
import type {
    GroupInsert,
    GroupMemberRow,
    GroupRow,
    GroupUpdate,
    GroupWithMembers,
    UserRow,
} from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const normalizeInviteCode = (code: string) => code.trim();

// Shape of a `groups` row joined with `group_members(..., users(...))` —
// hand-written because supabase-js infers `Relationships: []` until
// `types/database.ts` is regenerated via `supabase gen types` (bug #29).
type GroupRowWithMembers = GroupRow & {
  group_members: (GroupMemberRow & { users: UserRow })[];
};

const toGroupWithMembers = (col: GroupRowWithMembers): GroupWithMembers => ({
  ...col,
  members: col.group_members.map((m) => ({
    group_id: m.group_id,
    user_id: m.user_id,
    role: m.role,
    joined_at: m.joined_at,
    user: m.users,
  })),
});

// ---------------------------------------------------------------------------
// Publish schedule
// ---------------------------------------------------------------------------

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

// "9 AM" / "9:30 AM" — minutes drop when zero so datelines read like speech.
const formatClock = (hour24: number, minute: number): string => {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const h = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return minute === 0 ? `${h} ${period}` : `${h}:${String(minute).padStart(2, '0')} ${period}`;
};

export type NextPublish = {
  /** Whole days until the next publish moment: 0 = later today, 1 = tomorrow. */
  daysAway: number;
  /** "today", "tomorrow", or a weekday name — ready for warm copy. */
  dayLabel: string;
  /** "9 AM" / "9:30 AM" in the Group's timezone. */
  timeLabel: string;
  /**
   * Total minutes from `now` until the next publish moment, in the Group's
   * timezone. Ranking key for `soonestPublish` — two Groups publishing the
   * same day need the time-of-day to break the tie, which `daysAway` can't.
   */
  minutesUntil: number;
};

// `Number(x)` returns NaN for malformed segments, and destructuring defaults
// only fill `undefined` — not NaN — so a bad publish_time would silently break
// every comparison below (NaN < anything === false). Coerce explicitly.
const toMinuteOfDay = (value: string | undefined, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * When this Group's presses next roll, computed in the Group's own timezone
 * (publish_day/publish_time are defined there — see the schema). Display-only:
 * it answers "which day and how soon", not "the exact instant", so it never
 * has to wrestle with DST arithmetic.
 */
export const nextPublishForGroup = (
  group: Pick<GroupRow, 'publish_day' | 'publish_time' | 'timezone'>,
  now: Date = new Date(),
): NextPublish => {
  const [rawHour, rawMinute] = (group.publish_time ?? '09:00').split(':');
  const pubHour = toMinuteOfDay(rawHour, 9);
  const pubMinute = toMinuteOfDay(rawMinute, 0);

  // Read "now" as the Group's wall clock. An invalid IANA name throws — fall
  // back to the device clock rather than hiding the schedule.
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: group.timezone || 'UTC',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(now);
  } catch {
    parts = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(now);
  }
  const get = (type: Intl.DateTimeFormatPart['type']) =>
    parts.find((p) => p.type === type)?.value ?? '';
  const nowDay = WEEKDAY_INDEX[get('weekday')] ?? now.getDay();
  const nowHour = toMinuteOfDay(get('hour'), now.getHours());
  const nowMinute = toMinuteOfDay(get('minute'), now.getMinutes());

  let daysAway = ((group.publish_day ?? 0) - nowDay + 7) % 7;
  // Publish time already passed today → the next edition is a week out.
  if (daysAway === 0 && (nowHour > pubHour || (nowHour === pubHour && nowMinute >= pubMinute))) {
    daysAway = 7;
  }

  const dayLabel =
    daysAway === 0 ? 'today' : daysAway === 1 ? 'tomorrow' : DAY_NAMES[group.publish_day ?? 0];

  const minutesUntil =
    daysAway * 24 * 60 + (pubHour * 60 + pubMinute) - (nowHour * 60 + nowMinute);

  return { daysAway, dayLabel, timeLabel: formatClock(pubHour, pubMinute), minutesUntil };
};

/** The Group whose presses roll soonest — what Home's dateline announces. */
export const soonestPublish = (
  groups: Pick<GroupRow, 'id' | 'name' | 'publish_day' | 'publish_time' | 'timezone'>[],
  now: Date = new Date(),
): { group: (typeof groups)[number]; next: NextPublish } | null => {
  let best: { group: (typeof groups)[number]; next: NextPublish } | null = null;
  for (const group of groups) {
    const next = nextPublishForGroup(group, now);
    // Rank by the actual next-publish instant, not whole days — two Groups that
    // both publish "today" must be ordered by time-of-day, not array position.
    if (!best || next.minutesUntil < best.next.minutesUntil) {
      best = { group, next };
    }
  }
  return best;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const fetchUserGroups = async (userId: string): Promise<GroupWithMembers[]> => {
  const { data, error } = await supabase
    .from('group_members')
    .select(
      `group_id, groups!inner(
        id, name, description, cover_image_url, publish_day, publish_time,
        timezone, created_by, invite_code, created_at,
        group_members(group_id, user_id, role, joined_at, users(id, display_name, avatar_url, bio, created_at))
      )`
    )
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    toGroupWithMembers(row.groups as unknown as GroupRowWithMembers),
  );
};

export const fetchGroupDetails = async (groupId: string): Promise<GroupWithMembers> => {
  const { data, error } = await supabase
    .from('groups')
    .select(
      `id, name, description, cover_image_url, publish_day, publish_time,
       timezone, created_by, invite_code, created_at,
       group_members(group_id, user_id, role, joined_at, users(id, display_name, avatar_url, bio, created_at))`
    )
    .eq('id', groupId)
    .single();

  if (error) {
    throw error;
  }

  return toGroupWithMembers(data as unknown as GroupRowWithMembers);
};

// ---------------------------------------------------------------------------
// Create / Update
// ---------------------------------------------------------------------------

export const createGroup = async (
  input: Pick<GroupInsert, 'name' | 'description' | 'publish_day' | 'publish_time' | 'timezone' | 'created_by'>,
): Promise<GroupRow> => {
  // Guard: a DB trigger derives the moderator from `created_by`, so passing
  // a different UUID would make someone else the moderator. Caller must own
  // the row they're creating.
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (session?.user?.id && session.user.id !== input.created_by) {
    throw new Error('createGroup: created_by must match the signed-in user');
  }

  const { data, error } = await supabase
    .from('groups')
    .insert(input)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateGroupSettings = async (
  groupId: string,
  updates: GroupUpdate
): Promise<GroupRow> => {
  const { data, error } = await supabase
    .from('groups')
    .update(updates)
    .eq('id', groupId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// ---------------------------------------------------------------------------
// Cover image
// ---------------------------------------------------------------------------

export type GroupCoverUpload = {
  publicUrl: string;
  storagePath: string;
};

export const uploadGroupCover = async (
  groupId: string,
  imageUri: string,
): Promise<GroupCoverUpload> => {
  const resizedUri = await resizeImageForUpload(imageUri);
  const imageResponse = await fetch(resizedUri);
  if (!imageResponse.ok) {
    throw new Error(`Failed to read image for upload (${imageResponse.status})`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();
  // Bucket RLS uses the first path segment as the group_id to gate writes
  // against `is_group_moderator`. See 20260505000020_group_covers_bucket.sql.
  const storagePath = `${groupId}/cover.jpg`;

  const { error } = await supabase.storage.from('group-covers').upload(storagePath, imageBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return {
    publicUrl: supabase.storage.from('group-covers').getPublicUrl(storagePath).data.publicUrl,
    storagePath,
  };
};

export const removeGroupCover = async (storagePath: string): Promise<void> => {
  await supabase.storage.from('group-covers').remove([storagePath]);
};

// ---------------------------------------------------------------------------
// Invite / Join
// ---------------------------------------------------------------------------

export const isGroupMember = async (
  groupId: string,
  userId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data !== null;
};

export const lookupGroupByInviteCode = async (
  inviteCode: string
): Promise<GroupRow | null> => {
  const { data, error } = await supabase
    .rpc('find_group_by_invite_code', { p_invite_code: normalizeInviteCode(inviteCode) });

  if (error) {
    throw error;
  }

  const rows = data as GroupRow[] | null;
  return rows?.[0] ?? null;
};

export const joinGroupByInviteCode = async (
  inviteCode: string
): Promise<string> => {
  const { data, error } = await supabase.rpc('join_group_by_invite_code', {
    p_invite_code: normalizeInviteCode(inviteCode),
  });

  if (error) {
    if (error.code === 'P0002') {
      throw new Error('invalid_invite_code');
    }
    throw error;
  }

  return data;
};

// ---------------------------------------------------------------------------
// Leave
// ---------------------------------------------------------------------------

export const leaveGroup = async (groupId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Delete (moderator only)
// ---------------------------------------------------------------------------

export const deleteGroup = async (groupId: string): Promise<void> => {
  const { error } = await supabase.rpc('delete_group_as_moderator', {
    p_group_id: groupId,
  });

  if (error) {
    throw error;
  }
};
