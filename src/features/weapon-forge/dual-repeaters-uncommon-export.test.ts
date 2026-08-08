import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseImportedWeapons } from "@/features/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryExportBundle } from "@/features/weapon-forge/mappers/weapon-forge-foundry.export";

function loadDualRepeaters() {
  const raw = JSON.parse(
    readFileSync("public/data/raintdm-weapons/dual-repeaters.json", "utf8"),
  );
  const [weapon] = parseImportedWeapons([raw], { isCustom: false });
  return weapon;
}

describe("Dual Repeaters uncommon Foundry export", () => {
  it("emits Magazines consumable resources (6 Volleys) + reload dialogs", () => {
    const weapon = loadDualRepeaters();
    const uncommonIndex = weapon.rarityRows.findIndex(
      (r) => r.rarity === "Uncommon",
    );
    expect(uncommonIndex).toBeGreaterThanOrEqual(0);

    const bundle = buildWeaponFoundryExportBundle(weapon, uncommonIndex);
    const item = bundle.weapon;
    const system = item.system as Record<string, unknown>;
    const activities = system.activities as Record<
      string,
      Record<string, unknown>
    >;
    const byName = Object.fromEntries(
      Object.values(activities).map((a) => [String(a.name ?? ""), a]),
    );

    expect(item.name).toBe("Dual Repeaters (Uncommon)");
    expect(system.rarity).toBe("uncommon");
    expect(system.mastery).toBe("nick");
    expect(system.properties).toEqual(
      expect.arrayContaining(["amm", "lgt"]),
    );
    // Volleys live on the weapon sheet as Charges (system.uses max 6).
    expect(system.uses).toMatchObject({ spent: 6, max: "6" });

    const attack = byName.Attack;
    expect(attack).toBeDefined();
    expect(attack.type).toBe("attack");
    expect(
      (attack.consumption as { targets: { value: string; type: string }[] })
        .targets[0],
    ).toMatchObject({ type: "itemUses", value: "1" });

    const magazines = byName.Magazines;
    expect(magazines).toBeDefined();
    expect(magazines.type).toBe("utility");
    expect(magazines.activation).toMatchObject({ type: "bonus" });

    const empowered = byName["Empowered Reload"];
    expect(empowered).toBeDefined();
    expect(empowered.activation).toMatchObject({ type: "bonus" });

    const magGroup = bundle.resourceGroups.find((g) => g.id === "magazines");
    expect(magGroup).toBeDefined();
    expect(magGroup?.items.map((i) => i.name).sort()).toEqual([
      "Blaze Magazine",
      "Cryo Magazine",
      "Normal Magazine",
      "Slime Magazine",
      "Storm Magazine",
    ]);

    for (const mag of magGroup?.items ?? []) {
      expect(mag.type).toBe("consumable");
      const flags = mag.flags as {
        world?: {
          dualRepeaters?: {
            isMagazine?: boolean;
            chargesPerMagazine?: number;
          };
        };
        "amellwind-toolbox"?: { resourceKind?: string };
      };
      expect(flags.world?.dualRepeaters?.isMagazine).toBe(true);
      expect(flags.world?.dualRepeaters?.chargesPerMagazine).toBe(6);
      expect(flags["amellwind-toolbox"]?.resourceKind).toBe("magazine");
      expect(mag.effects.some((e) => /loaded/i.test(e.name ?? ""))).toBe(true);
    }

    const world = (item.flags as {
      world?: {
        dualRepeaters?: {
          isDualRepeaters?: boolean;
          unlockedMagazines?: string[];
        };
      };
    }).world;
    expect(world?.dualRepeaters).toMatchObject({
      isDualRepeaters: true,
      unlockedMagazines: expect.arrayContaining([
        "normal",
        "blaze",
        "cryo",
        "storm",
        "slime",
      ]),
    });
    expect(
      (item.flags as { itemacro?: { macro?: { command?: string } } }).itemacro
        ?.macro?.command,
    ).toContain("Load Magazine");

    expect(byName["Dawnstar Magazine"]).toBeUndefined();
  });
});
