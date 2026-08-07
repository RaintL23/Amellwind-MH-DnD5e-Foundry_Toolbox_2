import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseImportedWeapons } from "@/features/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryItem } from "@/features/weapon-forge/mappers/weapon-forge-foundry.export";

function loadWireKnuckles() {
  const raw = JSON.parse(
    readFileSync("public/data/raintdm-weapons/wire-knuckles.json", "utf8"),
  );
  const [weapon] = parseImportedWeapons([raw], { isCustom: false });
  return weapon;
}

describe("Wire Knuckles rare Foundry export", () => {
  it("emits Silkbind Tether AE + Snap Silkbind save + Grapple reminder", () => {
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
    ).toMatchObject({ type: "itemUses", value: "1" });
    expect(
      (tether.target as { affects: { type: string } }).affects.type,
    ).toBe("creature");

    const tetherEffect = item.effects.find((e) => e.name === "Tethered");
    expect(tetherEffect).toBeDefined();
    expect(tetherEffect?.transfer).toBe(false);
    expect(
      (tetherEffect?.flags as { dae?: { showIcon?: boolean } })?.dae?.showIcon,
    ).toBe(true);
    expect(tether.effects).toEqual([{ _id: tetherEffect?._id }]);

    const snap = byName["Snap Silkbind"];
    expect(snap).toBeDefined();
    expect(snap.type).toBe("save");
    expect(snap.save).toMatchObject({
      ability: ["str"],
      dc: { calculation: "str" },
    });

    const grapple = byName["Silkbind Grapple"];
    expect(grapple).toBeDefined();
    expect(grapple.type).toBe("utility");
    expect(
      (grapple.consumption as { targets: unknown[] }).targets,
    ).toEqual([]);

    // Legendary/VR upgrades not on Rare.
    expect(byName["Wyvern Ride"]).toBeUndefined();
    expect(
      (item.flags as { world?: { wireKnuckles?: { hasSilkbind?: boolean } } })
        .world?.wireKnuckles?.hasSilkbind,
    ).toBe(true);
  });
});
