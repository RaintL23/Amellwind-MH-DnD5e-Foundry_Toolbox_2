import { describe, expect, it } from "vitest";
import { buildFeats } from "./feats.mjs";
import { buildVariantRules } from "./variant-rules.mjs";
import { buildItems } from "./items.mjs";
import { buildWeapons } from "./weapons.mjs";
import { buildOptionalFeatures } from "./optional-features.mjs";
import { buildObjects } from "./objects.mjs";
import { buildBackgrounds } from "./backgrounds.mjs";
import { buildRaces } from "./races.mjs";
import { buildMaterialEffectsBookData } from "./material-effects.mjs";
import { mapMaterialEffectsFromBookData } from "../../src/features/amellwind/material-effects/mappers/material-effect.mapper.ts";
import { mapWeapon } from "../../src/features/amellwind/weapons/mappers/weapon.mapper.ts";

describe("gtmh parsers", () => {
  it("extracts the 14 Patreon new feats", () => {
    const feats = buildFeats();
    expect(feats).toHaveLength(14);
    expect(feats.map((f) => f.name)).toEqual(
      expect.arrayContaining([
        "Arcane Adaption",
        "Armored Gunner",
        "Bastion",
        "Bomb Specialist",
        "Frenzy Fever",
        "Gunlance Mastery",
        "Horn Maestro",
        "Insect Glaive Mastery",
        "Improved Hammer Charge",
        "Kinsect Mastery",
        "Master Craftsman",
        "Master Mounter",
        "Switch Axe Mastery",
        "Additional Wildshapes",
      ]),
    );
  });

  it("keeps Bastion PDF structure: ability prereq, intro, benefit list, closer", () => {
    const bastion = buildFeats().find((f) => f.name === "Bastion");
    expect(bastion).toBeTruthy();
    expect(bastion?.prerequisite).toEqual([
      { ability: [{ str: 13 }] },
    ]);
    expect(bastion?.entries).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/gain the following benefits/i),
        expect.objectContaining({
          type: "list",
          items: expect.arrayContaining([
            expect.stringMatching(/Strength saving throw/i),
            expect.stringMatching(/90-foot cone/i),
          ]),
        }),
        expect.stringMatching(/proficiency bonus/i),
      ]),
    );
    const list = bastion?.entries.find(
      (e: { type?: string }) => e && typeof e === "object" && e.type === "list",
    );
    expect(list?.items).toHaveLength(2);
  });

  it("extracts hunt roles and downtime entries as variantrule", () => {
    const rules = buildVariantRules();
    expect(rules.map((r) => r.name)).toEqual(
      expect.arrayContaining([
        "Hunt Role: Trailblazer",
        "Hunt Role: Spotter",
        "Hunt Role: Scout",
        "Hunt Role: Artisan",
        "Downtime Activity: Solo Hunt",
        "Downtime Activity: Trenya",
        "Downtime Activity: Sell Materials",
        "Downtime Activity: Palico Farm",
      ]),
    );
  });

  it("extracts Appendix B hunter weapons including Wire Knuckles", () => {
    const weapons = buildWeapons();
    expect(weapons.length).toBeGreaterThanOrEqual(22);
    expect(weapons.every((w) => w.type === "HW")).toBe(true);

    const wire = weapons.find((w) => w.name === "Wire Knuckles");
    expect(wire).toBeTruthy();
    expect(wire.dmg1).toBe("1d4");
    expect(wire.dmgType).toBe("B");
    expect(wire.property).toContain("L");
    expect(wire.value).toBe(3000);

    const mapped = mapWeapon(wire);
    expect(mapped.rarityRows.map((r) => r.rarity)).toEqual([
      "Common",
      "Uncommon",
      "Rare",
      "Very Rare",
      "Legendary",
    ]);
    const uncommon = mapped.rarityRows.find((r) => r.rarity === "Uncommon");
    expect(String(uncommon?.columns.Features ?? "")).toMatch(/Wiredash|Wirefall|Empowered Strikes/i);
  });

  it("extracts optional features for Wire Knuckles", () => {
    const features = buildOptionalFeatures();
    const names = features.map((f) => f.name);
    expect(names).toEqual(
      expect.arrayContaining(["Empowered Strikes", "Wiredash", "Wirefall", "Silkbind"]),
    );
    expect(features.some((f) => f.prerequisite?.[0]?.otherSummary?.entry?.includes("Wire Knuckles"))).toBe(
      true,
    );
  });

  it("extracts material effects into bookData for the Amellwind list", () => {
    const bookData = buildMaterialEffectsBookData();
    const effects = mapMaterialEffectsFromBookData(bookData);
    expect(effects.length).toBeGreaterThan(100);
    expect(effects.some((e) => e.slot === "weapon" && e.name === "Artillery")).toBe(true);
    expect(effects.some((e) => e.slot === "armor")).toBe(true);
  });

  it("extracts Patreon faction backgrounds from chapter 1", () => {
    const backgrounds = buildBackgrounds();
    expect(backgrounds).toHaveLength(10);
    expect(backgrounds.map((b) => b.name).sort()).toEqual(
      [
        "Apprentice Guild Knight",
        "Handler Initiate",
        "Helix Agent",
        "Helix Field Scout",
        "Hunter Initiate",
        "Infiltrator",
        "Poacher",
        "Scrivener",
        "Wycademy Researcher",
        "Wycademy Student",
      ].sort(),
    );
    const hunter = backgrounds.find((b) => b.name === "Hunter Initiate");
    expect(hunter?._faction).toBe("hunters-guild");
    expect(hunter?.skillProficiencies?.[0]?.survival).toBe(true);
    expect(
      hunter?.entries?.some(
        (e: { name?: string }) => e.name === "Feature: Guild Membership",
      ),
    ).toBe(true);
  });

  it("keeps parser modules available for remaining GTMH keys", () => {
    expect(Array.isArray(buildItems())).toBe(true);
    expect(Array.isArray(buildObjects())).toBe(true);
    const races = buildRaces();
    expect(Array.isArray(races.race)).toBe(true);
    expect(Array.isArray(races.subrace)).toBe(true);
  });
});
