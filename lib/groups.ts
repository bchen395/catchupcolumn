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
// Queries
// ---------------------------------------------------------------------------

export const fetchUserGroups = async (userId: string): Promise<GroupWithMembers[]> => {
  const { data, error } = await supabase
    .from('group_members')
    .select(
      `group_id, groups!inner(
        id, name, description, cover_image_url, publish_day, publish_time,
        timezone, created_by, invite_code, created_at,
        group_members(group_id, user_id, role, joined_at, users(id, display_name, avatar_url, bio, email, created_at))
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
       group_members(group_id, user_id, role, joined_at, users(id, display_name, avatar_url, bio, email, created_at))`
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
