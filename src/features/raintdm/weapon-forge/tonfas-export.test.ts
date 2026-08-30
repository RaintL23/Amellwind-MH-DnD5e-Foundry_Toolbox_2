import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryItem } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";

function loadTonfas() {
  const raw = JSON.parse(
    readFileSync("public/data/raintdm-weapons/tonfas.json", "utf8"),
  );
  const [weapon] = parseImportedWeapons([raw], { isCustom: false });
  return weapon;
}

describe("Tonfas Foundry export", () => {
  it("uncommon: spirit gauge, styles, burst, sky step", () => {
    const weapon = loadTonfas();
    const idx = weapon.rarityRows.findIndex((r) => r.rarity === "Uncommon");
    expect(idx).toBeGreaterThanOrEqual(0);

    const item = buildWeaponFoundryItem(weapon, idx);
    const system = item.system as Record<string, unknown>;
    const activities = system.activities as Record<
      string,
      Record<string, unknown>
    >;
    const byName = Object.fromEntries(
      Object.values(activities).map((a) => [String(a.name ?? ""), a]),
    );

    expect(item.name).toBe("Tonfas (Uncommon)");
    expect(system.rarity).toBe("uncommon");
    expect(system.mastery).toBe("nick");
    expect(system.properties).toEqual(expect.arrayContaining(["fin", "lgt"]));
    expect(system.uses).toMatchObject({ spent: 3, max: "3" });

    expect(byName["Tonfa Styles"]).toBeDefined();
    expect(byName["Spirit Burst ×1"]).toBeDefined();
    expect(byName["Spirit Burst ×3"]).toBeDefined();
    expect(byName["Sky Step"]).toBeDefined();
    expect(byName["Earth Impact"]).toBeUndefined();
  });

  it("rare: +1 bonus, max 4 spirit, earth impact", () => {
    const weapon = loadTonfas();
    const idx = weapon.rarityRows.findIndex((r) => r.rarity === "Rare");
    expect(idx).toBeGreaterThanOrEqual(0);

    const item = buildWeaponFoundryItem(weapon, idx);
    const system = item.system as Record<string, unknown>;
    const activities = system.activities as Record<
      string,
      Record<string, unknown>
    >;
    const byName = Object.fromEntries(
      Object.values(activities).map((a) => [String(a.name ?? ""), a]),
    );

    expect(item.name).toBe("Tonfas (Rare)");
    expect(system.rarity).toBe("rare");
    expect(system.magicalBonus).toBe(1);
    expect(system.properties).toEqual(
      expect.arrayContaining(["fin", "lgt", "mgc"]),
    );
    expect(system.uses).toMatchObject({ spent: 4, max: "4" });

    const burst = byName["Spirit Burst ×1"];
    expect(burst).toBeDefined();
    const flavor = String(
      (burst.description as { chatFlavor?: string } | undefined)?.chatFlavor ?? "",
    );
    expect(flavor).toContain("1d8");

    expect(byName["Earth Impact"]).toBeDefined();
    expect(byName["Sky Step"]).toBeDefined();
  });
});
