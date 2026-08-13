import { describe, expect, it } from "vitest";
import type { MaterialEffect } from "@/shared/types";
import {
  buildMaterialEffectNameIndex,
  extractLeadingMaterialEffectName,
  getMaterialEffectTierForText,
  getMaterialEffectTiersForRune,
  runeMatchesMaterialEffectTierFilter,
  supplementIndexWithRuneEffectNames,
  splitMaterialEffectRefs,
  findMatchingMaterialEffectNames,
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

describe("extractLeadingMaterialEffectName", () => {
  it("extracts short titled effects", () => {
    expect(
      extractLeadingMaterialEffectName(
        "Sovereign Wrath. You gain advantage on attack rolls.",
      ),
    ).toBe("Sovereign Wrath");
  });

  it("does not treat action sentences as material effect titles", () => {
    const text =
      "(Insect Glaive only) As an action you can hurl this weapon and speak this weapon's command word, it transforms into a bolt of lightning, forming a line 5 feet wide that extends out from you to a target within 120 feet. Each creature in the line excluding you and the target must make a DC 13 Dexterity saving throw.";
    expect(extractLeadingMaterialEffectName(text)).toBeNull();
  });

  it("strips leading restrictions before reading a real title", () => {
    expect(
      extractLeadingMaterialEffectName(
        "(Insect Glaive only) Thunder Lash. Your weapon deals an extra 1d6 lightning damage.",
      ),
    ).toBe("Thunder Lash");
  });
});

describe("material effect highlight — sentence false positives", () => {
  it("does not highlight an entire action paragraph as a discovered effect name", () => {
    const text =
      "(Insect Glaive only) As an action you can hurl this weapon and speak this weapon's command word, it transforms into a bolt of lightning, forming a line 5 feet wide that extends out from you to a target within 120 feet. Each creature in the line excluding you and the target must make a DC 13 Dexterity saving throw.";
    const rune = makeRune({
      name: "Test Scale",
      slots: ["W"],
      weaponEffect: text,
    });
    const index = supplementIndexWithRuneEffectNames(emptyIndex, [rune]);
    const candidates = findMatchingMaterialEffectNames(text, index.all);
    const segments = splitMaterialEffectRefs(text, candidates, index.byKey, "weapon");
    expect(segments.every((segment) => !segment.isMaterialEffect)).toBe(true);
  });
});

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

describe("getMaterialEffectTierForText — inline extra damage", () => {
  it("assigns Rare to unnamed 2d6 weapon extra damage", () => {
    expect(
      getMaterialEffectTierForText(
        "Your weapon deals an extra {@damage 2d6} necrotic damage.",
        "weapon",
        emptyIndex,
      ),
    ).toBe("Rare");
  });

  it("assigns Uncommon to unnamed 1d6 weapon extra damage", () => {
    expect(
      getMaterialEffectTierForText(
        "Your weapon deals an extra {@damage 1d6} lightning damage.",
        "weapon",
        emptyIndex,
      ),
    ).toBe("Uncommon");
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
