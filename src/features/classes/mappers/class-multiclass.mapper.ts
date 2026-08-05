import type { AbilityKey } from "@/shared/types";
import { ABILITY_NAMES } from "@/shared/constants/dnd";
import { parseNamedProficiencyBlocks } from "@/shared/utils/named-proficiency.parser";
import { parseSkillProficiencyBlocks } from "@/shared/utils/skill-proficiency.parser";
import type { RawMulticlassing } from "../utils/class-raw.types";
import { formatAbility } from "@/features/classes/mappers/class-table.mapper";
import { mapStartingProficiencies } from "@/features/classes/mappers/class-proficiency.mapper";

const ABILITY_LABELS: Record<string, string> = ABILITY_NAMES;

export function mapMulticlassing(raw?: RawMulticlassing): string[] {
  if (!raw) return [];
  const lines: string[] = [];

  if (raw.requirements) {
    const reqs = Object.entries(raw.requirements)
      .map(([ab, val]) => `${formatAbility(ab)} ${val}`)
      .join(", ");
    lines.push(`Requirements: ${reqs}`);
  }

  const gained = mapStartingProficiencies(raw.proficienciesGained);
  if (gained.length) {
    const summary = gained
      .map((group) => `${group.label}: ${group.items.join(", ")}`)
      .join("; ");
    lines.push(`Proficiencies gained: ${summary}`);
  }

  return lines;
}

export function mapMulticlassRequirements(
  raw?: RawMulticlassing,
): Partial<Record<AbilityKey, number>> | undefined {
  if (!raw?.requirements) return undefined;
  const result: Partial<Record<AbilityKey, number>> = {};
  for (const [ab, val] of Object.entries(raw.requirements)) {
    const key = ab.toLowerCase() as AbilityKey;
    if (key in ABILITY_LABELS) result[key] = val;
  }
  return Object.keys(result).length ? result : undefined;
}

export function mapMulticlassProficiencyGrants(
  raw: RawMulticlassing | undefined,
  classSource: import("@/shared/types/proficiency.types").ProficiencySource,
) {
  if (!raw?.proficienciesGained) return undefined;
  const gained = raw.proficienciesGained;
  const armorGrants = parseNamedProficiencyBlocks(
    gained.armor ?? [],
    classSource,
  );
  const weaponGrants = parseNamedProficiencyBlocks(
    gained.weapons ?? [],
    classSource,
  );
  const toolBlocks = [
    ...(gained.toolProficiencies ?? []),
    ...(gained.tools ?? []),
  ];
  const toolGrants = parseNamedProficiencyBlocks(toolBlocks, classSource);
  const skillChoiceGrants = parseSkillProficiencyBlocks(
    gained.skills ?? [],
    classSource,
  );
  if (
    !armorGrants.length &&
    !weaponGrants.length &&
    !toolGrants.length &&
    !skillChoiceGrants.length
  ) {
    return undefined;
  }
  return { armorGrants, weaponGrants, toolGrants, skillChoiceGrants };
}
