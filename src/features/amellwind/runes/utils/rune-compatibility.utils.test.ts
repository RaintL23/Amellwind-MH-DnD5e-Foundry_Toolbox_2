import { describe, expect, it } from "vitest";
import type { Rune } from "@/shared/types";
import {
  runeEffectMatchesListFilters,
  runeMatchesListTagFilter,
} from "./rune-compatibility.utils";
import type { MaterialEffectNameIndex } from "@/features/amellwind/material-effects/utils/material-effect-highlight.utils";
import { UNKNOWN_MATERIAL_EFFECT_TIER } from "@/features/amellwind/material-effects/constants/material-effect.constants";

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
    otherEffect: null,
    tags: [],
    weaponTags: [],
    armorTags: [],
    ...partial,
  };
}

const fireImmunityArmor = makeRune({
  name: "Rathalos Scale",
  armorEffect: "You are immune to fire damage while you wear this armor.",
  weaponEffect: "Your weapon deals an extra {@damage 1d6} fire damage.",
  armorTags: [
    "mechanic:immunity",
    "damage:fire",
    "type:defensive",
  ],
  weaponTags: [
    "mechanic:extra-damage:minor",
    "damage:fire",
    "type:offensive",
  ],
  tags: [
    "mechanic:immunity",
    "damage:fire",
    "type:defensive",
    "mechanic:extra-damage:minor",
    "type:offensive",
  ],
});

const splitTags = makeRune({
  name: "Split Material",
  armorEffect: "You are immune to poison damage while you wear this armor.",
  weaponEffect: "Your weapon deals an extra {@damage 1d6} fire damage.",
  armorTags: ["mechanic:immunity", "damage:poison", "type:defensive"],
  weaponTags: ["mechanic:extra-damage:minor", "damage:fire", "type:offensive"],
  tags: [
    "mechanic:immunity",
    "damage:poison",
    "type:defensive",
    "mechanic:extra-damage:minor",
    "damage:fire",
    "type:offensive",
  ],
});

/** Empty index → getMaterialEffectTierForText falls through to Unknown / tag inference. */
const emptyIndex: MaterialEffectNameIndex = {
  all: [],
  bySlot: { weapon: [], armor: [] },
  byKey: new Map(),
};

describe("runeMatchesListTagFilter", () => {
  it("requires fire and immunity to appear together on the armor effect", () => {
    expect(
      runeMatchesListTagFilter(
        fireImmunityArmor,
        ["damage:fire", "mechanic:immunity"],
        "A",
      ),
    ).toBe(true);
  });

  it("does not match armor slot when immunity lives on armor but fire only on weapon", () => {
    expect(
      runeMatchesListTagFilter(
        splitTags,
        ["damage:fire", "mechanic:immunity"],
        "A",
      ),
    ).toBe(false);
  });

  it("matches without a slot filter when one side has every selected tag", () => {
    expect(
      runeMatchesListTagFilter(fireImmunityArmor, [
        "damage:fire",
        "mechanic:immunity",
      ]),
    ).toBe(true);
  });

  it("does not match combined tags that are split across armor and weapon", () => {
    expect(
      runeMatchesListTagFilter(splitTags, [
        "damage:fire",
        "mechanic:immunity",
      ]),
    ).toBe(false);
  });
});

describe("runeEffectMatchesListFilters", () => {
  const tetsucabraClaw = makeRune({
    name: "Tetsucabra Claw",
    armorEffect: "Expert Fisherman. When you catch fish, you instead catch two.",
    weaponEffect:
      "While attuned this weapon, you can cast the mold earth cantrip at will.",
    armorTags: [],
    weaponTags: ["mechanic:cantrip", "mechanic:passive"],
  });

  it("matches both sides when no effect-scoped filters are active", () => {
    const filters = {
      slot: "" as const,
      tag: [],
      materialEffectTier: [],
      materialEffectName: [],
    };
    expect(
      runeEffectMatchesListFilters(tetsucabraClaw, "armor", filters, emptyIndex),
    ).toBe(true);
    expect(
      runeEffectMatchesListFilters(
        tetsucabraClaw,
        "weapon",
        filters,
        emptyIndex,
      ),
    ).toBe(true);
  });

  it("dims the side whose material-effect tier is outside the filter", () => {
    const filters = {
      slot: "" as const,
      tag: [],
      materialEffectTier: [UNKNOWN_MATERIAL_EFFECT_TIER],
      materialEffectName: [],
    };
    // Armor has no catalog/inferred rarity → Unknown
    expect(
      runeEffectMatchesListFilters(tetsucabraClaw, "armor", filters, emptyIndex),
    ).toBe(true);
    // Weapon has cantrip tag → Common, not Unknown
    expect(
      runeEffectMatchesListFilters(
        tetsucabraClaw,
        "weapon",
        filters,
        emptyIndex,
      ),
    ).toBe(false);
  });

  it("respects slot filter independently of tags/tiers", () => {
    const filters = {
      slot: "A" as const,
      tag: [],
      materialEffectTier: [],
      materialEffectName: [],
    };
    expect(
      runeEffectMatchesListFilters(tetsucabraClaw, "armor", filters, emptyIndex),
    ).toBe(true);
    expect(
      runeEffectMatchesListFilters(
        tetsucabraClaw,
        "weapon",
        filters,
        emptyIndex,
      ),
    ).toBe(false);
  });

  it("requires tags on the same effect side", () => {
    const filters = {
      slot: "" as const,
      tag: ["mechanic:cantrip"],
      materialEffectTier: [],
      materialEffectName: [],
    };
    expect(
      runeEffectMatchesListFilters(tetsucabraClaw, "armor", filters, emptyIndex),
    ).toBe(false);
    expect(
      runeEffectMatchesListFilters(
        tetsucabraClaw,
        "weapon",
        filters,
        emptyIndex,
      ),
    ).toBe(true);
  });
});
