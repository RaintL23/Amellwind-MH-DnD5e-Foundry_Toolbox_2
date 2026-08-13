import type { Class, Spell, Subclass } from "@/shared/types";

const MELEE_CANTTRIP_NAME_MARKERS = [
  "booming blade",
  "green-flame blade",
  "green flame blade",
];

const MELEE_CANTTRIP_TEXT_MARKERS = [
  "make a melee attack with a weapon",
  "melee weapon attack against",
  "weapon attack as part of casting this spell",
];

const MARTIAL_MELEE_CANTTRIP_CLASSES = new Set([
  "artificer",
  "barbarian",
  "fighter",
  "monk",
  "paladin",
  "ranger",
]);

const MELEE_CANTTRIP_SUBCLASS_MARKERS = [
  "eldritch knight",
  "arcane trickster",
  "hexblade",
  "college of swords",
  "college of valor",
];

/** Cantrips that require (or strongly assume) a melee weapon attack. */
export function isMeleeWeaponCantrip(spell: Spell): boolean {
  if (spell.level !== 0) return false;

  const name = spell.name.toLowerCase();
  if (MELEE_CANTTRIP_NAME_MARKERS.some((marker) => name.includes(marker))) {
    return true;
  }

  const text = [...spell.description, spell.summary]
    .join(" ")
    .toLowerCase();
  return MELEE_CANTTRIP_TEXT_MARKERS.some((marker) => text.includes(marker));
}

export function classPrefersMeleeCantrips(
  classData: Class,
  subclass: Subclass | null,
): boolean {
  if (MARTIAL_MELEE_CANTTRIP_CLASSES.has(classData.name.toLowerCase())) {
    return true;
  }

  const subclassLabel = [
    subclass?.shortName,
    subclass?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return MELEE_CANTTRIP_SUBCLASS_MARKERS.some((marker) =>
    subclassLabel.includes(marker),
  );
}

/** Remove melee-weapon cantrips for casters that do not fight in melee. */
export function filterSpellsForClassFit(
  spells: Spell[],
  classData: Class,
  subclass: Subclass | null,
): Spell[] {
  if (classPrefersMeleeCantrips(classData, subclass)) return spells;
  return spells.filter((spell) => !isMeleeWeaponCantrip(spell));
}
