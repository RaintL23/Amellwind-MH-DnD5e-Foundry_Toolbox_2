import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryItem } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";

const EXAMPLES = {
  common:
    "public/data/foundry-jsons-example/weapons/fvtt-Item-magus-staff-common.json",
  uncommon:
    "public/data/foundry-jsons-example/weapons/fvtt-Item-magus-staff-uncommon.json",
  rare: "public/data/foundry-jsons-example/weapons/fvtt-Item-magus-staff-rare.json",
} as const;

describe("Magus Staff Weapon Forge catalog", () => {
  const raw = JSON.parse(
    readFileSync("public/data/raintdm-weapons/magus-staff.json", "utf8"),
  );
  const [weapon] = parseImportedWeapons([raw], { isCustom: false });

  it("parses quarterstaff-compatible focus staff and rarity features", () => {
    expect(weapon.name).toBe("Magus Staff");
    expect(weapon.dmg1).toBe("1d6");
    expect(weapon.dmg2).toBe("1d10");
    expect(weapon.properties).toEqual(["V"]);
    expect(weapon.isFocus).toBe(true);
    expect(weapon.proficiency?.compatible).toEqual(["Quarterstaff"]);
    expect(weapon.proficiency?.tier).toBe("simple");

    expect(
      weapon.rarityRows.find((r) => r.rarity === "Common")?.columns.Features,
    ).toEqual(["Mastery (Sap)"]);
    expect(
      weapon.rarityRows.find((r) => r.rarity === "Uncommon")?.columns.Features,
    ).toEqual(
      expect.arrayContaining([
        "Spell Core Gauge",
        "Harvest Magic",
        "Arcane Discharge",
      ]),
    );
    expect(
      weapon.rarityRows.find((r) => r.rarity === "Rare")?.columns.Features,
    ).toEqual(
      expect.arrayContaining([
        "Improve Casting",
        "Expanded Gauge",
        "Offset Ward",
      ]),
    );
  });

  it("exports Common with Sap mastery, focus, versatile dice, and Item Macro", () => {
    const commonIndex = weapon.rarityRows.findIndex((r) => r.rarity === "Common");
    const item = buildWeaponFoundryItem(weapon, commonIndex);
    const system = item.system as Record<string, unknown>;
    const activities = system.activities as Record<
      string,
      Record<string, unknown>
    >;
    const byName = Object.fromEntries(
      Object.values(activities).map((a) => [String(a.name ?? ""), a]),
    );
    const damage = system.damage as {
      base?: { number?: number; denomination?: number; types?: string[] };
      versatile?: { number?: number; denomination?: number };
    };

    expect(item.name).toBe("Magus Staff (Common)");
    expect(item.img).toBe("mh-icons/weapon_magusstaff.webp");
    expect(system.identifier).toBe("magusstaff");
    expect(system.rarity).toBe("common");
    expect(system.attunement).toBe("required");
    expect(system.mastery).toBe("sap");
    expect(
      (system.type as { value?: string; baseItem?: string } | undefined)?.value,
    ).toBe("simpleM");
    expect(system.properties).toEqual(["foc", "ver"]);
    expect(damage.base).toMatchObject({
      number: 1,
      denomination: 6,
      types: ["bludgeoning"],
    });
    expect(damage.versatile).toMatchObject({
      number: 1,
      denomination: 10,
    });
    expect(byName.Attack).toBeDefined();
    expect(item.effects.some((ef) => ef.name === "Mastery (Sap)")).toBe(true);

    const flags = item.flags as {
      itemacro?: { macro?: { command?: string } };
      "midi-qol"?: { onUseMacroName?: string };
      world?: { magusStaff?: { isMagusStaff?: boolean; tier?: string } };
    };
    expect(flags.world?.magusStaff?.isMagusStaff).toBe(true);
    expect(flags.world?.magusStaff?.tier).toBe("common");
    expect(flags["midi-qol"]?.onUseMacroName).toBe(
      "[postActiveEffects]ItemMacro",
    );
    expect(flags.itemacro?.macro?.command).toContain("Mastery (Sap)");
  });

  it("exports Uncommon with Spell Core Gauge, Harvest Magic, and Arcane Discharge", () => {
    const uncommonIndex = weapon.rarityRows.findIndex(
      (r) => r.rarity === "Uncommon",
    );
    const item = buildWeaponFoundryItem(weapon, uncommonIndex);
    const system = item.system as Record<string, unknown>;
    const activities = system.activities as Record<
      string,
      Record<string, unknown>
    >;
    const byName = Object.fromEntries(
      Object.values(activities).map((a) => [String(a.name ?? ""), a]),
    );

    expect(item.name).toBe("Magus Staff (Uncommon)");
    expect(system.rarity).toBe("uncommon");
    expect(system.mastery).toBe("sap");
    expect(system.uses).toMatchObject({ spent: 3, max: "3" });
    expect(system.properties).toEqual(["foc", "ver"]);

    expect(byName.Attack).toBeDefined();
    expect(byName["Harvest Magic"]).toBeDefined();
    expect(byName["Harvest Magic"].type).toBe("utility");
    expect(byName["Harvest Magic"].useConditionText).toBe(
      "@item.uses.value < @item.uses.max",
    );
    expect(
      (byName["Harvest Magic"].consumption as { targets: unknown[] }).targets,
    ).toEqual([]);

    const discharge = byName["Arcane Discharge"];
    expect(discharge).toBeDefined();
    expect(discharge.type).toBe("damage");
    expect(
      (discharge.consumption as { scaling: { allowed: boolean; max: string } })
        .scaling,
    ).toEqual({ allowed: true, max: "2" });
    expect(
      (discharge.consumption as { targets: { value: string }[] }).targets[0]
        .value,
    ).toBe("1");
    expect(
      (
        discharge.damage as {
          parts: { number: number; denomination: number }[];
        }
      ).parts[0],
    ).toMatchObject({ number: 1, denomination: 6 });

    expect(byName["Offset Ward"]).toBeUndefined();
    expect(
      item.effects.some((ef) => ef.name === "Improve Casting"),
    ).toBe(false);

    const flags = item.flags as {
      "midi-qol"?: { onUseMacroName?: string };
      world?: {
        magusStaff?: {
          isMagusStaff?: boolean;
          tier?: string;
          spellCoreMax?: number;
        };
      };
      itemacro?: { macro?: { command?: string } };
    };
    expect(flags.world?.magusStaff).toMatchObject({
      isMagusStaff: true,
      tier: "uncommon",
      spellCoreMax: 3,
    });
    expect(flags["midi-qol"]?.onUseMacroName).toBe(
      "[postActiveEffects]ItemMacro",
    );
    expect(flags.itemacro?.macro?.command).toContain("Harvest Magic");
  });

  it("exports Rare with Expanded Gauge, Improve Casting, and Offset Ward", () => {
    const rareIndex = weapon.rarityRows.findIndex((r) => r.rarity === "Rare");
    const item = buildWeaponFoundryItem(weapon, rareIndex);
    const system = item.system as Record<string, unknown>;
    const activities = system.activities as Record<
      string,
      Record<string, unknown>
    >;
    const byName = Object.fromEntries(
      Object.values(activities).map((a) => [String(a.name ?? ""), a]),
    );

    expect(item.name).toBe("Magus Staff (Rare)");
    expect(system.rarity).toBe("rare");
    expect(system.uses).toMatchObject({ spent: 5, max: "5" });

    const casting = item.effects.find((ef) => ef.name === "Improve Casting");
    expect(casting).toBeDefined();
    expect(casting?.transfer).toBe(true);
    expect(casting?.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "system.bonuses.spell.dc",
          value: "1",
        }),
        expect.objectContaining({
          key: "system.bonuses.msak.attack",
          value: "1",
        }),
        expect.objectContaining({
          key: "system.bonuses.rsak.attack",
          value: "1",
        }),
      ]),
    );

    const ward = byName["Offset Ward"];
    expect(ward).toBeDefined();
    expect(ward.type).toBe("utility");
    expect((ward.activation as { type?: string }).type).toBe("reaction");
    expect(
      (ward.consumption as { targets: unknown[] }).targets,
    ).toEqual([]);

    const discharge = byName["Arcane Discharge"];
    expect(
      (discharge.consumption as { scaling: { max: string } }).scaling.max,
    ).toBe("4");

    const flags = item.flags as {
      "midi-qol"?: { onUseMacroName?: string };
      world?: { magusStaff?: { tier?: string; spellCoreMax?: number } };
      itemacro?: { macro?: { command?: string } };
    };
    expect(flags.world?.magusStaff).toMatchObject({
      tier: "rare",
      spellCoreMax: 5,
    });
    expect(flags["midi-qol"]?.onUseMacroName).toBe(
      "[preTargeting]ItemMacro,[postActiveEffects]ItemMacro",
    );
    expect(flags.itemacro?.macro?.command).toContain("Offset Ward");
    expect(flags.itemacro?.macro?.command).toContain("+5 AC");
  });

  it("keeps Foundry examples in sync with the exporter", () => {
    const rows: Array<{
      rarity: "Common" | "Uncommon" | "Rare";
      path: string;
    }> = [
      { rarity: "Common", path: EXAMPLES.common },
      { rarity: "Uncommon", path: EXAMPLES.uncommon },
      { rarity: "Rare", path: EXAMPLES.rare },
    ];

    for (const { rarity, path } of rows) {
      const idx = weapon.rarityRows.findIndex((r) => r.rarity === rarity);
      const item = buildWeaponFoundryItem(weapon, idx);
      if (process.env.UPDATE_FOUNDRY_EXAMPLES === "1") {
        writeFileSync(path, `${JSON.stringify(item, null, 2)}\n`);
      }
      const example = JSON.parse(readFileSync(path, "utf8")) as {
        name: string;
        system: {
          rarity: string;
          mastery: string;
          uses?: { max?: string; spent?: number };
          properties: string[];
        };
        flags: {
          itemacro?: { macro?: { command?: string } };
          world?: { magusStaff?: { isMagusStaff?: boolean; tier?: string } };
        };
      };

      expect(example.name, path).toBe(item.name);
      expect(example.system.rarity, path).toBe(
        (item.system as { rarity?: string }).rarity,
      );
      expect(example.system.mastery, path).toBe("sap");
      expect(example.system.properties, path).toEqual(["foc", "ver"]);
      expect(example.flags.world?.magusStaff?.isMagusStaff, path).toBe(true);
      expect(example.flags.itemacro?.macro?.command, path).toBe(
        (item.flags as { itemacro?: { macro?: { command?: string } } }).itemacro
          ?.macro?.command,
      );
    }
  });
});
