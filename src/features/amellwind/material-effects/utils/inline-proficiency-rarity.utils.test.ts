import { describe, expect, it } from "vitest";
import { inferRarityFromProficiencyGrantTags } from "./inline-proficiency-rarity.utils";

describe("inferRarityFromProficiencyGrantTags", () => {
  it("assigns Common to skill proficiency", () => {
    expect(
      inferRarityFromProficiencyGrantTags([
        "mechanic:proficiency-skill",
        "mechanic:skill-athletics",
      ]),
    ).toBe("Common");
  });

  it("assigns Common to tool proficiency", () => {
    expect(
      inferRarityFromProficiencyGrantTags(["mechanic:proficiency-tool"]),
    ).toBe("Common");
  });

  it("assigns Uncommon when expertise doubles PB", () => {
    expect(
      inferRarityFromProficiencyGrantTags([
        "mechanic:proficiency-instrument",
        "mechanic:expertise",
      ]),
    ).toBe("Uncommon");
  });
});
