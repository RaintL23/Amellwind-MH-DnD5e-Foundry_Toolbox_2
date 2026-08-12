import { describe, expect, it } from "vitest";
import type { Rune } from "@/shared/types";
import { runeMatchesListTagFilter } from "./rune-compatibility.utils";

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
