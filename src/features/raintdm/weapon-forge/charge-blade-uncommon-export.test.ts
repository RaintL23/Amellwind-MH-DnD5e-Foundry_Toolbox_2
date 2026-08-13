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

describe("Charge Blade uncommon Foundry export", () => {
  it("uses mode AEs + gated attacks + Phial Charges + Guard Point Eruption", () => {
    const weapon = loadChargeBlade();
    const uncommonIndex = weapon.rarityRows.findIndex(
      (r) => r.rarity === "Uncommon",
    );
    expect(uncommonIndex).toBeGreaterThanOrEqual(0);

    const { weapon: item } = buildWeaponFoundryExportBundle(
      weapon,
      uncommonIndex,
    );
    const system = item.system as Record<string, unknown>;
    const activities = system.activities as Record<
      string,
      Record<string, unknown>
    >;
    const byName = Object.fromEntries(
      Object.values(activities).map((a) => [String(a.name ?? ""), a]),
    );

    expect(item.name).toBe("Charge Blade (Uncommon)");
    expect(system.rarity).toBe("uncommon");
    expect(system.properties).toEqual(
      expect.arrayContaining(["hvy", "lgt", "fin", "two"]),
    );
    expect(system.uses).toMatchObject({ spent: 5, max: "5" });
    expect(system.mastery).toBe("sap");
    expect(system.damage).toMatchObject({
      base: { number: 1, denomination: 6 },
    });

    const shield = item.effects.find((e) =>
      /^Integrated Shield \(\+2 AC\)$/i.test(e.name ?? ""),
    );
    expect(shield).toBeDefined();
    expect(shield?.transfer).toBe(true);
    expect(shield?.disabled).toBe(false);
    expect(
      (
        shield?.flags as {
          world?: { integratedShield?: { isIntegratedShield?: boolean } };
        }
      ).world?.integratedShield?.isIntegratedShield,
    ).toBe(true);

    const swordMode = item.effects.find((e) => e.name === "Sword & Shield Mode");
    const axeMode = item.effects.find((e) => e.name === "Axe Mode");
    expect(swordMode).toBeDefined();
    expect(axeMode).toBeDefined();
    expect(swordMode?.disabled).toBe(false);
    expect(axeMode?.disabled).toBe(true);
    expect(swordMode?.transfer).toBe(true);
    expect(
      (swordMode?.flags as { world?: { cb?: { modeKey?: string } } }).world?.cb
        ?.modeKey,
    ).toBe("sword");

    expect(byName["Sword & Shield"]).toBeDefined();
    expect(byName.Axe).toBeDefined();
    expect(byName["Sword & Shield"].type).toBe("attack");
    expect(byName.Axe.type).toBe("attack");
    expect(byName["Sword & Shield"].useConditionText).toContain("axe");
    expect(byName.Axe.useConditionText).toContain("axe");
    expect(byName["Sword & Shield"].damage).toMatchObject({
      includeBase: false,
      parts: [{ number: 1, denomination: 6, bonus: "@mod" }],
    });
    expect(byName.Axe.damage).toMatchObject({
      includeBase: false,
      parts: [{ number: 1, denomination: 12, bonus: "@mod" }],
    });

    expect(byName["Switch Mode"]).toBeDefined();
    expect(byName["Switch Mode"].activation).toMatchObject({ type: "bonus" });

    const guard = byName["Guard Point"];
    expect(guard).toBeDefined();
    expect(guard.type).toBe("utility");
    expect(guard.activation).toMatchObject({ type: "reaction" });
    // Lance / Shield pattern: empty condition + no itemUses consumption.
    expect(guard.useConditionText ?? "").toBe("");
    expect(
      (guard.consumption as { targets: unknown[] } | undefined)?.targets ?? [],
    ).toEqual([]);

    const eruption = byName["Guard Point: Eruption"];
    expect(eruption).toBeDefined();
    expect(eruption.type).toBe("damage");
    const eruptionParts = (
      eruption.damage as {
        parts: { number: number; denomination: number; types?: string[] }[];
      }
    ).parts;
    expect(eruptionParts[0]).toMatchObject({
      number: 1,
      denomination: 4,
      types: [],
    });

    const attune = byName["Elemental Attunement"];
    expect(attune).toBeDefined();
    expect(attune.type).toBe("utility");
    expect(attune.activation).toMatchObject({ type: "special" });
    expect(attune.uses).toMatchObject({
      max: "1",
      recovery: [{ period: "sr", type: "recoverAll" }],
    });

    // Rare+ must not appear on uncommon.
    expect(byName["Elemental Discharge"]).toBeUndefined();
    expect(byName["Amped Element Discharge (AED)"]).toBeUndefined();
    expect(
      Object.keys(byName).some((n) => /amped element discharge/i.test(n)),
    ).toBe(false);

    const flags = item.flags as {
      itemacro?: { macro?: { command?: string } };
      "midi-qol"?: { onUseMacroName?: string };
      world?: {
        chargeBlade?: {
          isChargeBlade?: boolean;
          modeIndicators?: boolean;
          hasPhialCharges?: boolean;
          guardPointDamage?: string;
        };
      };
    };
    expect(flags["midi-qol"]?.onUseMacroName).toContain("preTargeting");
    expect(flags["midi-qol"]?.onUseMacroName).toContain("postDamageRoll");
    expect(flags["midi-qol"]?.onUseMacroName).toContain("postActiveEffects");
    expect(flags.itemacro?.macro?.command).toContain("Switch Mode");
    expect(flags.itemacro?.macro?.command).toContain("Integrated Shield");
    expect(flags.itemacro?.macro?.command).toContain("shieldDisabled");
    expect(flags.itemacro?.macro?.command).toContain("Guard Point");
    expect(flags.world?.chargeBlade?.isChargeBlade).toBe(true);
    expect(flags.world?.chargeBlade?.modeIndicators).toBe(true);
    expect(flags.world?.chargeBlade?.hasPhialCharges).toBe(true);
    expect(flags.world?.chargeBlade?.guardPointDamage).toBe("1d4");
    expect(
      (
        flags.world?.chargeBlade as {
          elementalType?: string;
          swordMastery?: string;
          axeMastery?: string;
        }
      )?.elementalType,
    ).toBe("");
    expect(flags.itemacro?.macro?.command).toContain("Elemental Attunement");
    expect(flags.itemacro?.macro?.command).toContain("applyElementalType");
    expect(
      (
        flags.world?.chargeBlade as {
          swordMastery?: string;
          axeMastery?: string;
        }
      )?.swordMastery,
    ).toBe("sap");
    expect(
      (
        flags.world?.chargeBlade as {
          swordMastery?: string;
          axeMastery?: string;
        }
      )?.axeMastery,
    ).toBe("cleave");
    expect(flags.itemacro?.macro?.command).toContain("system.mastery");
    expect(flags.itemacro?.macro?.command).toContain("new Dialog");
  });

  it("hand-tuned uncommon example wires modes / Guard Point / ItemMacro", () => {
    const example = JSON.parse(
      readFileSync(
        "public/data/foundry-jsons-example/weapons/fvtt-Item-charge-blade-uncommon.json",
        "utf8",
      ),
    ) as {
      name: string;
      system: {
        rarity: string;
        uses: { max: string; spent: number };
        activities: Record<string, Record<string, unknown>>;
      };
      effects?: { name?: string; disabled?: boolean }[];
      flags: {
        world?: {
          chargeBlade?: {
            isChargeBlade?: boolean;
            guardPointDamage?: string;
          };
        };
        "midi-qol"?: { onUseMacroName?: string };
        itemacro?: { macro?: { command?: string } };
      };
    };
    const byName = Object.fromEntries(
      Object.values(example.system.activities).map((a) => [
        String(a.name ?? ""),
        a,
      ]),
    );

    expect(example.name).toBe("Charge Blade (Uncommon)");
    expect(example.system.rarity).toBe("uncommon");
    expect(example.system.uses).toMatchObject({ spent: 5, max: "5" });
    expect((example.system as { mastery?: string }).mastery).toBe("sap");
    expect(byName["Sword & Shield"]).toBeDefined();
    expect(byName.Axe).toBeDefined();
    expect(byName["Switch Mode"]).toBeDefined();
    expect(byName["Elemental Attunement"]).toBeDefined();
    expect(byName["Guard Point"]).toBeDefined();
    expect(byName["Guard Point"].useConditionText ?? "").toBe("");
    expect(
      (
        byName["Guard Point"].consumption as { targets: unknown[] } | undefined
      )?.targets ?? [],
    ).toEqual([]);
    expect(byName["Guard Point: Eruption"]).toBeDefined();

    const swordMode = example.effects?.find(
      (e) => e.name === "Sword & Shield Mode",
    );
    const axeMode = example.effects?.find((e) => e.name === "Axe Mode");
    expect(swordMode?.disabled).toBe(false);
    expect(axeMode?.disabled).toBe(true);

    expect(example.flags.world?.chargeBlade?.isChargeBlade).toBe(true);
    expect(example.flags.world?.chargeBlade?.guardPointDamage).toBe("1d4");
    expect(
      (
        example.flags.world?.chargeBlade as {
          swordMastery?: string;
          axeMastery?: string;
        }
      )?.axeMastery,
    ).toBe("cleave");
    expect(example.flags["midi-qol"]?.onUseMacroName).toContain("preTargeting");
    expect(example.flags.itemacro?.macro?.command).toContain("Phial Charges");
    expect(example.flags.itemacro?.macro?.command).toContain("system.mastery");
    expect(example.flags.itemacro?.macro?.command).toContain("Integrated Shield");
  });
});
