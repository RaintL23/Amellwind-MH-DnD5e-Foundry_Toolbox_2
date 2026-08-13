import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryExportBundle } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";

function loadChargeBlade() {
  const raw = JSON.parse(
    readFileSync("public/data/raintdm-weapons/charge-blade.json", "utf8"),
  );
  const [weapon] = parseImportedWeapons([raw], { isCustom: false });
  return weapon;
}

describe("Charge Blade rare Foundry export", () => {
  it("keeps uncommon core and adds Discharge + single AED without preset element", () => {
    const weapon = loadChargeBlade();
    const rareIndex = weapon.rarityRows.findIndex((r) => r.rarity === "Rare");
    expect(rareIndex).toBeGreaterThanOrEqual(0);

    const { weapon: item } = buildWeaponFoundryExportBundle(weapon, rareIndex);
    const system = item.system as Record<string, unknown>;
    const activities = system.activities as Record<
      string,
      Record<string, unknown>
    >;
    const byName = Object.fromEntries(
      Object.values(activities).map((a) => [String(a.name ?? ""), a]),
    );

    expect(item.name).toBe("Charge Blade (Rare)");
    expect(system.rarity).toBe("rare");
    expect(system.magicalBonus).toBe(1);
    expect(system.mastery).toBe("sap");
    expect(system.properties).toEqual(
      expect.arrayContaining(["hvy", "mgc", "fin", "lgt", "two"]),
    );
    expect(system.uses).toMatchObject({ spent: 5, max: "5" });

    expect(byName["Sword & Shield"].damage).toMatchObject({
      includeBase: false,
      parts: [{ bonus: "@mod", number: 1, denomination: 6 }],
    });
    expect(byName.Axe.damage).toMatchObject({
      includeBase: false,
      parts: [{ bonus: "@mod", number: 1, denomination: 12 }],
    });

    const attune = byName["Elemental Attunement"];
    expect(attune).toBeDefined();
    expect(attune.type).toBe("utility");
    expect(attune.uses).toMatchObject({
      max: "1",
      recovery: [{ period: "sr", type: "recoverAll" }],
    });

    expect(byName["Guard Point"]).toBeDefined();
    expect(byName["Guard Point: Eruption"]).toBeDefined();
    expect(
      (
        byName["Guard Point: Eruption"].damage as {
          parts: { types?: string[] }[];
        }
      ).parts[0].types,
    ).toEqual([]);

    const discharge = byName["Elemental Discharge"];
    expect(discharge).toBeDefined();
    expect(discharge.type).toBe("damage");
    expect(discharge.activation).toMatchObject({
      type: "special",
      condition: "When you hit a creature with an attack in Axe Mode",
    });
    expect(
      (
        discharge.consumption as {
          targets: { type: string; value: string }[];
        }
      ).targets[0],
    ).toMatchObject({ type: "itemUses", value: "1" });
    expect(
      (
        discharge.damage as {
          parts: { number: number; denomination: number; types?: string[] }[];
        }
      ).parts[0],
    ).toMatchObject({ number: 1, denomination: 6, types: [] });

    expect(byName["Amped Element Discharge (AED)"]).toBeDefined();
    expect(byName["Amped Element Discharge (AED) ×1"]).toBeUndefined();
    expect(byName["Amped Element Discharge (AED) ×5"]).toBeUndefined();
    const aed = byName["Amped Element Discharge (AED)"];
    expect(aed.type).toBe("save");
    expect(aed.activation).toMatchObject({ type: "action" });
    expect(String(aed.useConditionText)).toContain("axe");
    expect(
      (aed.consumption as { targets: unknown[] } | undefined)?.targets ?? [],
    ).toEqual([]);
    expect(aed.save).toMatchObject({
      ability: ["dex"],
      dc: { calculation: "str" },
    });
    expect(
      (aed.target as { template: { type: string; size: string } }).template,
    ).toMatchObject({ type: "cone", size: "15" });
    expect(
      (
        aed.damage as {
          parts: { number: number; denomination: number; types?: string[] }[];
        }
      ).parts[0],
    ).toMatchObject({ number: 1, denomination: 8, types: [] });

    expect(byName["Charged Shield (Red Shield)"]).toBeUndefined();

    const flags = item.flags as {
      itemacro?: { macro?: { command?: string } };
      world?: {
        chargeBlade?: {
          isChargeBlade?: boolean;
          elementalType?: string;
          aedDamage?: string;
        };
      };
    };
    expect(flags.world?.chargeBlade?.isChargeBlade).toBe(true);
    expect(flags.world?.chargeBlade?.elementalType).toBe("");
    expect(flags.world?.chargeBlade?.aedDamage).toBe("1d8");
    expect(flags.itemacro?.macro?.command).toContain("aedChargesDialog");
    expect(flags.itemacro?.macro?.command).toContain("Elemental Attunement");
    expect(flags.itemacro?.macro?.command).toContain("applyElementalType");
    expect(flags.itemacro?.macro?.command).toContain("new Dialog");
  });

  it("hand-tuned rare example matches builder export contract", () => {
    const example = JSON.parse(
      readFileSync(
        "public/data/foundry-jsons-example/weapons/fvtt-Item-charge-blade-rare.json",
        "utf8",
      ),
    ) as {
      name: string;
      system: {
        rarity: string;
        magicalBonus?: number;
        mastery?: string;
        uses: { max: string; spent: number };
        activities: Record<string, Record<string, unknown>>;
      };
      flags: {
        world?: {
          chargeBlade?: { isChargeBlade?: boolean; elementalType?: string };
        };
        itemacro?: { macro?: { command?: string } };
      };
    };
    const byName = Object.fromEntries(
      Object.values(example.system.activities).map((a) => [
        String(a.name ?? ""),
        a,
      ]),
    );

    expect(example.name).toBe("Charge Blade (Rare)");
    expect(example.system.rarity).toBe("rare");
    expect(example.system.magicalBonus).toBe(1);
    expect(example.system.mastery).toBe("sap");
    expect(example.system.uses).toMatchObject({ spent: 5, max: "5" });
    expect(byName["Elemental Attunement"]).toBeDefined();
    expect(byName["Elemental Discharge"]).toBeDefined();
    expect(byName["Amped Element Discharge (AED)"]).toBeDefined();
    expect(byName["Amped Element Discharge (AED) ×1"]).toBeUndefined();
    expect(byName["Guard Point"]).toBeDefined();
    expect(example.flags.world?.chargeBlade?.isChargeBlade).toBe(true);
    expect(example.flags.world?.chargeBlade?.elementalType).toBe("");
    expect(example.flags.itemacro?.macro?.command).toContain("aedChargesDialog");
    expect(example.flags.itemacro?.macro?.command).toContain(
      "Elemental Attunement",
    );
  });
});
