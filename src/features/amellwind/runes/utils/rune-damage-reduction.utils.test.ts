import { describe, expect, it } from "vitest";
import { matchesFlatDamageReduction } from "./rune-damage-reduction.utils";

describe("matchesFlatDamageReduction", () => {
  it("matches elemental flat DR", () => {
    expect(
      matchesFlatDamageReduction(
        "You reduce fire damage you take by 3 while you wear this armor.",
      ),
    ).toBe(true);
  });

  it("matches ranged attack DR with intervening phrase", () => {
    expect(
      matchesFlatDamageReduction(
        "You reduce damage you take from ranged weapon and spell attacks by 2.",
      ),
    ).toBe(true);
  });

  it("matches Divine Blessing-style when-you-take-damage reduce", () => {
    expect(
      matchesFlatDamageReduction(
        "When you take damage that you aren't immune or resistant to, you can expend one or more divine dice to reduce the damage by the total rolled.",
      ),
    ).toBe(true);
  });
});
