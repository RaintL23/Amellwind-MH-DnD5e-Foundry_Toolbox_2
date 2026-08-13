import { describe, expect, it } from "vitest";
import {
  inferInlineExtraDamageRarity,
  rarityForExtraDamageScore,
} from "./inline-extra-damage-rarity.utils";

describe("rarityForExtraDamageScore", () => {
  it("maps score bands to rarities", () => {
    expect(rarityForExtraDamageScore(4)).toBe("Uncommon");
    expect(rarityForExtraDamageScore(6)).toBe("Uncommon");
    expect(rarityForExtraDamageScore(8)).toBe("Rare");
    expect(rarityForExtraDamageScore(12)).toBe("Rare");
    expect(rarityForExtraDamageScore(16)).toBe("Very Rare");
    expect(rarityForExtraDamageScore(20)).toBe("Very Rare");
    expect(rarityForExtraDamageScore(24)).toBe("Legendary");
  });
});

describe("inferInlineExtraDamageRarity", () => {
  it("assigns Uncommon to 1d6 extra damage", () => {
    expect(
      inferInlineExtraDamageRarity(
        "Your weapon deals an extra {@damage 1d6} lightning damage.",
      ),
    ).toBe("Uncommon");
  });

  it("assigns Rare to 2d6 necrotic extra damage", () => {
    expect(
      inferInlineExtraDamageRarity(
        "Your weapon deals an extra {@damage 2d6} necrotic damage.",
      ),
    ).toBe("Rare");
  });

  it("assigns Very Rare to 3d6 extra damage", () => {
    expect(
      inferInlineExtraDamageRarity(
        "Your weapon deals an extra {@damage 3d6} fire damage.",
      ),
    ).toBe("Very Rare");
  });

  it("assigns Legendary to 4d6 extra damage", () => {
    expect(
      inferInlineExtraDamageRarity(
        "Your weapon deals an extra {@damage 4d6} fire damage.",
      ),
    ).toBe("Legendary");
  });

  it("handles plain dice without {@damage}", () => {
    expect(
      inferInlineExtraDamageRarity(
        "Your weapon deals an extra 2d6 necrotic damage.",
      ),
    ).toBe("Rare");
  });

  it("returns null when there is no extra damage grant", () => {
    expect(
      inferInlineExtraDamageRarity(
        "You have resistance to fire damage while you wear this armor.",
      ),
    ).toBeNull();
  });
});
