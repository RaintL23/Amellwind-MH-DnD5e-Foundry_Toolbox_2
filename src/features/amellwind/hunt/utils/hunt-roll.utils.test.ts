import { describe, expect, it } from "vitest";
import type { Environment, Monster } from "@/shared/types";
import {
  environmentMatchesMonster,
  getCompatibleEnvironments,
  getCompatibleMonsters,
  isWideHabitatMonster,
  resolveFindingSignsRoll,
} from "./hunt-roll.utils";

function stubMonster(
  name: string,
  environment?: string[],
): Monster {
  return { name, environment } as unknown as Monster;
}

function stubEnvironment(name: string): Environment {
  return {
    name,
    biome: name,
    navigationDC: 10,
    encounterDC: 10,
    investigationDC: 10,
    totalResources: 1,
    commonWeather: "",
    specialRules: [],
    levelTiers: [],
  };
}

describe("resolveFindingSignsRoll", () => {
  it("uses manual roll when provided", () => {
    const result = resolveFindingSignsRoll(true, 0, { manualRoll: 18 });
    expect(result.rawRoll).toBe(18);
    expect(result.adjustedRoll).toBe(18);
    expect(result.signs).toBe(1);
  });

  it("clamps manual roll to die sides", () => {
    const fail = resolveFindingSignsRoll(false, 0, { manualRoll: 15 });
    expect(fail.dieSides).toBe(10);
    expect(fail.rawRoll).toBe(10);
  });

  it("applies flat bonus after manual roll", () => {
    const result = resolveFindingSignsRoll(true, 2, { manualRoll: 16 });
    expect(result.adjustedRoll).toBe(18);
    expect(result.event).toBe("sign");
  });
});

describe("wide habitat monster matching", () => {
  const ocean = stubEnvironment("Ocean");
  const verdant = stubEnvironment("Verdant Hills");
  const rathalos = stubMonster("Rathalos", [
    "desert",
    "forest",
    "grassland",
    "hill",
    "mountain",
    "swamp",
    "urban",
  ]);
  const greatJagras = stubMonster("Great Jagras", ["forest", "hill"]);
  const untagged = stubMonster("Mystery Pup");

  it("treats multi-biome quarry as wide-ranging", () => {
    expect(isWideHabitatMonster(rathalos)).toBe(true);
    expect(isWideHabitatMonster(greatJagras)).toBe(false);
  });

  it("keeps Rathalos available in Ocean despite no coastal/underwater tags", () => {
    expect(environmentMatchesMonster(ocean, rathalos)).toBe(true);
    expect(
      getCompatibleMonsters(ocean, [rathalos, greatJagras]).map((m) => m.name),
    ).toEqual(["Rathalos"]);
  });

  it("still requires tag overlap for narrow-habitat monsters", () => {
    expect(environmentMatchesMonster(ocean, greatJagras)).toBe(false);
    expect(environmentMatchesMonster(verdant, greatJagras)).toBe(true);
  });

  it("includes untagged monsters in any environment pool", () => {
    expect(environmentMatchesMonster(ocean, untagged)).toBe(true);
    expect(
      getCompatibleMonsters(verdant, [untagged, greatJagras]).map((m) => m.name),
    ).toEqual(["Mystery Pup", "Great Jagras"]);
  });

  it("lists every hunt environment for wide-habitat targets", () => {
    const envs = [
      stubEnvironment("Ocean"),
      stubEnvironment("Verdant Hills"),
      stubEnvironment("The Dunes"),
    ];
    expect(getCompatibleEnvironments([rathalos], envs)).toHaveLength(3);
    expect(getCompatibleEnvironments([greatJagras], envs).map((e) => e.name)).toEqual([
      "Verdant Hills",
    ]);
  });
});
