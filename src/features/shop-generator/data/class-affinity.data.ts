export interface ClassAffinityProfile {
  id: string;
  label: string;
  preferredTypes: string[];
  keywords: string[];
}

/**
 * Heuristic class affinities — D&D items rarely carry class tags, so we match
 * type labels and name/search keywords (including attunement text).
 */
export const CLASS_AFFINITIES: ClassAffinityProfile[] = [
  {
    id: "barbarian",
    label: "Barbarian",
    preferredTypes: ["Weapon", "Armor", "Wondrous Item"],
    keywords: ["rage", "strength", "greataxe", "totem", "brutal", "unarmed"],
  },
  {
    id: "bard",
    label: "Bard",
    preferredTypes: ["Instrument", "Wondrous Item", "Scroll", "Wand"],
    keywords: ["instrument", "charm", "song", "lute", "voice", "inspiration"],
  },
  {
    id: "cleric",
    label: "Cleric",
    preferredTypes: ["Holy Symbol", "Potion", "Scroll", "Armor", "Wondrous Item"],
    keywords: ["holy", "heal", "bless", "divine", "cleric", "undead", "radiant"],
  },
  {
    id: "druid",
    label: "Druid",
    preferredTypes: ["Wondrous Item", "Staff", "Potion", "Scroll"],
    keywords: ["nature", "beast", "plant", "wild", "druid", "elemental", "grove"],
  },
  {
    id: "fighter",
    label: "Fighter",
    preferredTypes: ["Weapon", "Armor", "Shield", "Wondrous Item"],
    keywords: ["weapon", "armor", "shield", "sword", "martial", "fighting"],
  },
  {
    id: "monk",
    label: "Monk",
    preferredTypes: ["Weapon", "Wondrous Item"],
    keywords: ["unarmed", "monk", "ki", "wraps", "staff", "dexterity", "mobility"],
  },
  {
    id: "paladin",
    label: "Paladin",
    preferredTypes: ["Weapon", "Armor", "Holy Symbol", "Potion", "Wondrous Item"],
    keywords: ["holy", "smite", "oath", "paladin", "radiant", "undead", "shield"],
  },
  {
    id: "ranger",
    label: "Ranger",
    preferredTypes: ["Weapon", "Armor", "Ammunition", "Wondrous Item", "Potion"],
    keywords: ["bow", "arrow", "ranger", "tracking", "nature", "hunter", "ammo"],
  },
  {
    id: "rogue",
    label: "Rogue",
    preferredTypes: ["Weapon", "Poison", "Wondrous Item", "Tool"],
    keywords: [
      "stealth",
      "invisibility",
      "poison",
      "thieves",
      "dagger",
      "sneak",
      "lock",
    ],
  },
  {
    id: "sorcerer",
    label: "Sorcerer",
    preferredTypes: ["Wand", "Staff", "Ring", "Wondrous Item", "Scroll"],
    keywords: ["spell", "arcane", "bloodline", "sorcer", "wand", "charisma"],
  },
  {
    id: "warlock",
    label: "Warlock",
    preferredTypes: ["Rod", "Wand", "Pact", "Wondrous Item", "Scroll"],
    keywords: ["pact", "warlock", "eldritch", "patron", "hex", "rod", "tome"],
  },
  {
    id: "wizard",
    label: "Wizard",
    preferredTypes: ["Scroll", "Wand", "Staff", "Ring", "Wondrous Item", "Rod"],
    keywords: [
      "scroll",
      "spellbook",
      "wizard",
      "arcane",
      "robe",
      "wand",
      "staff",
      "intelligence",
    ],
  },
];

export function getClassAffinity(id: string): ClassAffinityProfile | undefined {
  return CLASS_AFFINITIES.find((c) => c.id === id);
}
