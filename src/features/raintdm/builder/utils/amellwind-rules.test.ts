import { describe, expect, it } from "vitest";
import type { ArmorItem, EquippedArmor, EquippedTrinket, Rune } from "@/shared/types";
import { getArtificerLevel, getAttunementInfo } from "./attunement.utils";
import {
  getRuneSlotsForRarity,
  makeArmorSlot,
  makeWeaponSlot,
} from "./equipment.factory";
import { AMELLWIND_UNARMED_ITEM } from "../data/unarmed-item.data";
import {
  fitArmorRarityProperties,
  getArmorRarityBonuses,
  getArmorRarityPropertyCount,
} from "./armor-rarity-properties.utils";
import { resolveStartingEquipmentOffers } from "./amellwind-starting-equipment.utils";
import { exceedsStartingRarity, getStartingRarityCeiling } from "./rarity-guideline.utils";
import { getActiveTrinket, getTrinketMaterialEffect } from "./trinket.utils";

const plate = { name: "Plate", category: "heavy", baseAC: 18 } as ArmorItem;

describe("Artificer (AGMH material slots / D&D attunement)", () => {
  it("counts artificer levels from the primary class or a multiclass entry", () => {
    expect(getArtificerLevel("Artificer", 12, [])).toBe(12);
    expect(
      getArtificerLevel("Fighter", 15, [
        { classRef: { id: "a", name: "Artificer" }, level: 10, subclass: null },
      ]),
    ).toBe(10);
    expect(getArtificerLevel("Fighter", 10, [])).toBe(0);
  });

  it("adds material slots in Amellwind and attunement slots in D&D", () => {
    expect(getAttunementInfo(14, true).artificerBonusMaterialSlots).toBe(2);
    expect(getAttunementInfo(14, false)).toMatchObject({
      attunementSlots: 5,
      artificerBonusMaterialSlots: 0,
    });
    expect(getAttunementInfo(0, false).attunementSlots).toBe(3);
  });

  it("applies bonus slots to armor and weapon rarity slots", () => {
    expect(getRuneSlotsForRarity("Rare", 2)).toBe(5);
    expect(makeArmorSlot(plate, "Uncommon", true, 1).runeSlots).toBe(3);
    expect(makeArmorSlot(plate, "Uncommon", false, 1).runeSlots).toBe(0);
  });

  it("gives the unarmed item one extra slot per rarity", () => {
    expect(makeWeaponSlot(AMELLWIND_UNARMED_ITEM, "Uncommon").runeSlots).toBe(3);
    expect(makeWeaponSlot(AMELLWIND_UNARMED_ITEM, "Common", 1).runeSlots).toBe(3);
  });
});

describe("armor rarity properties", () => {
  it("grants one pick per Rare+ step", () => {
    expect(getArmorRarityPropertyCount("Uncommon")).toBe(0);
    expect(getArmorRarityPropertyCount("Rare")).toBe(1);
    expect(getArmorRarityPropertyCount("Legendary")).toBe(3);
    expect(fitArmorRarityProperties([{ kind: "ac" }, { kind: "ac" }], "Rare")).toEqual([
      { kind: "ac" },
    ]);
  });

  it("resolves AC, skill and save bonuses", () => {
    const armor: EquippedArmor = {
      armor: plate,
      rarity: "Legendary",
      runeSlots: 5,
      runes: [],
      rarityProperties: [
        { kind: "ac" },
        { kind: "skills", skills: ["ath", "prc"] },
        { kind: "unproficient-saves" },
      ],
    };
    const bonuses = getArmorRarityBonuses(
      armor,
      (ability) => ability === "str" || ability === "con",
      true,
    );
    expect(bonuses.ac).toBe(1);
    expect(bonuses.skills).toEqual({ ath: 1, prc: 1 });
    expect(bonuses.saves).toEqual({ dex: 1, int: 1, wis: 1, cha: 1 });
    expect(getArmorRarityBonuses(armor, () => false, false).ac).toBe(0);
  });
});

describe("Amellwind starting equipment", () => {
  const offers = {
    groups: [
      {
        id: "g0",
        options: [
          {
            key: "A",
            items: [
              { id: "1", name: "Greataxe", quantity: 1 },
              { id: "2", name: "Handaxe (×4)", quantity: 4 },
              { id: "3", name: "Explorer's Pack", quantity: 1 },
            ],
          },
          { key: "B", items: [{ id: "4", name: "Martial weapon", quantity: 1 }] },
        ],
      },
      { id: "g1", guaranteed: [{ id: "5", name: "Shield", quantity: 1 }] },
    ],
  };

  it("removes D&D weapons and shields only in Amellwind mode", () => {
    expect(resolveStartingEquipmentOffers(offers, false)).toBe(offers);
    const resolved = resolveStartingEquipmentOffers(offers, true);
    expect(resolved.groups).toEqual([
      {
        id: "g0",
        guaranteed: [{ id: "3", name: "Explorer's Pack", quantity: 1 }],
      },
    ]);
  });
});

describe("rarity guideline and trinkets", () => {
  it("warns above the starting rarity for the level", () => {
    expect(getStartingRarityCeiling(1)).toBe("Common");
    expect(getStartingRarityCeiling(9)).toBe("Rare");
    expect(exceedsStartingRarity("Uncommon", 2)).toBe(true);
    expect(exceedsStartingRarity("Very Rare", 16)).toBe(false);
  });

  it("keeps a single active trinket and its material half", () => {
    const rune = { name: "Scale", armorEffect: "+1 AC", weaponEffect: null } as Rune;
    const t1: EquippedTrinket = { name: "Trophy", rune: null };
    const t2: EquippedTrinket = { name: "Keepsake", rune, active: true };
    expect(getActiveTrinket(t1, t2)).toBe(t2);
    expect(getActiveTrinket(t1, { ...t2, active: false })).toBe(t1);
    expect(getTrinketMaterialEffect(t2)).toBe("armor");
  });
});
