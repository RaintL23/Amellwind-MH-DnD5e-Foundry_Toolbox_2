import { describe, expect, it } from "vitest";
import { mapFeat } from "@/features/amellwind/feats/mappers/feat.mapper";
import { mapDndFeat } from "@/features/dnd/feats/mappers/dnd-feat.mapper";
import {
  isEligibleGeneralFeat,
  isGeneralFeatSlotCategory,
  meetsFeatPrerequisites,
} from "@/features/raintdm/builder/utils/feat-prerequisites.utils";
import { buildFeatSelectionsForLevel } from "@/features/raintdm/builder/utils/randomizer/feat-randomizer.utils";
import type { Class, DndFeat } from "@/shared/types";

function scores(partial: Record<string, number>) {
  return {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
    ...partial,
  };
}

describe("feat prerequisites eligibility", () => {
  it("rejects epic boons below level 19 and accepts them at 19+", () => {
    const boon = mapDndFeat({
      name: "Boon of Fate",
      source: "XPHB",
      category: "EB",
      prerequisite: [{ level: 19 }],
      entries: ["An epic boon."],
    });

    expect(isGeneralFeatSlotCategory(boon)).toBe(true);
    expect(
      meetsFeatPrerequisites(boon, { level: 8, abilities: scores({}) }),
    ).toBe(false);
    expect(
      isEligibleGeneralFeat(boon, { level: 8, abilities: scores({}) }),
    ).toBe(false);
    expect(
      isEligibleGeneralFeat(boon, { level: 19, abilities: scores({}) }),
    ).toBe(true);
  });

  it("treats OR ability groups as alternatives (Athlete)", () => {
    const athlete = mapDndFeat({
      name: "Athlete",
      source: "XPHB",
      category: "G",
      prerequisite: [
        { level: 4, ability: [{ str: 13 }] },
        { level: 4, ability: [{ dex: 13 }] },
      ],
      entries: ["You have undergone extensive physical training."],
    });

    expect(
      isEligibleGeneralFeat(athlete, { level: 4, abilities: scores({ str: 13 }) }),
    ).toBe(true);
    expect(
      isEligibleGeneralFeat(athlete, { level: 4, abilities: scores({ dex: 13 }) }),
    ).toBe(true);
    expect(
      isEligibleGeneralFeat(athlete, { level: 4, abilities: scores({}) }),
    ).toBe(false);
    expect(
      isEligibleGeneralFeat(athlete, { level: 3, abilities: scores({ str: 16 }) }),
    ).toBe(false);
  });

  it("excludes origin and fighting-style categories from general slots", () => {
    const origin = mapDndFeat({
      name: "Alert",
      source: "XPHB",
      category: "O",
      entries: ["Always on the lookout."],
    });
    const archery = mapDndFeat({
      name: "Archery",
      source: "XPHB",
      category: "FS",
      prerequisite: [{ feature: ["Fighting Style"] }],
      entries: ["You gain a +2 bonus."],
    });

    expect(isGeneralFeatSlotCategory(origin)).toBe(false);
    expect(isGeneralFeatSlotCategory(archery)).toBe(false);
    expect(
      isEligibleGeneralFeat(archery, { level: 20, abilities: scores({}) }),
    ).toBe(false);
  });

  it("excludes feats whose only prereq branches need unverified requirements", () => {
    const heavilyArmored = mapDndFeat({
      name: "Heavily Armored",
      source: "XPHB",
      category: "G",
      prerequisite: [{ level: 4, proficiency: [{ armor: "medium" }] }],
      entries: ["You gain training."],
    });

    expect(
      isEligibleGeneralFeat(heavilyArmored, {
        level: 8,
        abilities: scores({}),
      }),
    ).toBe(false);
  });

  it("maps Amellwind feats with empty check groups when no prereqs", () => {
    const feat = mapFeat({
      name: "Sample Homebrew Feat",
      source: "AGMH",
      entries: ["A simple feat."],
    });
    expect(feat.prerequisiteCheckGroups).toEqual([]);
    expect(
      meetsFeatPrerequisites(feat, { level: 1, abilities: scores({}) }),
    ).toBe(true);
  });
});

describe("buildFeatSelectionsForLevel", () => {
  const classData = { name: "Fighter" } as Class;

  it("never picks epic boons for mid-level characters", () => {
    const pool: DndFeat[] = [
      mapDndFeat({
        name: "Boon of Fate",
        source: "XPHB",
        category: "EB",
        prerequisite: [{ level: 19 }],
        entries: ["Epic."],
      }),
      mapDndFeat({
        name: "Chef",
        source: "XPHB",
        category: "G",
        prerequisite: [{ level: 4 }],
        entries: ["Cook."],
      }),
      mapDndFeat({
        name: "Archery",
        source: "XPHB",
        category: "FS",
        prerequisite: [{ feature: ["Fighting Style"] }],
        entries: ["FS."],
      }),
    ];

    for (let i = 0; i < 20; i++) {
      const picks = buildFeatSelectionsForLevel(
        classData,
        8,
        pool,
        null,
        scores({ str: 14, dex: 14 }),
      );
      expect(picks.length).toBeGreaterThan(0);
      for (const pick of picks) {
        expect(pick?.name).toBe("Chef");
      }
    }
  });
});
