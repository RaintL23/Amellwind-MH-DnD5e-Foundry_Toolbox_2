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
import { flattenSliceMarkdown, readMarkdownTable } from "./common.mjs";

describe("gtmh slice reader", () => {
  it("flattens ### entries to `Name. text` and keeps structural headings", () => {
    const md = [
      "## Heavy Bowgun",
      "",
      "### The Kinsect",
      "",
      "Intro rules.",
      "",
      "#### Nonmagical",
      "",
      "50 gp, 1d10 piercing",
      "",
      "### Normal Ammo",
      "",
      "Deals normal weapon damage.",
      "",
      "Pierce lvl 1. You gain a +1 bonus.",
      "### Ammo Vendor",
      "",
      "| Type | Cost |",
      "| --- | --- |",
      "\\*Up to the GM",
    ].join("\n");
    const lines = flattenSliceMarkdown(md, {
      keepTitle: (_t, { level, afterLevel4 }) => level === 3 && !afterLevel4,
    })
      .split("\n")
      .filter(Boolean);
    expect(lines).toEqual([
      "Heavy Bowgun",
      "The Kinsect",
      "Intro rules.",
      "Nonmagical",
      "50 gp, 1d10 piercing",
      "Normal Ammo. Deals normal weapon damage.",
      "Pierce lvl 1. You gain a +1 bonus.",
      "Ammo Vendor",
      "| Type | Cost |",
      "| --- | --- |",
      "*Up to the GM",
    ]);
  });

  it("reads markdown table rows by first header", () => {
    const md = "| Weapon | Cost |\n| --- | ---: |\n| Bow | 24 gp |\n\nafter";
    expect(readMarkdownTable(md, "Weapon")).toEqual([["Bow", "24 gp"]]);
  });
});

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

  it("keeps downtime activity sections and tables from the chapter 2 slice", () => {
    const downtime = buildVariantRules().filter((r) =>
      r.name.startsWith("Downtime Activity:"),
    );
    expect(JSON.stringify(downtime)).not.toContain("Downtime activity entry extracted");

    const sectionNames = (name: string) =>
      downtime
        .find((r) => r.name === `Downtime Activity: ${name}`)
        ?.entries.filter((e: { name?: string }) => typeof e === "object")
        .map((e: { name?: string; type: string }) => e.name ?? e.type);
    expect(sectionNames("Solo Hunt")).toEqual(["table", "Resources", "Resolution"]);
    expect(sectionNames("Trenya")).toEqual([
      "Resources",
      "Resolution",
      "200 GP Adventures (DC 12)",
      "500 GP Adventures (DC 17)",
      "1500 GP Adventures (DC 22)",
    ]);
    expect(sectionNames("Palico Farm")).toEqual(["Resources", "Resolution", "Complications"]);

    const sell = downtime.find((r) => r.name === "Downtime Activity: Sell Materials");
    const tables = sell?.entries[2].entries.filter((e: { type?: string }) => e.type === "table");
    expect(tables.map((t: { caption?: string }) => t.caption)).toEqual([
      "Material Base Price",
      "Material Item Offer",
    ]);
    expect(tables[0].footnotes).toHaveLength(1);
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

    // Cost/weight come from the chapter 3 pricing table, not Appendix B.
    const byName = new Map(weapons.map((w) => [w.name, w]));
    expect(weapons.every((w) => w.value > 0)).toBe(true);
    expect(byName.get("Charge Blade").value).toBe(3000);
    expect(byName.get("Magnet Spike").value).toBe(3500);
    expect(byName.get("Lance").value).toBe(4000);
    expect(byName.get("Lance").weight).toBe(12);

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

  it("keeps weapon optfeature names unique so shared labels do not overwrite each other", () => {
    const features = buildOptionalFeatures();
    const names = features.map((f) => f.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);

    const byName = new Map(features.map((f) => [f.name, f]));
    const prereq = (name: string) =>
      byName.get(name)?.prerequisite?.[0]?.otherSummary?.entry;
    // Each bowgun / switch weapon keeps its own copy of the shared rule.
    expect(prereq("Ammo (HBG)")).toBe("Heavy Bowgun");
    expect(prereq("Ammo (LBG)")).toBe("Light Bowgun");
    expect(prereq("Ammo (DR)")).toBe("Dual Repeaters");
    expect(prereq("Switch Mode (SA)")).toBe("Switch Axe");
    expect(prereq("Charge (L)")).toBe("Lance (Rare)");
    expect(prereq("Capacity Increase (LBG, Very Rare)")).toBe("Light Bowgun (Very Rare)");
    // Missing-period source lines are still features.
    expect(prereq("Power Shot")).toBe("Bow (Legendary)");
    expect(prereq("Power Phial Upgrade")).toBe("Switch Axe (Rare)");
    // Sub-options with their own upgrade become chain roots (Tonfas Propel).
    expect(prereq("Propel")).toBe("Tonfas (Uncommon)");
  });

  it("splits weapon rules from resource columns and keeps Base features off Common", () => {
    const weapons = buildWeapons();
    const hbg = mapWeapon(weapons.find((w) => w.name === "Heavy Bowgun"));
    expect(hbg.baseFeatureNames).toEqual(["Ammo (HBG)", "Loading (HBG)"]);
    expect(hbg.featureLabels?.["ammo (hbg)"]).toBe("Ammo");

    const [common, , rare, , legendary] = hbg.rarityRows;
    expect(common.columns.Features).toBeUndefined();
    expect(common.columns.Ammo).toEqual(["Normal Ammo (HBG)", "Tranq Ammo (HBG)"]);
    expect(rare.columns.Features).toEqual(["Capacity Increase (HBG)"]);
    // Ammo Vendor table rows are not parsed as Legendary features.
    expect(legendary.columns.Ammo).toBeUndefined();
    expect(legendary.columns.Features).toEqual(["Capacity Increase (HBG, Legendary)"]);

    const glaive = mapWeapon(weapons.find((w) => w.name === "Insect Glaive"));
    expect(glaive.rarityRows[2].columns.Essences).toEqual(["Red", "White", "Orange", "Green"]);
    expect(glaive.supplementaryNotes[0]).toMatch(/^The Kinsect\. The Kinsect returns/);

    const horn = mapWeapon(weapons.find((w) => w.name === "Hunting Horn"));
    expect(horn.rarityRows.map((r) => r.columns["Chord Length"])).toEqual([
      "2",
      "3",
      "4",
      "5",
      undefined,
    ]);

    const longsword = weapons.find((w) => w.name === "Longsword");
    const rows = longsword.entries[1].entries[0].rows;
    expect(rows.map((r: string[]) => r[2])).toEqual(["-", "+1", "+2", "+2", "+3"]);
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

  it("adds the book races missing from the GitHub feed", () => {
    const { race, subrace } = buildRaces();
    expect(race.map((r) => r.name)).toEqual([
      "Kechaborn",
      "Malfestian",
      "Neopteroid",
    ]);
    expect(subrace.map((r) => `${r.raceName}:${r.name}`)).toEqual([
      "Neopteroid:Flying",
      "Neopteroid:Ground",
    ]);
    const kechaborn = race.find((r) => r.name === "Kechaborn");
    expect(kechaborn?.ability).toEqual([{ dex: 2, wis: 1 }]);
    expect(kechaborn?.speed).toEqual({ walk: 30, climb: 30 });
  });

  it("emits structured tool proficiencies for AGMH feats", () => {
    const feats = buildFeats();
    expect(feats.find((f) => f.name === "Bomb Specialist")?.toolProficiencies).toEqual([
      { "tinker's tools": true },
    ]);
    const craftsman = feats.find((f) => f.name === "Master Craftsman");
    expect(craftsman?.toolProficiencies?.[0]?.choose?.from).toHaveLength(9);
    expect(feats.find((f) => f.name === "Bastion")?.toolProficiencies).toBeUndefined();
  });
});
