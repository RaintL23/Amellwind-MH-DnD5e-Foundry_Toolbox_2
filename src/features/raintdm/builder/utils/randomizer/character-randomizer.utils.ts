import type { RpgbotRatingLookupEntry } from "@/features/raintdm/builder/data/rpgbot-ratings.types";

/** Yield to React state updates between randomizer steps. */
export function delay(ms = 50): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

export type RpgbotRatingGetter<T> = (
  item: T,
) => Pick<RpgbotRatingLookupEntry, "score"> | null | undefined;

/**
 * Prefer RPGBOT Good/Excellent (score >= minScore).
 * Falls back to Acceptable, then any candidate, then null.
 */
export function pickByRpgbot<T>(
  items: T[],
  getRating: RpgbotRatingGetter<T>,
  minScore = 3,
): T | null {
  if (items.length === 0) return null;

  const rated = items
    .map((item) => ({ item, rating: getRating(item) }))
    .filter((entry) => entry.rating != null);

  const preferred = rated.filter((entry) => (entry.rating?.score ?? 0) >= minScore);
  if (preferred.length > 0) {
    return pickRandom(preferred.map((entry) => entry.item));
  }

  const acceptable = rated.filter((entry) => (entry.rating?.score ?? 0) >= 2);
  if (acceptable.length > 0) {
    return pickRandom(acceptable.map((entry) => entry.item));
  }

  if (rated.length > 0) {
    return pickRandom(rated.map((entry) => entry.item));
  }

  return pickRandom(items);
}

/** Pick up to `count` unique items, preferring RPGBOT ratings. */
export function pickMultipleByRpgbot<T>(
  items: T[],
  count: number,
  getRating: RpgbotRatingGetter<T>,
  exclude: Set<T> = new Set(),
): T[] {
  const pool = shuffle(items.filter((item) => !exclude.has(item)));
  const picked: T[] = [];

  while (picked.length < count && pool.length > 0) {
    const remaining = pool.filter((item) => !picked.includes(item));
    const choice = pickByRpgbot(remaining, getRating);
    if (!choice) break;
    picked.push(choice);
  }

  return picked;
}

/** Weighted random pick; non-positive weights never win. */
export function pickWeighted<T>(
  items: readonly T[],
  weightOf: (item: T) => number,
): T | null {
  const weighted = items
    .map((item) => ({ item, weight: Math.max(0, weightOf(item)) }))
    .filter((entry) => entry.weight > 0);
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return pickRandom([...items]);

  let roll = Math.random() * total;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll < 0) return entry.item;
  }
  return weighted[weighted.length - 1]?.item ?? null;
}
