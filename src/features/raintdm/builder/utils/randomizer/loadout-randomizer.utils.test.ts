import { describe, expect, it } from "vitest";
import type { ArmorCategory, ArmorItem, StartingEquipmentOption } from "@/shared/types";
import {
  pickLoadoutArmor,
  pickLoadoutWeapons,
  resolveArchetypeWeaponCandidates,
  scoreStartingEquipmentOption,
  type LoadoutContext,
} from "./loadout-randomizer.utils";

function armor(
  name: string,
  category: ArmorCategory,
  baseAC: number,
  maxDexBonus: number | null,
  stealthDisadvantage = false,
): ArmorItem {
  return {
    name,
    category,
    baseAC,
    maxDexBonus,
    rarity: "Standard",
    itemRarityLabel: "Standard",
    runeSlots: 0,
    stealthDisadvantage,
    weight: 10,
    source: "XPHB",
    contentSource: "dnd",
  };
}

const ARMORS: ArmorItem[] = [
  armor("Leather Armor", "light", 11, null),
  armor("Studded Leather Armor", "light", 12, null),
  armor("Chain Shirt", "medium", 13, 2),
  armor("Scale Mail", "medium", 14, 2, true),
  armor("Breastplate", "medium", 14, 2),
  armor("Chain Mail", "heavy", 16, 0, true),
  armor("Plate Armor", "heavy", 18, 0, true),
  armor("Shield", "shield", 2, null),
];

const ALL_ARMOR = ["light", "medium", "heavy", "shield"];
const MARTIAL = ["simple", "martial"];

function ctx(partial: Partial<LoadoutContext>): LoadoutContext {
  return {
    archetype: "great-weapon",
    className: "Fighter",
    subclassName: null,
    abilities: { str: 17, dex: 14, con: 14, int: 8, wis: 12, cha: 10 },
    weaponProficiencies: MARTIAL,
    armorProficiencies: ALL_ARMOR,
    ...partial,
  };
}

describe("resolveArchetypeWeaponCandidates", () => {
  it("gives great-weapon builds two-handed melee weapons and no shield", () => {
    const candidates = resolveArchetypeWeaponCandidates(ctx({}));
    expect(candidates.main).toContain("Greatsword");
    expect(candidates.main).not.toContain("Longbow");
    expect(candidates.allowShield).toBe(false);
  });

  it("drops weapons the class is not proficient with", () => {
    const candidates = resolveArchetypeWeaponCandidates(
      ctx({ archetype: "sword-board", weaponProficiencies: ["simple"] }),
    );
    expect(candidates.main).toEqual(["Mace", "Spear"]);
  });

  it("never offers a shield to a Bladesinger", () => {
    const candidates = resolveArchetypeWeaponCandidates(
      ctx({ archetype: "gish", className: "Wizard", subclassName: "Bladesinger" }),
    );
    expect(candidates.allowShield).toBe(false);
  });
});

describe("pickLoadoutWeapons", () => {
  it("prefers a weapon already in the starting equipment", () => {
    const loadoutCtx = ctx({});
    const pick = pickLoadoutWeapons(
      resolveArchetypeWeaponCandidates(loadoutCtx),
      new Set(["greataxe"]),
      loadoutCtx,
    );
    expect(pick.mainHand).toBe("Greataxe");
    expect(pick.useShield).toBe(false);
    expect(pick.offHand).toBeNull();
  });

  it("adds a shield to sword-and-board builds", () => {
    const loadoutCtx = ctx({ archetype: "sword-board" });
    const pick = pickLoadoutWeapons(
      resolveArchetypeWeaponCandidates(loadoutCtx),
      new Set(),
      loadoutCtx,
    );
    expect(pick.useShield).toBe(true);
  });

  it("dual-wield builds hold two light weapons", () => {
    const loadoutCtx = ctx({
      archetype: "dual-wield",
      abilities: { str: 10, dex: 17, con: 14 },
    });
    const pick = pickLoadoutWeapons(
      resolveArchetypeWeaponCandidates(loadoutCtx),
      new Set(),
      loadoutCtx,
    );
    expect(pick.mainHand).not.toBeNull();
    expect(pick.offHand).not.toBeNull();
    expect(pick.useShield).toBe(false);
  });
});

describe("pickLoadoutArmor", () => {
  it("takes Chain Mail for a strong heavy-armor build, never Plate", () => {
    const strBuild = ctx({ abilities: { str: 17, dex: 10, con: 14 } });
    expect(pickLoadoutArmor(strBuild, ARMORS, new Set())?.name).toBe("Chain Mail");
  });

  it("on an AC tie prefers armor without Stealth disadvantage", () => {
    // DEX 14: Breastplate 14 + 2 = Chain Mail 16
    expect(pickLoadoutArmor(ctx({}), ARMORS, new Set())?.name).toBe("Breastplate");
  });

  it("skips Chain Mail below STR 13", () => {
    const picked = pickLoadoutArmor(
      ctx({ abilities: { str: 10, dex: 14, con: 14 } }),
      ARMORS,
      new Set(),
    );
    expect(picked?.name).toBe("Breastplate");
  });

  it("DEX builds avoid armor with Stealth disadvantage", () => {
    const picked = pickLoadoutArmor(
      ctx({ archetype: "dex-ranged", abilities: { str: 10, dex: 17, con: 14 } }),
      ARMORS,
      new Set(),
    );
    expect(picked?.stealthDisadvantage).toBe(false);
  });

  it("wears starting-equipment armor when it is wearable", () => {
    const picked = pickLoadoutArmor(ctx({}), ARMORS, new Set(["leather armor"]));
    expect(picked?.name).toBe("Leather Armor");
  });

  it("Monks never wear armor", () => {
    expect(
      pickLoadoutArmor(ctx({ className: "Monk", archetype: "dex-melee" }), ARMORS, new Set()),
    ).toBeNull();
  });

  it("Barbarians skip armor that does not beat Unarmored Defense", () => {
    const picked = pickLoadoutArmor(
      ctx({
        className: "Barbarian",
        armorProficiencies: ["light", "medium", "shield"],
        abilities: { str: 17, dex: 14, con: 16 },
      }),
      ARMORS,
      new Set(),
    );
    // 10 + DEX 2 + CON 3 = 15 vs Breastplate 14 + 2 = 16
    expect(picked?.name).toBe("Breastplate");

    const tough = pickLoadoutArmor(
      ctx({
        className: "Barbarian",
        armorProficiencies: ["light", "medium", "shield"],
        abilities: { str: 17, dex: 14, con: 20 },
      }),
      ARMORS,
      new Set(),
    );
    expect(tough).toBeNull();
  });

  it("non-proficient casters wear nothing", () => {
    expect(
      pickLoadoutArmor(
        ctx({ className: "Wizard", archetype: "caster", armorProficiencies: [] }),
        ARMORS,
        new Set(),
      ),
    ).toBeNull();
  });
});

describe("scoreStartingEquipmentOption", () => {
  const candidates = resolveArchetypeWeaponCandidates(ctx({}));
  const item = (name: string) => ({ id: name, name, quantity: 1 });
  const gold: StartingEquipmentOption = { key: "C", items: [item("155 gp")] };
  const gear: StartingEquipmentOption = {
    key: "A",
    items: [item("Chain Mail"), item("Greatsword"), item("Javelin")],
  };
  const dexGear: StartingEquipmentOption = {
    key: "B",
    items: [item("Studded Leather Armor"), item("Scimitar"), item("Longbow")],
  };
  const wearable = (name: string) => /mail|leather/i.test(name);

  it("ranks the package that fits the archetype first and gold last", () => {
    const scores = [gear, dexGear, gold].map((option) =>
      scoreStartingEquipmentOption(option, candidates, wearable),
    );
    expect(scores[0]).toBeGreaterThan(scores[1]!);
    expect(scores[2]).toBeLessThan(scores[1]!);
  });

  it("without a loadout (Amellwind) only gold-only packages are penalized", () => {
    expect(scoreStartingEquipmentOption(gear, null, wearable)).toBe(0);
    expect(scoreStartingEquipmentOption(gold, null, wearable)).toBeLessThan(0);
  });
});
