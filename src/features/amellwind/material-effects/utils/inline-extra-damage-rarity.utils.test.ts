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

  it("assigns Uncommon to crit DoT 1d4 fire damage", () => {
    expect(
      inferInlineExtraDamageRarity(
        "When you roll a 20 on your attack roll with this weapon, the target creature catches fire. Until someone takes an action to douse the flames, the creature takes {@damage 1d4} fire damage at the start of each of its turns.",
      ),
    ).toBe("Uncommon");
  });

  it("ignores armor self-damage wording", () => {
    expect(
      inferInlineExtraDamageRarity(
        "When you take fire damage while wearing this armor, you regain 1 hit point.",
      ),
    ).toBeNull();
  });

  it("ignores gather extra 1d4 without damage wording", () => {
    expect(
      inferInlineExtraDamageRarity(
        "Pro Fisherman. When you catch fish, you catch an extra 1d4 more.",
      ),
    ).toBeNull();
  });
});
