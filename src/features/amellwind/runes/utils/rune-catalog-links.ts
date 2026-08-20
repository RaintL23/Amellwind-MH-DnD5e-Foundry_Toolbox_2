import type { RichTextPhraseLink } from "@/shared/utils/dnd-rich-text.utils";
import { WEAPON_PROFICIENCIES } from "@/features/amellwind/weapons/data/weapon-proficiencies.data";
import { buildToolboxQueryPath } from "@/shared/utils/toolbox-entity-links";

const DND_CLASS_NAMES = [
  "Artificer",
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
] as const;

/** Untagged class / hunter-weapon names in rune prose (e.g. "Monk only"). */
export const RUNE_CATALOG_PHRASE_LINKS: RichTextPhraseLink[] = [
  ...DND_CLASS_NAMES.map((name) => ({
    id: `class:${name}`,
    phrase: name,
    href: `/classes/${encodeURIComponent(name)}`,
  })),
  ...Object.keys(WEAPON_PROFICIENCIES).map((name) => ({
    id: `weapon:${name}`,
    phrase: name,
    href: buildToolboxQueryPath("/weapons", "weapon", name),
  })),
];
