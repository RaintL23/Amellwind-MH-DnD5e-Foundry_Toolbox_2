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

export function resolveSpellLevelsFromText(
  text: string,
  lookup: SpellLevelLookup | null | undefined,
): number[] {
  if (!lookup || lookup.size === 0) return [];

  const levels: number[] = [];
  for (const name of extractSpellNamesFromEffectText(text)) {
    const level = lookup.get(normalizeSpellLookupKey(name));
    if (typeof level === "number") levels.push(level);
  }
  return levels;
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
