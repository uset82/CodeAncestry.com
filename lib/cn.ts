type ClassValue = string | number | null | undefined | false | ClassValue[];

/** Minimal class joiner. Deliberately dependency-free — Tailwind v4 plus a
 *  disciplined component API makes full class-merging unnecessary here. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }

  return out.join(' ');
}
