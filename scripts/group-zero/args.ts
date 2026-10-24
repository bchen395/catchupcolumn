// Strict flag parsing for the Group Zero operator script.
//
// Deliberately stricter than a general-purpose parser: an unknown or
// misspelled flag is an error, never ignored. `--titel "Moving day"` silently
// dropping the headline is exactly the kind of quiet wrong result this script
// exists to prevent.

/** Bad invocation — the command line itself is wrong. Exit code 2. */
export class UsageError extends Error {}

/** A safety rule said no. Nothing was written. Exit code 1. */
export class Refusal extends Error {}

/**
 * 'string' and 'boolean' flags may be given once. 'strings' may repeat, and
 * keeps every value in command-line order (`--photo a.jpg --photo b.jpg`).
 */
export type FlagSpec = Record<string, 'string' | 'strings' | 'boolean'>;

export class Flags {
  constructor(private readonly values: Map<string, string | string[] | true>) {}

  /** A string flag, or undefined when absent. `--title ""` returns "". */
  optional(name: string): string | undefined {
    const value = this.values.get(name);
    return typeof value === 'string' ? value : undefined;
  }

  /** Every value of a repeatable flag, in order; [] when absent. */
  all(name: string): string[] {
    const value = this.values.get(name);
    return Array.isArray(value) ? value : [];
  }

  required(name: string, hint?: string): string {
    const value = this.optional(name);
    if (value === undefined || value.trim() === '') {
      throw new UsageError(`--${name} is required${hint ? ` (${hint})` : ''}`);
    }
    return value;
  }

  bool(name: string): boolean {
    return this.values.get(name) === true;
  }
}

export const parseFlags = (args: string[], spec: FlagSpec): Flags => {
  const values = new Map<string, string | string[] | true>();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('--')) {
      throw new UsageError(
        `unexpected argument "${arg}" — every value needs its --flag (quote text with spaces)`,
      );
    }

    const eq = arg.indexOf('=');
    const name = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
    const kind = Object.hasOwn(spec, name) ? spec[name] : undefined;
    if (!kind) {
      const known = Object.keys(spec).map((k) => `--${k}`).join(', ');
      throw new UsageError(`unknown flag --${name} (this command takes: ${known})`);
    }
    if (values.has(name) && kind !== 'strings') {
      throw new UsageError(`--${name} was given twice`);
    }

    if (kind === 'boolean') {
      if (eq !== -1) throw new UsageError(`--${name} takes no value`);
      values.set(name, true);
      continue;
    }

    let value: string | undefined;
    if (eq !== -1) {
      value = arg.slice(eq + 1);
    } else {
      value = args[i + 1];
      i++;
      // `--body --title x` would otherwise post the literal text "--title".
      if (value !== undefined && value.startsWith('--') && Object.hasOwn(spec, value.slice(2).split('=')[0])) {
        throw new UsageError(`--${name} needs a value`);
      }
    }
    if (value === undefined) throw new UsageError(`--${name} needs a value`);
    if (kind === 'strings') {
      const earlier = values.get(name);
      values.set(name, [...(Array.isArray(earlier) ? earlier : []), value]);
    } else {
      values.set(name, value);
    }
  }

  return new Flags(values);
};
