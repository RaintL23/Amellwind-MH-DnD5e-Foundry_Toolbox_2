import { describe, expect, it } from "vitest";
import type { Class, OptionalFeatureProgression } from "@/shared/types";
import {
  getWeaponMasteryWeapon,
  WEAPON_MASTERY_OPTIONS,
} from "@/shared/data/weapon-mastery.data";
import { randomizeAllOptionalFeatureProgressions } from "./optional-feature-randomizer.utils";

const masteryProgression: OptionalFeatureProgression = {
  id: "wm-barbarian",
  name: "Weapon Mastery",
  featureTypes: [],
  catalog: "feature-choice",
  choiceOptions: WEAPON_MASTERY_OPTIONS,
  scope: "class",
  ownerId: "barbarian",
  progression: [2],
};

function barbarian(): Class {
  return {
    name: "Barbarian",
    progression: [
      {
        level: 1,
        tableCells: [],
        features: [
          {
            name: "Weapon Mastery",
            description: [
              "Your training with weapons allows you to use the mastery properties of two kinds of Simple or Martial Melee weapons of your choice.",
            ],
          },
        ],
      },
    ],
  } as unknown as Class;
}

describe("Weapon Mastery randomizer", () => {
  const ctx = {
    classData: barbarian(),
    subclass: null,
    classLevel: 1,
    optionalCatalog: [],
    featCatalog: [],
    createLookup: () => null,
    archetype: "great-weapon" as const,
  };

  it("is skipped on the first pass (before the loadout exists)", () => {
    const result = randomizeAllOptionalFeatureProgressions(
      [{ progression: masteryProgression, slotCount: 2 }] as never,
      {},
      ctx,
      () => {},
    );
    expect(result[masteryProgression.id]).toBeUndefined();
  });

  it("masters the loadout weapons first and only melee weapons for a Barbarian", () => {
    for (let i = 0; i < 20; i++) {
      const result = randomizeAllOptionalFeatureProgressions(
        [{ progression: masteryProgression, slotCount: 3 }] as never,
        {},
        {
          ...ctx,
          weaponMastery: {
            preferredWeaponNames: ["Greataxe", "Handaxe"],
            weaponProficiencies: ["simple", "martial"],
          },
        },
        () => {},
      );
      const picks = result[masteryProgression.id] ?? [];
      expect(picks.slice(0, 2).map((pick) => pick?.name)).toEqual([
        "Greataxe",
        "Handaxe",
      ]);
      for (const pick of picks) {
        expect(getWeaponMasteryWeapon(pick!.id)?.range).toBe("melee");
      }
    }
  });
});
