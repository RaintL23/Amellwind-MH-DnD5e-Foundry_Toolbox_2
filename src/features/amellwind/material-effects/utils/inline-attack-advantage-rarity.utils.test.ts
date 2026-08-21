import { describe, expect, it } from "vitest";
import { inferRarityFromAttackAdvantageTags } from "./inline-attack-advantage-rarity.utils";

describe("inferRarityFromAttackAdvantageTags", () => {
  it("assigns Uncommon for limited Aim Booster-style advantage", () => {
    expect(
      inferRarityFromAttackAdvantageTags([
        "mechanic:advantage",
        "mechanic:attack-roll",
        "mechanic:bonus-action",
        "mechanic:active",
        "mechanic:long-rest",
      ]),
    ).toBe("Uncommon");
  });

  it("assigns Rare for always-on attack advantage", () => {
    expect(
      inferRarityFromAttackAdvantageTags([
        "mechanic:advantage",
        "mechanic:attack-roll",
        "mechanic:passive",
      ]),
    ).toBe("Rare");
  });

  it("returns null without attack-roll", () => {
    expect(
      inferRarityFromAttackAdvantageTags([
        "mechanic:advantage",
        "mechanic:against-condition",
      ]),
    ).toBeNull();
  });
});
