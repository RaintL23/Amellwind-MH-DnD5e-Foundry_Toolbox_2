import { describe, expect, it } from "vitest";
import type { MaterialEffect } from "@/shared/types";
import {
  buildMaterialEffectNameIndex,
  getMaterialEffectTierForText,
  getMaterialEffectTiersForRune,
  runeMatchesMaterialEffectTierFilter,
} from "./material-effect-highlight.utils";
import type { Rune } from "@/shared/types";

function makeEffect(
  partial: Pick<MaterialEffect, "id" | "name" | "slot" | "rarity">,
): MaterialEffect {
  return {
    effect: "Catalog effect",
    summary: "Catalog effect",
    isReference: false,
    ...partial,
  };
}

function makeRune(partial: Partial<Rune> & Pick<Rune, "name">): Rune {
  return {
    monsterName: "Test Monster",
    monsterSource: "GTMH",
    monsterCr: "5",
    monsterCrs: ["5"],
    tier: 2,
    carveChance: "1-10",
    captureChance: "-",
    rolls: 3,
    slots: ["A", "W"],
    armorEffect: null,
    weaponEffect: null,
    tags: [],
    weaponTags: [],
    armorTags: [],
    ...partial,
  };
}

const emptyIndex = buildMaterialEffectNameIndex([]);

describe("getMaterialEffectTierForText — inline defenses", () => {
  it("assigns Rare to unnamed resistance text", () => {
    expect(
      getMaterialEffectTierForText(
        "You have resistance to lightning damage, while you wear this armor.",
        "armor",
        emptyIndex,
      ),
    ).toBe("Rare");
  });

  it("assigns Very Rare to unnamed immunity text", () => {
    expect(
      getMaterialEffectTierForText(
        "You are immune to fire damage while you wear this armor.",
        "armor",
        emptyIndex,
      ),
    ).toBe("Very Rare");
  });

  it("prefers a named catalog rarity over the inline defense fallback", () => {
    const index = buildMaterialEffectNameIndex([
      makeEffect({
        id: "armor-Common-ember-ward",
        name: "Ember Ward",
        slot: "armor",
        rarity: "Common",
      }),
    ]);

    expect(
      getMaterialEffectTierForText(
        "Ember Ward. You are immune to fire damage while you wear this armor.",
        "armor",
        index,
      ),
    ).toBe("Common");
  });
});

describe("getMaterialEffectTiersForRune", () => {
  it("does not treat a missing effect side as Unknown", () => {
    const rune = makeRune({
      name: "Scale",
      slots: ["A"],
      armorEffect: "You have resistance to fire damage while you wear this armor.",
    });

    expect(getMaterialEffectTiersForRune(rune, emptyIndex)).toEqual(["Rare"]);
    expect(
      runeMatchesMaterialEffectTierFilter(rune, emptyIndex, ["Unknown"]),
    ).toBe(false);
    expect(
      runeMatchesMaterialEffectTierFilter(rune, emptyIndex, ["Rare"]),
    ).toBe(true);
  });
});
