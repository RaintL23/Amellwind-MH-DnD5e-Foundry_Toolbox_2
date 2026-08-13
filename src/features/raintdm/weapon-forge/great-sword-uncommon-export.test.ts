import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { parseImportedWeapons } from "@/features/raintdm/weapon-forge/mappers/weapon-forge.mapper";
import { buildWeaponFoundryItem } from "@/features/raintdm/weapon-forge/mappers/weapon-forge-foundry.export";

describe("Great Sword uncommon Foundry export", () => {
  it("matches Charged Slash Gather / ×N wiring from the hand-tuned uncommon item", () => {
    const raw = JSON.parse(
      readFileSync("public/data/raintdm-weapons/great-sword.json", "utf8"),
    );
    const [weapon] = parseImportedWeapons([raw], { isCustom: false });
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

    expect(system.rarity).toBe("uncommon");
    expect(system.mastery).toBe("graze");
    expect(system.uses).toMatchObject({ spent: 3, max: "3" });

    const gather = byName["Charged Slash: Gather Charge"];
    expect(gather).toBeDefined();
    expect(gather.type).toBe("utility");
    expect(
      (gather.consumption as { targets: { value: string }[] }).targets[0].value,
    ).toBe("-1");
    expect(gather.useConditionText).toBe("@item.uses.value < @item.uses.max");
    expect(gather.useConditionReason).toBe("Already at maximum charges (3).");
    expect((gather.target as { affects: { type: string }; prompt: boolean }).affects.type).toBe(
      "self",
    );
    expect((gather.target as { prompt: boolean }).prompt).toBe(false);
    expect((gather.range as { units: string }).units).toBe("self");
    expect(gather.effects).toEqual([
      expect.objectContaining({ _id: expect.any(String) }),
    ]);

    const advEffect = item.effects.find((e) =>
      e.name.includes("Advantage"),
    );
    expect(advEffect).toBeDefined();
    expect(advEffect?.transfer).toBe(false);
    expect(
      (advEffect?.flags as { dae?: { selfTarget?: boolean; showIcon?: boolean } })
        ?.dae?.selfTarget,
    ).toBe(true);
    expect(
      (advEffect?.flags as { dae?: { showIcon?: boolean } })?.dae?.showIcon,
    ).toBe(true);
    expect(gather.effects).toEqual([{ _id: advEffect?._id }]);

    for (const n of [1, 2, 3] as const) {
      const act = byName[`Charged Slash ×${n}`];
      expect(act).toBeDefined();
      expect(act.type).toBe("attack");
      expect(
        (act.consumption as { targets: { value: string }[] }).targets[0].value,
      ).toBe(String(n));
      expect(act.effects).toEqual([]);
      expect(act.effectConditionText).toBe("false");
      expect((act.range as { units: string }).units).toBe("self");
      const parts = (
        act.damage as {
          includeBase: boolean;
          parts: { number: number; denomination: number }[];
        }
      ).parts;
      expect(act.damage).toMatchObject({ includeBase: true });
      expect(parts[0]).toMatchObject({
        number: n * 3,
        denomination: 6,
      });
    }
  });
});
