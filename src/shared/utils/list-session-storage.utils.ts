/**
 * localStorage helpers for list filter state. Shared across tabs and persisted
 * across browser restarts so users find their filters as they left them.
 */

const STORAGE_PREFIX = "list-filters:";

export type ListSessionStoredValue = string | string[];
export type ListSessionStoredState = Record<string, ListSessionStoredValue>;

export function listSessionStorageKey(listId: string): string {
  return `${STORAGE_PREFIX}${listId}`;
}

export function readListSessionState(
  listId: string,
): ListSessionStoredState | null {
  try {
    const raw = localStorage.getItem(listSessionStorageKey(listId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as ListSessionStoredState;
  } catch {
    return null;
  }
}

export function writeListSessionState(
  listId: string,
  state: ListSessionStoredState,
): void {
  try {
    localStorage.setItem(
      listSessionStorageKey(listId),
      JSON.stringify(state),
    );
  } catch {
    /* localStorage unavailable or quota exceeded */
  }
}

export function isListSessionStateEmpty(
  state: ListSessionStoredState,
  stringKeys: readonly string[],
  multiKeys: readonly string[],
): boolean {
  for (const key of stringKeys) {
    const value = state[key];
    if (typeof value === "string" && value.trim()) return false;
  }
  for (const key of multiKeys) {
    const value = state[key];
    if (Array.isArray(value) && value.length > 0) return false;
  }
  return true;
}

export function emptyListSessionState(
  stringKeys: readonly string[],
  multiKeys: readonly string[],
): ListSessionStoredState {
  const state: ListSessionStoredState = {};
  for (const key of stringKeys) state[key] = "";
  for (const key of multiKeys) state[key] = [];
  return state;
}

export function normalizeListSessionState(
  raw: ListSessionStoredState | null,
  stringKeys: readonly string[],
  multiKeys: readonly string[],
): ListSessionStoredState {
  const state = emptyListSessionState(stringKeys, multiKeys);
  if (!raw) return state;
  for (const key of stringKeys) {
    const value = raw[key];
    if (typeof value === "string") state[key] = value;
  }
  for (const key of multiKeys) {
    const value = raw[key];
    if (Array.isArray(value)) {
      state[key] = value.filter((item): item is string => typeof item === "string");
    }
  }
  return state;
}

export function parseListFiltersFromSearchParams(
  params: URLSearchParams,
  stringKeys: readonly string[],
  multiKeys: readonly string[],
): ListSessionStoredState {
  const state = emptyListSessionState(stringKeys, multiKeys);
  for (const key of stringKeys) {
    state[key] = params.get(key) ?? "";
  }
  for (const key of multiKeys) {
    state[key] = params.getAll(key).filter(Boolean);
  }
  return state;
}
