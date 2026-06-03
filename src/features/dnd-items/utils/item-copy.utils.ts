import type { CopyRef } from "./item-raw.types";

function copyFast<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function applyPreserve(
  merged: Record<string, unknown>,
  overrides: Record<string, unknown>,
  preserve?: Record<string, boolean>,
): void {
  if (!preserve) return;
  for (const key of Object.keys(preserve)) {
    if (preserve[key] && overrides[key] !== undefined) {
      merged[key] = overrides[key];
    }
  }
}

/**
 * Resolve 5etools `_copy` stubs by merging parent entities (iterates until stable).
 */
export function resolveEntityCopies<T extends Record<string, unknown>>(
  entities: T[],
  keyFn: (entity: T) => string,
  resolveRef: (entity: T, ref: CopyRef) => T | undefined,
): T[] {
  const index = new Map<string, T>();
  for (const ent of entities) {
    index.set(keyFn(ent), ent);
  }

  let result = entities.map((ent) => copyFast(ent));
  let changed = true;
  let passes = 0;
  const maxPasses = 20;

  while (changed && passes < maxPasses) {
    changed = false;
    passes += 1;
    result = result.map((ent) => {
      const copyRef = ent._copy as CopyRef | undefined;
      if (!copyRef) return ent;

      const base = resolveRef(ent, copyRef);
      if (!base) return ent;

      const { _copy: _ignored, ...overrides } = ent;
      const merged = { ...copyFast(base), ...overrides } as T;
      applyPreserve(
        merged as Record<string, unknown>,
        overrides as Record<string, unknown>,
        copyRef._preserve,
      );
      delete (merged as Record<string, unknown>)._copy;
      changed = true;
      return merged;
    });
    index.clear();
    for (const ent of result) {
      index.set(keyFn(ent), ent);
    }
  }

  return result;
}

export function resolveItemsByNameSource<T extends { name: string; source: string }>(
  entities: T[],
): T[] {
  const index = new Map<string, T>();
  for (const ent of entities) {
    index.set(`${ent.name}|${ent.source}`.toLowerCase(), ent);
  }
  return resolveEntityCopies(entities as T[] & Record<string, unknown>[], (e) =>
    `${e.name}|${e.source}`.toLowerCase(),
  (_entity, ref) => {
    if (!ref.name || !ref.source) return undefined;
    return index.get(`${ref.name}|${ref.source}`.toLowerCase());
  }) as T[];
}

export function resolveItemTypesByAbbreviation<
  T extends { abbreviation: string; source: string },
>(entities: T[]): T[] {
  const index = new Map<string, T>();
  for (const ent of entities) {
    index.set(`${ent.abbreviation}|${ent.source}`.toLowerCase(), ent);
  }
  return resolveEntityCopies(entities as T[] & Record<string, unknown>[], (e) =>
    `${e.abbreviation}|${e.source}`.toLowerCase(),
  (_entity, ref) => {
    if (!ref.abbreviation || !ref.source) return undefined;
    return index.get(`${ref.abbreviation}|${ref.source}`.toLowerCase());
  }) as T[];
}
