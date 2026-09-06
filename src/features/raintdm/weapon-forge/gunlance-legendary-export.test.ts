import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryItem } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";
import type { FoundryItem } from "@/shared/foundry";

const raw = JSON.parse(
  readFileSync("public/data/raintdm-weapons/gunlance.json", "utf8"),
);

function activitiesByName(item: FoundryItem) {
  return Object.fromEntries(
    Object.values(
      item.system.activities as Record<string, Record<string, unknown>>,
    ).map((a) => [String(a.name ?? ""), a]),
  );
}

describe("gunlance legendary / very rare automation", () => {
  it("reloads all shells, dual Wyvern's Fire, auto Wyrmstake", () => {
    const [weapon] = parseImportedWeapons([raw], { isCustom: false });
    const legendaryIdx = weapon.rarityRows.findIndex(
      (r) => r.rarity === "Legendary",
    );
    const vrIdx = weapon.rarityRows.findIndex((r) => r.rarity === "Very Rare");
    const legendary = buildWeaponFoundryItem(weapon, legendaryIdx);
    const vr = buildWeaponFoundryItem(weapon, vrIdx);

    const L = activitiesByName(legendary);
    const V = activitiesByName(vr);

    expect(legendary.system.uses).toMatchObject({ max: "6" });
    expect(
      (L["Artillery Shells"].consumption as { targets: { value: string }[] })
        .targets[0].value,
    ).toBe("-6");

    expect(vr.system.uses).toMatchObject({ max: "5" });
    expect(
      (V["Artillery Shells"].consumption as { targets: { value: string }[] })
        .targets[0].value,
    ).toBe("-5");

    const wyvern = L["Wyvern's Fire"] as {
      type: string;
      target: { template: { type: string; size: string } };
      damage: {
        parts: Array<{
          number: number;
          denomination: number;
          types: string[];
        }>;
      };
      save: { dc: { calculation: string } };
    };
    expect(wyvern.type).toBe("save");
    expect(wyvern.target.template).toMatchObject({ type: "cone", size: "30" });
    expect(wyvern.damage.parts).toHaveLength(2);
    expect(wyvern.damage.parts[0]).toMatchObject({
      number: 5,
      denomination: 6,
      types: ["fire"],
    });
    expect(wyvern.damage.parts[1]).toMatchObject({
      number: 5,
      denomination: 6,
      types: ["thunder"],
    });
    expect(wyvern.save.dc.calculation).toBe("str");

    const wyrm = L["Wyrmstake Cannon"] as {
      type: string;
      consumption: { targets: { value: string }[] };
      damage: {
        parts: Array<{
          number: number;
          denomination: number;
          types: string[];
        }>;
      };
      save?: unknown;
    };
    expect(wyrm.type).toBe("damage");
    expect(wyrm.consumption.targets[0].value).toBe("1");
    expect(wyrm.damage.parts[0]).toMatchObject({
      number: 4,
      denomination: 10,
      types: ["thunder"],
    });
    expect(wyrm.save).toBeUndefined();

    const vrWyvern = V["Wyvern's Fire"] as {
      damage: { parts: Array<{ number: number; types: string[] }> };
    };
    expect(vrWyvern.damage.parts).toHaveLength(2);
    expect(vrWyvern.damage.parts[0]).toMatchObject({
      number: 4,
      types: ["fire"],
    });
    expect(vrWyvern.damage.parts[1]).toMatchObject({
      number: 4,
      types: ["thunder"],
    });
  });

  it("hand-tuned legendary / very rare goldens match the fixes", () => {
    for (const [path, reload, shellMax, tier, fireDice] of [
      [
        "public/data/foundry-jsons-example/weapons/gunlance/fvtt-Item-gunlance-legendary.json",
        "-6",
        6,
        "legendary",
        5,
      ],
      [
        "public/data/foundry-jsons-example/weapons/gunlance/fvtt-Item-gunlance-very-rare.json",
        "-5",
        5,
        "veryRare",
        4,
      ],
    ] as const) {
      const example = JSON.parse(readFileSync(path, "utf8")) as FoundryItem & {
        flags?: {
          world?: {
            gunlance?: {
              isGunlance?: boolean;
              tier?: string;
              shellMax?: number;
            };
          };
        };
      };
      const byName = activitiesByName(example);
      expect(
        (
          byName["Artillery Shells"].consumption as {
            targets: { value: string }[];
          }
        ).targets[0].value,
      ).toBe(reload);
      expect(example.flags?.world?.gunlance).toMatchObject({
        isGunlance: true,
        tier,
        shellMax,
      });

      const wyvern = byName["Wyvern's Fire"] as {
        damage: { parts: Array<{ number: number; types: string[] }> };
        target: { template: { size: string } };
      };
      expect(wyvern.target.template.size).toBe("30");
      expect(wyvern.damage.parts).toHaveLength(2);
      expect(wyvern.damage.parts[0]).toMatchObject({
        number: fireDice,
        types: ["fire"],
      });
      expect(wyvern.damage.parts[1]).toMatchObject({
        number: fireDice,
        types: ["thunder"],
      });

      if (tier === "legendary") {
        const wyrm = byName["Wyrmstake Cannon"] as {
          type: string;
          consumption: { targets: { value: string }[] };
          damage: {
            parts: Array<{ number: number; denomination: number }>;
          };
        };
        expect(wyrm.type).toBe("damage");
        expect(wyrm.consumption.targets[0].value).toBe("1");
        expect(wyrm.damage.parts[0]).toMatchObject({
          number: 4,
          denomination: 10,
        });
      }
    }
  });
});
