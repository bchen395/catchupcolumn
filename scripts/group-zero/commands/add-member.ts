// add-member --group <id|invite code> --email <e> --name <display name> [--apply]
//
// Creates the person's account if it doesn't exist (confirmed, passwordless,
// byline set) and makes them a contributor. Idempotent: re-running it changes
// nothing once they're in.

import { parseFlags, UsageError } from '../args.ts';
import { connect } from '../client.ts';
import {
  fetchMembership,
  fetchProfile,
  findAuthUserByEmail,
  resolveGroup,
  validateDisplayName,
  validateEmail,
} from '../lookup.ts';
import { addContributorStep, createAccountStep, ensureProfileStep, groupSummary } from '../people.ts';
import { banner, executePlan, field, type Step } from '../plan.ts';

export const addMember = async (args: string[]): Promise<void> => {
  const flags = parseFlags(args, { group: 'string', email: 'string', name: 'string', apply: 'boolean' });
  const groupInput = flags.required('group', 'a Group id or invite code');
  const email = validateEmail(flags.required('email'));
  const nameArg = flags.optional('name');
  const apply = flags.bool('apply');

  const { db, projectRef } = connect();
  banner('add-member', projectRef, apply);

  const group = await resolveGroup(db, groupInput);
  field('Group', groupSummary(group));

  const steps: Step[] = [];
  const existing = await findAuthUserByEmail(db, email);
  let userId: string | null = existing?.id ?? null;

  if (!existing) {
    if (nameArg === undefined) {
      throw new UsageError(`no account exists for ${email}, so --name is required (it becomes their byline)`);
    }
    const name = validateDisplayName(nameArg);
    field('Person', `${email} — no account yet`);
    steps.push(createAccountStep(db, email, name, (id) => (userId = id)));
    steps.push(addContributorStep(db, group, () => userId));
  } else {
    const profile = await fetchProfile(db, existing.id);
    field('Person', `${email} — existing account ${existing.id}`);
    if (profile) {
      field('', `byline ${JSON.stringify(profile.display_name)}`);
      if (nameArg !== undefined && nameArg.trim() !== profile.display_name) {
        field('', 'note: --name ignored — add-member never renames an existing account');
      }
      // A sign-up that failed part-way leaves exactly this (on_auth_user_created
      // falls back to the email's local part), and every story would print under it.
      if (profile.display_name.toLowerCase() === email.split('@')[0]) {
        field(
          'WARNING',
          'that byline is the email-address fallback, not a name. They can change it in the ' +
            "app's Profile screen once they sign in; until then their stories print under it.",
        );
      }
    } else {
      steps.push(ensureProfileStep(db, existing));
    }

    const membership = await fetchMembership(db, group.id, existing.id);
    if (membership) {
      field('', `already in this Group as ${membership.role} (since ${membership.joined_at})`);
    } else {
      steps.push(addContributorStep(db, group, () => userId));
    }
  }

  const wrote = await executePlan(steps, apply);
  if (wrote) {
    console.log(
      `\nDone. ${email} can sign in on the app's sign-in screen with a 6-digit code — no password. ` +
        'Until they do, write for them with post-for.',
    );
  }
};
