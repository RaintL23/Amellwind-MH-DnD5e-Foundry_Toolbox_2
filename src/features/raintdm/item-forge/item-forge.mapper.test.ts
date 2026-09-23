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

describe("parseImportedItems potions", () => {
  it("maps AGMH buff potions with Combo List crafting", () => {
    const raw = JSON.parse(
      readFileSync("public/data/raintdm-items/potions.json", "utf8"),
    );
    const items = parseImportedItems(raw);
    expect(items).toHaveLength(23);
    expect(items.every((i) => i.typeLabel === "Potions & Consumables")).toBe(
      true,
    );

    const adamant = items.find((i) => i.name === "Adamant Pill");
    expect(adamant?.valueCp).toBe(20000);
    expect(adamant?.rarity).toBe("uncommon");
    expect(adamant?.raintdm).toMatchObject({
      kind: "potion",
      potionKey: "adamant-pill",
    });
    expect(adamant?.crafting).toEqual({
      tool: "Alchemist's Supplies",
      item1: "Immunizer",
      item2: "Adamant Seed",
      dc: "15",
      quantity: "1",
    });

    const armorskin = items.find((i) => i.name === "Armorskin");
    expect(armorskin?.valueCp).toBe(37500);
    expect(armorskin?.crafting).toEqual({
      tool: "Alchemist's Supplies",
      item1: "Catalyst",
      item2: "Adamant Seed",
      dc: "17",
      quantity: "1",
    });

    const herbal = items.find((i) => i.name === "Herbal Medicine");
    expect(herbal?.crafting).toEqual({
      tool: "Herbalism Kit",
      item1: "Cactus Flower",
      item2: "Bitterbug",
      dc: "12",
      quantity: "1",
    });

    const power = items.find((i) => i.name === "Power Juice");
    expect(power?.raintdm).toMatchObject({
      kind: "potion",
      potionKey: "power-juice",
    });
  });
});

describe("parseImportedItems bombs", () => {
  it("maps AGMH bombs with Tinker's Tools crafting and AoE flash", () => {
    const raw = JSON.parse(
      readFileSync("public/data/raintdm-items/bombs.json", "utf8"),
    );
    const items = parseImportedItems(raw);
    expect(items).toHaveLength(10);
    expect(items.every((i) => i.typeLabel === "Bombs")).toBe(true);

    const flash = items.find((i) => i.name === "Flash Bomb");
    expect(flash?.valueCp).toBe(10000);
    expect(flash?.raintdm).toMatchObject({
      kind: "bomb",
      bombKey: "flash-bomb",
    });
    expect(flash?.crafting).toEqual({
      tool: "Tinker's Tools",
      item1: "Bomb Casing",
      item2: "Flashbug",
      dc: "15",
      quantity: "1",
    });
    expect(flash?.entries?.[0]).toMatch(/point up to 60 feet/i);
  });
});
