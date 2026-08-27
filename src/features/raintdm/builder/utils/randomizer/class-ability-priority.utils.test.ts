import { describe, expect, it } from "vitest";
import type { Class } from "@/shared/types";
import {
  pickPreferredAbility,
  resolveClassAbilityPriority,
} from "./class-ability-priority.utils";

const CLERIC: Pick<Class, "spellcastingAbility" | "saveProficiencies"> = {
  spellcastingAbility: "Wisdom",
  saveProficiencies: ["wis", "cha"],
};

const FIGHTER: Pick<Class, "name" | "spellcastingAbility" | "saveProficiencies"> = {
  name: "Fighter",
  spellcastingAbility: undefined,
  saveProficiencies: ["str", "con"],
};

const MONK: Pick<Class, "name" | "spellcastingAbility" | "saveProficiencies"> = {
  name: "Monk",
  spellcastingAbility: "Wisdom",
  saveProficiencies: ["str", "dex"],
};

describe("resolveClassAbilityPriority", () => {
  it("prioritizes casting stat and CON for spellcasters", () => {
    const priority = resolveClassAbilityPriority(CLERIC as Class, null);
    expect(priority.slice(0, 3)).toEqual(["wis", "con", "cha"]);
  });

  it("prioritizes DEX and WIS for Monk over save order", () => {
    const priority = resolveClassAbilityPriority(MONK as Class, null);
    expect(priority.slice(0, 3)).toEqual(["dex", "wis", "con"]);
  });

  it("does not inject CON before saves for non-casters", () => {
    const priority = resolveClassAbilityPriority(FIGHTER as Class, null);
    expect(priority.slice(0, 2)).toEqual(["str", "con"]);
  });
});

describe("pickPreferredAbility", () => {
  it("picks the highest-priority option available", () => {
    const pick = pickPreferredAbility(
      ["str", "dex", "wis", "con"],
      ["wis", "con", "cha"],
    );
    expect(pick).toBe("wis");
  });

  it("picks DEX for Athlete on a Monk build", () => {
    const pick = pickPreferredAbility(["str", "dex"], ["dex", "wis", "con"]);
    expect(pick).toBe("dex");
  });

  it("falls back to the first listed option when no priority matches", () => {
    const pick = pickPreferredAbility(["str", "dex"], ["wis", "con"]);
    expect(pick).toBe("str");
  });
});
