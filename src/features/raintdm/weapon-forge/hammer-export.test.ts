import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryItem } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";
import type { FoundryItem } from "@/shared/foundry";
import { HAMMER_ITEM_MACRO } from "@/features/raintdm/weapon-forge/mappers/hammer.macro";

const raw = JSON.parse(
  readFileSync("public/data/raintdm-weapons/hammer.json", "utf8"),
);

function activitiesByName(item: FoundryItem) {
  return Object.fromEntries(
    Object.values(
      item.system.activities as Record<string, Record<string, unknown>>,
    ).map((a) => [String(a.name ?? ""), a]),
  );
}

describe("hammer forge automation", () => {
  it("syncs Item Macro script mirror", () => {
    const dir = "public/data/scripts/weapons-resources/hammer";
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "hammer-item-macro.js"), `${HAMMER_ITEM_MACRO}\n`);
    expect(HAMMER_ITEM_MACRO).toContain("Big Bang Combo");
    expect(HAMMER_ITEM_MACRO).toContain("stunUpgrade");
  });

  it("very rare: Power Charge 3d6, Mighty Weapon uses, Upswing split, Offset Smash", () => {
    const [weapon] = parseImportedWeapons([raw], { isCustom: false });
    const idx = weapon.rarityRows.findIndex((r) => r.rarity === "Very Rare");
    const item = buildWeaponFoundryItem(weapon, idx);
    const byName = activitiesByName(item);

    expect(item.name).toBe("Hammer (Very Rare)");
    expect(byName["Power Charge"]).toBeTruthy();
    expect(byName["Charge Upgrade II"]).toBeUndefined();
    expect(byName["Mighty Weapon"]).toBeTruthy();
    expect(byName["Stun Upgrade"]).toBeUndefined();
    expect(byName["Upswing"]).toBeTruthy();
    expect(byName["Upswing: Collision"]).toBeTruthy();
    expect(byName["Spinning Bludgeon"]).toBeTruthy();
    expect(byName["Offset Smash"]).toBeTruthy();
    expect(byName["Upswing / Spinning Bludgeon"]).toBeUndefined();

    expect(item.system.uses).toMatchObject({
      max: "1",
      recovery: [{ period: "sr" }],
    });

    const pc = item.effects.find((e) => e.name === "Power Charge");
    expect(pc?.changes?.some((c) => c.value === "3d6")).toBe(true);

    const flags = item.flags as {
      world?: { hammer?: { tier?: string; stunUpgrade?: boolean; chargeDice?: string } };
      itemacro?: unknown;
    };
    expect(flags.world?.hammer).toMatchObject({
      isHammer: true,
      tier: "veryRare",
      stunUpgrade: true,
      chargeDice: "3d6",
    });
    expect(flags.itemacro).toBeTruthy();
  });

  it("legendary: Power Charge 4d6 + Big Bang Combo", () => {
    const [weapon] = parseImportedWeapons([raw], { isCustom: false });
    const idx = weapon.rarityRows.findIndex((r) => r.rarity === "Legendary");
    const item = buildWeaponFoundryItem(weapon, idx);
    const byName = activitiesByName(item);

    expect(byName["Big Bang Combo"]).toBeTruthy();
    expect(byName["Power Charge"]).toBeTruthy();
    expect(byName["Mighty Weapon"]).toBeTruthy();
    expect(byName["Upswing"]).toBeTruthy();

    const pc = item.effects.find((e) => e.name === "Power Charge");
    expect(pc?.changes?.some((c) => c.value === "4d6")).toBe(true);

    const flags = item.flags as {
      world?: { hammer?: { tier?: string; bigBangCombo?: boolean; chargeDice?: string } };
    };
    expect(flags.world?.hammer).toMatchObject({
      tier: "legendary",
      bigBangCombo: true,
      chargeDice: "4d6",
    });
  });
});
