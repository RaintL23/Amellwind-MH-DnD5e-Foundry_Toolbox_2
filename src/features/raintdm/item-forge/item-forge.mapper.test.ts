import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseImportedItems } from "./mappers/item-forge.mapper";

describe("parseImportedItems magazines", () => {
  it("keeps Combo List crafting on Dual Repeaters magazines", () => {
    const raw = JSON.parse(
      readFileSync("public/data/raintdm-items/magazines.json", "utf8"),
    );
    const items = parseImportedItems(raw);
    expect(items).toHaveLength(11);

    const normal = items.find((i) => i.name === "Normal Magazine");
    expect(normal?.crafting).toEqual({
      tool: "Herbalism Kit",
      item1: "Huskberry",
      item2: "Insect Husk",
      dc: "12",
      quantity: "1",
    });

    const blazeI = items.find((i) => i.name === "Blaze Magazine Upgrade I");
    expect(blazeI?.crafting).toEqual({
      tool: "Herbalism Kit",
      item1: "Catalyst",
      item2: "Nitroshroom",
      dc: "15",
      quantity: "1",
    });
  });
});

describe("parseImportedItems traps", () => {
  it("maps RaintDM hunter traps with Tinker's Tools crafting", () => {
    const raw = JSON.parse(
      readFileSync("public/data/raintdm-items/traps.json", "utf8"),
    );
    const items = parseImportedItems(raw);
    expect(items).toHaveLength(5);
    expect(items.every((i) => i.typeLabel === "Traps")).toBe(true);

    const tool = items.find((i) => i.name === "Trap Tool");
    expect(tool?.valueCp).toBe(12000);
    expect(tool?.crafting).toBeUndefined();
    expect(tool?.raintdm).toMatchObject({ kind: "trap", trapKey: "tool" });

    const pitfall = items.find((i) => i.name === "Pitfall Trap");
    expect(pitfall?.valueCp).toBe(25000);
    expect(pitfall?.crafting).toEqual({
      tool: "Tinker's Tools",
      item1: "Net",
      item2: "Trap Tool",
      dc: "12",
      quantity: "1",
    });

    const shockPlus = items.find((i) => i.name === "Shock Trap+");
    expect(shockPlus?.valueCp).toBe(84000);
    expect(shockPlus?.rarity).toBe("uncommon");
    expect(shockPlus?.crafting).toEqual({
      tool: "Tinker's Tools",
      item1: "Shock Trap",
      item2: "Trap Tool",
      dc: "15",
      quantity: "1",
    });
  });
});
