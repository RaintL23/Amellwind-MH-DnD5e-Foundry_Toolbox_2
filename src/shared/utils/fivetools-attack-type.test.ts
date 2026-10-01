import { describe, expect, it } from "vitest";
import {
  formatFiveToolsAttackType,
  parseFiveToolsMarkup,
} from "./fivetools-parser";

describe("formatFiveToolsAttackType", () => {
  it("expands 2024 single-letter codes", () => {
    expect(formatFiveToolsAttackType("m")).toBe("Melee Attack:");
    expect(formatFiveToolsAttackType("r")).toBe("Ranged Attack:");
  });

  it("expands classic weapon/spell codes", () => {
    expect(formatFiveToolsAttackType("mw")).toBe("Melee Weapon Attack:");
    expect(formatFiveToolsAttackType("rw")).toBe("Ranged Weapon Attack:");
    expect(formatFiveToolsAttackType("ms")).toBe("Melee Spell Attack:");
    expect(formatFiveToolsAttackType("rs")).toBe("Ranged Spell Attack:");
  });

  it("expands combined codes with SRD phrasing", () => {
    expect(formatFiveToolsAttackType("mw,rw")).toBe(
      "Melee or Ranged Weapon Attack:",
    );
    expect(formatFiveToolsAttackType("m,r")).toBe("Melee or Ranged Attack:");
  });
});

describe("parseFiveToolsMarkup atk tags", () => {
  it("does not leave a bare M before Attack", () => {
    expect(parseFiveToolsMarkup("{@atk m} {@hit 6}")).toBe(
      "Melee Attack: +6 to hit",
    );
    expect(parseFiveToolsMarkup("{@atkr m} {@hit 6}")).toBe(
      "Melee Attack: +6 to hit",
    );
  });
});
