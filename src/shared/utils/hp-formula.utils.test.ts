import { describe, expect, it } from "vitest";
import { getMaxHpFromFormula } from "./hp-formula.utils";

describe("getMaxHpFromFormula", () => {
  it("parses standard dice formulas", () => {
    expect(getMaxHpFromFormula("5d12+35")).toBe(95);
    expect(getMaxHpFromFormula("18d10+108")).toBe(288);
  });

  it("parses flat-only formulas", () => {
    expect(getMaxHpFromFormula("45")).toBe(45);
  });

  it("returns null for invalid formulas", () => {
    expect(getMaxHpFromFormula("")).toBeNull();
    expect(getMaxHpFromFormula("abc")).toBeNull();
  });
});
