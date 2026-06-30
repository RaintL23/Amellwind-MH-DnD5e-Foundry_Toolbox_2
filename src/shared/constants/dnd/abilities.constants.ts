import type { AbilityKey } from "@/shared/types";

/**
 * The six D&D 5e ability scores in canonical sheet order.
 *
 * Single source of truth for ability ordering across the app. Other modules
 * should import this instead of hard-coding `["str", "dex", ...]`.
 */
export const ABILITY_KEYS: AbilityKey[] = [
  "str",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
];

/** Alias for callers that think in terms of display order. */
export const ABILITY_ORDER: AbilityKey[] = ABILITY_KEYS;

/** Full ability names, e.g. `str` → `"Strength"`. */
export const ABILITY_NAMES: Record<AbilityKey, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

/** Upper-case three-letter abbreviations, e.g. `str` → `"STR"`. */
export const ABILITY_ABBREVIATIONS: Record<AbilityKey, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

/** Title-case short labels, e.g. `str` → `"Str"`. */
export const ABILITY_SHORT_LABELS: Record<AbilityKey, string> = {
  str: "Str",
  dex: "Dex",
  con: "Con",
  int: "Int",
  wis: "Wis",
  cha: "Cha",
};

/**
 * Maps full ability names and their abbreviations (any casing) to an ability
 * key. Useful when parsing external data (5etools, class spellcasting labels…).
 */
export const ABILITY_NAME_TO_KEY: Record<string, AbilityKey> = {
  strength: "str",
  str: "str",
  dexterity: "dex",
  dex: "dex",
  constitution: "con",
  con: "con",
  intelligence: "int",
  int: "int",
  wisdom: "wis",
  wis: "wis",
  charisma: "cha",
  cha: "cha",
};

/** Normalises an ability name/abbreviation to its key, or `null` if unknown. */
export function toAbilityKey(name: string | null | undefined): AbilityKey | null {
  if (!name) return null;
  return ABILITY_NAME_TO_KEY[name.trim().toLowerCase()] ?? null;
}
