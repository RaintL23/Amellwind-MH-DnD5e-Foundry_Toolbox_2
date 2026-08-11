import { describe, expect, it } from "vitest";
import type { Weapon } from "@/shared/types";
import {
  checkPhbWeaponNameProficiency,
  checkWeaponProficiency,
  hasMartialFinesseOrLightGrant,
} from "./equipment-proficiency.utils";

const ROGUE_XPHB_WEAPONS = [
  "Simple",
  "Martial weapons that have the Finesse or Light property",
];

function amellwindWeapon(
  name: string,
  properties: string[],
): Weapon {
  return {
    name,
    source: "RAINTDM",
    contentSource: "amellwind",
    dmg1: "1d6",
    dmgType: "P",
    properties,
    weight: 1,
    valueCp: 0,
    description: "",
    supplementaryNotes: [],
    rarityRows: [],
    baseFeatureNames: [],
  };
}

function dndMartialWeapon(name: string, properties: string[]): Weapon {
  return {
    ...amellwindWeapon(name, properties),
    contentSource: "dnd",
    source: "XPHB",
    weaponCategory: "martial",
  };
}

describe("hasMartialFinesseOrLightGrant", () => {
  it("detects the XPHB Rogue prose grant", () => {
    expect(hasMartialFinesseOrLightGrant(ROGUE_XPHB_WEAPONS)).toBe(true);
  });

  it("ignores plain Simple / Martial labels", () => {
    expect(hasMartialFinesseOrLightGrant(["Simple", "Martial"])).toBe(false);
  });
});

describe("checkWeaponProficiency — XPHB Rogue martial Finesse/Light grant", () => {
  it("allows Dual Repeaters via Hand Crossbow compatibility", () => {
    const result = checkWeaponProficiency(
      "Dual Repeaters",
      ROGUE_XPHB_WEAPONS,
      [],
      amellwindWeapon("Dual Repeaters", ["A", "L"]),
    );
    expect(result.allowed).toBe(true);
    expect(result.effectiveTier).toBe("martial");
  });

  it("allows Dual Repeaters by name only (equipped-gear conflict path)", () => {
    const result = checkWeaponProficiency(
      "Dual Repeaters",
      ROGUE_XPHB_WEAPONS,
      [],
    );
    expect(result.allowed).toBe(true);
  });

  it("allows Dual Blades (martial + Light)", () => {
    const result = checkWeaponProficiency(
      "Dual Blades",
      ROGUE_XPHB_WEAPONS,
      [],
      amellwindWeapon("Dual Blades", ["F", "L"]),
    );
    expect(result.allowed).toBe(true);
  });

  it("denies Great Sword (martial without Finesse/Light)", () => {
    const result = checkWeaponProficiency(
      "Great Sword",
      ROGUE_XPHB_WEAPONS,
      [],
      amellwindWeapon("Great Sword", ["H", "2H"]),
    );
    expect(result.allowed).toBe(false);
  });

  it("allows D&D Hand Crossbow (martial + Light)", () => {
    const result = checkWeaponProficiency(
      "Hand Crossbow",
      ROGUE_XPHB_WEAPONS,
      [],
      dndMartialWeapon("Hand Crossbow", ["A", "L", "LD"]),
    );
    expect(result.allowed).toBe(true);
  });

  it("denies D&D Longsword (martial without Finesse/Light)", () => {
    const result = checkWeaponProficiency(
      "Longsword",
      ROGUE_XPHB_WEAPONS,
      [],
      dndMartialWeapon("Longsword", ["V"]),
    );
    expect(result.allowed).toBe(false);
  });

  it("allows D&D Rapier (martial + Finesse)", () => {
    const result = checkWeaponProficiency(
      "Rapier",
      ROGUE_XPHB_WEAPONS,
      [],
      dndMartialWeapon("Rapier", ["F"]),
    );
    expect(result.allowed).toBe(true);
  });
});

describe("checkPhbWeaponNameProficiency — mastery picker", () => {
  it("allows Shortsword and Hand Crossbow for XPHB Rogue", () => {
    expect(
      checkPhbWeaponNameProficiency("Shortsword", "martial", ROGUE_XPHB_WEAPONS)
        .allowed,
    ).toBe(true);
    expect(
      checkPhbWeaponNameProficiency(
        "Hand Crossbow",
        "martial",
        ROGUE_XPHB_WEAPONS,
      ).allowed,
    ).toBe(true);
  });

  it("denies Greataxe for XPHB Rogue", () => {
    expect(
      checkPhbWeaponNameProficiency("Greataxe", "martial", ROGUE_XPHB_WEAPONS)
        .allowed,
    ).toBe(false);
  });
});
