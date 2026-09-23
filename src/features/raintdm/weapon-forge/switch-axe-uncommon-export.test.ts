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
    const acid = byName["Phial Discharge (Acid)"];
    const cold = byName["Phial Discharge (Cold)"];
    const fire = byName["Phial Discharge (Fire)"];
    const lightning = byName["Phial Discharge (Lightning)"];
    expect(power).toBeDefined();
    expect(acid).toBeDefined();
    expect(cold).toBeDefined();
    expect(fire).toBeDefined();
    expect(lightning).toBeDefined();
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
      denomination: 8,
      types: ["slashing"],
    });
    const fireParts = (
      fire.damage as {
        parts: { number: number; denomination: number; types?: string[] }[];
      }
    ).parts;
    expect(fireParts[1]).toMatchObject({
      number: 1,
      denomination: 6,
      types: ["fire"],
    });
    expect(power.useConditionText).toContain("sword");
    expect(power.useConditionText).toContain("installedPhial");
    expect(power.useConditionText).toContain('"power"');
    expect(fire.useConditionText).toContain('"fire"');

    const switchPhial = byName["Switch Phial"];
    expect(switchPhial).toBeDefined();
    expect(switchPhial.type).toBe("utility");
    expect(switchPhial.uses).toMatchObject({
      max: "1",
      recovery: [expect.objectContaining({ period: "lr" })],
    });
    expect(
      (switchPhial.midiProperties as { identifier?: string }).identifier,
    ).toBe("switch-phial");

    const zsd = byName["Zero Sum Discharge (ZSD) (scale)"];
    expect(zsd).toBeDefined();
    expect(zsd.type).toBe("attack");
    expect(zsd.activation).toMatchObject({
      type: "special",
      condition: expect.stringMatching(/replace one attack/i),
    });
    expect(zsd.uses).toMatchObject({
      max: "@prof",
      recovery: [expect.objectContaining({ period: "sr" })],
    });
    expect(zsd.range).toMatchObject({ value: 10, units: "ft", override: true });
    const zsdDamage = zsd.damage as {
      includeBase: boolean;
      parts: { number: number; denomination: number }[];
    };
    expect(zsdDamage.includeBase).toBe(false);
    expect(zsdDamage.parts[0]).toMatchObject({ number: 2, denomination: 6 });
    // Phial part scales from 1d6 base (min 2 charges → 2d6 in the scale activity).
    expect(zsdDamage.parts[1]).toMatchObject({ number: 2, denomination: 6 });

    const zsdAdv = item.effects.find((effect) =>
      effect.name.includes("Zero Sum Discharge (ZSD) (Advantage)"),
    );
    expect(zsdAdv).toBeUndefined();

    const flags = item.flags as {
      itemacro?: { macro?: { command?: string } };
      "midi-qol"?: { onUseMacroName?: string };
      world?: {
        switchAxe?: {
          hasKineticGenerator?: boolean;
          modeIndicators?: boolean;
          unlockedPhials?: string[];
        };
      };
    };
    expect(flags["midi-qol"]?.onUseMacroName).toContain("preTargeting");
    expect(flags["midi-qol"]?.onUseMacroName).toContain("postDamageRoll");
    expect(flags.itemacro?.macro?.command).toContain("Fluid Morph");
    expect(flags.itemacro?.macro?.command).toContain("Switch Phial");
    expect(flags.world?.switchAxe?.hasKineticGenerator).toBe(true);
    expect(flags.world?.switchAxe?.modeIndicators).toBe(true);
    expect(flags.world?.switchAxe?.unlockedPhials?.sort()).toEqual([
      "acid",
      "cold",
      "fire",
      "lightning",
      "power",
    ]);

    expect(resources.map((r) => r.name).sort()).toEqual([
      "Acid Phial",
      "Cold Phial",
      "Fire Phial",
      "Lightning Phial",
      "Power Phial",
    ]);
    expect(resourceGroups.map((g) => g.id)).toContain("phials");
  });
});
