import {
  getFeatSlotLevels,
  isAsiFeatSelection,
  isSubclassLevelReached,
  toFeatSlot,
  toOptionalOriginFeatSlot,
} from "../builder-class.utils";
import {
  getProgressionPicks,
  resolveOptionalFeatureProgressions,
  toOptionalFeatureSlot,
} from "../class-optional-features.utils";
import {
  hasOriginFeatChooseGrant,
} from "../origin-feat.constants";
import type { BuildCompletenessInput, BuildCompletenessIssue } from "../build-completeness.types";
import { isAsiChoicesComplete } from "./helpers";

export function evaluateIdentityCompleteness(
  input: BuildCompletenessInput,
): BuildCompletenessIssue[] {
  const issues: BuildCompletenessIssue[] = [];

  if (input.classSelection && !input.species) {
    issues.push({
      id: "identity-species",
      section: "identity",
      message: "Choose a species",
      slot: "species",
      highlightKey: "species",
    });
  }

  if (input.classSelection && !input.background) {
    issues.push({
      id: "identity-background",
      section: "identity",
      message: "Choose a background",
      slot: "background",
      highlightKey: "background",
    });
  }

  if (!input.classSelection && (input.species || input.background)) {
    issues.push({
      id: "identity-class",
      section: "identity",
      message: "Choose a class",
      slot: "class",
      highlightKey: "class",
    });
  }

  if (
    input.classData &&
    isSubclassLevelReached(input.classData, input.level) &&
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
    const featSlotLevels = getFeatSlotLevels(
      input.classSelection.name,
      input.level,
    );
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

  const optionalProgressions = resolveOptionalFeatureProgressions(
    input.classData,
    input.subclassData,
    input.level,
  );
  for (const { progression, slotCount } of optionalProgressions) {
    const picks = getProgressionPicks(input.optionalFeatureSelections, progression.id);
    if (picks.length >= slotCount) continue;
    issues.push({
      id: `optional-feature-${progression.id}`,
      section: "optional-features",
      message: `Choose ${slotCount - picks.length} more ${progression.name.replace(/ Options$/i, "")} option${slotCount - picks.length === 1 ? "" : "s"} (${picks.length}/${slotCount})`,
      slot: toOptionalFeatureSlot(progression.id),
      highlightKey: toOptionalFeatureSlot(progression.id),
    });
  }

  return issues;
}
