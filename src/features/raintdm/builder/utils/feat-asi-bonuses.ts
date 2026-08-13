import type { AbilityKey, BuilderFeatSelection } from "@/shared/types";
import {
  getFeatSlotLevels,
  isAsiFeatSelection,
} from "./builder-class.utils";
import type { AbilityScoreBreakdown } from "./species-ability-bonuses";

function addBonus(
  map: Record<AbilityKey, AbilityScoreBreakdown>,
  key: AbilityKey,
  amount: number,
  label: string,
): void {
  map[key].bonus += amount;
  map[key].sources.push({ label, amount });
}

export function applyFeatAsiBonuses(
  bonusMap: Record<AbilityKey, AbilityScoreBreakdown>,
  featSelections: (BuilderFeatSelection | null)[],
  className: string,
  level: number,
): void {
  const slotLevels = getFeatSlotLevels(className, level);

  featSelections.forEach((feat, index) => {
    if (!feat || !isAsiFeatSelection(feat)) return;

    const choices = feat.asiChoices;
    if (!choices) return;

    const featLevel = slotLevels[index];
    const label = featLevel
      ? `ASI (nivel ${featLevel})`
      : `ASI (${feat.name})`;

    if (choices.mode === "plus2" && choices.plus2) {
      addBonus(bonusMap, choices.plus2, 2, label);
      return;
    }

    if (choices.mode === "plus1plus1") {
      if (choices.plus1a) addBonus(bonusMap, choices.plus1a, 1, label);
      if (choices.plus1b) addBonus(bonusMap, choices.plus1b, 1, label);
    }
  });
}
