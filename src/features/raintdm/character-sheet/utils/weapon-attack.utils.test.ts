import { describe, expect, it } from "vitest";
import {
  getWeaponAttackAbility,
  isLightProperty,
  weaponAttackMods,
} from "./weapon-attack.utils";

describe("weapon attack ability", () => {
  it("greataxe uses STR", () => {
    expect(getWeaponAttackAbility([], 4, 2)).toBe("str");
  });

  it("longbow uses DEX", () => {
    expect(getWeaponAttackAbility(["A"], 4, 2)).toBe("dex");
    expect(getWeaponAttackAbility(["Ammunition"], 4, 2)).toBe("dex");
  });

  it("finesse shortsword picks higher mod", () => {
    expect(getWeaponAttackAbility(["F"], 3, 4)).toBe("dex");
    expect(getWeaponAttackAbility(["Finesse"], 5, 2)).toBe("str");
  });
});

describe("isLightProperty", () => {
  it("detects L and Light", () => {
    expect(isLightProperty(["L"])).toBe(true);
    expect(isLightProperty(["Light"])).toBe(true);
    expect(isLightProperty(["F"])).toBe(false);
  });
});

describe("weaponAttackMods", () => {
  it("omits damage mod for off-hand light", () => {
    const { attackBonus, damageMod } = weaponAttackMods(
      ["L", "F"],
      3,
      4,
      2,
      { omitDamageMod: true },
    );
    expect(attackBonus).toBe(6);
    expect(damageMod).toBe(0);
  });
});
