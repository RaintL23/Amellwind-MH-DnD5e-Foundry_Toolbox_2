import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryItem } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";
import { DUAL_BLADES_DEMON_DODGE_ITEM_MACRO } from "@/features/raintdm/weapon-forge/mappers/dual-blades-demon-dodge.macro";

function loadDualBlades() {
  const raw = JSON.parse(
    readFileSync("public/data/raintdm-weapons/dual-blades.json", "utf8"),
  );
  const [weapon] = parseImportedWeapons([raw], { isCustom: false });
  return weapon;
}

describe("Dual Blades uncommon Foundry export", () => {
  it("emits Demon Mode stance + Demon Dodge ItemMacro AC automation", () => {
    const weapon = loadDualBlades();
    const uncommonIndex = weapon.rarityRows.findIndex(
      (r) => r.rarity === "Uncommon",
    );
    expect(uncommonIndex).toBeGreaterThanOrEqual(0);

    const item = buildWeaponFoundryItem(weapon, uncommonIndex);
    const system = item.system as Record<string, unknown>;
    const activities = system.activities as Record<
      string,
      Record<string, unknown>
    >;
    const byName = Object.fromEntries(
      Object.values(activities).map((a) => [String(a.name ?? ""), a]),
    );

    expect(item.name).toBe("Dual Blades (Uncommon)");
    expect(system.rarity).toBe("uncommon");
    expect(system.mastery).toBe("nick");
    expect(system.properties).toEqual(expect.arrayContaining(["fin", "lgt"]));
    expect(system.price).toMatchObject({ value: 30, denomination: "gp" });

    const demonMode = byName["Demon Mode"];
    expect(demonMode).toBeDefined();
    expect(demonMode.type).toBe("utility");
    expect(demonMode.activation).toMatchObject({ type: "bonus" });
    expect(demonMode.uses).toMatchObject({
      max: "@prof",
      recovery: [expect.objectContaining({ period: "lr", type: "recoverAll" })],
    });
    expect(demonMode.duration).toMatchObject({
      value: "1",
      units: "minute",
    });
    expect(
      (demonMode.midiProperties as { toggleEffect?: boolean }).toggleEffect,
    ).toBe(true);

    const demonModeEffect = item.effects.find((e) => e.name === "Demon Mode");
    expect(demonModeEffect).toBeDefined();
    expect(demonModeEffect?.transfer).toBe(false);
    expect(demonModeEffect?.duration.seconds).toBe(60);
    expect(demonModeEffect?.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "system.attributes.movement.walk",
          value: "10",
        }),
        expect.objectContaining({
          key: "system.bonuses.mwak.damage",
          value: "1d4[slashing]",
        }),
      ]),
    );
    expect(demonModeEffect?.changes).toHaveLength(2);
    expect(
      (
        demonModeEffect?.flags as {
          world?: { dualBlades?: { isDemonMode?: boolean } };
          dae?: { disableIncapacitated?: boolean };
        }
      )?.world?.dualBlades?.isDemonMode,
    ).toBe(true);
    expect(
      (demonModeEffect?.flags as { dae?: { disableIncapacitated?: boolean } })
        ?.dae?.disableIncapacitated,
    ).toBe(true);
    expect(
      (demonModeEffect?.flags as { dae?: { selfTarget?: boolean } })?.dae
        ?.selfTarget,
    ).toBeUndefined();

    const demonDodge = byName["Demon Dodge"];
    expect(demonDodge).toBeDefined();
    expect(demonDodge.type).toBe("utility");
    expect(demonDodge.activation).toMatchObject({
      type: "reaction",
      condition: expect.stringContaining("Demon Mode"),
    });
    expect(byName["Archdemon Mode"]).toBeUndefined();
    expect(byName["Perfect Evade"]).toBeUndefined();

    const flags = item.flags as {
      "midi-qol"?: { onUseMacroName?: string };
      itemacro?: { macro?: { command?: string } };
      world?: { dualBlades?: { isDualBlades?: boolean; tier?: string } };
    };
    expect(flags["midi-qol"]?.onUseMacroName).toBe(
      "[postActiveEffects]ItemMacro",
    );
    expect(flags.itemacro?.macro?.command).toBe(
      DUAL_BLADES_DEMON_DODGE_ITEM_MACRO,
    );
    expect(flags.world?.dualBlades).toMatchObject({
      isDualBlades: true,
      tier: "uncommon",
    });
  });
});

describe("Dual Blades rare Foundry export", () => {
  it("keeps Demon Mode/Dodge and adds Perfect Evade + Archdemon Mode", () => {
    const weapon = loadDualBlades();
    const rareIndex = weapon.rarityRows.findIndex((r) => r.rarity === "Rare");
    expect(rareIndex).toBeGreaterThanOrEqual(0);

    const item = buildWeaponFoundryItem(weapon, rareIndex);
    const system = item.system as Record<string, unknown>;
    const activities = system.activities as Record<
      string,
      Record<string, unknown>
    >;
    const byName = Object.fromEntries(
      Object.values(activities).map((a) => [String(a.name ?? ""), a]),
    );

    expect(item.name).toBe("Dual Blades (Rare)");
    expect(system.rarity).toBe("rare");
    expect(system.magicalBonus).toBe(1);
    expect(system.mastery).toBe("nick");
    expect(system.properties).toEqual(
      expect.arrayContaining(["fin", "lgt", "mgc"]),
    );

    const demonMode = byName["Demon Mode"];
    expect(demonMode).toBeDefined();
    expect(demonMode.type).toBe("utility");
    expect(demonMode.uses).toMatchObject({ max: "@prof" });
    expect(
      (demonMode.midiProperties as { toggleEffect?: boolean }).toggleEffect,
    ).toBe(true);

    const demonDodge = byName["Demon Dodge"];
    expect(demonDodge).toBeDefined();
    expect(demonDodge.type).toBe("utility");
    expect(demonDodge.activation).toMatchObject({ type: "reaction" });

    const perfectEvade = byName["Perfect Evade"];
    expect(perfectEvade).toBeDefined();
    expect(perfectEvade.type).toBe("attack");
    expect(perfectEvade.activation).toMatchObject({
      type: "reaction",
      condition: expect.stringContaining("Demon Dodge"),
    });
    expect(perfectEvade.damage).toMatchObject({ includeBase: true });

    const archdemon = byName["Archdemon Mode"];
    expect(archdemon).toBeDefined();
    expect(archdemon.type).toBe("utility");
    expect(archdemon.activation).toMatchObject({
      type: "bonus",
      condition: expect.stringContaining("Demon Mode ends"),
    });
    expect(
      (archdemon.midiProperties as { toggleEffect?: boolean }).toggleEffect,
    ).toBe(true);

    const demonModeEffect = item.effects.find((e) => e.name === "Demon Mode");
    expect(demonModeEffect?.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "system.attributes.movement.walk",
          value: "10",
        }),
        expect.objectContaining({
          key: "system.bonuses.mwak.damage",
          value: "1d4[slashing]",
        }),
      ]),
    );

    const archEffect = item.effects.find((e) => e.name === "Archdemon Mode");
    expect(archEffect).toBeDefined();
    expect(archEffect?.changes).toEqual([
      expect.objectContaining({
        key: "system.bonuses.mwak.damage",
        value: "1d4[slashing]",
      }),
    ]);
    expect(
      archEffect?.changes.some(
        (c) => c.key === "system.attributes.movement.walk",
      ),
    ).toBe(false);
    expect(
      (
        archEffect?.flags as {
          world?: { dualBlades?: { isArchdemonMode?: boolean } };
        }
      )?.world?.dualBlades?.isArchdemonMode,
    ).toBe(true);

    const flags = item.flags as {
      "midi-qol"?: { onUseMacroName?: string };
      world?: { dualBlades?: { tier?: string; isDualBlades?: boolean } };
      itemacro?: { macro?: { command?: string } };
    };
    expect(flags["midi-qol"]?.onUseMacroName).toBe(
      "[postActiveEffects]ItemMacro",
    );
    expect(flags.world?.dualBlades).toMatchObject({
      isDualBlades: true,
      tier: "rare",
    });
    expect(flags.itemacro?.macro?.command).toContain("Perfect Evade");
    expect(flags.itemacro?.macro?.command).toContain("Archdemon Mode");
  });
});
