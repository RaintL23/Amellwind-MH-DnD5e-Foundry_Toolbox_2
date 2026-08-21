import { describe, expect, it } from "vitest";
import { inferRarityFromSkillUtilityTags } from "./inline-skill-rarity.utils";

describe("inferRarityFromSkillUtilityTags", () => {
  it("assigns Common for a flat skill bonus", () => {
    expect(
      inferRarityFromSkillUtilityTags([
        "mechanic:skill-bonus",
        "mechanic:skill-athletics",
        "mechanic:passive",
      ]),
    ).toBe("Common");
  });

  it("assigns Common for advantage against being disarmed", () => {
    expect(
      inferRarityFromSkillUtilityTags([
        "mechanic:advantage",
        "mechanic:disarm",
        "mechanic:passive",
      ]),
    ).toBe("Common");
  });

  it("assigns Common for advantage on a named skill", () => {
    expect(
      inferRarityFromSkillUtilityTags([
        "mechanic:advantage",
        "mechanic:skill-insight",
        "mechanic:passive",
      ]),
    ).toBe("Common");
  });

  it("returns null for bare advantage without skill or disarm", () => {
    expect(
      inferRarityFromSkillUtilityTags([
        "mechanic:advantage",
        "mechanic:passive",
      ]),
    ).toBeNull();
  });
});
