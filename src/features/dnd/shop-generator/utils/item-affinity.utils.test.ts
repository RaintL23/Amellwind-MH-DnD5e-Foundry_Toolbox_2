import { describe, expect, it } from "vitest";
import {
  affinityMatchMultiplier,
  bestAffinityMultiplier,
} from "./item-affinity.utils";
import {
  getAbilityAffinity,
  getClassAffinity,
  getIntendedUseAffinity,
} from "../data/class-affinity.data";
import type { DndItem } from "@/shared/types";

function stubItem(partial: Partial<DndItem> & Pick<DndItem, "name">): DndItem {
  return {
    id: partial.id ?? "x",
    name: partial.name,
    source: partial.source ?? "DMG",
    rarity: partial.rarity ?? "rare",
    rarityLabel: partial.rarityLabel ?? "Rare",
    typeLabel: partial.typeLabel ?? "Wondrous Item",
    isMundane: false,
    isMagic: true,
    isItemGroup: false,
    isBaseItem: false,
    isGenericVariant: false,
    isSpecificVariant: false,
    attunement: partial.attunement ?? null,
    weight: null,
    valueGp: null,
    valueCp: null,
    baseValueCp: null,
    description: [],
    searchText: partial.searchText ?? partial.name.toLowerCase(),
    category: "Other",
    properties: partial.properties ?? null,
  };
}

describe("item affinity matching", () => {
  it("strongly boosts signature wizard gear and attunement", () => {
    const wizard = getClassAffinity("wizard");
    expect(wizard).toBeTruthy();
    const grimoire = stubItem({
      name: "+2 Arcane Grimoire",
      typeLabel: "Wondrous Item",
      attunement: "Requires attunement by a wizard",
    });
    const random = stubItem({
      name: "Potion of Climbing",
      typeLabel: "Potion",
    });
    expect(affinityMatchMultiplier(grimoire, wizard!)).toBeGreaterThan(
      affinityMatchMultiplier(random, wizard!),
    );
  });

  it("recognizes defensive and strength focuses from community staples", () => {
    const defensive = getIntendedUseAffinity("defensive")!;
    const strength = getAbilityAffinity("strength")!;
    const cloak = stubItem({
      name: "Cloak of Protection",
      typeLabel: "Wondrous Item",
    });
    const belt = stubItem({
      name: "Belt of Hill Giant Strength",
      typeLabel: "Wondrous Item",
    });
    expect(affinityMatchMultiplier(cloak, defensive)).toBeGreaterThan(1.5);
    expect(affinityMatchMultiplier(belt, strength)).toBeGreaterThan(1.5);
    expect(
      bestAffinityMultiplier(belt, [defensive, strength]),
    ).toBeGreaterThan(1.5);
  });
});
