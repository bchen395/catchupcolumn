import { supabase } from '@/lib/supabase';

// One-way blocks (20261101204252). Blocking someone hides their stories from
// you everywhere: the posts SELECT policy drops them from every read, so no
// screen filters anything itself, and the email worker leaves them out of
// your edition emails. They aren't told, and they still see yours. A block
// belongs to you, not to a Group.
//
// The table's RLS gives each person their own rows only. These functions
// still name the signed-in user explicitly, so a forged blocker id fails at
// the database (the insert policy's check) rather than anywhere quieter.

/**
 * The user ids the signed-in person has blocked — for the Group page's
 * "Blocked" chip and "Unblock". Nobody can read anyone else's.
 */
export const fetchMyBlockedIds = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocker_id', userId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.blocked_id);
};

/**
 * "Block {first}" at the foot of a story. Already blocked (a second tap, or
 * another device got there first) counts as done.
 */
export const blockMember = async (userId: string, blockedId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_blocks')
    .insert({ blocker_id: userId, blocked_id: blockedId });

  // 23505: the row already exists, which is the outcome asked for.
  if (error && error.code !== '23505') {
    throw error;
  }
};

/**
 * "Unblock" on the Group page. Their stories come back at once, past
 * editions included; emails already sent stay as they were.
 */
export const unblockMember = async (userId: string, blockedId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', userId)
    .eq('blocked_id', blockedId);

  if (error) {
    throw error;
  }
};
