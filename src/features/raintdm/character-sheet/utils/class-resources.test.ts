import { describe, expect, it } from "vitest";
import type { Class } from "@/shared/types";
import type { PlayFeature } from "../utils/play-character.types";
import {
  buildPlayResources,
  extractClassResources,
} from "../compile/class-resources";

function mockClass(colLabels: string[], row: unknown[]): Class {
  return {
    id: "bard-xphb",
    name: "Bard",
    source: "XPHB",
    spellProgression: [
      {
        title: "",
        colLabels,
        rows: [row.map(String)],
      },
    ],
  } as Class;
}

describe("extractClassResources", () => {
  it("skips progression columns (Cantrips, Prepared Spells, Bardic Die)", () => {
    const classData = mockClass(
      ["Bardic Die", "Cantrips", "Prepared Spells"],
      ["1d6", "2", "4"],
    );
    expect(extractClassResources(classData, 1)).toEqual([]);
  });

  it("keeps spendable pool columns like Rages and Second Wind", () => {
    const barb = mockClass(["Rages", "Rage Damage"], ["2", "+2"]);
    expect(extractClassResources(barb, 1)).toEqual([
      { id: "resource-rages", label: "Rages", max: 2, recovery: "lr" },
    ]);

    const fighter = mockClass(["Second Wind", "Weapon Mastery"], ["2", "3"]);
    expect(extractClassResources(fighter, 1)).toEqual([
      {
        id: "resource-second-wind",
        label: "Second Wind",
        max: 2,
        recovery: "sr",
      },
    ]);
  });
});

describe("buildPlayResources", () => {
  it("adds limited-use features and prefers them over matching class columns", () => {
    const fighter = mockClass(["Second Wind", "Weapon Mastery"], ["2", "3"]);
    const features: PlayFeature[] = [
      {
        id: "feat-second-wind",
        name: "Second Wind",
        sourceKind: "class",
        sourceLabel: "Fighter",
        description: "",
        activation: "bonus",
        bucket: "bonus",
        uses: { max: 2, recovery: "sr" },
      },
      {
        id: "feat-action-surge",
        name: "Action Surge",
        sourceKind: "class",
        sourceLabel: "Fighter",
        description: "",
        activation: "special",
        bucket: "other",
        uses: { max: 1, recovery: "sr" },
      },
    ];

    const resources = buildPlayResources(fighter, 1, features);
    expect(resources).toEqual([
      {
        id: "feat-second-wind",
        label: "Second Wind",
        max: 2,
        recovery: "sr",
        featureId: "feat-second-wind",
      },
      {
        id: "feat-action-surge",
        label: "Action Surge",
        max: 1,
        recovery: "sr",
        featureId: "feat-action-surge",
      },
    ]);
  });

  it("keeps class pools when no matching feature exists", () => {
    const barb = mockClass(["Rages"], ["3"]);
    const resources = buildPlayResources(barb, 1, []);
    expect(resources).toEqual([
      { id: "resource-rages", label: "Rages", max: 3, recovery: "lr" },
    ]);
  });
});
