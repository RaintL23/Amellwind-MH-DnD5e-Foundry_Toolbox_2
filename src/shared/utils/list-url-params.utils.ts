export function appendAll(
  params: URLSearchParams,
  key: string,
  values: string[],
): void {
  for (const value of values) {
    if (value) params.append(key, value);
  }
}

export function setIfPresent(
  params: URLSearchParams,
  key: string,
  value: string,
): void {
  if (value) params.set(key, value);
}

export function setIntIfNotDefault(
  params: URLSearchParams,
  key: string,
  value: number,
  defaultValue: number,
): void {
  if (value !== defaultValue) params.set(key, String(value));
}

export function preserveParams(
  next: URLSearchParams,
  prev: URLSearchParams,
  keys: string[],
): void {
  for (const key of keys) {
    for (const value of prev.getAll(key)) {
      next.append(key, value);
    }
  }
}

export function parsePositiveInt(
  raw: string | null,
  fallback: number,
): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
