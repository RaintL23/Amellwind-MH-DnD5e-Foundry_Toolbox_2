import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryExportBundle } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";

function loadSwitchAxe() {
  const raw = JSON.parse(
    readFileSync("public/data/raintdm-weapons/switch-axe.json", "utf8"),
  );
  const [weapon] = parseImportedWeapons([raw], { isCustom: false });
  return weapon;
}

describe("Switch Axe uncommon Foundry export", () => {
  it("uses mode AEs + Axe attack + Phial Discharge sword strikes (no Sword Attack)", () => {
    const weapon = loadSwitchAxe();
    const uncommonIndex = weapon.rarityRows.findIndex(
      (r) => r.rarity === "Uncommon",
    );
    expect(uncommonIndex).toBeGreaterThanOrEqual(0);

    const { weapon: item, resources, resourceGroups } =
      buildWeaponFoundryExportBundle(weapon, uncommonIndex);
    const system = item.system as Record<string, unknown>;
    const activities = system.activities as Record<
      string,
      Record<string, unknown>
    >;
    const byName = Object.fromEntries(
      Object.values(activities).map((a) => [String(a.name ?? ""), a]),
    );

    expect(item.name).toBe("Switch Axe (Uncommon)");
    expect(system.rarity).toBe("uncommon");
    expect(system.properties).toEqual(
      expect.arrayContaining(["hvy", "rch", "two"]),
    );
    expect(system.uses).toMatchObject({ spent: 5, max: "5" });

    // Mode indicators
    const axeMode = item.effects.find((e) => e.name === "Axe Mode");
    const swordMode = item.effects.find((e) => e.name === "Sword Mode");
    expect(axeMode).toBeDefined();
    expect(swordMode).toBeDefined();
    expect(axeMode?.disabled).toBe(false);
    expect(swordMode?.disabled).toBe(true);
    expect(axeMode?.transfer).toBe(true);
    expect(
      (axeMode?.flags as { world?: { sa?: { modeKey?: string } } }).world?.sa
        ?.modeKey,
    ).toBe("axe");

    // No Sword Attack activity — Sword Mode strikes via Phial Discharge.
    expect(byName.Sword).toBeUndefined();
    expect(byName.Axe).toBeDefined();
    expect(byName.Axe.type).toBe("attack");
    expect(byName.Axe.useConditionText).toContain("sword");

    expect(byName["Fluid Morph"]).toBeDefined();
    expect(byName["Fluid Morph"].activation).toMatchObject({ type: "bonus" });

    expect(byName["Kinetic Generator"]).toBeUndefined();

    const power = byName["Phial Discharge (Power)"];
    const element = byName["Phial Discharge (Element)"];
    expect(power).toBeDefined();
    expect(element).toBeDefined();
    expect(power.type).toBe("attack");
    expect(
      (
        power.consumption as {
          targets: { value: string; type: string }[];
        }
      ).targets[0],
    ).toMatchObject({ type: "itemUses", value: "1" });
    const powerParts = (
      power.damage as {
        includeBase: boolean;
        parts: { number: number; denomination: number; types?: string[] }[];
      }
    ).parts;
    expect(power.damage).toMatchObject({ includeBase: false });
    expect(powerParts[0]).toMatchObject({
      number: 2,
      denomination: 6,
      types: ["slashing"],
      bonus: "@mod",
    });
    expect(powerParts[1]).toMatchObject({
      number: 1,
      denomination: 6,
      types: ["slashing"],
    });
    expect(power.useConditionText).toContain("sword");

    const zsd = byName["Zero Sum Discharge (ZSD) (scale)"];
    expect(zsd).toBeDefined();
    expect(zsd.type).toBe("attack");
    const zsdDamage = zsd.damage as {
      includeBase: boolean;
      parts: { number: number; denomination: number }[];
    };
    expect(zsdDamage.includeBase).toBe(false);
    expect(zsdDamage.parts[0]).toMatchObject({ number: 2, denomination: 6 });

    const zsdAdv = item.effects.find((effect) =>
      effect.name.includes("Zero Sum Discharge (ZSD) (Advantage)"),
    );
    expect(
      (zsdAdv?.flags as { dae?: { showIcon?: boolean } })?.dae?.showIcon,
    ).toBe(true);

    const flags = item.flags as {
      itemacro?: { macro?: { command?: string } };
      "midi-qol"?: { onUseMacroName?: string };
      world?: {
        switchAxe?: {
          hasKineticGenerator?: boolean;
          modeIndicators?: boolean;
        };
      };
    };
    expect(flags["midi-qol"]?.onUseMacroName).toContain("preTargeting");
    expect(flags["midi-qol"]?.onUseMacroName).toContain("postDamageRoll");
    expect(flags.itemacro?.macro?.command).toContain("Fluid Morph");
    expect(flags.world?.switchAxe?.hasKineticGenerator).toBe(true);
    expect(flags.world?.switchAxe?.modeIndicators).toBe(true);

    expect(resources.map((r) => r.name).sort()).toEqual([
      "Element Phial",
      "Power Phial",
    ]);
    expect(resourceGroups.map((g) => g.id)).toContain("phials");
  });
});
