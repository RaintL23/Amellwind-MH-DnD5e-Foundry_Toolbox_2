/**
 * Randomizer variety memory (per browser session).
 * - Class: shuffled bag — every class comes out once before any repeats.
 * - Other categories: remember the last pick so the next run avoids it.
 * Storage failures (private mode, blocked site data) fall back to memory.
 */
import { shuffle } from "./character-randomizer.utils";

const STORAGE_KEY = "raintdm-builder-randomizer-variety-v1";

interface VarietyState {
  bags: Record<string, string[]>;
  last: Record<string, string>;
}

export type VarietyStorage = Pick<Storage, "getItem" | "setItem">;

let memoryState: VarietyState = { bags: {}, last: {} };

function defaultStorage(): VarietyStorage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function readState(storage: VarietyStorage | null): VarietyState {
  if (!storage) return memoryState;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return memoryState;
    const parsed = JSON.parse(raw) as Partial<VarietyState>;
    return {
      bags: parsed.bags && typeof parsed.bags === "object" ? parsed.bags : {},
      last: parsed.last && typeof parsed.last === "object" ? parsed.last : {},
    };
  } catch {
    return memoryState;
  }
}

function writeState(storage: VarietyStorage | null, state: VarietyState): void {
  memoryState = state;
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Memory fallback already updated.
  }
}

/**
 * Next key from the shuffled bag for `category`. Keys no longer in `keys`
 * are dropped; an empty bag is refilled so the first new key differs from
 * the last one drawn.
 */
export function drawFromBag(
  category: string,
  keys: readonly string[],
  storage: VarietyStorage | null = defaultStorage(),
): string | null {
  const unique = [...new Set(keys)];
  if (unique.length === 0) return null;

  const state = readState(storage);
  const available = new Set(unique);
  let bag = (state.bags[category] ?? []).filter((key) => available.has(key));

  if (bag.length === 0) {
    bag = shuffle(unique);
    const last = state.last[category];
    if (bag.length > 1 && bag[0] === last) {
      [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1]!, bag[0]!];
    }
  }

  const [next, ...rest] = bag;
  writeState(storage, {
    bags: { ...state.bags, [category]: rest },
    last: next ? { ...state.last, [category]: next } : state.last,
  });
  return next ?? null;
}

export function getLastPick(
  category: string,
  storage: VarietyStorage | null = defaultStorage(),
): string | null {
  return readState(storage).last[category] ?? null;
}

export function rememberPick(
  category: string,
  key: string | null | undefined,
  storage: VarietyStorage | null = defaultStorage(),
): void {
  if (!key) return;
  const state = readState(storage);
  writeState(storage, { ...state, last: { ...state.last, [category]: key } });
}

/** Drops the item matching `lastKey` when other candidates remain. */
export function excludeLastPick<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  lastKey: string | null,
): T[] {
  if (!lastKey || items.length < 2) return [...items];
  const rest = items.filter((item) => keyOf(item) !== lastKey);
  return rest.length > 0 ? rest : [...items];
}

/** Test helper: forget the in-memory fallback state. */
export function resetVarietyMemory(): void {
  memoryState = { bags: {}, last: {} };
}
