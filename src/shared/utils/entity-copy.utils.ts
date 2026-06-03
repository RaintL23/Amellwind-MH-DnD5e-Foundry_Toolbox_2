export interface CopyRef {
  name?: string;
  source?: string;
  abbreviation?: string;
  _preserve?: Record<string, boolean>;
  _mod?: Record<string, unknown[] | unknown>;
  [key: string]: unknown;
}

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

function getEntryName(entry: unknown): string | undefined {
  if (typeof entry === "object" && entry !== null && "name" in entry) {
    return String((entry as { name: unknown }).name);
  }
  return undefined;
}

type ArrayMod = {
  mode?: string;
  replace?: string | { index?: number; name?: string };
  items?: unknown;
  index?: number;
  names?: string | string[];
};

function normalizeModList(modList: unknown): unknown[] {
  if (modList == null) return [];
  return Array.isArray(modList) ? modList : [modList];
}

function resolveReplaceIndex(
  arr: unknown[],
  replace: ArrayMod["replace"],
): number {
  if (replace == null) return -1;
  if (typeof replace === "string") {
    return arr.findIndex((e) => getEntryName(e) === replace);
  }
  if (typeof replace.index === "number") return replace.index;
  if (replace.name) {
    return arr.findIndex((e) => getEntryName(e) === replace.name);
  }
  return -1;
}

function applyArrayMod(baseArr: unknown[], mod: ArrayMod): unknown[] {
  const arr = [...baseArr];
  const mode = mod.mode ?? "replaceArr";

  if (mode === "replaceArr" && mod.replace != null && mod.items !== undefined) {
    const idx = resolveReplaceIndex(arr, mod.replace);
    if (idx >= 0) {
      const replacement = Array.isArray(mod.items) ? mod.items : [mod.items];
      arr.splice(idx, 1, ...replacement);
    }
    return arr;
  }

  if (mode === "appendArr" && mod.items !== undefined) {
    const toAppend = Array.isArray(mod.items) ? mod.items : [mod.items];
    return [...arr, ...toAppend];
  }

  if (mode === "insertArr" && mod.items !== undefined) {
    const toInsert = Array.isArray(mod.items) ? mod.items : [mod.items];
    if (mod.index === undefined || mod.index === -1) {
      return [...arr, ...toInsert];
    }
    const idx = mod.index < 0 ? Math.max(0, arr.length + mod.index + 1) : mod.index;
    const result = [...arr];
    result.splice(idx, 0, ...toInsert);
    return result;
  }

  if (mode === "removeArr" && mod.names) {
    const names = Array.isArray(mod.names) ? mod.names : [mod.names];
    return arr.filter((e) => !names.includes(getEntryName(e) ?? ""));
  }

  if (mode === "replaceArr" && typeof mod.index === "number" && mod.items !== undefined) {
    const replacement = Array.isArray(mod.items) ? mod.items : [mod.items];
    arr.splice(mod.index, 1, ...replacement);
    return arr;
  }

  return arr;
}

function applyCopyMods(
  merged: Record<string, unknown>,
  mods: Record<string, unknown[] | unknown>,
): void {
  for (const [key, modList] of Object.entries(mods)) {
    const baseArr = merged[key];
    if (!Array.isArray(baseArr)) continue;
    let result = baseArr as unknown[];
    for (const mod of normalizeModList(modList)) {
      if (typeof mod === "object" && mod !== null) {
        result = applyArrayMod(result, mod as ArrayMod);
      }
    }
    merged[key] = result;
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
      if (copyRef._mod) {
        applyCopyMods(merged as Record<string, unknown>, copyRef._mod);
      }
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

export function resolveByNameSource<T extends { name: string; source: string }>(
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

export function resolveByAbbreviationSource<
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
