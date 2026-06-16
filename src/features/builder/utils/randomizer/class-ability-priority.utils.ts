import type { AbilityKey, Class, Subclass } from "@/shared/types";
import { ABILITY_KEYS } from "../ability-scores";

const ABILITY_NAME_TO_KEY: Record<string, AbilityKey> = {
  strength: "str",
  dexterity: "dex",
  constitution: "con",
  intelligence: "int",
  wisdom: "wis",
  charisma: "cha",
  str: "str",
  dex: "dex",
  con: "con",
  int: "int",
  wis: "wis",
  cha: "cha",
};

/** Maps a class spellcasting label (e.g. "Charisma") or raw key to an ability key. */
export function parseSpellcastingAbilityKey(
  spellcastingAbility?: string | null,
): AbilityKey | null {
  if (!spellcastingAbility) return null;
  const normalized = spellcastingAbility.trim().toLowerCase();
  return ABILITY_NAME_TO_KEY[normalized] ?? null;
}

/**
 * Ability assignment priority for the randomizer.
 * Primary casting stat first, then saving throws, then the rest.
 */
export function resolveClassAbilityPriority(
  classData: Class,
  subclass?: Subclass | null,
): AbilityKey[] {
  const priority: AbilityKey[] = [];
  const seen = new Set<AbilityKey>();

  const add = (key: AbilityKey | null | undefined) => {
    if (!key || seen.has(key)) return;
    seen.add(key);
    priority.push(key);
  };

  const subclassSpellKey = parseSpellcastingAbilityKey(subclass?.spellcastingAbility);
  const classSpellKey = parseSpellcastingAbilityKey(classData.spellcastingAbility);
  const isSubclassCaster =
    subclass?.casterProgression && subclass.casterProgression !== "none";

  if (isSubclassCaster && subclassSpellKey) {
    add(subclassSpellKey);
  } else {
    add(classSpellKey);
  }

  for (const key of classData.saveProficiencies) {
    add(key);
  }

  for (const key of ABILITY_KEYS) {
    add(key);
  }

  return priority;
}
