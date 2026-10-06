import { describe, expect, it } from "vitest";
import type { SpeciesTrait } from "@/shared/types";
import {
  findSpeciesTraitChoiceGaps,
  resolveSpeciesTraitEntries,
} from "./species-trait-choice.utils";

const giantAncestry: SpeciesTrait = {
  name: "Giant Ancestry",
  entries: [
    "Choose one of the following benefits; you can use the chosen benefit.",
  ],
  creationChoice: {
    pickCount: 1,
    options: [
      {
        id: "cloud-s-jaunt-cloud-giant",
        name: "Cloud's Jaunt (Cloud Giant)",
        entries: ["As a Bonus Action, teleport up to 30 feet."],
      },
      {
        id: "stone-s-endurance-stone-giant",
        name: "Stone's Endurance (Stone Giant)",
        entries: ["As a Reaction, roll 1d12 to reduce damage."],
      },
    ],
  },
};

describe("resolveSpeciesTraitEntries", () => {
  it("shows only the chosen option when selected", () => {
    expect(
      resolveSpeciesTraitEntries(giantAncestry, "cloud-s-jaunt-cloud-giant", {
        showAllWhenUnselected: false,
      }),
    ).toEqual([
      "Choose one of the following benefits; you can use the chosen benefit.",
      "• Cloud's Jaunt (Cloud Giant): As a Bonus Action, teleport up to 30 feet.",
    ]);
  });

  it("hides option bodies when unselected and filtering", () => {
    expect(
      resolveSpeciesTraitEntries(giantAncestry, null, {
        showAllWhenUnselected: false,
      }),
    ).toEqual([
      "Choose one of the following benefits; you can use the chosen benefit.",
    ]);
  });
});

describe("findSpeciesTraitChoiceGaps", () => {
  it("requires a pick for creation-choice traits", () => {
    const gaps = findSpeciesTraitChoiceGaps([giantAncestry], {}, 1);
    expect(gaps.map((t) => t.name)).toEqual(["Giant Ancestry"]);
  });

  it("accepts a valid pick", () => {
    const gaps = findSpeciesTraitChoiceGaps(
      [giantAncestry],
      { "giant ancestry": "cloud-s-jaunt-cloud-giant" },
      1,
    );
    expect(gaps).toEqual([]);
  });
});
