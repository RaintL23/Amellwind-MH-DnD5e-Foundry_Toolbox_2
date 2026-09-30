import type { CalculatorMode } from "../types/damage-calculator.types";

export interface CalculatorLabels {
  unit: string;
  unitCapitalized: string;
  buildsTitle: string;
  buildSingular: string;
  attacksPerTurn: string;
  attackSingular: string;
  addAttack: string;
  sameAsFirst: string;
  addDice: string;
  bonusFlat: string;
  flatBonusAria: string;
  typeOptional: string;
  avgOnHit: string;
  avgOnCrit: string;
  expected: string;
  expectedPerTurn: string;
  avgOnHitTurn: string;
  avgOnCritTurn: string;
  compareExpected: string;
  halfOnSave: string;
  noneOnSave: string;
  fullOnSave: string;
  saveSuccessEffect: string;
  onSaveFail: string;
  onSaveSuccess: string;
  expressionHint: string;
  averageHitHint: string;
  averageCritHint: string;
  expectedAttackHint: string;
  expectedSaveHint: string;
}

export function getCalculatorLabels(mode: CalculatorMode): CalculatorLabels {
  if (mode === "healing") {
    return {
      unit: "healing",
      unitCapitalized: "Healing",
      buildsTitle: "Builds",
      buildSingular: "Build",
      attacksPerTurn: "Effects per turn",
      attackSingular: "Effect",
      addAttack: "Effect",
      sameAsFirst: "Same healing as first effect",
      addDice: "Add healing dice",
      bonusFlat: "Bonus healing (flat)",
      flatBonusAria: "Flat healing bonus",
      typeOptional: "Type (optional)",
      avgOnHit: "Avg. healing",
      avgOnCrit: "Avg. on crit",
      expected: "Expected",
      expectedPerTurn: "expected healing per turn",
      avgOnHitTurn: "Avg. healing (turn)",
      avgOnCritTurn: "Avg. on crit (turn)",
      compareExpected: "Compare expected healing",
      halfOnSave: "Half healing on successful save",
      noneOnSave: "No healing on successful save",
      fullOnSave: "Full healing on successful save",
      saveSuccessEffect: "On successful save",
      onSaveFail: "Healing on fail",
      onSaveSuccess: "Healing on success",
      expressionHint:
        "Dice formula and flat bonuses for the effect, including type and bracket comments.",
      averageHitHint:
        "Average healing when the effect fully applies. Does not include miss or save chance.",
      averageCritHint:
        "Critical hits do not double healing dice in standard 5e; shown only if crits are enabled for this build.",
      expectedAttackHint:
        "Average healing per attempt, weighting misses (0) and hits.",
      expectedSaveHint:
        "Average healing per effect use, weighting whether the target fails or makes the save.",
    };
  }

  return {
    unit: "damage",
    unitCapitalized: "Damage",
    buildsTitle: "Builds",
    buildSingular: "Build",
    attacksPerTurn: "Attacks per turn",
    attackSingular: "Attack",
    addAttack: "Attack",
    sameAsFirst: "Same damage as first attack",
    addDice: "Add damage dice",
    bonusFlat: "Bonus damage (flat)",
    flatBonusAria: "Flat damage bonus",
    typeOptional: "Type (optional)",
    avgOnHit: "Avg. on hit",
    avgOnCrit: "Avg. on crit",
    expected: "Expected",
    expectedPerTurn: "expected damage per turn",
    avgOnHitTurn: "Avg. on hit (turn)",
    avgOnCritTurn: "Avg. on crit (turn)",
    compareExpected: "Compare expected DPR",
    halfOnSave: "Half damage on successful save",
    noneOnSave: "No damage on successful save",
    fullOnSave: "Full damage on successful save",
    saveSuccessEffect: "On successful save",
    onSaveFail: "Damage on fail",
    onSaveSuccess: "Damage on success",
    expressionHint:
      "Dice formula and flat bonuses for the attack, including damage type and bracket comments.",
    averageHitHint:
      "Average damage on a normal hit (no crit). Does not include miss chance.",
    averageCritHint:
      "Average critical damage: doubled dice, flat bonuses, and Brutal Critical dice if applicable.",
    expectedAttackHint:
      "Average damage per attack attempt, weighting misses (0), hits, and crits.",
    expectedSaveHint:
      "Average damage per effect use, weighting whether the target fails or makes the save.",
  };
}
