import type { AbilityKey, MulticlassRequirementGroup } from "@/shared/types";
import { ABILITY_NAMES } from "@/shared/constants/dnd";
import { parseNamedProficiencyBlocks } from "@/shared/utils/named-proficiency.parser";
import { parseSkillProficiencyBlocks } from "@/shared/utils/skill-proficiency.parser";
import type { RawMulticlassing } from "../utils/class-raw.types";
import { formatAbility } from "@/features/dnd/classes/mappers/class-table.mapper";
import {
  mapStartingProficiencies,
  parseClassToolGrants,
} from "@/features/dnd/classes/mappers/class-proficiency.mapper";

const ABILITY_LABELS: Record<string, string> = ABILITY_NAMES;

/** 2024 rule: 13+ in the class's primary ability (XPHB has no `requirements`). */
const PRIMARY_ABILITY_MINIMUM = 13;

export function mapMulticlassing(
  raw?: RawMulticlassing,
  primaryAbility?: Record<string, boolean>[],
): string[] {
  const lines: string[] = [];

  const requirements = mapMulticlassRequirements(raw, primaryAbility);
  if (requirements) {
    lines.push(`Requirements: ${formatMulticlassRequirements(requirements)}`);
  }
  if (!raw) return lines;

  const gained = mapStartingProficiencies(raw.proficienciesGained);
  if (gained.length) {
    const summary = gained
      .map((group) => `${group.label}: ${group.items.join(", ")}`)
      .join("; ");
    lines.push(`Proficiencies gained: ${summary}`);
  }

  return lines;
}

function toAbilityKey(raw: string): AbilityKey | null {
  const key = raw.toLowerCase();
  return key in ABILITY_LABELS ? (key as AbilityKey) : null;
}

/**
 * Normalizes multiclass prerequisites to OR-of-AND groups. PHB data uses
 * `requirements` (`or` holds alternatives, e.g. Fighter Str or Dex); XPHB omits
 * it, so the class `primaryAbility` list at 13 is used instead.
 */
export function mapMulticlassRequirements(
  raw?: RawMulticlassing,
  primaryAbility?: Record<string, boolean>[],
): MulticlassRequirementGroup[] | undefined {
  if (raw?.requirements) {
    let groups: MulticlassRequirementGroup[] = [{}];
    for (const [ab, val] of Object.entries(raw.requirements)) {
      if (typeof val === "number") {
        const key = toAbilityKey(ab);
        if (key) groups = groups.map((g) => ({ ...g, [key]: val }));
        continue;
      }
      if (ab !== "or" || !Array.isArray(val)) continue;
      for (const alternatives of val) {
        const options = Object.entries(alternatives)
          .map(([alt, min]) => [toAbilityKey(alt), min] as const)
          .filter((entry): entry is [AbilityKey, number] => entry[0] !== null);
        if (!options.length) continue;
        groups = groups.flatMap((g) =>
          options.map(([key, min]) => ({ ...g, [key]: min })),
        );
      }
    }
    const nonEmpty = groups.filter((g) => Object.keys(g).length > 0);
    if (nonEmpty.length) return nonEmpty;
  }

  const fromPrimary = (primaryAbility ?? [])
    .map((set) => {
      const group: MulticlassRequirementGroup = {};
      for (const [ab, required] of Object.entries(set)) {
        const key = toAbilityKey(ab);
        if (key && required) group[key] = PRIMARY_ABILITY_MINIMUM;
      }
      return group;
    })
    .filter((g) => Object.keys(g).length > 0);
  return fromPrimary.length ? fromPrimary : undefined;
}

/** "Strength 13 or Dexterity 13", "Strength 13, Charisma 13". */
export function formatMulticlassRequirements(
  groups: MulticlassRequirementGroup[],
): string {
  return groups
    .map((group) =>
      Object.entries(group)
        .map(([ab, min]) => `${formatAbility(ab)} ${min}`)
        .join(", "),
    )
    .join(" or ");
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
  const toolGrants = parseClassToolGrants(gained, classSource);
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
