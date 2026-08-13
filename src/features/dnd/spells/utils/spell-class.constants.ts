/**
 * Clases con lista de hechizos en D&D 5e (lista estándar + variantes EK/AT).
 * Usado para el filtro de la tabla; excluye martial sin magia (Barbarian, Monk, etc.).
 */
export const SPELL_LIST_FILTER_CLASSES = [
  "Artificer",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
] as const;

export type SpellListFilterClass = (typeof SPELL_LIST_FILTER_CLASSES)[number];

const FILTER_SET = new Set<string>(SPELL_LIST_FILTER_CLASSES);

export function isSpellListFilterClass(name: string): name is SpellListFilterClass {
  return FILTER_SET.has(name);
}
