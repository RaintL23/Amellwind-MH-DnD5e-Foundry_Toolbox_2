import type {
  BuilderAsiChoices,
  CartEntry,
  DamageType,
  SkillKey,
  StartingEquipmentOffers,
  StartingEquipmentSource,
} from "@/shared/types";
import type {
  ProficiencySource,
} from "@/shared/types/proficiency.types";
import { hasStartingEquipmentOffers } from "@/shared/utils/starting-equipment.parser";
import { getPendingDefenseChoiceGrants } from "@/shared/utils/defense-grant.parser";
import { getPendingNamedChoiceGrants } from "@/shared/utils/named-proficiency.parser";
import { getPendingChoiceGrants } from "../compute-character-proficiencies";
import type { BuildCompletenessInput, BuildCompletenessIssue } from "../build-completeness.types";

export type PendingSkillGrant = ReturnType<typeof getPendingChoiceGrants>[number];

export function scopedStartingItemId(
  source: StartingEquipmentSource,
  itemId: string,
): string {
  return `${source.type}:${source.id}:${itemId}`;
}

export function isSkillPickerComplete(
  grants: PendingSkillGrant[],
  chosen: SkillKey[],
  alreadyGranted: Partial<Record<SkillKey, ProficiencySource[]>>,
): boolean {
  if (!grants.length) return true;
  const totalCount = grants.reduce((acc, grant) => acc + grant.count, 0);
  const effectiveChosen = chosen.filter((skill) => !alreadyGranted[skill]?.length);
  return effectiveChosen.length >= totalCount;
}

export function isNamedPickerComplete(
  grants: ReturnType<typeof getPendingNamedChoiceGrants>,
  chosen: string[],
): boolean {
  if (!grants.length) return true;
  const totalCount = grants.reduce((acc, grant) => acc + grant.count, 0);
  return chosen.length >= totalCount;
}

export function isDefensePickerComplete(
  grants: ReturnType<typeof getPendingDefenseChoiceGrants>,
  chosen: DamageType[],
): boolean {
  if (!grants.length) return true;
  const totalCount = grants.reduce((acc, grant) => acc + grant.count, 0);
  return chosen.length >= totalCount;
}

export function isAsiChoicesComplete(choices: BuilderAsiChoices | undefined): boolean {
  if (!choices) return false;
  if (choices.mode === "plus2") return choices.plus2 !== null;
  return choices.plus1a !== null && choices.plus1b !== null;
}

export function collectStartingEquipmentIssues(
  offers: StartingEquipmentOffers | undefined,
  source: StartingEquipmentSource,
  inventoryItems: CartEntry[],
): BuildCompletenessIssue[] {
  if (!offers || !hasStartingEquipmentOffers(offers)) return [];

  const prefix = `${source.type}:${source.id}:`;
  const selectedIds = new Set(
    inventoryItems
      .map((entry) => entry.startingEquipmentId)
      .filter((id): id is string => !!id && id.startsWith(prefix)),
  );

  if (selectedIds.size === 0) {
    return [
      {
        id: `starting-equipment-${source.type}-${source.id}`,
        section: "starting-equipment",
        message: `Choose starting equipment for ${source.name}`,
        slot: source.type === "class" ? "class" : "background",
        highlightKey: source.type,
      },
    ];
  }

  const issues: BuildCompletenessIssue[] = [];
  for (const group of offers.groups) {
    if (!group.options || group.options.length <= 1) continue;

    const hasOptionPick = group.options.some((option) =>
      option.items.some((item) =>
        selectedIds.has(scopedStartingItemId(source, item.id)),
      ),
    );

    if (!hasOptionPick) {
      issues.push({
        id: `starting-equipment-${source.type}-${source.id}-${group.id}`,
        section: "starting-equipment",
        message: `Choose a starting equipment option${group.label ? `: ${group.label}` : ""} (${source.name})`,
        slot: source.type === "class" ? "class" : "background",
        highlightKey: source.type,
      });
    }
  }

  return issues;
}

export function hasBuildStarted(input: BuildCompletenessInput): boolean {
  if (
    input.species ||
    input.background ||
    input.classSelection ||
    input.subclass
  ) {
    return true;
  }

  if (
    input.mainHand ||
    input.offHand ||
    input.armor ||
    input.equippedShield ||
    input.inventoryItems.length > 0
  ) {
    return true;
  }

  if (
    input.speciesOriginFeat ||
    input.backgroundOriginFeat ||
    input.featSelections.some(Boolean) ||
    input.optionalFeatureOriginFeats.some(Boolean)
  ) {
    return true;
  }

  if (
    Object.values(input.optionalFeatureSelections).some(
      (picks) => (picks?.length ?? 0) > 0,
    )
  ) {
    return true;
  }

  if (
    input.speciesSkillChoices.length > 0 ||
    input.backgroundSkillChoices.length > 0 ||
    Object.values(input.classSkillChoices).some((choices) => choices.length > 0) ||
    input.originFeatSkillChoices.length > 0 ||
    Object.values(input.featSkillChoices).some((choices) => choices.length > 0) ||
    Object.values(input.optionalFeatureOriginFeatSkillChoices).some(
      (choices) => choices.length > 0,
    )
  ) {
    return true;
  }

  if (
    input.speciesToolChoices.length > 0 ||
    input.backgroundToolChoices.length > 0 ||
    Object.values(input.classToolChoices).some((choices) => choices.length > 0) ||
    input.speciesLanguageChoices.length > 0 ||
    input.backgroundLanguageChoices.length > 0 ||
    Object.values(input.classLanguageChoices).some((choices) => choices.length > 0) ||
    Object.values(input.speciesDefenseChoices).some((choices) => choices.length > 0) ||
    Object.values(input.expertiseChoices).some((choices) => choices.length > 0)
  ) {
    return true;
  }

  if (
    input.speciesAbilityChoices.some(Boolean) ||
    input.backgroundAsiMode ||
    (input.useTashaOrigin && (input.tashaPlus2 || input.tashaPlus1))
  ) {
    return true;
  }

  if (
    input.spellcasting &&
    (input.spellcasting.selectedCantripCount > 0 ||
      input.spellcasting.selectedSpellCount > 0)
  ) {
    return true;
  }

  return false;
}
