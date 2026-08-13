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

describe("Wire Knuckles uncommon Foundry export", () => {
  it("emits Wirebug Gauge + Wire-Dash / Wire-Fall consume-uses activities", () => {
    const weapon = loadWireKnuckles();
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

    expect(item.name).toBe("Wire Knuckles (Uncommon)");
    expect(system.rarity).toBe("uncommon");
    expect(system.mastery).toBe("push");
    expect(system.properties).toEqual(expect.arrayContaining(["lgt"]));
    expect(system.uses).toMatchObject({
      spent: 0,
      max: "3",
      recovery: [expect.objectContaining({ period: "sr", type: "recoverAll" })],
    });

    const dash = byName["Wire-Dash"];
    expect(dash).toBeDefined();
    expect(dash.type).toBe("utility");
    expect(dash.activation).toMatchObject({
      type: "special",
      condition: "When you take damage",
    });
    expect(
      (dash.consumption as { targets: { value: string; type: string }[] })
        .targets[0],
    ).toMatchObject({ type: "itemUses", value: "1" });
    expect(
      (dash.target as { affects: { type: string }; prompt: boolean }).affects
        .type,
    ).toBe("self");
    expect((dash.target as { prompt: boolean }).prompt).toBe(false);

    const fall = byName["Wire-Fall"];
    expect(fall).toBeDefined();
    expect(fall.type).toBe("utility");
    expect(fall.activation).toMatchObject({
      type: "special",
      condition: "When you fall",
    });
    expect(
      (fall.consumption as { targets: { value: string; type: string }[] })
        .targets[0],
    ).toMatchObject({ type: "itemUses", value: "1" });

    // Rare+ features must not appear on uncommon.
    expect(byName["Silkbind Tether"]).toBeUndefined();
    expect(byName["Snap Silkbind"]).toBeUndefined();
    expect(byName["Silkbind Grapple"]).toBeUndefined();
    expect(byName["Wyvern Ride"]).toBeUndefined();
  });
});
