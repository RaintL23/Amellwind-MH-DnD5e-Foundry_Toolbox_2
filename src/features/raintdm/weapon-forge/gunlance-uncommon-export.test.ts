import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryItem } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";

function loadGunlance() {
  const raw = JSON.parse(
    readFileSync("public/data/raintdm-weapons/gunlance.json", "utf8"),
  );
  const [weapon] = parseImportedWeapons([raw], { isCustom: false });
  return weapon;
}

describe("Gunlance uncommon Foundry export", () => {
  it("emits Artillery Shells pool + Shelling Strike / Guard Reload wiring", () => {
    const weapon = loadGunlance();
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

    expect(item.name).toBe("Gunlance (Uncommon)");
    expect(system.rarity).toBe("uncommon");
    expect(system.mastery).toBe("push");
    expect(system.properties).toEqual(expect.arrayContaining(["rch"]));
    expect(system.uses).toMatchObject({
      spent: 0,
      max: "4",
      recovery: [],
    });
    expect(weapon.acBonus).toBe(2);
    expect(weapon.includesShield).toBe(true);

    const shield = item.effects.find((e) =>
      /^Integrated Shield \(\+2 AC\)$/i.test(e.name ?? ""),
    );
    expect(shield).toBeDefined();
    expect(shield?.transfer).toBe(true);
    expect(shield?.changes?.[0]).toMatchObject({
      key: "system.attributes.ac.bonus",
      mode: 2,
      value: "2",
    });

    const reload = byName["Artillery Shells"];
    expect(reload).toBeDefined();
    expect(reload.type).toBe("utility");
    expect(reload.activation).toMatchObject({ type: "bonus" });
    expect(
      (reload.consumption as { targets: { value: string; type: string }[] })
        .targets[0],
    ).toMatchObject({ type: "itemUses", value: "-4" });
    expect(
      (reload.target as { affects: { type: string }; prompt: boolean }).affects
        .type,
    ).toBe("self");
    expect((reload.target as { prompt: boolean }).prompt).toBe(false);
    expect((reload.range as { units: string }).units).toBe("self");

    const strike = byName["Shelling Strike ×1"];
    expect(strike).toBeDefined();
    expect(strike.type).toBe("damage");
    expect(strike.activation).toMatchObject({
      type: "special",
      condition:
        "When you hit a creature with a melee attack using this weapon",
    });
    expect(
      (strike.consumption as { targets: { value: string; type: string }[] })
        .targets[0],
    ).toMatchObject({ type: "itemUses", value: "1" });
    const parts = (
      strike.damage as {
        parts: { number: number; denomination: number; types: string[] }[];
      }
    ).parts;
    expect(parts[0]).toMatchObject({
      number: 1,
      denomination: 6,
      types: ["thunder"],
    });

    const guard = byName["Guard Reload"];
    expect(guard).toBeDefined();
    expect(guard.type).toBe("utility");
    expect(guard.activation).toMatchObject({
      type: "reaction",
      condition:
        "When a creature misses you with a melee attack while you are wielding the shield",
    });
    expect(
      (guard.consumption as { targets: { value: string; type: string }[] })
        .targets[0],
    ).toMatchObject({ type: "itemUses", value: "-2" });
    expect(
      (guard.target as { affects: { type: string }; prompt: boolean }).affects
        .type,
    ).toBe("self");

    // Rare+ features must not appear on uncommon.
    expect(byName["Blast Dash"]).toBeUndefined();
    expect(byName["Full Burst"]).toBeUndefined();
    expect(byName["Shelling Strike ×2"]).toBeUndefined();
    expect(byName["Shelling Strike ×3"]).toBeUndefined();
    expect(byName["Wyvern's Fire"]).toBeUndefined();
  });

  it("hand-tuned uncommon example wires Shelling Strike / Guard Reload dialogs", () => {
    const example = JSON.parse(
      readFileSync(
        "public/data/foundry-jsons-example/weapons/gunlance/fvtt-Item-gunlance-uncommon.json",
        "utf8",
      ),
    ) as {
      name: string;
      system: {
        rarity: string;
        mastery: string;
        uses: { max: string; spent: number };
        activities: Record<string, Record<string, unknown>>;
      };
      effects?: { name?: string; changes?: { value?: string }[] }[];
      flags: {
        "midi-qol"?: {
          onUseMacroName?: string;
        };
        itemacro?: { macro?: { command?: string } };
        world?: { gunlance?: { isGunlance?: boolean; tier?: string } };
      };
    };
    const byName = Object.fromEntries(
      Object.values(example.system.activities).map((a) => [
        String(a.name ?? ""),
        a,
      ]),
    );

    expect(example.name).toBe("Gunlance (Uncommon)");
    expect(example.system.rarity).toBe("uncommon");
    expect(example.system.mastery).toBe("push");
    expect(example.system.uses).toMatchObject({ spent: 0, max: "4" });
    expect(byName["Attack"]).toBeDefined();

    const shield = example.effects?.find((e: { name?: string }) =>
      /^Integrated Shield \(\+2 AC\)$/i.test(e.name ?? ""),
    );
    expect(shield).toBeDefined();
    expect(
      (shield as { changes?: { value?: string }[] })?.changes?.[0]?.value,
    ).toBe("2");

    const reload = byName["Artillery Shells"];
    expect(reload.useConditionText).toBe("@item.uses.spent > 0");
    expect(
      (reload.consumption as { targets: { value: string }[] }).targets[0].value,
    ).toBe("-4");

    const guard = byName["Guard Reload"];
    expect(String(guard.useConditionText)).toContain('reaction == "isMissed"');
    expect(String(guard.useConditionText)).toContain("@item.uses.spent > 0");
    expect(
      (guard.consumption as { targets: { value: string }[] }).targets[0].value,
    ).toBe("-2");

    const midi = example.flags["midi-qol"];
    expect(midi?.onUseMacroName).toContain("preTargeting");
    expect(midi?.onUseMacroName).toContain("postDamageRoll");
    expect(midi?.onUseMacroName).toContain("postActiveEffects");

    const command = example.flags.itemacro?.macro?.command ?? "";
    expect(command).toContain("Shelling Strike");
    expect(command).toContain("Guard Reload");
    expect(command).toContain("completeActivityUse");
    expect(command).toContain("new Dialog");
    expect(example.flags.world?.gunlance).toMatchObject({
      isGunlance: true,
      tier: "uncommon",
    });

    // Keep companion macro file in sync with the embedded ItemMacro.
    const companion = readFileSync(
      "public/data/foundry-jsons-example/weapons-resources/gunlance/gunlance-item-macro.js",
      "utf8",
    );
    expect(command).toBe(companion);
  });
});
