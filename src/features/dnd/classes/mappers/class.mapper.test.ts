import { describe, expect, it } from "vitest";
import type { ClassFeatureEntry, ClassLevelRow, Subclass } from "@/shared/types";
import { mergeProgressionWithSubclass } from "./class.mapper";

function feature(
  partial: Pick<ClassFeatureEntry, "name" | "level" | "source"> &
    Partial<ClassFeatureEntry>,
): ClassFeatureEntry {
  return {
    uid: `${partial.name}|${partial.level}|${partial.source}`,
    displayName: partial.displayName ?? partial.name,
    content: [],
    description: [],
    ...partial,
  };
}

function emptyProgression(): ClassLevelRow[] {
  return Array.from({ length: 20 }, (_, i) => ({
    level: i + 1,
    features: [],
    tableCells: [],
  }));
}

describe("mergeProgressionWithSubclass", () => {
  const classProgression = emptyProgression();
  classProgression[0] = {
    level: 1,
    features: [feature({ name: "Favored Enemy", level: 1, source: "PHB" })],
    tableCells: [],
  };
  classProgression[2] = {
    level: 3,
    features: [
      feature({
        name: "Ranger Archetype",
        level: 3,
        source: "PHB",
        gainSubclassFeature: true,
      }),
      feature({ name: "Primeval Awareness", level: 3, source: "PHB" }),
    ],
    tableCells: [],
  };
  classProgression[6] = {
    level: 7,
    features: [
      feature({
        name: "Ranger Archetype",
        level: 7,
        source: "PHB",
        gainSubclassFeature: true,
      }),
    ],
    tableCells: [],
  };

  const swarmkeeperProgression = emptyProgression();
  swarmkeeperProgression[2] = {
    level: 3,
    features: [
      feature({
        name: "Swarmkeeper",
        level: 3,
        source: "TCE",
        isSubclassFeature: true,
      }),
      feature({
        name: "Gathered Swarm",
        level: 3,
        source: "TCE",
        isSubclassFeature: true,
      }),
    ],
    tableCells: [],
  };
  swarmkeeperProgression[6] = {
    level: 7,
    features: [
      feature({
        name: "Writhing Tide",
        level: 7,
        source: "TCE",
        isSubclassFeature: true,
      }),
    ],
    tableCells: [],
  };

  const swarmkeeper: Subclass = {
    id: "TCE::Swarmkeeper",
    name: "Swarmkeeper",
    shortName: "Swarmkeeper",
    source: "TCE",
    classSource: "PHB",
    progression: swarmkeeperProgression,
  };

  it("keeps archetype placeholders when no subclass is selected", () => {
    const merged = mergeProgressionWithSubclass(classProgression, null);
    expect(merged[2]?.features.map((f) => f.name)).toEqual([
      "Ranger Archetype",
      "Primeval Awareness",
    ]);
    expect(merged[2]?.features[0]?.gainSubclassFeature).toBe(true);
  });

  it("replaces archetype placeholders with subclass features when selected", () => {
    const merged = mergeProgressionWithSubclass(classProgression, swarmkeeper);

    expect(merged[2]?.features.map((f) => f.displayName)).toEqual([
      "Primeval Awareness",
      "Swarmkeeper",
      "Gathered Swarm",
    ]);
    expect(merged[2]?.features.some((f) => f.gainSubclassFeature)).toBe(false);

    expect(merged[6]?.features.map((f) => f.displayName)).toEqual([
      "Writhing Tide",
    ]);
    expect(merged[6]?.features.every((f) => f.isSubclassFeature)).toBe(true);
  });
});
