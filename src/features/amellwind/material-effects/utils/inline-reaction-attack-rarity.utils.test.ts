import { describe, expect, it } from "vitest";
import { inferRarityFromReactionAttackTags } from "./inline-reaction-attack-rarity.utils";

describe("inferRarityFromReactionAttackTags", () => {
  it("assigns Uncommon for reaction + natural-weapon", () => {
    expect(
      inferRarityFromReactionAttackTags([
        "mechanic:reaction",
        "mechanic:natural-weapon",
        "mechanic:active",
      ]),
    ).toBe("Uncommon");
  });

  it("assigns Uncommon for reaction + unarmed", () => {
    expect(
      inferRarityFromReactionAttackTags([
        "mechanic:reaction",
        "mechanic:unarmed",
        "mechanic:active",
      ]),
    ).toBe("Uncommon");
  });

  it("returns null without reaction", () => {
    expect(
      inferRarityFromReactionAttackTags([
        "mechanic:natural-weapon",
        "mechanic:active",
      ]),
    ).toBeNull();
  });

  it("returns null for reaction alone", () => {
    expect(
      inferRarityFromReactionAttackTags([
        "mechanic:reaction",
        "mechanic:active",
      ]),
    ).toBeNull();
  });
});
