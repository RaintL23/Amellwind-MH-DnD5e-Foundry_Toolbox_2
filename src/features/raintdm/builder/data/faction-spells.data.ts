import type { BackgroundFaction } from "@/shared/types";
import type { ExpandedSpellFilter } from "../utils/subclass-spells.utils";

/** Faction spell lists from Amellwind's Guide (Hunter's Guild table). */
const HUNTERS_GUILD_SPELLS: Record<number, string[]> = {
  0: ["Produce Flame", "Resistance"],
  1: ["Detect Poison and Disease", "Longstrider"],
  2: ["Enhance Ability", "Gust of Wind"],
  3: ["Fear", "Plant Growth"],
  4: ["Elemental Bane", "Guardian of Nature"],
  5: ["Awaken", "Skill Empowerment"],
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
    id: "hunters-guild",
    name: "Hunter's Guild",
    description:
      "Central governing body of hunters. Grants extra spells to spellcasters.",
    hasSpellGrants: true,
  },
  {
    id: "handlers-guild",
    name: "Handlers",
    description:
      "Caretakers and liaisons for hunting parties. Spell list coming in a future book update.",
    hasSpellGrants: false,
  },
  {
    id: "wycademy",
    name: "Wycademy",
    description:
      "Research institution studying monsters and the world. Spell list coming in a future book update.",
    hasSpellGrants: false,
  },
];

export function resolveFactionExpandedSpellFilters(
  faction: BackgroundFaction | null,
): ExpandedSpellFilter[] {
  if (!faction || faction !== "hunters-guild") return [];

  const filters: ExpandedSpellFilter[] = [];
  for (const [levelStr, names] of Object.entries(HUNTERS_GUILD_SPELLS)) {
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
  return FACTION_OPTIONS.find((f) => f.id === faction);
}
