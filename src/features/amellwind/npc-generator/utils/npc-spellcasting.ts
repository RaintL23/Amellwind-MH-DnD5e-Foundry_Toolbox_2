import type { AbilityScores } from "@/shared/types";
import type { SpellcastingBlock } from "@/shared/types/bestiary-creature.types";
import type { SpellcastingSpellLine } from "@/shared/types/statblock-content.types";
import type { NpcTemplate } from "@/shared/types/npc.types";
import type { NpcPowerProfile } from "./npc-power-scaling";
import { getAbilityModifier, formatModifier } from "@/shared/utils/cr.utils";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { ABILITY_NAMES as CANONICAL_ABILITY_NAMES } from "@/shared/constants/dnd";
import {
  NPC_SPELLCASTING_BY_TEMPLATE,
  type NpcSpellcastingDefinition,
} from "../data/npc-spellcasting.data";

const ABILITY_NAMES: Record<string, string> = CANONICAL_ABILITY_NAMES;

const ORDINALS: Record<number, string> = {
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
  5: "5th",
  6: "6th",
  7: "7th",
  8: "8th",
  9: "9th",
};

function parseSpellRef(spell: string): string {
  return parseFiveToolsMarkup(spell);
}

function buildDailyLines(
  daily: Record<string, string[]>,
): SpellcastingSpellLine[] {
  return Object.entries(daily)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([key, spells]) => {
      let label: string;
      if (key === "will") {
        label = "At will";
      } else if (key.endsWith("e")) {
        label = `${key.slice(0, -1)}/day each`;
      } else {
        label = `${key}/day`;
      }
      return { label, spells: spells.map(parseSpellRef) };
    })
    .filter((l) => l.spells.length > 0);
}

function buildLeveledLines(
  spells: Record<number, { slots?: number; spells: string[] }>,
): SpellcastingSpellLine[] {
  return Object.keys(spells)
    .map(Number)
    .sort((a, b) => a - b)
    .map((level) => {
      const block = spells[level];
      if (level === 0) {
        return { label: "Cantrips (at will)", spells: block.spells.map(parseSpellRef) };
      }
      const slots = block.slots != null ? ` (${block.slots} slot${block.slots !== 1 ? "s" : ""})` : "";
      return {
        label: `${ORDINALS[level] ?? `${level}th`} level${slots}`,
        spells: block.spells.map(parseSpellRef),
      };
    })
    .filter((l) => l.spells.length > 0);
}

/**
 * Build a structured SpellcastingBlock for a caster NPC template.
 * Returns an empty array when the template has no spellcasting definition.
 */
export function buildNpcSpellcasting(
  template: NpcTemplate,
  abilities: AbilityScores,
  pb: number,
  _profile: NpcPowerProfile,
  subjectRef: string,
): SpellcastingBlock[] {
  const def: NpcSpellcastingDefinition | undefined =
    NPC_SPELLCASTING_BY_TEMPLATE[template.id];

  if (!def) return [];

  const abilityMod = getAbilityModifier(abilities[def.ability]);
  const dc = 8 + pb + abilityMod;
  const hitBonus = formatModifier(pb + abilityMod);
  const abilityName = ABILITY_NAMES[def.ability] ?? def.ability;

  const headerText =
    `${subjectRef.charAt(0).toUpperCase() + subjectRef.slice(1)} casts one of the ` +
    `following spells, requiring no Material components and using ${abilityName} as ` +
    `the spellcasting ability (spell save DC ${dc}, ${hitBonus} to hit with spell attacks):`;

  const spellLines: SpellcastingSpellLine[] = [];

  if (def.will && def.will.length > 0) {
    spellLines.push({ label: "At will", spells: def.will.map(parseSpellRef) });
  }

  if (def.daily) {
    spellLines.push(...buildDailyLines(def.daily));
  }

  if (def.spells) {
    spellLines.push(...buildLeveledLines(def.spells));
  }

  return [
    {
      name: "Spellcasting",
      displayAs: def.displayAs,
      header: [{ type: "paragraph", text: headerText }],
      spellLines,
      footer: [],
    },
  ];
}
