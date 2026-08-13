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
