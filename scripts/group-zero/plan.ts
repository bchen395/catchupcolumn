// Every write goes through a Plan: the dry run prints the same steps that
// --apply executes, so "what it said it would do" and "what it did" can't
// drift apart.

import { describeError } from './client.ts';

export type Step = {
  title: string;
  /** The exact values this step writes. Placeholders are in <angle brackets>. */
  lines: string[];
  /** Runs only under --apply. Returns lines describing what actually happened. */
  run: () => Promise<string[] | void>;
};

export const banner = (command: string, projectRef: string, apply: boolean): void => {
  console.log(`group-zero ${command} · project ${projectRef}`);
  console.log(
    apply
      ? 'APPLY — changes below are being written to this project.'
      : 'DRY RUN — reads only. Nothing is written without --apply.',
  );
  console.log('');
};

export const field = (label: string, value: string): void => {
  console.log(`${label.padEnd(10)}${value}`);
};

export const executePlan = async (steps: Step[], apply: boolean): Promise<boolean> => {
  if (steps.length === 0) {
    console.log('\nNothing to change.');
    return false;
  }

  console.log(`\n${apply ? 'Writing' : 'Would write'} ${steps.length} change${steps.length === 1 ? '' : 's'}:`);
  steps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step.title}`);
    for (const line of step.lines) console.log(`       ${line}`);
  });

  if (!apply) {
    console.log('\nDRY RUN — nothing was written. Re-run the same command with --apply to write it.');
    return false;
  }

  console.log('');
  for (let i = 0; i < steps.length; i++) {
    try {
      const result = await steps[i].run();
      console.log(`  done ${i + 1}/${steps.length}: ${steps[i].title}`);
      for (const line of result ?? []) console.log(`       ${line}`);
    } catch (err) {
      console.error(`  FAILED ${i + 1}/${steps.length}: ${steps[i].title}`);
      console.error(`       ${describeError(err)}`);
      console.error(
        i === 0
          ? '  Nothing was written.'
          : `  Step${i === 1 ? '' : 's'} 1${i === 1 ? '' : `–${i}`} already landed and ${i === 1 ? 'is' : 'are'} not rolled back.`,
      );
      throw new PlanFailed();
    }
  }
  return true;
};

/** Thrown after executePlan has already reported the failure. */
export class PlanFailed extends Error {
  constructor() {
    super('plan failed');
  }
}

/** A JSON-quoted value, or null — so blank vs. missing is visible in the plan. */
export const show = (value: string | null | undefined): string =>
  value === null || value === undefined ? 'null' : JSON.stringify(value);

/** Indented full text block for bodies. */
export const block = (text: string): string[] => text.split('\n').map((l) => `  | ${l}`);
