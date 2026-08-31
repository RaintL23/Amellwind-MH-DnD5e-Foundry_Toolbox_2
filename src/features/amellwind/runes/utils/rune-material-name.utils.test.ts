import { describe, expect, it } from "vitest";
import {
  materialLootNamesMatch,
  normalizeMaterialLootName,
  parseMaterialNameParts,
  stripMaterialQuantity,
} from "./rune-material-name.utils";

describe("normalizeMaterialLootName", () => {
  it("collapses tier spacing and trailing periods", () => {
    expect(normalizeMaterialLootName("Evade Extender (S).")).toBe(
      "evade extender (s)",
    );
    expect(normalizeMaterialLootName("Deadly Poison +1")).toBe(
      "deadly poison+1",
    );
    expect(normalizeMaterialLootName("Honey Hunter+")).toBe("honey hunter+");
  });
});

describe("materialLootNamesMatch", () => {
  it("matches quantity-suffixed loot rows to base effect names", () => {
    expect(materialLootNamesMatch("B.Sleep Sac x2", "B.Sleep Sac")).toBe(true);
    expect(materialLootNamesMatch("Elder Dragon Blood X2", "Elder Dragon Blood")).toBe(
      true,
    );
  });

  it("matches loose MH tier suffixes but not different numeric tiers", () => {
    expect(materialLootNamesMatch("Honey Hunter", "Honey Hunter+")).toBe(true);
    expect(materialLootNamesMatch("Deadeye+", "Deadeye")).toBe(true);
    expect(materialLootNamesMatch("Deadly Poison+1", "Deadly Poison+1")).toBe(
      true,
    );
    expect(materialLootNamesMatch("Deadly Poison+1", "Deadly Poison+2")).toBe(
      false,
    );
  });
});

describe("parseMaterialNameParts", () => {
  it("parses bare plus and numeric tier suffixes", () => {
    expect(parseMaterialNameParts("Marathon Runner+")).toEqual({
      base: "Marathon Runner",
      tierSuffix: "+",
    });
    expect(parseMaterialNameParts("Coalescence +2")).toEqual({
      base: "Coalescence",
      tierSuffix: "+2",
    });
  });
});

describe("stripMaterialQuantity", () => {
  it("removes leading and trailing quantity multipliers", () => {
    expect(stripMaterialQuantity("2x Paddock Oil")).toBe("Paddock Oil");
    expect(stripMaterialQuantity("B.Sleep Sac x2")).toBe("B.Sleep Sac");
  });
});
