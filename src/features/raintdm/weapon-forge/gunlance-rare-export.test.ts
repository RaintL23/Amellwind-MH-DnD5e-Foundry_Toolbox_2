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

describe("Gunlance rare Foundry export", () => {
  it("emits +1 / AC / Full Burst ×1–3 / Blast Dash over uncommon pool", () => {
    const weapon = loadGunlance();
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

    expect(item.name).toBe("Gunlance (Rare)");
    expect(system.rarity).toBe("rare");
    expect(system.mastery).toBe("push");
    expect(system.magicalBonus).toBe(1);
    expect(system.properties).toEqual(expect.arrayContaining(["rch", "mgc"]));
    expect(system.uses).toMatchObject({ spent: 0, max: "4" });
    expect(weapon.acBonus).toBe(2);
    expect(weapon.includesShield).toBe(true);

    expect(byName["Artillery Shells"]).toBeDefined();
    expect(byName["Guard Reload"]).toBeDefined();

    const shield = item.effects.find((e) =>
      /^Integrated Shield \(\+2 AC\)$/i.test(e.name ?? ""),
    );
    expect(shield).toBeDefined();
    expect(shield?.changes?.[0]).toMatchObject({
      key: "system.attributes.ac.bonus",
      value: "2",
    });

    const rarityAc = item.effects.find((e) =>
      /^Gunlance AC \(\+1\)$/i.test(e.name ?? ""),
    );
    expect(rarityAc).toBeDefined();
    expect(rarityAc?.changes?.[0]).toMatchObject({ value: "1" });

    for (const n of [1, 2, 3] as const) {
      // Exporter names the upgraded leaf "Full Burst ×N".
      const act = byName[`Full Burst ×${n}`] ?? byName[`Shelling Strike ×${n}`];
      expect(act).toBeDefined();
      expect(act.type).toBe("damage");
      expect(
        (act.consumption as { targets: { value: string }[] }).targets[0].value,
      ).toBe(String(n));
      const parts = (
        act.damage as {
          parts: { number: number; denomination: number; types: string[] }[];
        }
      ).parts;
      expect(parts[0]).toMatchObject({
        number: n,
        denomination: 8,
        types: ["thunder"],
      });
    }

    const blast = byName["Blast Dash"];
    expect(blast).toBeDefined();
    expect(blast.type).toBe("utility");
    expect(blast.activation).toMatchObject({ type: "bonus" });
    expect(
      (blast.consumption as { targets: { value: string; type: string }[] })
        .targets[0],
    ).toMatchObject({ type: "itemUses", value: "1" });
    expect((blast.target as { affects: { type: string } }).affects.type).toBe(
      "self",
    );

    const ac = item.effects.find((e) => /Gunlance AC/i.test(e.name ?? ""));
    expect(ac).toBeDefined();
    expect(ac?.transfer).toBe(true);

    // VR+ not on Rare.
    expect(byName["Wyvern's Fire"]).toBeUndefined();
    expect(byName["Wyrmstake Cannon"]).toBeUndefined();
  });

  it("hand-tuned rare example wires Full Burst dialog + Blast Dash attack offer", () => {
    const example = JSON.parse(
      readFileSync(
        "public/data/foundry-jsons-example/weapons/fvtt-Item-gunlance-rare.json",
        "utf8",
      ),
    ) as {
      name: string;
      system: {
        rarity: string;
        magicalBonus: number | null;
        uses: { max: string; spent: number };
        activities: Record<string, Record<string, unknown>>;
      };
      effects: { name?: string }[];
      flags: {
        "midi-qol"?: { onUseMacroName?: string };
        itemacro?: { macro?: { command?: string } };
        world?: { gunlance?: { tier?: string; isGunlance?: boolean } };
      };
    };
    const byName = Object.fromEntries(
      Object.values(example.system.activities).map((a) => [
        String(a.name ?? ""),
        a,
      ]),
    );

    expect(example.name).toBe("Gunlance (Rare)");
    expect(example.system.rarity).toBe("rare");
    expect(example.system.magicalBonus).toBe(1);
    expect(example.system.uses).toMatchObject({ spent: 0, max: "4" });
    expect(byName["Attack"]).toBeDefined();
    expect(byName["Blast Dash"]).toBeDefined();
    expect(
      (byName["Blast Dash"].consumption as { targets: { value: string }[] })
        .targets[0].value,
    ).toBe("1");
    expect(String(byName["Blast Dash"].useConditionText)).toContain(
      "@item.uses.spent < @item.uses.max",
    );

    for (const n of [1, 2, 3] as const) {
      expect(byName[`Shelling Strike ×${n}`]).toBeDefined();
      expect(
        (
          byName[`Shelling Strike ×${n}`].consumption as {
            targets: { value: string }[];
          }
        ).targets[0].value,
      ).toBe(String(n));
    }

    expect(String(byName["Guard Reload"].useConditionText)).toContain(
      'reaction == "isMissed"',
    );
    expect(
      example.effects.some((e) =>
        /^Integrated Shield \(\+2 AC\)$/i.test(e.name ?? ""),
      ),
    ).toBe(true);
    expect(
      example.effects.some((e) => /^Gunlance AC \(\+1\)$/i.test(e.name ?? "")),
    ).toBe(true);

    const midi = example.flags["midi-qol"];
    expect(midi?.onUseMacroName).toContain("preTargeting");
    expect(midi?.onUseMacroName).toContain("postDamageRoll");
    expect(midi?.onUseMacroName).toContain("postActiveEffects");

    const command = example.flags.itemacro?.macro?.command ?? "";
    expect(command).toContain("Full Burst");
    expect(command).toContain("Blast Dash");
    expect(command).toContain("shellingChoiceDialog");
    expect(command).toContain("completeActivityUse");
    expect(example.flags.world?.gunlance).toMatchObject({
      isGunlance: true,
      tier: "rare",
    });

    const companion = readFileSync(
      "public/data/foundry-jsons-example/weapons-resources/gunlance/gunlance-item-macro.js",
      "utf8",
    );
    expect(command).toBe(companion);
  });
});
