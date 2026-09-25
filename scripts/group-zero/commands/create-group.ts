// create-group --name <n> --moderator <email> [--moderator-name <n>]
//              [--description <d>] [--publish-day <0-6|weekday>] [--publish-time HH:MM]
//              [--timezone <IANA>] [--apply]
//
// The same insert app/group/create.tsx makes (via createGroup in lib/groups.ts),
// with the same defaults: Sunday 09:00, the creator's timezone, the invite code
// left to the database default. on_group_created then makes created_by the
// moderator. No cover photo — add one from the app.
//
// Refuses a publish time of 23:40 or later: compile_due_editions can never
// match such a slot (see neverAutoPublishes in schedule.ts). The app's picker
// still offers 11:45 PM until the SQL fix lands.

import type { GroupRow } from '../../../types/database.ts';
import { parseFlags, Refusal, UsageError } from '../args.ts';
import { connect } from '../client.ts';
import { fetchProfile, findAuthUserByEmail, validateDisplayName, validateEmail } from '../lookup.ts';
import { createAccountStep, ensureProfileStep } from '../people.ts';
import { banner, executePlan, field, show, type Step } from '../plan.ts';
import {
  COMPILE_TOLERANCE_MINUTES,
  describeSchedule,
  formatSlot,
  neverAutoPublishes,
  publishSlots,
} from '../schedule.ts';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const parseDay = (raw: string): number => {
  const value = raw.trim().toLowerCase();
  if (/^[0-6]$/.test(value)) return Number(value);
  const index = DAYS.findIndex((d) => value.length >= 3 && d.startsWith(value));
  if (index === -1) throw new UsageError(`--publish-day "${raw}" should be 0–6 (0 = Sunday) or a weekday name`);
  return index;
};

/** "9:30" → "09:30:00", the shape formatPublishTime in create.tsx writes. */
const parseTime = (raw: string): string => {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  const h = match ? Number(match[1]) : NaN;
  const m = match ? Number(match[2]) : NaN;
  if (!(h >= 0 && h <= 23 && m >= 0 && m <= 59)) throw new UsageError(`--publish-time "${raw}" should be HH:MM, 24-hour`);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
};

const parseTimezone = (raw: string): string => {
  try {
    return Temporal.Now.zonedDateTimeISO(raw.trim()).timeZoneId;
  } catch {
    throw new UsageError(`--timezone "${raw}" is not an IANA zone (e.g. America/Chicago)`);
  }
};

export const createGroup = async (args: string[]): Promise<void> => {
  const flags = parseFlags(args, {
    name: 'string',
    moderator: 'string',
    'moderator-name': 'string',
    description: 'string',
    'publish-day': 'string',
    'publish-time': 'string',
    timezone: 'string',
    apply: 'boolean',
  });
  const name = flags.required('name').trim();
  const moderatorEmail = validateEmail(flags.required('moderator', 'their email'));
  const moderatorName = flags.optional('moderator-name');
  const description = flags.optional('description')?.trim() || null;
  const publishDay = parseDay(flags.optional('publish-day') ?? '0');
  const publishTime = parseTime(flags.optional('publish-time') ?? '09:00');
  if (neverAutoPublishes(publishTime)) {
    throw new Refusal(
      `--publish-time ${publishTime.slice(0, 5)} would never publish on its own. compile_due_editions ` +
        `matches [publish_time, publish_time + ${COMPILE_TOLERANCE_MINUTES} min), and that window wraps ` +
        `past midnight for any time from 23:${60 - COMPILE_TOLERANCE_MINUTES} on. Pick 23:${59 - COMPILE_TOLERANCE_MINUTES} or earlier.`,
    );
  }
  const tzArg = flags.optional('timezone');
  const timezone = parseTimezone(tzArg ?? Temporal.Now.timeZoneId());
  const apply = flags.bool('apply');

  const { db, projectRef } = connect();
  banner('create-group', projectRef, apply);

  const steps: Step[] = [];
  let moderatorId: string | null = null;
  const existing = await findAuthUserByEmail(db, moderatorEmail);

  if (!existing) {
    if (moderatorName === undefined) {
      throw new UsageError(`no account exists for ${moderatorEmail}, so --moderator-name is required`);
    }
    field('Moderator', `${moderatorEmail} — no account yet`);
    steps.push(createAccountStep(db, moderatorEmail, validateDisplayName(moderatorName), (id) => (moderatorId = id)));
  } else {
    moderatorId = existing.id;
    const profile = await fetchProfile(db, existing.id);
    field('Moderator', `${moderatorEmail} — existing account ${existing.id}`);
    if (profile) field('', `byline ${show(profile.display_name)}`);
    else steps.push(ensureProfileStep(db, existing));

    const { data: theirs, error } = await db.from('groups').select('id, name').eq('created_by', existing.id);
    if (error) throw error;
    const same = ((theirs ?? []) as { id: string; name: string }[]).filter(
      (g) => g.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (same.length > 0) {
      field('WARNING', `they already created a Group named ${show(name)}: ${same.map((g) => g.id).join(', ')}`);
    }
  }

  const schedule = { publish_day: publishDay, publish_time: publishTime, timezone };
  steps.push({
    title: 'Insert public.groups',
    lines: [
      `name           ${show(name)}`,
      `description    ${show(description)}`,
      `publish_day    ${publishDay} — ${describeSchedule(schedule)}`,
      `publish_time   ${publishTime}`,
      `timezone       ${timezone}${tzArg === undefined ? " — this machine's zone (the app uses the creator's phone zone)" : ''}`,
      `created_by     ${moderatorId ?? '<the new user id from step 1>'}`,
      'invite_code    database default (12 hex characters)',
      `then           on_group_created adds created_by as moderator; first edition ${formatSlot(publishSlots(schedule).next)}`,
    ],
    run: async () => {
      if (!moderatorId) throw new Error('no moderator id');
      const { data, error } = await db
        .from('groups')
        .insert({ name, description, ...schedule, created_by: moderatorId })
        .select('*')
        .single();
      if (error) throw error;
      const group = data as GroupRow;

      const { data: member, error: memberError } = await db
        .from('group_members')
        .select('role')
        .eq('group_id', group.id)
        .eq('user_id', moderatorId)
        .single();
      if (memberError) throw memberError;
      return [
        `group id     ${group.id}`,
        `invite code  ${group.invite_code}  (app link: catchupcolumn://group/join?code=${group.invite_code})`,
        `${moderatorEmail} is ${member.role}`,
      ];
    },
  });

  const wrote = await executePlan(steps, apply);
  if (wrote) {
    console.log(`\nNext: add-member --group <the invite code above> for each person, then post-for.`);
  }
};
