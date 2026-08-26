import { describe, expect, it } from "vitest";
import {
  FALLBACK_ARTISAN_TOOLS,
  FALLBACK_MARTIAL_WEAPONS,
  resolveAnyProficiencyOptions,
} from "@/shared/data/chooseable-tools-weapons";
import {
  entriesMentionProficiencyGrant,
  formatNamedProficiencyGrant,
  textMentionsProficiencyGrant,
} from "@/features/raintdm/builder/utils/library-proficiency-highlight.utils";

describe("resolveAnyProficiencyOptions", () => {
  it("uses the live artisan catalog even if stale options were passed", () => {
    const options = resolveAnyProficiencyOptions("Artisan's tools", [
      "Smith's Tools",
    ]);
    expect(options).toEqual(
      expect.arrayContaining([...FALLBACK_ARTISAN_TOOLS]),
    );
    expect(options.length).toBeGreaterThan(1);
  });

  it("resolves artisan tools from the catalog", () => {
    const options = resolveAnyProficiencyOptions("Artisan's tools");
    expect(options).toEqual(expect.arrayContaining([...FALLBACK_ARTISAN_TOOLS]));
    expect(options.length).toBeGreaterThanOrEqual(FALLBACK_ARTISAN_TOOLS.length);
  });

  it("resolves martial weapons from the catalog", () => {
    const options = resolveAnyProficiencyOptions("Martial weapons");
    expect(options).toEqual(
      expect.arrayContaining(["Longsword", "Battleaxe"]),
    );
    expect(options).not.toEqual(
      expect.arrayContaining(["Antimatter Rifle", "Blackrazor"]),
    );
    expect(options.length).toBeGreaterThanOrEqual(
      FALLBACK_MARTIAL_WEAPONS.length,
    );
  });

  it("ignores magic weapon names baked into options for martial picks", () => {
    const options = resolveAnyProficiencyOptions("Martial weapons", [
      "Blackrazor",
      "Antimatter Rifle",
      "Battleaxe",
    ]);
    expect(options).toContain("Battleaxe");
    expect(options).not.toContain("Blackrazor");
    expect(options).not.toContain("Antimatter Rifle");
  });
});

describe("library proficiency highlight", () => {
  it("detects proficiency grant clauses", () => {
    expect(
      textMentionsProficiencyGrant(
        "You gain proficiency with four martial weapons of your choice.",
      ),
    ).toBe(true);
    expect(
      entriesMentionProficiencyGrant([
        "You gain proficiency in the Stealth skill.",
      ]),
    ).toBe(true);
  });

  it("ignores proficiency bonus mentions alone", () => {
    expect(
      textMentionsProficiencyGrant(
        "Add your proficiency bonus to the damage roll.",
      ),
    ).toBe(false);
  });

  it("formats named grants", () => {
    expect(
      formatNamedProficiencyGrant({
        kind: "any",
        count: 2,
        label: "Artisan's tools",
        source: { type: "species", name: "Test" },
      }),
    ).toBe("Choose 2 Artisan's tools");
  });
});
