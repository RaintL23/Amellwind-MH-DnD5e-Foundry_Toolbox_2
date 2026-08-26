import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryExportBundle } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";

function loadDualRepeaters() {
  const raw = JSON.parse(
    readFileSync("public/data/raintdm-weapons/dual-repeaters.json", "utf8"),
  );
  const [weapon] = parseImportedWeapons([raw], { isCustom: false });
  return weapon;
}

describe("Dual Repeaters rare Foundry export", () => {
  it("emits +1 Rare weapon + Upgrade I / Dawnstar / Twilight magazines", () => {
    const weapon = loadDualRepeaters();
    const rareIndex = weapon.rarityRows.findIndex((r) => r.rarity === "Rare");
    expect(rareIndex).toBeGreaterThanOrEqual(0);

    const bundle = buildWeaponFoundryExportBundle(weapon, rareIndex);
    const item = bundle.weapon;
    const system = item.system as Record<string, unknown>;

    expect(item.name).toBe("Dual Repeaters (Rare)");
    expect(system.rarity).toBe("rare");
    expect(system.magicalBonus).toBe(1);
    expect(system.uses).toMatchObject({ spent: 6, max: "6" });

    const magGroup = bundle.resourceGroups.find((g) => g.id === "magazines");
    expect(magGroup).toBeDefined();
    expect(magGroup?.items.map((i) => i.name).sort()).toEqual([
      "Blaze Magazine",
      "Blaze Magazine Upgrade I",
      "Cryo Magazine",
      "Cryo Magazine Upgrade I",
      "Dawnstar Magazine",
      "Normal Magazine",
      "Slime Magazine",
      "Slime Magazine Upgrade I",
      "Storm Magazine",
      "Storm Magazine Upgrade I",
      "Twilight Magazine",
    ]);

    const blazeI = magGroup?.items.find(
      (i) => i.name === "Blaze Magazine Upgrade I",
    );
    expect(blazeI).toBeDefined();
    const blazeFlags = blazeI?.flags as {
      world?: { dualRepeaters?: { magazineKey?: string; riderKind?: string } };
    };
    expect(blazeFlags.world?.dualRepeaters?.magazineKey).toBe("blaze-i");
    expect(blazeFlags.world?.dualRepeaters?.riderKind).toBe("bonusDamage");
    expect(
      blazeI?.effects.some((e) =>
        e.changes?.some((c) => c.key === "system.bonuses.rwak.damage"),
      ),
    ).toBe(true);

    const world = (item.flags as {
      world?: {
        dualRepeaters?: {
          unlockedMagazines?: string[];
        };
      };
    }).world;
    expect(world?.dualRepeaters?.unlockedMagazines).toEqual(
      expect.arrayContaining([
        "normal",
        "blaze",
        "blaze-i",
        "cryo-i",
        "storm-i",
        "slime-i",
        "dawnstar",
        "twilight",
      ]),
    );
  });

  it("hand-tuned rare example matches builder export contract", () => {
    const example = JSON.parse(
      readFileSync(
        "public/data/foundry-jsons-example/weapons/dual-repeaters/fvtt-Item-dual-repeaters-rare.json",
        "utf8",
      ),
    );
    expect(example.name).toBe("Dual Repeaters (Rare)");
    expect(example.system.rarity).toBe("rare");
    expect(example.system.magicalBonus).toBe(1);
    expect(example.flags?.world?.dualRepeaters?.isDualRepeaters).toBe(true);
    expect(example.flags?.world?.dualRepeaters?.unlockedMagazines).toEqual(
      expect.arrayContaining(["blaze-i", "dawnstar", "twilight"]),
    );
  });
});
