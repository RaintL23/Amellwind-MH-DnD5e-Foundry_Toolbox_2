import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryItem } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";

function loadWireKnuckles() {
  const raw = JSON.parse(
    readFileSync("public/data/raintdm-weapons/wire-knuckles.json", "utf8"),
  );
  const [weapon] = parseImportedWeapons([raw], { isCustom: false });
  return weapon;
}

describe("Wire Knuckles rare Foundry export", () => {
  it("emits Silkbind Tether AE + Snap Tether release + Grapple with Grappled AE", () => {
    const weapon = loadWireKnuckles();
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

    expect(item.name).toBe("Wire Knuckles (Rare)");
    expect(system.rarity).toBe("rare");
    expect(system.magicalBonus).toBe(1);
    expect(system.properties).toEqual(
      expect.arrayContaining(["lgt", "mgc"]),
    );
    expect(system.mastery).toBe("push");
    expect(system.uses).toMatchObject({
      spent: 0,
      max: "3",
      recovery: [expect.objectContaining({ period: "sr", type: "recoverAll" })],
    });

    // Uncommon mobility still present.
    expect(byName["Wire-Dash"]).toBeDefined();
    expect(byName["Wire-Escape"]).toBeDefined();
    expect(byName["Wire-Fall"]).toBeDefined();

    const tether = byName["Silkbind Tether"];
    expect(tether).toBeDefined();
    expect(tether.type).toBe("utility");
    expect(tether.activation).toMatchObject({
      type: "special",
      condition: expect.stringContaining("hit"),
    });
    expect(
      (tether.consumption as { targets: { value: string; type: string }[] })
        .targets[0],
    ).toMatchObject({ type: "itemUses", value: "2" });
    expect(
      (tether.target as { affects: { type: string } }).affects.type,
    ).toBe("creature");

    const tetherEffect = item.effects.find((e) => e.name === "Tethered");
    expect(tetherEffect).toBeDefined();
    expect(tetherEffect?.transfer).toBe(false);
    expect(
      (tetherEffect?.flags as { dae?: { showIcon?: boolean } })?.dae?.showIcon,
    ).toBe(true);
    expect(
      (
        tetherEffect?.flags as {
          world?: { wireKnuckles?: { isTethered?: boolean } };
        }
      )?.world?.wireKnuckles?.isTethered,
    ).toBe(true);
    expect(tether.effects).toEqual([{ _id: tetherEffect?._id }]);

    // Hunter release (no save) — save lives on the target's temporary feat.
    const snap = byName["Snap Tether"];
    expect(snap).toBeDefined();
    expect(snap.type).toBe("utility");
    expect(
      (snap.midiProperties as { identifier?: string })?.identifier,
    ).toBe("snap-tether");
    expect(byName["Snap Silkbind"]).toBeUndefined();

    const grapple = byName["Silkbind Grapple"];
    expect(grapple).toBeDefined();
    expect(grapple.type).toBe("utility");
    expect(
      (grapple.target as { affects: { type: string } }).affects.type,
    ).toBe("creature");
    expect(
      (grapple.consumption as { targets: unknown[] }).targets,
    ).toEqual([]);

    const grappled = item.effects.find((e) => e.name === "Grappled (Silkbind)");
    expect(grappled).toBeDefined();
    expect(grappled?.statuses).toEqual(["grappled"]);
    expect(grapple.effects).toEqual(
      expect.arrayContaining([{ _id: grappled?._id }]),
    );

    // Legendary/VR upgrades not on Rare.
    expect(byName["Wyvern Ride"]).toBeUndefined();
    expect(
      (item.flags as { world?: { wireKnuckles?: {
        hasSilkbind?: boolean;
        tetherRadius?: number;
        dcBonus?: number;
      } } })
        .world?.wireKnuckles,
    ).toMatchObject({
      hasSilkbind: true,
      tetherRadius: 15,
      dcBonus: 0,
    });

    expect(
      (item.flags as { itemacro?: { macro?: { command?: string } } })
        .itemacro?.macro?.command,
    ).toContain("Silkbind Tether");
    expect(
      (item.flags as { "midi-qol"?: { onUseMacroName?: string } })[
        "midi-qol"
      ]?.onUseMacroName,
    ).toContain("postActiveEffects");

    // Asymmetric rarity: +1 magical / +3 damage → +2 flat on base damage.
    expect(system.magicalBonus).toBe(1);
    expect(
      (system.damage as { base?: { bonus?: string } }).base?.bonus,
    ).toBe("2");
  });

  it("uses 10 ft tether radius and DC bonus on Very Rare / Legendary", () => {
    const weapon = loadWireKnuckles();
    const vrIndex = weapon.rarityRows.findIndex((r) => r.rarity === "Very Rare");
    const legIndex = weapon.rarityRows.findIndex(
      (r) => r.rarity === "Legendary",
    );
    expect(vrIndex).toBeGreaterThanOrEqual(0);
    expect(legIndex).toBeGreaterThanOrEqual(0);

    const vr = buildWeaponFoundryItem(weapon, vrIndex);
    const leg = buildWeaponFoundryItem(weapon, legIndex);

    expect(
      (vr.flags as { world?: { wireKnuckles?: Record<string, unknown> } })
        .world?.wireKnuckles,
    ).toMatchObject({ tetherRadius: 10, dcBonus: 1 });
    expect(
      (leg.flags as { world?: { wireKnuckles?: Record<string, unknown> } })
        .world?.wireKnuckles,
    ).toMatchObject({ tetherRadius: 10, dcBonus: 2 });
  });
});
