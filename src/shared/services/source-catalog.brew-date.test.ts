import { describe, expect, it } from "vitest";
import {
  brewDateUnix,
  withBrewSourceYearLabel,
} from "./source-catalog.service";

describe("brewDateUnix", () => {
  it("prefers published over added/modified", () => {
    expect(brewDateUnix({ p: 100, a: 200, m: 300 })).toBe(100);
  });

  it("falls back to added when published is missing", () => {
    // D&D Beyond Drops index-timestamps omit `p`.
    expect(brewDateUnix({ a: 1778257975, m: 1788616877 })).toBe(1778257975);
    expect(new Date(1778257975 * 1000).getUTCFullYear()).toBe(2026);
  });

  it("falls back to modified when only that is present", () => {
    expect(brewDateUnix({ m: 1788616877 })).toBe(1788616877);
  });

  it("returns undefined for empty stamps", () => {
    expect(brewDateUnix(undefined)).toBeUndefined();
    expect(brewDateUnix({})).toBeUndefined();
  });
});

describe("withBrewSourceYearLabel", () => {
  it("appends year when the name has none", () => {
    expect(withBrewSourceYearLabel("D&D Beyond Drops", 2026)).toBe(
      "D&D Beyond Drops 2026",
    );
    expect(withBrewSourceYearLabel("Cthulhu by Torchlight", 2025)).toBe(
      "Cthulhu by Torchlight 2025",
    );
  });

  it("keeps names that already include a year", () => {
    expect(
      withBrewSourceYearLabel("Grim Hollow: Player's Guide (2024)", 2025),
    ).toBe("Grim Hollow: Player's Guide (2024)");
  });

  it("leaves the name unchanged without a year", () => {
    expect(withBrewSourceYearLabel("D&D Beyond Drops", undefined)).toBe(
      "D&D Beyond Drops",
    );
  });
});
