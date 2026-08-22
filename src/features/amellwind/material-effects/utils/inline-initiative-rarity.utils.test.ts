import { describe, expect, it } from "vitest";
import { inferRarityFromInitiativeTags } from "./inline-initiative-rarity.utils";

describe("inferRarityFromInitiativeTags", () => {
  it("assigns Uncommon for plain initiative", () => {
    expect(inferRarityFromInitiativeTags(["mechanic:initiative"])).toBe(
      "Uncommon",
    );
  });

  it("assigns Rare for initiative:major", () => {
    expect(
      inferRarityFromInitiativeTags([
        "mechanic:initiative",
        "mechanic:initiative:major",
      ]),
    ).toBe("Rare");
  });

  it("returns null without initiative tags", () => {
    expect(inferRarityFromInitiativeTags(["mechanic:advantage"])).toBeNull();
  });
});
