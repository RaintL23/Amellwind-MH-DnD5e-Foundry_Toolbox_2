import { describe, expect, it } from "vitest";
import {
  isWeaponAcBonusColumn,
  isWeaponFeatureColumn,
  isWeaponStatBonusColumn,
  type WeaponRarityRow,
} from "@/shared/types";
import { getRaritySlideStatEntries } from "./rarity-slide.utils";

function row(
  columns: WeaponRarityRow["columns"],
): WeaponRarityRow {
  return { rarity: "Legendary", slots: 5, columns };
}

describe("weapon bonus column classification", () => {
  it("treats AGMH AC Bonus and forge Bonus AC as stats, not features", () => {
    expect(isWeaponStatBonusColumn("AC Bonus")).toBe(true);
    expect(isWeaponStatBonusColumn("Bonus AC")).toBe(true);
    expect(isWeaponAcBonusColumn("AC Bonus")).toBe(true);
    expect(isWeaponAcBonusColumn("Bonus AC")).toBe(true);
    expect(isWeaponFeatureColumn("AC Bonus")).toBe(false);
    expect(isWeaponFeatureColumn("Bonus AC")).toBe(false);
    expect(isWeaponFeatureColumn("Features")).toBe(true);
    expect(isWeaponFeatureColumn("Spirit Gain")).toBe(false);
    expect(isWeaponStatBonusColumn("Spirit Gain")).toBe(false);
  });
});

describe("getRaritySlideStatEntries", () => {
  it("puts AGMH Bonus + AC Bonus in the rarity header", () => {
    const { headerBonuses, otherStats } = getRaritySlideStatEntries(
      row({
        Bonus: "+2",
        "AC Bonus": "+3",
        Features: ["Powerguard Upgrade II"],
      }),
    );

    expect(headerBonuses).toEqual(["+2 to Hit and Damage", "+3 to AC"]);
    expect(otherStats).toEqual([]);
  });

  it("merges matching forge to-hit and damage into one header chip", () => {
    const { headerBonuses } = getRaritySlideStatEntries(
      row({
        "Bonus to Hit": "+2",
        "Bonus AC": "+3",
        "Bonus to Damage": "+2",
      }),
    );

    expect(headerBonuses).toEqual(["+2 to Hit and Damage", "+3 to AC"]);
  });

  it("keeps distinct hit and damage bonuses separate", () => {
    const { headerBonuses } = getRaritySlideStatEntries(
      row({
        "Bonus to Hit": "+2",
        "Bonus to Damage": "+1",
      }),
    );

    expect(headerBonuses).toEqual(["+2 to Hit", "+1 to Damage"]);
  });

  it("lifts other simple numeric bonuses into the header", () => {
    const { headerBonuses, otherStats } = getRaritySlideStatEntries(
      row({
        "Save DC Bonus": "+1",
        "Bonus Notes": "Keep the shield raised",
      }),
    );

    expect(headerBonuses).toEqual(["+1 Save DC"]);
    expect(otherStats).toEqual([["Bonus Notes", "Keep the shield raised"]]);
  });

  it("lifts Spirit Gain into the rarity header without treating it as a feature", () => {
    const { headerBonuses, otherStats } = getRaritySlideStatEntries(
      row({
        "Bonus to Hit": "+2",
        "Bonus to Damage": "+2",
        Features: ["Spirit Helm Breaker"],
        "Spirit Gain": "2",
      }),
    );

    expect(headerBonuses).toEqual(["+2 to Hit and Damage", "2 Spirit Gain"]);
    expect(otherStats).toEqual([]);
  });
});
