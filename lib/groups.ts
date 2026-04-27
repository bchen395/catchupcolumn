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

const getFileExtension = (uri: string, mimeType?: string | null): string => {
  if (mimeType) {
    const ext = mimeType.split('/')[1];
    if (ext) return ext.replace('jpeg', 'jpg');
  }
  const match = uri.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : 'jpg';
};

const normalizeInviteCode = (code: string) => code.trim().toUpperCase();

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const fetchUserGroups = async (userId: string): Promise<GroupWithMembers[]> => {
  const { data, error } = await supabase
    .from('group_members')
    .select(
      `group_id, groups!inner(
        id, name, description, cover_image_url, publish_day, publish_time,
        created_by, invite_code, created_at,
        group_members(group_id, user_id, role, joined_at, users(id, display_name, avatar_url, bio, email, created_at))
      )`
    )
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const col = row.groups as unknown as GroupRow & {
      group_members: (GroupMemberRow & { users: UserRow })[];
    };
    return {
      ...col,
      members: col.group_members.map((m) => ({
        group_id: m.group_id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        user: m.users,
      })),
    };
  });
};

export const fetchGroupDetails = async (groupId: string): Promise<GroupWithMembers> => {
  const { data, error } = await supabase
    .from('groups')
    .select(
      `id, name, description, cover_image_url, publish_day, publish_time,
       created_by, invite_code, created_at,
       group_members(group_id, user_id, role, joined_at, users(id, display_name, avatar_url, bio, email, created_at))`
    )
    .eq('id', groupId)
    .single();

  if (error) {
    throw error;
  }

  const col = data as unknown as GroupRow & {
    group_members: (GroupMemberRow & { users: UserRow })[];
  };

  return {
    ...col,
    members: col.group_members.map((m) => ({
      group_id: m.group_id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      user: m.users,
    })),
  };
};

// ---------------------------------------------------------------------------
// Create / Update
// ---------------------------------------------------------------------------

export const createGroup = async (
  input: Pick<GroupInsert, 'name' | 'description' | 'publish_day' | 'publish_time' | 'created_by'>
): Promise<GroupRow> => {
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

export const uploadGroupCover = async (
  groupId: string,
  imageUri: string,
  mimeType?: string | null
): Promise<string> => {
  const imageResponse = await fetch(imageUri);
  const imageBuffer = await imageResponse.arrayBuffer();
  const ext = getFileExtension(imageUri, mimeType);
  const contentType = mimeType ?? (ext === 'png' ? 'image/png' : 'image/jpeg');
  const storagePath = `groups/${groupId}/cover.${ext}`;

  const { error } = await supabase.storage.from('avatars').upload(storagePath, imageBuffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return supabase.storage.from('avatars').getPublicUrl(storagePath).data.publicUrl;
};

// ---------------------------------------------------------------------------
// Invite / Join
// ---------------------------------------------------------------------------

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

export const joinGroupByCode = async (
  groupId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId, role: 'contributor' });

  if (error) {
    // Unique constraint violation means they're already a member
    if (error.code === '23505') {
      throw new Error('already_member');
    }
    throw error;
  }
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
