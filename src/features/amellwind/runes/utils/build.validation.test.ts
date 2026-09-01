import { describe, expect, it } from "vitest";
import type { Rune } from "@/shared/types";
import {
  getArmorViolations,
  getWeaponViolations,
  hasTagPrefix,
  wouldViolateRule,
} from "./build.validation";

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

describe("hasTagPrefix", () => {
  it("matches exact and scaled mechanic tags", () => {
    expect(hasTagPrefix(["mechanic:extra-damage:minor"], "mechanic:extra-damage")).toBe(
      true,
    );
    expect(hasTagPrefix(["mechanic:extra-damage:major"], "mechanic:extra-damage")).toBe(
      true,
    );
    expect(hasTagPrefix(["mechanic:extra-damage"], "mechanic:extra-damage")).toBe(true);
    expect(hasTagPrefix(["mechanic:condition"], "mechanic:extra-damage")).toBe(false);
  });
});

describe("weapon rule 2 — extra damage exclusivity", () => {
  const blackfur = makeRune({
    name: "Rajang Blackfur",
    weaponEffect: "Your weapon deals an extra {@damage 1d6} lightning damage.",
    weaponTags: ["mechanic:extra-damage:minor", "type:offensive", "damage:lightning"],
  });
  const electroscale = makeRune({
    name: "Electroscale",
    weaponEffect: "Your weapon deals an extra {@damage 1d6} lightning damage.",
    weaponTags: ["mechanic:extra-damage:minor", "type:offensive", "damage:lightning"],
  });

  it("flags two extra-damage materials as a violation", () => {
    const violations = getWeaponViolations([blackfur, electroscale]);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toMatch(/rule 2/);
    expect(violations[0].offenders).toEqual(["Rajang Blackfur", "Electroscale"]);
  });

  it("warns via wouldViolateRule before adding the second extra-damage rune", () => {
    const warning = wouldViolateRule(electroscale, [blackfur, null], "weapon");
    expect(warning).not.toBeNull();
    expect(warning?.rule).toMatch(/rule 2/);
    expect(warning?.offenders).toContain("Electroscale");
    expect(warning?.offenders).toContain("Rajang Blackfur");
  });

  it("allows a single extra-damage material", () => {
    expect(getWeaponViolations([blackfur, null])).toEqual([]);
  });
});

describe("weapon rule 2 — exceptions", () => {
  const extraDamage = makeRune({
    name: "Extra Spark",
    weaponEffect: "Your weapon deals an extra {@damage 1d6} lightning damage.",
    weaponTags: ["mechanic:extra-damage:minor", "damage:lightning"],
  });

  it("exempts critical (rule 1) materials from rule 2", () => {
    const crit = makeRune({
      name: "Critical Fang",
      weaponEffect:
        "When you roll a 20 on an attack roll with this weapon, the target is {@condition stunned}.",
      weaponTags: ["mechanic:critical", "mechanic:condition"],
    });
    expect(getWeaponViolations([extraDamage, crit])).toEqual([]);
  });

  it("treats roll-20 materials as the same nat-20 exclusivity group as critical", () => {
    const roll20 = makeRune({
      name: "Tetranadon Beak",
      weaponTags: [
        "mechanic:roll-20",
        "mechanic:push",
        "mechanic:no-damage",
        "mechanic:unarmed",
      ],
    });
    const namedCrit = makeRune({
      name: "Critical Fang",
      weaponTags: ["mechanic:critical", "mechanic:roll-20"],
    });
    const violations = getWeaponViolations([roll20, namedCrit]);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toMatch(/rule 1/);
  });

  it("exempts roll-20 (rule 1) materials from rule 2", () => {
    const roll20 = makeRune({
      name: "Tetranadon Beak",
      weaponTags: [
        "mechanic:roll-20",
        "mechanic:push",
        "mechanic:no-damage",
        "mechanic:unarmed",
      ],
    });
    expect(getWeaponViolations([extraDamage, roll20])).toEqual([]);
  });

  it("exempts conditional extra damage from the extra-damage part of rule 2", () => {
    const pureConditional = makeRune({
      name: "Fright Burn",
      weaponEffect:
        "Your weapon deals an extra {@damage 1d6} fire damage if the target is {@condition frightened}.",
      weaponTags: [
        "mechanic:extra-damage:minor",
        "mechanic:condition",
        "damage:fire",
      ],
    });
    expect(getWeaponViolations([extraDamage, pureConditional])).toEqual([]);

    const alsoInflicts = makeRune({
      name: "Venom Edge",
      weaponEffect:
        "On a hit, the target must succeed on a Constitution saving throw or be {@condition poisoned}. Your weapon also deals an extra {@damage 1d6} poison damage if the target is {@condition poisoned}.",
      weaponTags: [
        "mechanic:extra-damage:minor",
        "mechanic:condition",
        "mechanic:saving-throw",
        "damage:poison",
      ],
    });
    expect(getWeaponViolations([extraDamage, alsoInflicts])).toHaveLength(1);
  });
});

describe("weapon rule 4 — spell buff exclusivity", () => {
  it("flags two spell-buff materials", () => {
    const a = makeRune({
      name: "Arcane Horn",
      weaponTags: ["mechanic:spell-buff:save"],
    });
    const b = makeRune({
      name: "Caster Claw",
      weaponTags: ["mechanic:spell-buff:damage"],
    });
    const violations = getWeaponViolations([a, b]);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toMatch(/rule 4/);
  });
});

describe("armor rules", () => {
  it("flags two elemental resistance materials (rule 1)", () => {
    const a = makeRune({
      name: "Scale A",
      armorTags: ["mechanic:resistance", "damage:fire"],
    });
    const b = makeRune({
      name: "Scale B",
      armorTags: ["mechanic:resistance", "damage:lightning"],
    });
    const violations = getArmorViolations([a, b]);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toMatch(/rule 1/);
  });

  it("flags two condition-advantage materials (rule 2)", () => {
    const a = makeRune({
      name: "Steady Plate",
      armorTags: ["mechanic:advantage", "mechanic:condition"],
    });
    const b = makeRune({
      name: "Fearless Hide",
      armorTags: ["mechanic:immunity", "mechanic:condition"],
    });
    const violations = getArmorViolations([a, b]);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toMatch(/rule 2/);
  });

  it("does not treat condition immunity as elemental immunity (rule 1)", () => {
    const elemental = makeRune({
      name: "Fire Plate",
      armorTags: ["mechanic:immunity", "damage:fire"],
    });
    const vsCondition = makeRune({
      name: "Antivenom",
      armorTags: ["mechanic:immunity", "mechanic:condition"],
    });
    expect(getArmorViolations([elemental, vsCondition])).toEqual([]);
  });

  it("allows Guard Up alongside a real AC bonus (rule 3)", () => {
    const ironWall = makeRune({
      name: "Iron Wall Material",
      armorEffect:
        "Iron Wall. You have a +2 bonus to your armor class while you wear this armor.",
      armorTags: ["mechanic:armor-class", "mechanic:passive", "type:defensive"],
    });
    const guardUp = makeRune({
      name: "Heavy Rustrazor Scalp",
      armorEffect:
        "Guard Up When you fail a Dexterity or Strength saving throw, you can use your reaction to expend 1 of its runes to use your AC in place of your roll. You can use this property a number of times equal to your Constitution modifier, regaining all expended uses when you finish a long rest.",
      armorTags: [
        "mechanic:guard-up",
        "mechanic:reaction",
        "mechanic:saving-throw",
        "type:defensive",
      ],
    });

    expect(getArmorViolations([ironWall, guardUp])).toEqual([]);
    expect(wouldViolateRule(ironWall, [guardUp], "armor")).toBeNull();
    expect(wouldViolateRule(guardUp, [ironWall], "armor")).toBeNull();
  });

  it("flags two real AC bonus materials (rule 3)", () => {
    const a = makeRune({
      name: "Iron Wall A",
      armorEffect: "You have a +2 bonus to your AC while you wear this armor.",
      armorTags: ["mechanic:armor-class", "mechanic:passive"],
    });
    const b = makeRune({
      name: "Iron Wall B",
      armorEffect: "You have a +1 bonus to your AC while you wear this armor.",
      armorTags: ["mechanic:armor-class", "mechanic:passive"],
    });
    const violations = getArmorViolations([a, b]);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toMatch(/rule 3/);
  });
});
