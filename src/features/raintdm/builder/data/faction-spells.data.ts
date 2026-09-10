import type { BackgroundFaction } from "@/shared/types";
import type { ExpandedSpellFilter } from "../utils/subclass-spells.utils";

/** Faction spell lists from Amellwind's Guide (Patreon chapter 1). */
const FACTION_SPELLS: Record<
  Exclude<BackgroundFaction, "handlers-guild">,
  Record<number, string[]>
> = {
  "hunters-guild": {
    0: ["Produce Flame", "Resistance"],
    1: ["Detect Poison and Disease", "Longstrider"],
    2: ["Enhance Ability", "Gust of Wind"],
    3: ["Fear", "Plant Growth"],
    4: ["Elemental Bane", "Guardian of Nature"],
    5: ["Awaken", "Skill Empowerment"],
  },
  "helix-commission": {
    0: ["Druidcraft", "Message"],
    1: ["Disguise Self", "Heroism"],
    2: ["Alter Self", "Enhance Ability"],
    3: ["Nondetection", "Water Breathing"],
    4: ["Divination", "Dominate Beast"],
    5: ["Passwall", "Tree Stride"],
  },
  "royal-scrivener": {
    0: ["Guidance", "Mending"],
    1: ["Purify Food and Drink", "Heroism"],
    2: ["Animal Messenger", "Enhance Ability"],
    3: ["Speak with Dead", "Water Walk"],
    4: ["Freedom of Movement", "Fabricate"],
    5: ["Commune with Nature", "Modify Memory"],
  },
  "talon-society": {
    0: ["Mage Hand", "Minor Illusion"],
    1: ["Detect Magic", "Longstrider"],
    2: ["Pass without Trace", "Locate Object"],
    3: ["Nondetection", "Speak with Dead"],
    4: ["Divination", "Arcane Eye"],
    5: ["Mislead", "Modify Memory"],
  },
  wycademy: {
    0: ["Druidcraft", "Light"],
    1: ["Comprehend Languages", "Expeditious Retreat"],
    2: ["Alter Self", "Locate Animals or Plants"],
    3: ["Water Breathing", "Tongues"],
    4: ["Control Water", "Leomund's Secret Chest"],
    5: ["Commune with Nature", "Legend Lore"],
  },
};

export interface FactionOption {
  id: BackgroundFaction;
  name: string;
  description: string;
  /** Whether spell grants are defined in data (others coming in future book updates). */
  hasSpellGrants: boolean;
}

export const FACTION_OPTIONS: FactionOption[] = [
  {
    id: "helix-commission",
    name: "Helix Commission",
    description:
      "Secret research body focused on hybridization and experimental resources.",
    hasSpellGrants: true,
  },
  {
    id: "hunters-guild",
    name: "Hunter's Guild",
    description:
      "Central governing body of hunters. Grants extra spells to spellcasters.",
    hasSpellGrants: true,
  },
  {
    id: "royal-scrivener",
    name: "Royal Paleontology Scriveners",
    description:
      "Royal scholars who archive monster lore and field research.",
    hasSpellGrants: true,
  },
  {
    id: "talon-society",
    name: "Talon Society",
    description:
      "Poachers and infiltrators who traffic in rare monsters and secrets.",
    hasSpellGrants: true,
  },
  {
    id: "wycademy",
    name: "Wycademy",
    description:
      "Research institution studying monsters, resources, and the Old World.",
    hasSpellGrants: true,
  },
];

function resolveSpellMap(
  faction: BackgroundFaction,
): Record<number, string[]> | null {
  if (faction === "handlers-guild") {
    return FACTION_SPELLS["hunters-guild"];
  }
  return FACTION_SPELLS[faction] ?? null;
}

export function resolveFactionExpandedSpellFilters(
  faction: BackgroundFaction | null,
): ExpandedSpellFilter[] {
  if (!faction) return [];
  const spells = resolveSpellMap(faction);
  if (!spells) return [];

  const filters: ExpandedSpellFilter[] = [];
  for (const [levelStr, names] of Object.entries(spells)) {
    const level = Number(levelStr);
    for (const name of names) {
      filters.push({
        spellLevels: [level],
        classNames: [],
        sources: [],
        explicitSpellName: name,
      });
    }
  }
  return filters;
}

export function getFactionOption(
  faction: BackgroundFaction,
): FactionOption | undefined {
  if (faction === "handlers-guild") {
    return FACTION_OPTIONS.find((f) => f.id === "hunters-guild");
  }
  return FACTION_OPTIONS.find((f) => f.id === faction);
}
