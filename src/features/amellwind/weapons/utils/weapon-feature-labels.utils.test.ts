import { describe, expect, it } from "vitest";
import type { OptionalFeature, Weapon } from "@/shared/types";
import { buildColumnChains } from "@/shared/foundry/weapons";
import { mapWeapon } from "../mappers/weapon.mapper";
import { resolveWeaponBaseFeatures } from "../services/optionalfeature.service";
import { localizeWeaponFeatureNames } from "./weapon-feature-labels.utils";
import { getRaritySlideStatEntries } from "./rarity-slide.utils";

const RAW_BOWGUN = {
  name: "Heavy Bowgun",
  source: "AGMH",
  type: "HW",
  property: ["2H", "MHL"],
  dmg1: "1d10",
  dmgType: "P",
  entries: [
    "{@i Artillery.}",
    {
      type: "inset",
      name: "Heavy Bowgun",
      entries: [
        "{@optfeature Ammo (HBG)|AGMH|Ammo}, {@optfeature Loading (HBG)|AGMH|Loading}",
        {
          type: "table",
          colLabels: ["Rarity", "Slots", "Bonus", "Features", "Ammo"],
          rows: [
            ["Common", "1", "-", "--", "{@optfeature Normal Ammo (HBG)|AGMH|Normal Ammo}"],
            ["Uncommon", "2", "-", "--", "{@optfeature Cluster Ammo|AGMH}"],
            ["Rare", "3", "+1", "{@optfeature Capacity Increase (HBG)|AGMH|Capacity Increase}", "--"],
            ["Very Rare", "4", "+1", "{@optfeature Capacity Increase (HBG, Very Rare)|AGMH|Capacity Increase}", "--"],
          ],
        },
      ],
    },
  ],
};

function feature(name: string, weaponName = "Heavy Bowgun"): OptionalFeature {
  return { name, source: "AGMH", featureType: ["HWF"], weaponName, paragraphs: [name] };
}

function featuresMapOf(...names: string[]): Map<string, OptionalFeature> {
  return new Map(names.map((n) => [n.toLowerCase(), feature(n)]));
}

describe("Amellwind weapon feature keys vs labels", () => {
  const weapon: Weapon = mapWeapon(RAW_BOWGUN);

  it("keeps optfeature keys in columns and display text in featureLabels", () => {
    expect(weapon.rarityRows[3].columns.Features).toEqual([
      "Capacity Increase (HBG, Very Rare)",
    ]);
    expect(weapon.featureLabels?.["capacity increase (hbg, very rare)"]).toBe(
      "Capacity Increase",
    );
    expect(weapon.rarityRows[1].columns.Ammo).toEqual(["Cluster Ammo"]);
  });

  it("chains repeated labels as upgrades and splits the Ammo resource column", () => {
    const chains = buildColumnChains(weapon.rarityRows, {
      featureLabels: weapon.featureLabels,
    });
    expect(chains.map((c) => c.label)).toEqual(["Features", "Ammo"]);
    const capacity = chains[0].chains[0];
    expect(capacity.baseName).toBe("Capacity Increase");
    expect(capacity.features.map((f) => [f.name, f.label])).toEqual([
      ["Capacity Increase (HBG)", "Capacity Increase"],
      ["Capacity Increase (HBG, Very Rare)", "Capacity Increase"],
    ]);
  });

  it("dedupes the MHL Loading property against the Loading optfeature", () => {
    const base = resolveWeaponBaseFeatures(
      weapon,
      featuresMapOf("Ammo (HBG)", "Loading (HBG)"),
    );
    expect(base.map((f) => f.name).sort()).toEqual(["Ammo (HBG)", "Loading (HBG)"]);
  });

  it("localizes keys to unique display names for the Weapon Forge", () => {
    const { weapon: local, featuresMap } = localizeWeaponFeatureNames(
      weapon,
      featuresMapOf("Ammo (HBG)", "Capacity Increase (HBG)", "Capacity Increase (HBG, Very Rare)"),
    );
    expect(local.baseFeatureNames).toEqual(["Ammo", "Loading"]);
    expect(local.rarityRows[2].columns.Features).toEqual(["Capacity Increase"]);
    expect(local.rarityRows[3].columns.Features).toEqual([
      "Capacity Increase (Very Rare)",
    ]);
    expect(local.rarityRows[2].columns.Bonus).toBe("+1");
    expect(featuresMap.get("ammo")?.name).toBe("Ammo");
    expect(featuresMap.has("ammo (hbg)")).toBe(false);
  });

  it("shows Chord Length as a rarity header chip", () => {
    const { headerBonuses, otherStats } = getRaritySlideStatEntries({
      rarity: "Rare",
      slots: 3,
      columns: { Bonus: "+1", "Chord Length": "4", Notes: ["Earplugs"] },
    });
    expect(headerBonuses).toEqual(["+1 to Hit and Damage", "Chord Length 4"]);
    expect(otherStats).toEqual([]);
  });
});
