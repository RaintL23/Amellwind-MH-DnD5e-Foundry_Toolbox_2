import { describe, expect, it } from "vitest";
import { inferRarityFromClassResourceRecoveryTags } from "./inline-class-resource-rarity.utils";

describe("inferRarityFromClassResourceRecoveryTags", () => {
  it("assigns Uncommon when recover-class-resource is present", () => {
    expect(
      inferRarityFromClassResourceRecoveryTags([
        "mechanic:ki",
        "mechanic:class-resource",
        "mechanic:recover-class-resource",
        "class:monk",
      ]),
    ).toBe("Uncommon");
  });

  it("returns null without recover-class-resource", () => {
    expect(
      inferRarityFromClassResourceRecoveryTags([
        "mechanic:channel-divinity",
        "mechanic:class-resource",
      ]),
    ).toBeNull();
  });
});
