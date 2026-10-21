import {
  isAsiFeatSelection,
  isSubclassLevelReached,
  toFeatSlot,
  toOptionalOriginFeatSlot,
} from "../builder-class.utils";
import {
  resolveMulticlassEntryContexts,
  toMulticlassClassSlot,
  toMulticlassSubclassSlot,
} from "../multiclass.utils";
import {
  getProgressionPicks,
  resolveOptionalFeatureProgressions,
  toOptionalFeatureSlot,
} from "../class-optional-features.utils";
import {
  hasOriginFeatChooseGrant,
} from "../origin-feat.constants";
import { areFeatAbilityIncreaseChoicesComplete } from "../feat-ability-increase-choices.utils";
import type { BuildCompletenessInput, BuildCompletenessIssue } from "../build-completeness.types";
import {
  getCompletenessFeatSlotLevels,
  getCompletenessPrimaryLevel,
  isAsiChoicesComplete,
} from "./helpers";
import {
  findSpeciesTraitChoiceGaps,
  speciesTraitsForCreationChoices,
} from "@/shared/utils/species-trait-choice.utils";

export function evaluateIdentityCompleteness(
  input: BuildCompletenessInput,
): BuildCompletenessIssue[] {
  const issues: BuildCompletenessIssue[] = [];

  // Core picks are always required; evaluateBuildCompleteness drops every
  // issue until the build has started, so a blank builder stays quiet.
  if (!input.classSelection) {
    issues.push({
      id: "identity-class",
      section: "identity",
      message: "Choose a class",
      slot: "class",
      highlightKey: "class",
    });
  }

  if (!input.species) {
    issues.push({
      id: "identity-species",
      section: "identity",
      message: "Choose a species",
      slot: "species",
      highlightKey: "species",
    });
  }

  if (!input.background) {
    issues.push({
      id: "identity-background",
      section: "identity",
      message: "Choose a background",
      slot: "background",
      highlightKey: "background",
    });
  }

  if (
    input.classData &&
    isSubclassLevelReached(input.classData, getCompletenessPrimaryLevel(input)) &&
    !input.subclass
  ) {
    issues.push({
      id: "identity-subclass",
      section: "identity",
      message: `Choose a ${input.classData.subclassTitle ?? "subclass"}`,
      slot: "subclass",
      highlightKey: "subclass",
    });
  }

  (input.multiclassEntries ?? []).forEach((entry, index) => {
    if (!entry.classRef) {
      const slot = toMulticlassClassSlot(index);
      issues.push({
        id: `identity-multiclass-class-${index}`,
        section: "identity",
        message: `Choose class ${index + 2}`,
        slot,
        highlightKey: slot,
      });
      return;
    }
    const entryClassData = input.multiclassClassData?.[index] ?? null;
    if (
      entryClassData &&
      !entry.subclass &&
      isSubclassLevelReached(entryClassData, entry.level)
    ) {
      const slot = toMulticlassSubclassSlot(index);
      issues.push({
        id: `identity-multiclass-subclass-${index}`,
        section: "identity",
        message: `Choose a ${entryClassData.subclassTitle ?? "subclass"} for ${entry.classRef.name}`,
        slot,
        highlightKey: slot,
      });
    }
  });

  if (input.species && input.speciesSubraceMissing) {
    issues.push({
      id: "identity-subspecies",
      section: "identity",
      message: `Choose a subspecies for ${input.species.name}`,
      slot: "species",
      highlightKey: "species",
    });
  }

  if (input.species && input.speciesData) {
    const gaps = findSpeciesTraitChoiceGaps(
      speciesTraitsForCreationChoices(input.speciesData),
      input.speciesTraitChoices ?? {},
      input.level,
    );
    for (const trait of gaps) {
      issues.push({
        id: `identity-species-trait-${trait.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        section: "identity",
        message: `Choose ${trait.name}`,
        slot: "species",
        highlightKey: "species",
      });
    }
  }

  return issues;
}

export function evaluateFeatsCompleteness(
  input: BuildCompletenessInput,
): BuildCompletenessIssue[] {
  const issues: BuildCompletenessIssue[] = [];

  if (
    hasOriginFeatChooseGrant(
      input.speciesOriginFeatGrant,
      input.backgroundOriginFeatGrant,
      input.useAmellwindHomebrew,
      !!input.background,
    ) &&
    !input.speciesOriginFeat &&
    !input.backgroundOriginFeat
  ) {
    issues.push({
      id: "origin-feat",
      section: "feats",
      message: "Choose an origin feat",
      slot: "origin-feat",
      highlightKey: "origin-feat",
    });
  }

  if (input.classSelection) {
    const featSlotLevels = getCompletenessFeatSlotLevels(input);
    featSlotLevels.forEach((featLevel, index) => {
      const feat = input.featSelections[index];
      if (feat) {
        if (isAsiFeatSelection(feat) && !isAsiChoicesComplete(feat.asiChoices)) {
          issues.push({
            id: `feat-asi-${index}`,
            section: "feats",
            message: `Complete ASI choices for level ${featLevel} feat`,
            slot: toFeatSlot(index),
            highlightKey: toFeatSlot(index),
          });
        } else if (
          !isAsiFeatSelection(feat) &&
          feat.abilityIncreaseChoices &&
          !areFeatAbilityIncreaseChoicesComplete(feat.abilityIncreaseChoices)
        ) {
          issues.push({
            id: `feat-ability-${index}`,
            section: "feats",
            message: `Choose ability score increase for ${feat.name}`,
            slot: toFeatSlot(index),
            highlightKey: toFeatSlot(index),
          });
        } else if (feat.damageTypeChoice === null) {
          issues.push({
            id: `feat-damage-type-${index}`,
            section: "feats",
            message: `Choose damage type for ${feat.name}`,
            slot: toFeatSlot(index),
            highlightKey: toFeatSlot(index),
          });
        }
        return;
      }

      issues.push({
        id: `feat-slot-${index}`,
        section: "feats",
        message: `Choose a feat at level ${featLevel}`,
        slot: toFeatSlot(index),
        highlightKey: toFeatSlot(index),
      });
    });
  }

  input.optionalFeatureOriginFeatSlots.forEach((slotMeta) => {
    if (input.optionalFeatureOriginFeats[slotMeta.slotIndex]) return;
    issues.push({
      id: `opt-origin-feat-${slotMeta.slotIndex}`,
      section: "feats",
      message: `Choose origin feat: ${slotMeta.sourceFeatureName}`,
      slot: toOptionalOriginFeatSlot(slotMeta.slotIndex),
      highlightKey: toOptionalOriginFeatSlot(slotMeta.slotIndex),
    });
  });

  const optionalOwners = [
    {
      prefix: "",
      progressions: resolveOptionalFeatureProgressions(
        input.classData,
        input.subclassData,
        getCompletenessPrimaryLevel(input),
      ),
    },
    ...resolveMulticlassEntryContexts(
      input.multiclassEntries ?? [],
      input.multiclassClassData ?? [],
    ).map((ctx) => ({
      prefix: `${ctx.classData.name}: `,
      progressions: ctx.progressions,
    })),
  ];
  for (const { prefix, progressions } of optionalOwners) {
    for (const { progression, slotCount } of progressions) {
      const picks = getProgressionPicks(input.optionalFeatureSelections, progression.id);
      if (picks.length >= slotCount) continue;
      issues.push({
        id: `optional-feature-${progression.id}`,
        section: "optional-features",
        message: `${prefix}Choose ${slotCount - picks.length} more ${progression.name.replace(/ Options$/i, "")} option${slotCount - picks.length === 1 ? "" : "s"} (${picks.length}/${slotCount})`,
        slot: toOptionalFeatureSlot(progression.id),
        highlightKey: toOptionalFeatureSlot(progression.id),
      });
    }
  }

  return issues;
}
