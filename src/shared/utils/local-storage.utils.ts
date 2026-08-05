/**
 * Small localStorage helpers with silent failure handling (private mode, quota
 * exceeded, SSR). Prefer these over inline `localStorage` access so persistence
 * behaves consistently across features.
 */

/** Reads and JSON-parses a value, returning `fallback` on any failure. */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** JSON-serializes and writes a value, swallowing storage errors. */
export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* localStorage unavailable or quota exceeded */
  }
}

/** Removes a key, swallowing storage errors. */
export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* localStorage unavailable */
  }
}
