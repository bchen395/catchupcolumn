// Group Zero operator script — see README.md next to this file.
//
//   deno run --allow-env --allow-net=<project>.supabase.co --allow-read \
//     scripts/group-zero/group-zero.ts <command> [flags]
//
// Dry run by default; nothing is written without --apply.

import { Refusal, UsageError } from './args.ts';
import { describeError } from './client.ts';
import { addMember } from './commands/add-member.ts';
import { createGroup } from './commands/create-group.ts';
import { list } from './commands/list.ts';
import { postFor } from './commands/post-for.ts';
import { PlanFailed } from './plan.ts';

const USAGE = `Group Zero operator script — write for members who haven't installed yet.

Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the shell environment.
Every command is a dry run until you add --apply. --group takes a Group id or invite code.

  list [--group G]
      Every Group; or one Group's members and the posts waiting for its next edition.

  add-member --group G --email E --name "Display Name" [--apply]
      Create a confirmed, passwordless account (byline = --name) if none exists,
      and add it to the Group as a contributor. Safe to re-run.

  post-for --group G --email E [--body TEXT|@file|@-] [--title T]
           [--photo path.jpg | --remove-photo] [--apply]
      Write this member's post for the next edition, under their name. Updates
      their existing draft if they have one. Refuses within 30 minutes of the
      Group's publish slot, and for anyone who isn't a member.

  create-group --name N --moderator E [--moderator-name "Name"] [--description D]
               [--publish-day 0-6|sunday] [--publish-time HH:MM] [--timezone Area/City] [--apply]
      Create a Group with the app's defaults (Sunday 09:00), moderated by E.
`;

const COMMANDS: Record<string, (args: string[]) => Promise<void>> = {
  list,
  'add-member': addMember,
  'post-for': postFor,
  'create-group': createGroup,
};

const main = async (argv: string[]): Promise<number> => {
  const [command, ...rest] = argv;
  if (!command || ['help', '--help', '-h'].includes(command) || rest.includes('--help')) {
    console.log(USAGE);
    return 0;
  }
  const run = Object.hasOwn(COMMANDS, command) ? COMMANDS[command] : undefined;
  if (!run) throw new UsageError(`unknown command "${command}"`);

  try {
    await run(rest);
    return 0;
  } catch (err) {
    if (err instanceof UsageError) {
      console.error(`\nerror: ${err.message}\nRun with --help for usage.`);
      return 2;
    }
    if (err instanceof Refusal) {
      console.error(`\nREFUSED: ${err.message}\nNothing was written.`);
      return 1;
    }
    if (err instanceof PlanFailed) return 1; // already reported, with what landed
    console.error(`\nfailed: ${describeError(err)}`);
    return 1;
  }
};

if (import.meta.main) {
  Deno.exit(await main(Deno.args).catch((err) => {
    console.error(`error: ${err instanceof Error ? err.message : err}\nRun with --help for usage.`);
    return 2;
  }));
}
