import {
  getSpeciesChooseSlots,
  hasBackgroundAsi,
} from "../species-ability-bonuses";
import type { BuildCompletenessInput, BuildCompletenessIssue } from "../build-completeness.types";

export function evaluateAbilityScoresCompleteness(
  input: BuildCompletenessInput,
): BuildCompletenessIssue[] {
  const issues: BuildCompletenessIssue[] = [];

  if (input.speciesData) {
    const chooseSlots = getSpeciesChooseSlots(input.speciesData.abilityBonuses ?? []);
    chooseSlots.forEach((slot, index) => {
      if (input.speciesAbilityChoices[index]) return;
      issues.push({
        id: `species-asi-${index}`,
        section: "ability-scores",
        message: `Assign species ability bonus (${slot.amount > 1 ? `+${slot.amount}` : "+1"})`,
        highlightKey: "species-asi",
      });
    });
  }

  if (input.dndBackground && hasBackgroundAsi(input.dndBackground.abilityBonuses)) {
    if (!input.backgroundAsiMode) {
      issues.push({
        id: "background-asi-mode",
        section: "ability-scores",
        message: `Choose background ability score mode (${input.dndBackground.name})`,
        highlightKey: "background-asi",
      });
    } else if (input.backgroundAsiMode === "plus2plus1") {
      if (!input.backgroundAsiPlus2 || !input.backgroundAsiPlus1) {
        issues.push({
          id: "background-asi-assign",
          section: "ability-scores",
          message: "Assign background +2 and +1 ability scores",
          highlightKey: "background-asi",
        });
      }
    }
  }

  if (input.useTashaOrigin) {
    if (!input.tashaPlus2 || !input.tashaPlus1) {
      issues.push({
        id: "tasha-origin",
        section: "ability-scores",
        message: "Assign Tasha's +2 and +1 ability scores",
        highlightKey: "tasha-origin",
      });
    }
  }

  return issues;
}
