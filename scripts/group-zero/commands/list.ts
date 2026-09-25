// list [--group <id|code>]
//
// Read-only. Without --group: every Group. With it: that Group's members and
// the posts waiting for its next edition.

import type { GroupRow, PostRow, UserRow } from '../../../types/database.ts';
import { parseFlags } from '../args.ts';
import { connect, type Db } from '../client.ts';
import { fetchUncompiledPosts, preview, resolveGroup } from '../lookup.ts';
import { field, show } from '../plan.ts';
import {
  describeSchedule,
  formatMinutes,
  formatSlot,
  NEVER_AUTO_PUBLISHES_NOTE,
  neverAutoPublishes,
  publishSlots,
} from '../schedule.ts';

type MemberRow = {
  user_id: string;
  role: 'moderator' | 'contributor';
  joined_at: string;
  email_subscribed: boolean;
};

const localTime = (timestamp: string): string => {
  const z = Temporal.Instant.from(timestamp).toZonedDateTimeISO(Temporal.Now.timeZoneId());
  return `${z.toPlainDate()} ${String(z.hour).padStart(2, '0')}:${String(z.minute).padStart(2, '0')}`;
};

const nextEdition = (group: GroupRow): string => {
  try {
    const slots = publishSlots(group);
    return `${formatSlot(slots.next)}, in ${formatMinutes(slots.minutesToNext)}`;
  } catch (err) {
    return `unknown — ${err instanceof Error ? err.message : err}`;
  }
};

const table = (headers: string[], rows: string[][]): void => {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => [...r[i]].length)));
  const line = (cells: string[]) =>
    '  ' + cells.map((c, i) => c + ' '.repeat(widths[i] - [...c].length)).join('  ').trimEnd();
  console.log(line(headers));
  for (const row of rows) console.log(line(row));
};

const listGroups = async (db: Db): Promise<void> => {
  const [groups, members, drafts] = await Promise.all([
    db.from('groups').select('*').order('created_at'),
    db.from('group_members').select('group_id'),
    db.from('posts').select('group_id').is('edition_id', null),
  ]);
  for (const r of [groups, members, drafts]) if (r.error) throw r.error;

  const count = (rows: { group_id: string }[] | null, id: string) =>
    String((rows ?? []).filter((r) => r.group_id === id).length);

  const rows = ((groups.data ?? []) as GroupRow[]).map((g) => [
    g.name,
    g.id,
    g.invite_code,
    count(members.data, g.id),
    count(drafts.data, g.id),
    describeSchedule(g) + (neverAutoPublishes(g.publish_time) ? ' (NEVER AUTO-PUBLISHES)' : ''),
  ]);
  console.log(`${rows.length} Group${rows.length === 1 ? '' : 's'}:\n`);
  table(['NAME', 'ID', 'INVITE', 'MEMBERS', 'WAITING', 'PUBLISHES'], rows);
  console.log('\nWAITING = posts not yet compiled. Details: list --group <id or invite code>');
};

const listGroup = async (db: Db, group: GroupRow): Promise<void> => {
  const [membersRes, lastEdition, editionCount, drafts] = await Promise.all([
    db
      .from('group_members')
      .select('user_id, role, joined_at, email_subscribed')
      .eq('group_id', group.id)
      .order('joined_at'),
    db
      .from('editions')
      .select('edition_number, published_at')
      .eq('group_id', group.id)
      .order('edition_number', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from('editions').select('id', { count: 'exact', head: true }).eq('group_id', group.id),
    fetchUncompiledPosts(db, group.id),
  ]);
  if (membersRes.error) throw membersRes.error;
  if (lastEdition.error) throw lastEdition.error;
  if (editionCount.error) throw editionCount.error;

  const members = (membersRes.data ?? []) as MemberRow[];
  const ids = members.map((m) => m.user_id);
  const [usersRes, tokensRes] = await Promise.all([
    db.from('users').select('id, display_name, email').in('id', ids),
    db.from('push_tokens').select('user_id').in('user_id', ids),
  ]);
  if (usersRes.error) throw usersRes.error;
  if (tokensRes.error) throw tokensRes.error;

  const users = new Map(
    ((usersRes.data ?? []) as Pick<UserRow, 'id' | 'display_name' | 'email'>[]).map((u) => [u.id, u]),
  );
  const installed = new Set(((tokensRes.data ?? []) as { user_id: string }[]).map((t) => t.user_id));
  const nameOf = (id: string) => users.get(id)?.display_name ?? `<no profile ${id}>`;

  field('Group', `${group.name} (${group.id})`);
  field('Invite', group.invite_code);
  field('Schedule', describeSchedule(group));
  field('Next', nextEdition(group));
  if (neverAutoPublishes(group.publish_time)) field('WARNING', NEVER_AUTO_PUBLISHES_NOTE);
  const last = lastEdition.data as { edition_number: number; published_at: string } | null;
  field(
    'Editions',
    last
      ? `${editionCount.count ?? '?'} so far · last was #${last.edition_number}, ${localTime(last.published_at)}`
      : 'none yet',
  );

  console.log(`\nMembers (${members.length}):`);
  table(
    ['NAME', 'EMAIL', 'ROLE', 'JOINED', 'EMAILS', 'APP', 'THIS EDITION'],
    members.map((m) => {
      const mine = drafts.filter((p) => p.author_id === m.user_id).length;
      return [
        nameOf(m.user_id),
        users.get(m.user_id)?.email ?? '?',
        m.role,
        localTime(m.joined_at).slice(0, 10),
        m.email_subscribed ? 'on' : 'off',
        installed.has(m.user_id) ? 'yes' : '-',
        mine === 0 ? '-' : mine === 1 ? 'posted' : `${mine} POSTS`,
      ];
    }),
  );
  console.log('  APP = has a push token (installed, notifications allowed).');

  const byAge = [...drafts].reverse() as PostRow[];
  console.log(`\nWaiting for the next edition (${byAge.length} post${byAge.length === 1 ? '' : 's'}):`);
  for (const p of byAge) {
    console.log(`  - ${nameOf(p.author_id)}: ${p.title ? show(p.title) : '(no headline)'}`);
    console.log(`      ${preview(p.body)}`);
    console.log(
      `      ${[...p.body].length} chars · photo ${p.image_url ? show(p.image_url) : 'none'} · ` +
        `written ${localTime(p.created_at)} · updated ${localTime(p.updated_at)} · id ${p.id}`,
    );
  }
  console.log(`\nTimes are ${Temporal.Now.timeZoneId()}.`);
};

export const list = async (args: string[]): Promise<void> => {
  const flags = parseFlags(args, { group: 'string' });
  const groupInput = flags.optional('group');

  const { db, projectRef } = connect();
  console.log(`group-zero list · project ${projectRef} · read-only\n`);

  if (groupInput === undefined) {
    await listGroups(db);
  } else {
    await listGroup(db, await resolveGroup(db, groupInput));
  }
};
