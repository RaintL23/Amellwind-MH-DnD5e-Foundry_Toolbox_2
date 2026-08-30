import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type FoundryRuneItem = {
  name: string;
  type: string;
  system: {
    description?: { value?: string };
    activities?: Record<string, Record<string, unknown>>;
    uses?: { max?: string; recovery?: unknown[] };
  };
  effects: Array<{
    name?: string;
    changes?: Array<{ key?: string; value?: string }>;
    flags?: Record<string, Record<string, unknown>>;
  }>;
  flags?: Record<string, Record<string, unknown>>;
};

function loadRune(relativePath: string): FoundryRuneItem {
  return JSON.parse(
    readFileSync(`public/data/foundry-jsons-example/runes/${relativePath}`, "utf8"),
  ) as FoundryRuneItem;
}

function toolboxFlags(item: FoundryRuneItem) {
  return item.flags?.["amellwind-toolbox"] as Record<string, unknown> | undefined;
}

function macroCommand(item: FoundryRuneItem): string {
  const macro = item.flags?.itemacro?.macro as { command?: string } | undefined;
  return macro?.command ?? "";
}

function sideEffects(item: FoundryRuneItem, side: "weapon" | "armor") {
  return item.effects.filter(
    (e) =>
      (e.flags?.["amellwind-toolbox"]?.runeSide as string | undefined) === side,
  );
}

function expectUnifiedRuneShell(item: FoundryRuneItem, runeName: string, monsterName: string) {
  expect(item.type).toBe("equipment");
  expect(item.name).toBe(`${runeName} Rune`);
  expect(toolboxFlags(item)).toMatchObject({
    exportKind: "rune",
    runeName,
    monsterName,
    unified: true,
  });
  expect(item.effects.some((e) => e.flags?.["amellwind-toolbox"]?.runeController)).toBe(
    true,
  );
  expect(macroCommand(item)).toContain("runeApplySide");
}

describe("Foundry example runes — requested set", () => {
  it("Bulldrome Tusk automates extra slashing damage on weapon attacks", () => {
    const item = loadRune("Bulldrome/fvtt-Item-bulldrome-bulldrome-tusk-rune.json");
    expectUnifiedRuneShell(item, "Bulldrome Tusk", "Bulldrome");

    const sides = toolboxFlags(item)?.sides as Record<string, unknown>;
    expect(Object.keys(sides)).toEqual(["weapon"]);

    const weaponFx = sideEffects(item, "weapon");
    expect(weaponFx).toHaveLength(1);
    expect(weaponFx[0]?.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "system.bonuses.mwak.damage", value: "2[slashing]" }),
        expect.objectContaining({ key: "system.bonuses.rwak.damage", value: "2[slashing]" }),
      ]),
    );
    expect(item.system.description?.value).toContain("extra 2 slashing damage");
  });

  it("Juv.Astalos Membrane automates Marathon Runner and lightning/thunder spell attacks", () => {
    const item = loadRune(
      "Juvenile Astalos/fvtt-Item-juvenile-astalos-juv-astalos-membrane-rune.json",
    );
    expectUnifiedRuneShell(item, "Juv.Astalos Membrane", "Juvenile Astalos");

    const armorFx = sideEffects(item, "armor");
    expect(armorFx[0]?.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "system.attributes.movement.walk", value: "5" }),
      ]),
    );

    const weaponFx = sideEffects(item, "weapon");
    expect(weaponFx[0]?.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "flags.midi-qol.onUseMacroName",
          value: "ItemMacro.Juv.Astalos Membrane Rune,preItemRoll",
        }),
      ]),
    );

    const macro = macroCommand(item);
    expect(macro).toContain("attackRollBonus");
    expect(macro).toContain("lightning");
    expect(macro).toContain("thunder");
    expect(macro).not.toContain("saveDCBonus");
  });

  it("D.Seltas Razorwing wires Minor Guard Up activity and Gunlance Artillery notes", () => {
    const item = loadRune(
      "Desert Seltas/fvtt-Item-desert-seltas-d-seltas-razorwing-rune.json",
    );
    expectUnifiedRuneShell(item, "D.Seltas Razorwing", "Desert Seltas");

    expect(item.system.uses).toMatchObject({
      max: "1",
      recovery: expect.arrayContaining([expect.objectContaining({ period: "lr" })]),
    });

    const activities = Object.values(item.system.activities ?? {});
    expect(activities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Minor Guard Up",
          activation: expect.objectContaining({ type: "reaction" }),
        }),
      ]),
    );

    const weaponFx = sideEffects(item, "weapon");
    expect(weaponFx[0]?.description).toMatch(/wyvernfire/i);
    expect(weaponFx[0]?.flags?.["amellwind-toolbox"]?.materialEffectName).toBe(
      "Artillery",
    );

    const armorFx = sideEffects(item, "armor");
    expect(armorFx[0]?.flags?.["amellwind-toolbox"]?.materialEffectName).toBe(
      "Minor Guard Up",
    );
  });

  it("Hirabami Hide documents Divine Blessing+ with armor-only side", () => {
    const item = loadRune("Hirabami/fvtt-Item-hirabami-hirabami-hide-rune.json");
    expectUnifiedRuneShell(item, "Hirabami Hide", "Hirabami");

    const sides = toolboxFlags(item)?.sides as Record<string, unknown>;
    expect(Object.keys(sides)).toEqual(["armor"]);

    const armorFx = sideEffects(item, "armor");
    expect(armorFx[0]?.flags?.["amellwind-toolbox"]?.materialEffectName).toBe(
      "Divine Blessing+",
    );
    expect(armorFx[0]?.description).toMatch(/proficiency bonus/i);
    expect(item.system.description?.value).toContain("Divine Blessing+");
  });

  it("Sharpened Fang (Volvidon Pup) automates slashing bonus and reduction", () => {
    const item = loadRune(
      "Volvidon Pup/fvtt-Item-volvidon-pup-sharpened-fang-rune.json",
    );
    expectUnifiedRuneShell(item, "Sharpened Fang", "Volvidon Pup");

    const weaponFx = sideEffects(item, "weapon");
    expect(weaponFx[0]?.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "system.bonuses.mwak.damage", value: "1[slashing]" }),
      ]),
    );

    const armorFx = sideEffects(item, "armor");
    expect(armorFx[0]?.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "system.traits.dm.amount.slashing",
          value: "-2",
        }),
      ]),
    );
  });

  it("Lagombi Plastron wires ice reservoir activity and ice/snow terrain", () => {
    const item = loadRune("Lagombi/fvtt-Item-lagombi-lagombi-plastron-rune.json");
    expectUnifiedRuneShell(item, "Lagombi Plastron", "Lagombi");

    const activities = Object.values(item.system.activities ?? {});
    expect(activities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Plant Ice Reservoir",
          activation: expect.objectContaining({ type: "action" }),
        }),
      ]),
    );

    const armorFx = sideEffects(item, "armor");
    expect(armorFx[0]?.description).toMatch(/ice or snow/i);
    expect(item.system.description?.value).toContain("difficult terrain created by ice or snow");
  });

  it("Seregios Blunt Scale automates slashing reduction and documents Hunter", () => {
    const item = loadRune(
      "Young Seregios/fvtt-Item-young-seregios-seregios-blunt-scale-rune.json",
    );
    expectUnifiedRuneShell(item, "Seregios Blunt Scale", "Young Seregios");

    const armorFx = sideEffects(item, "armor");
    expect(armorFx[0]?.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "system.traits.dm.amount.slashing",
          value: "-3",
        }),
      ]),
    );

    const weaponFx = sideEffects(item, "weapon");
    expect(weaponFx[0]?.flags?.["amellwind-toolbox"]?.materialEffectName).toBe("Hunter");
    expect(weaponFx[0]?.description).toMatch(/extra ration/i);
  });

  it("Y.Seregios Scraper wires Jump Master uses and FastCharge notes", () => {
    const item = loadRune(
      "Young Seregios/fvtt-Item-young-seregios-y-seregios-scraper-rune.json",
    );
    expectUnifiedRuneShell(item, "Y.Seregios Scraper", "Young Seregios");

    expect(item.system.uses).toMatchObject({
      max: "2",
      recovery: expect.arrayContaining([expect.objectContaining({ period: "sr" })]),
    });

    const activities = Object.values(item.system.activities ?? {});
    expect(activities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Double Jump Distance" }),
      ]),
    );

    const weaponFx = sideEffects(item, "weapon");
    expect(weaponFx[0]?.flags?.["amellwind-toolbox"]?.materialEffectName).toBe("FastCharge");
    expect(weaponFx[0]?.description).toMatch(/initiative/i);
  });
});
