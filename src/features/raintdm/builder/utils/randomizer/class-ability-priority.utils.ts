import type { AbilityKey, Class, Subclass } from "@/shared/types";
import { ABILITY_KEYS, ABILITY_NAME_TO_KEY } from "@/shared/constants/dnd";
import { toRpgbotClassSlug } from "@/features/raintdm/builder/data/rpgbot-ratings.utils";

/** Maps a class spellcasting label (e.g. "Charisma") or raw key to an ability key. */
export function parseSpellcastingAbilityKey(
  spellcastingAbility?: string | null,
): AbilityKey | null {
  if (!spellcastingAbility) return null;
  const normalized = spellcastingAbility.trim().toLowerCase();
  return ABILITY_NAME_TO_KEY[normalized] ?? null;
}

/**
 * Canonical build priorities per PHB class.
 * Combat/casting identity first — save order in 5etools data (e.g. Monk STR before DEX)
 * does not reflect actual build needs.
 */
const CLASS_BUILD_ABILITY_PRIORITY: Readonly<
  Record<string, readonly AbilityKey[]>
> = {
  artificer: ["int", "con", "dex"],
  barbarian: ["str", "con", "dex"],
  bard: ["cha", "con", "dex"],
  cleric: ["wis", "con", "cha"],
  druid: ["wis", "con", "dex"],
  fighter: ["str", "con", "dex"],
  monk: ["dex", "wis", "con"],
  paladin: ["str", "cha", "con"],
  ranger: ["dex", "wis", "con"],
  rogue: ["dex", "int", "cha"],
  sorcerer: ["cha", "con", "dex"],
  warlock: ["cha", "con", "dex"],
  wizard: ["int", "con", "dex"],
};

function appendFallbackClassPriorities(
  classData: Class,
  subclass: Subclass | null | undefined,
  add: (key: AbilityKey | null | undefined) => void,
): void {
  const subclassSpellKey = parseSpellcastingAbilityKey(subclass?.spellcastingAbility);
  const classSpellKey = parseSpellcastingAbilityKey(classData.spellcastingAbility);
  const isSubclassCaster =
    subclass?.casterProgression && subclass.casterProgression !== "none";

  const primaryCastingKey =
    isSubclassCaster && subclassSpellKey ? subclassSpellKey : classSpellKey;

  add(primaryCastingKey);
  if (primaryCastingKey) {
    add("con");
  }
}

/**
 * Ability assignment priority for the randomizer.
 * Uses per-class build priorities when known; otherwise falls back to
 * casting stat → CON → saving throws → remaining abilities.
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

  const classSlug = toRpgbotClassSlug(classData.name);
  const buildPriority = classSlug
    ? CLASS_BUILD_ABILITY_PRIORITY[classSlug]
    : undefined;

  if (buildPriority) {
    for (const key of buildPriority) add(key);
  } else {
    appendFallbackClassPriorities(classData, subclass, add);
  }

  for (const key of classData.saveProficiencies) {
    add(key);
  }

  for (const key of ABILITY_KEYS) {
    add(key);
  }

  return priority;
}

/** Pick the best ability from a choosable list using class priority order. */
export function pickPreferredAbility(
  options: AbilityKey[],
  abilityPriority: AbilityKey[],
): AbilityKey | null {
  if (options.length === 0) return null;
  if (options.length === 1) return options[0] ?? null;

  for (const preferred of abilityPriority) {
    if (options.includes(preferred)) return preferred;
  }

  return options[0] ?? null;
}
