import type { BuilderFeatSelection } from "@/shared/types";
import {
  DEFAULT_ASI_CHOICES,
  isAsiFeatSelection,
} from "./builder-class.utils";
import type {
  BuildCompletenessInput,
  BuildCompletenessResult,
} from "./build-completeness.types";
export type { BuildCompletenessInput } from "./build-completeness.types";
export type {
  BuildCompletenessIssue,
  BuildCompletenessResult,
  BuildCompletenessSection,
} from "./build-completeness.types";
import { evaluateAbilityScoresCompleteness } from "./build-completeness/evaluate-ability-scores.utils";
import { evaluateEquipmentAndSpellsCompleteness } from "./build-completeness/evaluate-equipment-spells.utils";
import {
  evaluateFeatsCompleteness,
  evaluateIdentityCompleteness,
} from "./build-completeness/evaluate-identity-feats.utils";
import { evaluateProficienciesCompleteness } from "./build-completeness/evaluate-proficiencies.utils";
import { hasBuildStarted, isAsiChoicesComplete } from "./build-completeness/helpers";

export function evaluateBuildCompleteness(
  input: BuildCompletenessInput,
): BuildCompletenessResult {
  const issues = [
    ...evaluateIdentityCompleteness(input),
    ...evaluateFeatsCompleteness(input),
    ...evaluateAbilityScoresCompleteness(input),
    ...evaluateProficienciesCompleteness(input),
    ...evaluateEquipmentAndSpellsCompleteness(input),
  ];

  const hasStarted = hasBuildStarted(input);
  const filteredIssues = hasStarted ? issues : [];

  return {
    hasStarted,
    issues: filteredIssues,
    shouldBlockExport: hasStarted && filteredIssues.length > 0,
  };
}

export function isAsiSelectionComplete(
  selection: BuilderFeatSelection | null | undefined,
): boolean {
  if (!selection || !isAsiFeatSelection(selection)) return true;
  return isAsiChoicesComplete(selection.asiChoices ?? DEFAULT_ASI_CHOICES);
}
