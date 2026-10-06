import { describe, expect, it } from "vitest";
import {
  getBackgroundMetaLabels,
  resolveBackgroundDisplay,
  type BackgroundDetailData,
} from "./background-display.utils";

function makeBackground(
  overrides: Partial<BackgroundDetailData>,
): BackgroundDetailData {
  return {
    id: "sage::XPHB",
    name: "Sage",
    source: "XPHB",
    fluff: "",
    proficiencies: {
      skills: "Arcana, History",
      tools: "Calligrapher's Supplies",
      languages: "—",
      equipment: "—",
    },
    features: [],
    suggestedCharacteristics: [],
    skillGrants: [],
    toolGrants: [],
    languageGrants: [],
    ...overrides,
  };
}

describe("resolveBackgroundDisplay", () => {
  it("omits em-dash proficiency fields", () => {
    const display = resolveBackgroundDisplay(makeBackground({}));
    expect(display.proficiencyFields.map((field) => field.label)).toEqual([
      "Skills",
      "Tools",
    ]);
  });

  it("prefers the D&D feat summary and falls back to the origin feat grant", () => {
    expect(
      resolveBackgroundDisplay(makeBackground({ featSummary: "Magic Initiate" }))
        .originFeatSummary,
    ).toBe("Magic Initiate");

    expect(
      resolveBackgroundDisplay(
        makeBackground({
          originFeatGrant: {
            kind: "choose",
            categories: ["O"],
            count: 1,
            summary: "Choose 1 Origin feat",
          },
        }),
      ).originFeatSummary,
    ).toBe("Choose 1 Origin feat");
  });
});

describe("getBackgroundMetaLabels", () => {
  it("labels Amellwind factions and D&D edition flags", () => {
    expect(getBackgroundMetaLabels(makeBackground({ faction: "wycademy" }))).toEqual([
      "Wycademy",
    ]);
    expect(
      getBackgroundMetaLabels(
        makeBackground({ edition: "2024", srd: true, basicRules: true }),
      ),
    ).toEqual(["2024", "SRD", "Basic Rules"]);
  });
});
