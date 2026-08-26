import { describe, expect, it } from "vitest";
import type { FeatAbilityIncrease } from "@/shared/types";
import {
  areFeatAbilityIncreaseChoicesComplete,
  buildFeatAbilityIncreaseChoices,
  formatFeatAbilityIncreaseChoicesSummary,
  isChoosableAbilityIncrease,
  setFeatAbilityIncreaseChoiceAt,
} from "./feat-ability-increase-choices.utils";

const PIERCER: FeatAbilityIncrease = {
  label: "STR or DEX +1 (choose)",
  abilities: ["str", "dex"],
  amount: 1,
};

const ACTOR: FeatAbilityIncrease = {
  label: "CHA +1",
  abilities: ["cha"],
  amount: 1,
};

describe("feat-ability-increase-choices.utils", () => {
  it("treats multi-ability increases as choosable", () => {
    expect(isChoosableAbilityIncrease(PIERCER)).toBe(true);
    expect(isChoosableAbilityIncrease(ACTOR)).toBe(false);
  });

  it("auto-fills fixed increases and leaves choose blocks empty", () => {
    const choices = buildFeatAbilityIncreaseChoices([ACTOR, PIERCER]);
    expect(choices).toEqual([
      { ability: "cha", amount: 1 },
      { ability: null, amount: 1 },
    ]);
    expect(areFeatAbilityIncreaseChoicesComplete(choices)).toBe(false);
  });

  it("randomizes choose blocks when requested", () => {
    const choices = buildFeatAbilityIncreaseChoices([PIERCER], {
      randomize: true,
    });
    expect(choices).toHaveLength(1);
    expect(choices[0]?.ability === "str" || choices[0]?.ability === "dex").toBe(
      true,
    );
    expect(areFeatAbilityIncreaseChoicesComplete(choices)).toBe(true);
  });

  it("updates a single choice and formats the summary", () => {
    const initial = buildFeatAbilityIncreaseChoices([PIERCER]);
    const updated = setFeatAbilityIncreaseChoiceAt(initial, 0, "dex");
    expect(formatFeatAbilityIncreaseChoicesSummary(updated)).toBe("+1 DEX");
  });
});
