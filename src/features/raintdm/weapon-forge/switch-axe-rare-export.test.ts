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

describe("Switch Axe rare Foundry export", () => {
  it("adds Expanded Gauge I, ZSD Splash save, Exhaust/Poison discharges + +1", () => {
    const weapon = loadSwitchAxe();
    const rareIndex = weapon.rarityRows.findIndex((r) => r.rarity === "Rare");
    expect(rareIndex).toBeGreaterThanOrEqual(0);

    const { weapon: item, resources } = buildWeaponFoundryExportBundle(
      weapon,
      rareIndex,
    );
    const system = item.system as Record<string, unknown>;
    const activities = system.activities as Record<
      string,
      Record<string, unknown>
    >;
    const byName = Object.fromEntries(
      Object.values(activities).map((a) => [String(a.name ?? ""), a]),
    );

    expect(item.name).toBe("Switch Axe (Rare)");
    expect(system.rarity).toBe("rare");
    expect(system.magicalBonus).toBe(1);
    expect(system.properties).toEqual(
      expect.arrayContaining(["hvy", "mgc", "rch", "two"]),
    );
    expect(system.uses).toMatchObject({ spent: 7, max: "7" });

    // Uncommon core retained.
    expect(byName.Axe).toBeDefined();
    expect(byName.Sword).toBeUndefined();
    expect(byName["Fluid Morph"]).toBeDefined();
    expect(item.effects.some((e) => e.name === "Axe Mode")).toBe(true);

    // Seven Phial Discharge attacks (Power + 4 elements + Exhaust + Poison).
    for (const label of [
      "Power",
      "Acid",
      "Cold",
      "Fire",
      "Lightning",
      "Exhaust",
      "Poison",
    ] as const) {
      const act = byName[`Phial Discharge (${label})`];
      expect(act, label).toBeDefined();
      expect(act.type).toBe("attack");
      expect(
        (act.consumption as { targets: { value: string }[] }).targets[0].value,
      ).toBe("1");
    }

    expect(byName["Switch Phial"]).toBeDefined();
    expect(byName["Phial Discharge (Element)"]).toBeUndefined();

    const exhaust = byName["Phial Discharge (Exhaust)"];
    const exhaustParts = (
      exhaust.damage as {
        parts: {
          number: number;
          denomination: number;
          types: string[];
          bonus?: string;
        }[];
      }
    ).parts;
    expect(exhaustParts[0]).toMatchObject({
      number: 2,
      denomination: 6,
      bonus: "@mod",
    });
    expect(exhaustParts[1]).toMatchObject({
      number: 1,
      denomination: 6,
      types: ["bludgeoning"],
    });
    expect(item.effects.some((e) => e.name === "Exhaust Phial")).toBe(true);
    expect(exhaust.effects).toEqual([
      expect.objectContaining({
        _id: item.effects.find((e) => e.name === "Exhaust Phial")?._id,
      }),
    ]);

    const poisonSave = byName["Poison Phial (Save)"];
    expect(poisonSave).toBeDefined();
    expect(poisonSave.type).toBe("save");
    expect(poisonSave.save).toMatchObject({
      ability: ["con"],
      dc: { calculation: "str" },
    });
    expect(
      (
        byName["Phial Discharge (Poison)"]
          .midiProperties as { triggeredActivityId?: string }
      ).triggeredActivityId,
    ).toBe(
      Object.entries(activities).find(
        ([, a]) => a.name === "Poison Phial (Save)",
      )?.[0],
    );

    // ZSD Splash companion.
    const zsd =
      byName["Zero Sum Discharge Splash"] ??
      byName["Zero Sum Discharge Splash (scale)"];
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
      parts: { number: number; denomination: number }[];
    };
    // Upgrade I → 1d8 per charge; scale activity starts at min 2 → 2d8.
    expect(zsdDamage.parts[1]).toMatchObject({ number: 2, denomination: 8 });
    const splash = byName["ZSD Splash"];
    expect(splash).toBeDefined();
    expect(splash.type).toBe("save");
    expect(splash.save).toMatchObject({ ability: ["dex"] });
    expect(
      (splash.target as { template: { type: string; size: string } }).template,
    ).toMatchObject({ type: "radius", size: "5" });
    expect(
      (splash.damage as { parts: { denomination: number }[] }).parts[0],
    ).toMatchObject({ denomination: 8 });
    expect(
      (zsd.midiProperties as { triggeredActivityId?: string })
        .triggeredActivityId,
    ).toBe(
      Object.entries(activities).find(([, a]) => a.name === "ZSD Splash")?.[0],
    );

    const splashAdv = item.effects.find(
      (effect) =>
        /zero sum discharge/i.test(effect.name) &&
        /advantage/i.test(effect.name),
    );
    expect(splashAdv).toBeUndefined();

    expect(resources.map((r) => r.name).sort()).toEqual([
      "Acid Phial",
      "Cold Phial",
      "Exhaust Phial",
      "Fire Phial",
      "Lightning Phial",
      "Poison Phial",
      "Power Phial",
    ]);

    // VR+ features absent.
    expect(
      Object.keys(byName).some((n) => /offset morph|elemental awakening/i.test(n)),
    ).toBe(false);
  });
});
