import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryItem } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";
import {
  isWeaponFeatureColumn,
  isWeaponSpiritGainColumn,
} from "@/shared/types";

describe("Longsword Weapon Forge catalog", () => {
  const raw = JSON.parse(
    readFileSync("public/data/raintdm-weapons/longsword.json", "utf8"),
  );
  const [weapon] = parseImportedWeapons([raw], { isCustom: false });

  it("parses stats, proficiency, Spirit Gain as a stat column, and rarity features", () => {
    expect(weapon.name).toBe("Longsword");
    expect(weapon.dmg1).toBe("1d10");
    expect(weapon.properties).toEqual(["2H"]);
    expect(weapon.proficiency?.compatible).toEqual(["Greatsword", "Longsword"]);
    expect(isWeaponSpiritGainColumn("Spirit Gain")).toBe(true);
    expect(isWeaponFeatureColumn("Spirit Gain")).toBe(false);

    const uncommon = weapon.rarityRows.find((r) => r.rarity === "Uncommon");
    expect(uncommon?.columns["Spirit Gain"]).toBe("1");
    const uncommonFeatures = uncommon?.columns.Features;
    expect(uncommonFeatures).toEqual(
      expect.arrayContaining(["Spirit Gauge", "Spirit Blade"]),
    );
    expect(uncommonFeatures).not.toEqual(expect.arrayContaining(["1"]));

    const legendary = weapon.rarityRows.find((r) => r.rarity === "Legendary");
    expect(legendary?.columns["Spirit Gain"]).toBe("2");
    expect(legendary?.columns.Features).toEqual(
      expect.arrayContaining([
        "Special Sheathe (Iai Spirit Slash)",
        "Spirit Release Slash",
      ]),
    );
    expect(legendary?.columns.Features).not.toEqual(
      expect.arrayContaining(["Spirit Gauge Upgrade III"]),
    );
  });

  it("exports Uncommon with Sap, empty Spirit Gauge, and Spirit Blade spend", () => {
    const uncommonIndex = weapon.rarityRows.findIndex(
      (r) => r.rarity === "Uncommon",
    );
    const item = buildWeaponFoundryItem(weapon, uncommonIndex);
    const system = item.system as Record<string, unknown>;
    const activities = system.activities as Record<
      string,
      Record<string, unknown>
    >;
    const names = Object.values(activities).map((a) => String(a.name ?? ""));

    const byName = Object.fromEntries(
      Object.values(activities).map((a) => [String(a.name ?? ""), a]),
    );

    expect(system.rarity).toBe("uncommon");
    expect(system.attunement).toBe("required");
    expect(system.mastery).toBe("sap");
    expect(system.uses).toMatchObject({ spent: 6, max: "6" });
    expect(system.properties).toEqual(["two"]);
    expect(byName.Attack).toBeDefined();
    expect(byName["Spirit Blade"]).toBeDefined();
    expect(byName["Spirit Blade"].type).toBe("damage");
    expect(
      (byName["Spirit Blade"].damage as { includeBase?: boolean } | undefined)
        ?.includeBase,
    ).not.toBe(true);
    expect(names.some((name) => name.toLowerCase().includes("foresight"))).toBe(
      false,
    );

    const flags = item.flags as {
      itemacro?: { macro?: { command?: string } };
      world?: { longsword?: { isLongsword?: boolean; spiritGain?: number } };
    };
    expect(flags.world?.longsword?.isLongsword).toBe(true);
    expect(flags.world?.longsword?.spiritGain).toBe(1);
    expect(flags.itemacro?.macro?.command).toContain("Spirit Gauge");
  });

  it("exports Rare Foresight Slash as a reaction and Legendary Iai as a bonus action", () => {
    const rareIndex = weapon.rarityRows.findIndex((r) => r.rarity === "Rare");
    const rareItem = buildWeaponFoundryItem(weapon, rareIndex);
    const rareActivities = (
      rareItem.system as { activities: Record<string, Record<string, unknown>> }
    ).activities;
    const foresight = Object.values(rareActivities).find(
      (a) => String(a.name ?? "") === "Foresight Slash",
    );
    expect(foresight).toBeDefined();
    expect(
      (foresight?.activation as { type?: string } | undefined)?.type,
    ).toBe("reaction");
    expect(
      (
        foresight?.consumption as { targets?: unknown[] } | undefined
      )?.targets ?? [],
    ).toEqual([]);
    expect(foresight?.useConditionText ?? "").toBe("");
    expect(
      Object.values(rareActivities).some(
        (a) => String(a.name ?? "") === "Foresight Slash: Counter",
      ),
    ).toBe(true);
    const rareBlade = Object.values(rareActivities).find((a) =>
      String(a.name ?? "")
        .toLowerCase()
        .includes("spirit blade"),
    );
    expect(rareBlade?.type).toBe("damage");
    expect(
      (rareBlade?.description as { chatFlavor?: string } | undefined)
        ?.chatFlavor,
    ).toContain("1d6");
    expect(
      (rareItem.flags as { itemacro?: { macro?: { command?: string } } })
        .itemacro?.macro?.command,
    ).toContain("Foresight Slash");

    const legendaryIndex = weapon.rarityRows.findIndex(
      (r) => r.rarity === "Legendary",
    );
    const legendaryItem = buildWeaponFoundryItem(weapon, legendaryIndex);
    const legendaryActivities = (
      legendaryItem.system as {
        activities: Record<string, Record<string, unknown>>;
      }
    ).activities;
    const iai = Object.values(legendaryActivities).find((a) =>
      String(a.name ?? "")
        .toLowerCase()
        .includes("iai"),
    );
    expect(iai).toBeDefined();
    expect((iai?.activation as { type?: string } | undefined)?.type).toBe(
      "bonus",
    );
  });
});
