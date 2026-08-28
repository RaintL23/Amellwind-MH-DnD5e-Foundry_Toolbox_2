import { describe, expect, it } from "vitest";
import type { Monster } from "@/shared/types";
import {
  getAveragePartyLevel,
  getHuntCombatDifficulty,
  getHuntHpMultiplier,
  getScaledBossHp,
  getTotalTargetCr,
} from "./hunt-party.utils";

function makeMonster(cr: string, hp: { average?: number; formula?: string }): Monster {
  return {
    name: "Test Monster",
    source: "test",
    cr,
    size: "M",
    type: { type: "beast" },
    alignment: [],
    armorClass: [{ ac: 13 }],
    hp,
    speed: { walk: 30 },
    initiative: 0,
    proficiencyBonus: 2,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    savingThrows: {},
    skills: {},
    passivePerception: 10,
    senses: {},
    damageImmunities: [],
    damageResistances: [],
    damageVulnerabilities: [],
    conditionImmunities: [],
    languages: [],
    traits: [],
    actions: [],
    reactions: [],
  } as Monster;
}

describe("hunt-party.utils", () => {
  it("calculates average party level rounded down", () => {
    expect(getAveragePartyLevel([3, 4, 5, 6])).toBe(4);
    expect(getAveragePartyLevel([1, 2])).toBe(1);
  });

  it("sums target CR", () => {
    const monsters = [makeMonster("2", {}), makeMonster("3", {})];
    expect(getTotalTargetCr(monsters)).toBe(5);
  });

  it("applies Amellwind HP multipliers for 3/4/5 PCs", () => {
    expect(getHuntHpMultiplier(3)).toEqual({ multiplier: 1, label: expect.any(String) });
    expect(getHuntHpMultiplier(4).multiplier).toBe(1.5);
    expect(getHuntHpMultiplier(5).multiplier).toBe(2);
    expect(getHuntHpMultiplier(6).multiplier).toBeNull();
  });

  it("scales boss HP from formula", () => {
    const monster = makeMonster("5", { formula: "5d12+35", average: 67 });
    const scaled = getScaledBossHp(monster, 4);
    expect(scaled.baseMaxHp).toBe(95);
    expect(scaled.scaledHp).toBe(143);
  });

  it("rates combat difficulty from APL vs total CR", () => {
    const result = getHuntCombatDifficulty(5, 20, 4);
    expect(result.rating).toBe("medium");
  });
});
