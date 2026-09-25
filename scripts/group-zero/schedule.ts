// A Group's publish slots, evaluated the way the database evaluates them.
//
// `compile_due_editions` (20260525000000_manual_publish.sql) compiles a Group
// when, in the Group's own IANA `timezone`, the weekday is `publish_day`
// (0 = Sunday) and the wall-clock time is in [publish_time, publish_time +
// tolerance). The cron runs every 15 minutes and the compile-editions function
// passes a 20-minute tolerance, so a post written just after the slot may land
// in this edition or next week's depending on which tick fires first.
//
// Temporal gives the exact instants, DST included, rather than the day-level
// approximation `nextPublishForGroup` in lib/groups.ts settles for on screen.

import type { GroupRow } from '../../types/database.ts';
import { Refusal } from './args.ts';

/** post-for refuses this close to a publish slot, on either side of it. */
export const PUBLISH_GUARD_MINUTES = 30;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type Schedule = Pick<GroupRow, 'publish_day' | 'publish_time' | 'timezone'>;

export type PublishSlots = {
  previous: Temporal.ZonedDateTime;
  next: Temporal.ZonedDateTime;
  minutesSincePrevious: number;
  minutesToNext: number;
};

const slotOn = (date: Temporal.PlainDate, time: Temporal.PlainTime, timezone: string) =>
  // 'compatible' = the earlier instant on a fall-back repeat, which is when
  // compile_due_editions actually fires: it matches on local wall-clock time,
  // so the first pass through the repeated hour compiles and its duplicate
  // guard skips the second. (Postgres's own `timestamp at time zone` would pick
  // the later instant.) In a spring-forward gap the slot is shifted forward
  // here; compile never fires for it at all, so the guard is merely cautious.
  date.toPlainDateTime(time).toZonedDateTime(timezone, { disambiguation: 'compatible' });

/** Throws Refusal when the Group's schedule can't be evaluated. */
export const publishSlots = (
  group: Schedule,
  now: Temporal.Instant = Temporal.Now.instant(),
): PublishSlots => {
  let local: Temporal.ZonedDateTime;
  try {
    local = now.toZonedDateTimeISO(group.timezone);
  } catch {
    throw new Refusal(
      `this Group's timezone "${group.timezone}" is not a valid IANA zone. compile_due_editions ` +
        'skips such Groups entirely, so it would never publish — fix groups.timezone first.',
    );
  }

  let time: Temporal.PlainTime;
  try {
    time = Temporal.PlainTime.from(group.publish_time);
  } catch {
    throw new Refusal(`this Group's publish_time "${group.publish_time}" can't be parsed`);
  }

  // Temporal numbers weekdays Monday = 1 … Sunday = 7; publish_day is Sunday = 0.
  const today = local.dayOfWeek % 7;
  const daysAhead = (group.publish_day - today + 7) % 7;
  const candidateDate = local.toPlainDate().add({ days: daysAhead });

  let next = slotOn(candidateDate, time, group.timezone);
  if (Temporal.Instant.compare(next.toInstant(), now) <= 0) {
    next = slotOn(candidateDate.add({ days: 7 }), time, group.timezone);
  }
  const previous = slotOn(next.toPlainDate().subtract({ days: 7 }), time, group.timezone);

  return {
    previous,
    next,
    minutesSincePrevious: now.since(previous.toInstant()).total('minutes'),
    minutesToNext: next.toInstant().since(now).total('minutes'),
  };
};

/**
 * Refuse to write a post inside the ±30-minute band around a publish slot:
 * before it, the post might miss the compile it was meant for; just after it,
 * it might land in either edition, and the edition email may be going out.
 */
export const assertOutsidePublishWindow = (
  group: Schedule,
  now: Temporal.Instant = Temporal.Now.instant(),
): PublishSlots => {
  const slots = publishSlots(group, now);
  if (slots.minutesToNext < PUBLISH_GUARD_MINUTES) {
    throw new Refusal(
      `this Group publishes in ${formatMinutes(slots.minutesToNext)}, at ${formatSlot(slots.next)}. ` +
        `post-for refuses within ${PUBLISH_GUARD_MINUTES} minutes of a publish slot — ` +
        `try again after ${formatSlot(slots.next.add({ minutes: PUBLISH_GUARD_MINUTES }))}.`,
    );
  }
  if (slots.minutesSincePrevious < PUBLISH_GUARD_MINUTES) {
    throw new Refusal(
      `this Group's edition was due ${formatMinutes(slots.minutesSincePrevious)} ago, at ` +
        `${formatSlot(slots.previous)}, and may still be compiling or sending. ` +
        `Try again after ${formatSlot(slots.previous.add({ minutes: PUBLISH_GUARD_MINUTES }))}.`,
    );
  }
  return slots;
};

/** "Sundays at 09:00 America/New_York" */
export const describeSchedule = (group: Schedule): string =>
  `${DAY_NAMES[group.publish_day] ?? `day ${group.publish_day}`}s at ` +
  `${group.publish_time.slice(0, 5)} ${group.timezone}`;

/** "Sun 2026-09-27 09:00 America/New_York (15:00 your time)" */
export const formatSlot = (slot: Temporal.ZonedDateTime): string => {
  const day = DAY_NAMES[slot.dayOfWeek % 7].slice(0, 3);
  const hhmm = (z: Temporal.ZonedDateTime) =>
    `${String(z.hour).padStart(2, '0')}:${String(z.minute).padStart(2, '0')}`;
  const mine = slot.withTimeZone(Temporal.Now.timeZoneId());
  const yours =
    mine.timeZoneId === slot.timeZoneId
      ? ''
      : ` (${mine.toPlainDate().equals(slot.toPlainDate()) ? '' : `${mine.toPlainDate()} `}` +
        `${hhmm(mine)} your time)`;
  return `${day} ${slot.toPlainDate()} ${hhmm(slot)} ${slot.timeZoneId}${yours}`;
};

/** 4114.2 → "2d 20h 34m" */
export const formatMinutes = (minutes: number): string => {
  const total = Math.max(0, Math.floor(minutes));
  const d = Math.floor(total / 1440);
  const h = Math.floor((total % 1440) / 60);
  const m = total % 60;
  return [d && `${d}d`, (d || h) && `${h}h`, `${m}m`].filter(Boolean).join(' ');
};
