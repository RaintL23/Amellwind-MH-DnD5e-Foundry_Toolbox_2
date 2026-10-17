import {
  ABILITY_KEYS,
  STANDARD_ARRAY,
  pointBuyRemaining,
} from "@/shared/utils/ability-scores";
import type { AbilityScores } from "@/shared/types";
import {
  getSpeciesChooseSlots,
  hasBackgroundAsi,
} from "../species-ability-bonuses";
import type { BuildCompletenessInput, BuildCompletenessIssue } from "../build-completeness.types";

export const BASE_ABILITIES_HIGHLIGHT_KEY = "base-abilities";

/**
 * True while all six base scores are identical: the new-character default
 * (11s) or a method reset (8s) that nobody has assigned yet.
 */
export function areBaseAbilitiesUntouched(abilities: AbilityScores): boolean {
  const [first, ...rest] = ABILITY_KEYS.map((key) => abilities[key]);
  return rest.every((score) => score === first);
}

/**
 * Base scores must be assigned before export. Manual and dice builds are only
 * flagged while the scores are still untouched (see areBaseAbilitiesUntouched).
 */
function evaluateBaseAbilityScores(
  input: BuildCompletenessInput,
): BuildCompletenessIssue | null {
  const scores = ABILITY_KEYS.map((key) => input.baseAbilities[key]);
  let message: string | null = null;

  switch (input.abilityScoreMethod) {
    case "standard": {
      const sorted = [...scores].sort((a, b) => b - a);
      if (sorted.some((score, index) => score !== STANDARD_ARRAY[index])) {
        message = "Assign every Standard Array value (15, 14, 13, 12, 10, 8)";
      }
      break;
    }
    case "pointbuy": {
      const remaining = pointBuyRemaining(input.baseAbilities);
      if (remaining > 0) {
        message = `Spend ${remaining} more point-buy point${remaining === 1 ? "" : "s"}`;
      }
      break;
    }
    case "manual":
    case "dice":
      if (areBaseAbilitiesUntouched(input.baseAbilities)) {
        message = "Assign your ability scores";
      }
      break;
  }

  if (!message) return null;
  return {
    id: "base-abilities",
    section: "ability-scores",
    message,
    highlightKey: BASE_ABILITIES_HIGHLIGHT_KEY,
  };
}

export function evaluateAbilityScoresCompleteness(
  input: BuildCompletenessInput,
): BuildCompletenessIssue[] {
  const issues: BuildCompletenessIssue[] = [];

  const baseIssue = evaluateBaseAbilityScores(input);
  if (baseIssue) issues.push(baseIssue);

  const backgroundOwnsAsi =
    !!input.dndBackground && hasBackgroundAsi(input.dndBackground.abilityBonuses);

  // Same rule as OriginBonusesPanel: Tasha's origin or a 2024 background ASI
  // replaces the species bonuses, so their pickers are hidden and not required.
  if (input.speciesData && !input.useTashaOrigin && !backgroundOwnsAsi) {
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

  if (input.dndBackground && backgroundOwnsAsi) {
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
