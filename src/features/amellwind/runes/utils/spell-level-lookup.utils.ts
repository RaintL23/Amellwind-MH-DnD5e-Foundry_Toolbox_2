import type { Spell } from "@/shared/types";

/** Normalized spell name → spell level (0 = cantrip). */
export type SpellLevelLookup = ReadonlyMap<string, number>;

export type SpellLevelSource = Pick<Spell, "name" | "level">;

export function normalizeSpellLookupKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Builds a name→level map from the spell catalog (first wins for duplicates). */
export function buildSpellLevelLookup(
  spells: SpellLevelSource[],
): SpellLevelLookup {
  const map = new Map<string, number>();
  for (const spell of spells) {
    const key = normalizeSpellLookupKey(spell.name);
    if (!key || map.has(key)) continue;
    map.set(key, spell.level);
  }
  return map;
}

/** Extracts `{@spell Name}` / `{@spell Name|SOURCE}` display names from effect text. */
export function extractSpellNamesFromEffectText(text: string): string[] {
  const names: string[] = [];
  for (const match of text.matchAll(/\{@spell\s+([^}|]+)(?:\|[^}]*)?\}/gi)) {
    const name = match[1]?.trim();
    if (name) names.push(name);
  }
  return names;
}

/**
 * True when `name` at `index` in lowercased `haystack` is a whole phrase
 * (not a substring of a longer word).
 */
function isWholePhraseMatch(
  haystack: string,
  index: number,
  name: string,
): boolean {
  const before = index === 0 ? " " : haystack[index - 1] ?? " ";
  const after =
    index + name.length >= haystack.length
      ? " "
      : (haystack[index + name.length] ?? " ");
  return !/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after);
}

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * MHMM runes often write "cast the Earth Tremor spell" or "know the ice knife
 * spell" without `{@spell}`. Match catalog names (longest first) near cast /
 * know / cantrip wording.
 */
export function findCatalogSpellLevelsInPlainText(
  text: string,
  lookup: SpellLevelLookup,
): number[] {
  if (lookup.size === 0) return [];

  const lower = text.toLowerCase().replace(/\s+/g, " ");
  if (
    !/\bcast(?:s|ing)?\b|\bknow(?:s|ing)?\b|\bcantrip\b|\bbenefits of the\b|\beffects of the\b|\bacts as the\b/.test(
      lower,
    )
  ) {
    return [];
  }

  const names = [...lookup.keys()].sort((a, b) => b.length - a.length);
  const levels: number[] = [];
  const claimed: Array<[number, number]> = [];

  for (const name of names) {
    if (name.length < 3) continue;
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(name, from);
      if (idx === -1) break;
      from = idx + 1;

      if (!isWholePhraseMatch(lower, idx, name)) continue;
      if (claimed.some(([s, e]) => rangesOverlap(idx, idx + name.length, s, e))) {
        continue;
      }

      // Require cast/know/cantrip language near the name
      // (MHMM: "cast the X spell", "know the X spell").
      const windowStart = Math.max(0, idx - 48);
      const before = lower.slice(windowStart, idx);
      const after = lower.slice(idx + name.length, idx + name.length + 16);
      const nearCast = /\bcast(?:s|ing)?\b/.test(before);
      const nearKnow = /\bknow(?:s|ing)?\b/.test(before);
      const nearCantrip =
        /\bcantrip\b/.test(before) || /^\s+cantrip\b/.test(after);
      const nearReplication =
        /\bbenefits of the\b/.test(before) ||
        /\beffects of the\b/.test(before) ||
        /\bacts as the\b/.test(before);
      if (!nearCast && !nearKnow && !nearCantrip && !nearReplication) continue;

      const level = lookup.get(name);
      if (typeof level !== "number") continue;
      levels.push(level);
      claimed.push([idx, idx + name.length]);
    }
  }

  return levels;
}

/**
 * Highest "at Nth level" / "Nth-level version" mentioned for an upcast grant.
 * Used so "cast catapult at 2nd level" rates as level 2 even if base is 1st.
 */
export function parseCastAtSpellLevel(text: string): number | null {
  let max: number | null = null;
  for (const match of text.matchAll(
    /\bat\s+(\d+)(?:st|nd|rd|th)[-\s]?level\b|\b(\d+)(?:st|nd|rd|th)[-\s]?level\s+version\b/gi,
  )) {
    const n = parseInt(match[1] ?? match[2] ?? "", 10);
    if (n < 1 || n > 9) continue;
    max = Math.max(max ?? 0, n);
  }
  return max;
}

export function resolveSpellLevelsFromText(
  text: string,
  lookup: SpellLevelLookup | null | undefined,
): number[] {
  const fromMarkup = extractSpellNamesFromEffectText(text)
    .map((name) => lookup?.get(normalizeSpellLookupKey(name)))
    .filter((level): level is number => typeof level === "number");

  // Strip `{@spell …}` so plain-text matching does not double-count the same grant.
  const withoutMarkup = text.replace(/\{@spell\s+[^}]+\}/gi, " ");
  const fromPlain =
    lookup && lookup.size > 0
      ? findCatalogSpellLevelsInPlainText(withoutMarkup, lookup)
      : [];

  const levels = [...fromMarkup, ...fromPlain];
  if (levels.length === 0) return [];

  const castAt = parseCastAtSpellLevel(text);
  if (castAt == null) return levels;

  // Upcast wording raises the effective level used for tags / rarity.
  return levels.map((level) => Math.max(level, castAt));
}

/**
 * Tags from looked-up spell levels:
 * - 0 → mechanic:cantrip
 * - 1–9 → mechanic:spell:lvlN
 */
export function spellTagsFromLevels(levels: number[]): string[] {
  if (levels.length === 0) return [];

  const tags = new Set<string>();
  for (const level of levels) {
    if (level <= 0) {
      tags.add("mechanic:cantrip");
      continue;
    }
    const capped = Math.min(9, Math.max(1, Math.floor(level)));
    tags.add(`mechanic:spell:lvl${capped}`);
  }
  return [...tags];
}
