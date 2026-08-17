import { describe, expect, it } from "vitest";
import {
  applyFoundryModuleCompat,
  inferFoundryRulesVersion,
  wrapItem,
} from "@/shared/foundry";
import { lookupAutomation } from "@/shared/foundry/weapons";

describe("foundry module compat", () => {
  it("infers 2014 vs 2024 rules from book codes for CPR Medkit matching", () => {
    expect(inferFoundryRulesVersion("PHB")).toBe("2014");
    expect(inferFoundryRulesVersion("XPHB")).toBe("2024");
    expect(inferFoundryRulesVersion("GTMH")).toBe("2024");
  });

  it("stamps Midi magic flags and premade Medkit hints on spells", () => {
    const item = wrapItem({
      name: "Fireball",
      type: "spell",
      system: {
        source: { book: "XPHB", rules: "2014" },
        identifier: "fireball",
        activities: {
          abcdefghijklmnop: {
            type: "save",
            name: "Fireball",
            damage: { parts: [{ number: 8, denomination: 6 }] },
            midiProperties: {},
          },
        },
      },
    });
    applyFoundryModuleCompat(item);
    const source = item.system.source as { rules?: string };
    expect(source.rules).toBe("2024");
    const activities = item.system.activities as Record<
      string,
      { midiProperties?: { magicEffect?: boolean; magicDamage?: boolean } }
    >;
    const midi = Object.values(activities)[0]?.midiProperties;
    expect(midi?.magicEffect).toBe(true);
    expect(midi?.magicDamage).toBe(true);
    const compat = (
      item.flags["amellwind-toolbox"] as {
        compat?: { chrisPremades?: string; gambitsPremades?: string };
      }
    ).compat;
    expect(compat?.chrisPremades).toBe("medkit");
    expect(compat?.gambitsPremades).toBe("medkit");
  });

  it("skips 2014 True Strike overlay on 2024 items so CPR/GPS can own the 2024 cantrip", () => {
    expect(lookupAutomation("True Strike", "PHB", "2024")).toBeUndefined();
    expect(lookupAutomation("True Strike", "PHB", "2014")?.rules).toBe("2014");
  });

  it("light mode does not add toolbox compat flags (Weapon Forge example parity)", () => {
    const item = wrapItem({
      name: "Great Sword (Rare)",
      type: "weapon",
      system: {},
      flags: { "amellwind-toolbox": { exportKind: "weapon-forge" } },
    });
    applyFoundryModuleCompat(item, { light: true });
    expect(item.flags["amellwind-toolbox"]).toEqual({
      exportKind: "weapon-forge",
    });
  });
});
